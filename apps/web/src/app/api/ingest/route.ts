import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processAndSavePage } from "@/lib/processAndSavePage";

export async function GET(request: Request) {
  // Secure your endpoint to prevent public abuse
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log("Starting data ingestion...");

    // Check if backfill is complete
    const state = await prisma.ingestionState.findUnique({ where: { id: 'singleton' } });
    if (!state || !state.isBackfillComplete) {
      console.log("Backfill is not complete yet. Skipping daily sync.");
      return NextResponse.json({
        success: true,
        message: "Backfill is not complete yet. Skipping daily sync.",
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch data from the external OCDS API
    // Fetch data from the external OCDS API with required date parameters
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = state.lastDailySync.toISOString().split("T")[0]; // Last sync date

    // We need to paginate through the results
    let pageNumber = 1;
    let totalUpserted = 0;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await fetch(
        `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=100&PageNumber=${pageNumber}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }

      const data = await response.json();
      const releases = data.releases || [];

      console.log(`Fetched ${releases.length} releases from external API (page ${pageNumber})`);

      // Process and save all data points for this page into the new relational schema
      await processAndSavePage(releases);
      totalUpserted += releases.length;

      // Check if there are more pages
      hasMorePages = data.links?.next !== undefined;
      pageNumber++;

      // If more data exists, trigger the next run
      if (hasMorePages) {
        // Fire-and-forget call to the next page
        fetch(`${process.env.VERCEL_URL}/api/ingest?page=${pageNumber}&dateFrom=${dateFrom}&dateTo=${dateTo}`, { 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          }
        });
        // For now, we'll break the loop and let the chained call handle the rest
        // In a more robust implementation, you might want to handle this differently
        break;
      }
    }

    // Update the last daily sync time
    await prisma.ingestionState.update({
      where: { id: 'singleton' },
      data: { lastDailySync: new Date() },
    });

    console.log(`Successfully upserted ${totalUpserted} releases`);

    return NextResponse.json({
      success: true,
      fetched: totalUpserted,
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