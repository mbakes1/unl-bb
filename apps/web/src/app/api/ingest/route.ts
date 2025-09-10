import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // Secure your endpoint to prevent public abuse
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log("Starting data ingestion...");

    // Fetch data from the external OCDS API
    // Fetch data from the external OCDS API with required date parameters
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

    console.log(`Fetched ${releases.length} releases from external API`);

    // Transform and upsert data into Neon DB
    let upsertedCount = 0;
    for (const release of releases) {
      try {
        // Extract searchable fields from the nested data
        const title = release.tender?.title || "";
        const buyerName =
          release.buyer?.name || release.tender?.procuringEntity?.name || "";
        const status = release.tender?.status || "";
        const releaseDate = release.date ? new Date(release.date) : new Date();

        await prisma.release.upsert({
          where: { ocid: release.ocid },
          update: {
            releaseDate,
            data: release, // Store the full JSON object
            title,
            buyerName,
            status,
          },
          create: {
            ocid: release.ocid,
            releaseDate,
            data: release,
            title,
            buyerName,
            status,
          },
        });

        upsertedCount++;
      } catch (error) {
        console.error(`Error upserting release ${release.ocid}:`, error);
        // Continue with other releases even if one fails
      }
    }

    console.log(`Successfully upserted ${upsertedCount} releases`);

    return NextResponse.json({
      success: true,
      fetched: releases.length,
      upserted: upsertedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Ingestion failed:", error);
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
