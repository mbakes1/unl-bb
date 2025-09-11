import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { performanceMonitor, dbCacheMetrics } from "@/lib/performance-monitor";

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

    const release = await prisma.release.findUnique({
      where: { ocid: decodedOcid },
      select: {
        data: true,
        updatedAt: true, // Include for freshness check
        createdAt: true,
      },
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

    return NextResponse.json(release.data, {
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

    // Extract searchable fields for optimization
    const title = releaseData.tender?.title || "";
    const buyerName =
      releaseData.buyer?.name ||
      releaseData.tender?.procuringEntity?.name ||
      "";
    const status = releaseData.tender?.status || "";
    const procurementMethod = releaseData.tender?.procurementMethod || "";
    const mainProcurementCategory = releaseData.tender?.mainProcurementCategory || "";
    const valueAmount = releaseData.tender?.value?.amount || null;
    const currency = releaseData.tender?.value?.currency || null;
    const releaseDate = releaseData.date
      ? new Date(releaseData.date)
      : new Date();

    await prisma.release.upsert({
      where: { ocid },
      update: {
        releaseDate,
        data: releaseData,
        title,
        buyerName,
        status,
        procurementMethod,
        mainProcurementCategory,
        valueAmount,
        currency,
      },
      create: {
        ocid,
        releaseDate,
        data: releaseData,
        title,
        buyerName,
        status,
        procurementMethod,
        mainProcurementCategory,
        valueAmount,
        currency,
      },
    });

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
      const title = data.tender?.title || "";
      const buyerName =
        data.buyer?.name || data.tender?.procuringEntity?.name || "";
      const status = data.tender?.status || "";
      const procurementMethod = data.tender?.procurementMethod || "";
      const mainProcurementCategory = data.tender?.mainProcurementCategory || "";
      const valueAmount = data.tender?.value?.amount || null;
      const currency = data.tender?.value?.currency || null;
      const releaseDate = data.date ? new Date(data.date) : new Date();

      await prisma.release.upsert({
        where: { ocid },
        update: {
          releaseDate,
          data,
          title,
          buyerName,
          status,
          procurementMethod,
          mainProcurementCategory,
          valueAmount,
          currency,
        },
        create: {
          ocid,
          releaseDate,
          data,
          title,
          buyerName,
          status,
          procurementMethod,
          mainProcurementCategory,
          valueAmount,
          currency,
        },
      });
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
