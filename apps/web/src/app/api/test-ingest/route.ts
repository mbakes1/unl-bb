import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Starting test ingestion...");

    // Fetch more data for testing with broader date parameters
    // We'll fetch multiple pages but limit to avoid timeout issues
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
      .toISOString()
      .split("T")[0]; 

    // Fetch first 3 pages in a loop to get more data
    let totalReleases = 0;
    const maxPages = 3;
    let hasMorePages = true;
    
    for (let pageNum = 1; pageNum <= maxPages && hasMorePages; pageNum++) {
      const response = await fetch(
        `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=100&PageNumber=${pageNum}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }

      const data = await response.json();
      const releases = data.releases || [];

      console.log(`Fetched ${releases.length} releases from page ${pageNum} for test ingestion...`);

      if (releases.length === 0) {
        // No more data, break out of the loop
        break;
      }

      // Transform and upsert data into database
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

          totalReleases++;
        } catch (error) {
          console.error(`Error upserting release ${release.ocid}:`, error);
        }
      }

      // If we received less than a full page, there's no more data
      if (releases.length < 100) {
        hasMorePages = false;
      }
    }

    // Get total count in database
    const totalCountResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Release"
    `;
    const totalCount = parseInt(totalCountResult[0].count);

    return NextResponse.json({
      success: true,
      fetched: totalReleases,
      upserted: totalReleases, // All releases are upserted in our new approach
      totalInDatabase: totalCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test ingestion failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}