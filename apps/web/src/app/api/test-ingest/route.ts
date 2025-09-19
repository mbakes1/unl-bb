import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Starting test ingestion...");

    // Fetch just one page for testing with required date parameters
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]; // 7 days ago

    const response = await fetch(
      `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=10&PageNumber=1&dateFrom=${dateFrom}&dateTo=${dateTo}`
    );

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    const releases = data.releases || [];

    console.log(`Fetched ${releases.length} releases from external API`);

    // Transform and upsert data into database
    let upsertedCount = 0;
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

        upsertedCount++;
      } catch (error) {
        console.error(`Error upserting release ${release.ocid}:`, error);
      }
    }

    // Get total count in database
    const totalCountResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Release"
    `;
    const totalCount = parseInt(totalCountResult[0].count);

    return NextResponse.json({
      success: true,
      fetched: releases.length,
      upserted: upsertedCount,
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