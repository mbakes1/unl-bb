import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { performanceMonitor, dbCacheMetrics } from "@/lib/performance-monitor";
import { processAndSavePage } from "@/lib/processAndSavePage";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ocid: string }> }
) {
  const { ocid } = await context.params;
  const decodedOcid = decodeURIComponent(ocid);

  try {
    // Find the release by OCID in our database with optimized query
    const dbTracker =
      performanceMonitor.trackDatabaseQuery("findReleaseByOcid");
    dbTracker.start();

    // Note: We're using 'any' here because the Prisma types are based on the old schema
    const release: any = await prisma.release.findUnique({
      where: { ocid: decodedOcid },
      select: {
        // data field no longer exists in the new schema
        // We'll need to get this data from the related models
        updatedAt: true, // Include for freshness check
        createdAt: true,
      } as any,
    });

    dbTracker.end();

    if (!release) {
      console.log(
        `Release not found in database: ${decodedOcid}, attempting fallback...`
      );
      dbCacheMetrics.miss();
      return await fallbackToExternalDetailAPI(decodedOcid);
    }

    dbCacheMetrics.hit();

    // Check data freshness and trigger background update if needed
    const hoursSinceUpdate =
      (Date.now() - release.updatedAt.getTime()) / (1000 * 60 * 60);

    // Trigger background update if data is older than 6 hours (details change less frequently)
    if (hoursSinceUpdate > 6) {
      console.log(
        `Detail data is stale for ${decodedOcid}, triggering background refresh...`
      );
      // Don't await - let it run in background
      refreshDetailInBackground(decodedOcid).catch(console.error);
    }

    // Since we no longer have the data directly in the Release model,
    // we need to construct it from the related models
    const tender = await prisma.tender.findUnique({
      where: { releaseId: release.id }
    });
    
    const buyer = await prisma.buyer.findUnique({
      where: { releaseId: release.id }
    });
    
    const parties = await prisma.party.findMany({
      where: { releaseId: release.id }
    });
    
    const awards = await prisma.award.findMany({
      where: { releaseId: release.id },
      include: { suppliers: true }
    });
    
    const contracts = await prisma.contract.findMany({
      where: { releaseId: release.id }
    });
    
    // Construct the data object from the related models
    const data = {
      ocid: decodedOcid,
      id: release.id,
      date: release.releaseDate,
      // Add other fields from related models as needed
      tender: tender ? {
        id: tender.tenderId,
        title: tender.title,
        status: tender.status,
        description: tender.description,
        mainProcurementCategory: tender.mainProcurementCategory,
        procurementMethod: tender.procurementMethod,
        procurementMethodDetails: tender.procurementMethodDetails,
        value: tender.valueJson,
        tenderPeriod: tender.tenderPeriodJson,
        procuringEntity: tender.procuringEntityJson,
      } : undefined,
      buyer: buyer ? {
        id: buyer.buyerId,
        name: buyer.name
      } : undefined,
      parties,
      awards: awards.map(award => ({
        id: award.awardId,
        title: award.title,
        status: award.status,
        date: award.awardDate,
        value: award.valueJson,
        suppliers: award.suppliers
      })),
      contracts: contracts.map(contract => ({
        id: contract.contractId,
        awardID: contract.awardID,
        title: contract.title,
        status: contract.status,
        period: contract.periodJson,
        value: contract.valueJson
      }))
    };

    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        // Aggressive caching for individual releases since they change less frequently
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200", // 1hr cache, 2hr stale
        "X-Data-Source": "database",
        "X-Last-Updated": release.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Database query error for detail:", error);
    // Fallback to external API if database fails
    return await fallbackToExternalDetailAPI(decodedOcid);
  }
}

// Background refresh function for individual release details
async function refreshDetailInBackground(ocid: string) {
  try {
    const response = await fetch(
      `https://ocds-api.etenders.gov.za/api/OCDSReleases/release/${encodeURIComponent(
        ocid
      )}`
    );

    if (!response.ok) {
      console.log(`External API returned ${response.status} for ${ocid}`);
      return;
    }

    const releaseData = await response.json();

    // Process and save the data using our new processAndSavePage function
    await processAndSavePage([releaseData]);

    console.log(`Successfully refreshed detail data for ${ocid}`);
  } catch (error) {
    console.error(`Background refresh failed for ${ocid}:`, error);
  }
}

// Fallback to external API for detail requests
async function fallbackToExternalDetailAPI(ocid: string) {
  try {
    const targetUrl = `https://ocds-api.etenders.gov.za/api/OCDSReleases/release/${encodeURIComponent(
      ocid
    )}`;

    const response = await fetch(targetUrl, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Release not found", ocid },
          { status: 404 }
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Try to cache the fetched data for future requests
    try {
      // Process and save the data using our new processAndSavePage function
      await processAndSavePage([data]);
    } catch (cacheError) {
      console.error(`Failed to cache detail data for ${ocid}:`, cacheError);
      // Continue anyway - we have the data to return
    }

    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "X-Data-Source": "external-api",
      },
    });
  } catch (error) {
    console.error(`Fallback API error for ${ocid}:`, error);
    return NextResponse.json(
      { error: "API error", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
