import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Smart caching endpoint that checks data freshness and updates if needed
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // Check when we last updated data
    const latestReleaseResult: any[] = await prisma.$queryRaw`
      SELECT "createdAt" FROM "Release" 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `;
    const latestRelease = latestReleaseResult[0];

    const now = new Date();
    const lastUpdate = latestRelease?.createdAt ? new Date(latestRelease.createdAt) : new Date(0);
    const hoursSinceUpdate =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    // If data is older than 6 hours, trigger a background update
    let shouldUpdate = hoursSinceUpdate > 6;

    // For manual refresh, check for force parameter
    const forceUpdate = searchParams.get("force") === "true";

    if (shouldUpdate || forceUpdate) {
      console.log("Data is stale, triggering background update...");

      // Trigger update in background (don't wait for it)
      updateDataInBackground().catch((error) => {
        console.error("Background update failed:", error);
      });
    }

    // Always return current data immediately (even if stale)
    const page = parseInt(searchParams.get("PageNumber") || "1");
    // Default to maximum allowed page size if not specified, to show most results possible
    const pageSize = Math.min(
      parseInt(searchParams.get("PageSize") || "20000"),
      20000
    );
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const searchQuery = searchParams.get("search");

    // Build where clause
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    
    if (dateFrom) {
      whereClause += ` AND "releaseDate" >= $${params.length + 1}`;
      params.push(new Date(dateFrom));
    }
    
    if (dateTo) {
      // Create end of day date for inclusive filtering
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      whereClause += ` AND "releaseDate" <= ${params.length + 1}`;
      params.push(endDate);
    }
    
    if (searchQuery) {
      whereClause += ` AND ("title" ILIKE $${params.length + 1} OR "buyerName" ILIKE $${params.length + 2})`;
      params.push(`%${searchQuery}%`);
      params.push(`%${searchQuery}%`);
    }

    const totalCountResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Release" ${Prisma.raw(whereClause)}
    `;
    const totalCount = parseInt(totalCountResult[0].count);

    const releases: any[] = await prisma.$queryRaw`
      SELECT * FROM "Release" 
      ${Prisma.raw(whereClause)} 
      ORDER BY "releaseDate" DESC 
      LIMIT ${pageSize} 
      OFFSET ${(page - 1) * pageSize}
    `;

    const releaseData = releases.map(release => release.data);
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNext = page < totalPages;

    const response: any = {
      releases: releaseData,
      meta: {
        lastUpdated: lastUpdate.toISOString(),
        hoursSinceUpdate: Math.round(hoursSinceUpdate * 10) / 10,
        totalCount,
        currentPage: page,
        totalPages,
      },
    };

    if (hasNext) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("PageNumber", (page + 1).toString());
      response.links = {
        next: `/api/smart-cache?${nextParams.toString()}`,
      };
    }

    return NextResponse.json(response, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Smart cache error:", error);

    // Fallback to external API if database fails
    return fallbackToExternalAPI(request);
  }
}

// Background update function
async function updateDataInBackground() {
  try {
    // Add required date parameters
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]; // 30 days ago

    const response = await fetch(
      `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=100&PageNumber=1&dateFrom=${dateFrom}&dateTo=${dateTo}`
    );

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    const releases = data.releases || [];

    console.log(`Updating ${releases.length} releases in background...`);

    for (const release of releases) {
      try {
        const title = release.tender?.title || "";
        const buyerName =
          release.buyer?.name || release.tender?.procuringEntity?.name || "";
        const status = release.tender?.status || "";
        const procurementMethod = release.tender?.procurementMethod || "";
        const mainProcurementCategory = release.tender?.mainProcurementCategory || "";
        const valueAmount = release.tender?.value?.amount || null;
        const currency = release.tender?.value?.currency || null;
        const releaseDate = release.date ? new Date(release.date) : new Date();

        // Use raw SQL for upsert since Prisma doesn't support native upsert with complex expressions
        await prisma.$executeRaw`
          INSERT INTO "Release" (
            "ocid", "releaseDate", "data", "title", "buyerName", "status", 
            "procurementMethod", "mainProcurementCategory", "valueAmount", "currency", "createdAt", "updatedAt"
          ) VALUES (
            ${release.ocid}, ${releaseDate}, ${release}, ${title}, ${buyerName}, ${status},
            ${procurementMethod}, ${mainProcurementCategory}, ${valueAmount}, ${currency}, NOW(), NOW()
          )
          ON CONFLICT ("ocid") DO UPDATE SET
            "releaseDate" = EXCLUDED."releaseDate",
            "data" = EXCLUDED."data",
            "title" = EXCLUDED."title",
            "buyerName" = EXCLUDED."buyerName",
            "status" = EXCLUDED."status",
            "procurementMethod" = EXCLUDED."procurementMethod",
            "mainProcurementCategory" = EXCLUDED."mainProcurementCategory",
            "valueAmount" = EXCLUDED."valueAmount",
            "currency" = EXCLUDED."currency",
            "updatedAt" = NOW()
        `;
      } catch (error) {
        console.error(`Error updating release ${release.ocid}:`, error);
      }
    }

    console.log("Background update completed successfully");
  } catch (error) {
    console.error("Background update failed:", error);
    throw error;
  }
}

// Fallback to external API if database is empty or fails
async function fallbackToExternalAPI(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();

  try {
    const targetUrl = `https://ocds-api.etenders.gov.za/api/OCDSReleases?${queryString}`;

    const response = await fetch(targetUrl, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      ...data,
      meta: {
        source: "external_api_fallback",
        message: "Data served from external API due to cache unavailability",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Both cache and external API failed",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}