import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { processAndSavePage } from "@/lib/processAndSavePage";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Secure your endpoint to prevent public abuse
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log("Starting comprehensive backfill...");

    // Define date range - from beginning of 2024 to today
    const startDate = "2024-01-01";
    const endDate = new Date().toISOString().split("T")[0];
    const pageSize = 10000; // Use the max page size that the API allows

    let page = 1;
    let totalProcessed = 0;
    let hasMoreData = true;

    console.log(`Fetching data from ${startDate} to ${endDate}...`);

    while (hasMoreData && page <= 100) { // Add a safety limit of 100 pages
      try {
        console.log(`Fetching page ${page}...`);

        const url = `https://ocds-api.etenders.gov.za/api/OCDSReleases?PageSize=${pageSize}&Page=${page}&dateFrom=${startDate}&dateTo=${endDate}`;

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "OCDS-Cache-System/1.0",
          },
        });

        if (!response.ok) {
          throw new Error(`External API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.releases || data.releases.length === 0) {
          console.log("No more data found, stopping...");
          hasMoreData = false;
          break;
        }

        console.log(`Processing ${data.releases.length} releases from page ${page}...`);

        // Process releases using the new processAndSavePage function
        await processAndSavePage(data.releases);
        
        totalProcessed += data.releases.length;
        console.log(`Total processed so far: ${totalProcessed} releases`);

        // If we got less than the page size, we've reached the end
        if (data.releases.length < pageSize) {
          hasMoreData = false;
        } else {
          page++;
          // Add a small delay to be respectful to the API
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error on page ${page}:`, error);

        // If it's a network error, wait and retry
        if (
          error instanceof Error &&
          (error.message.includes("fetch") || error.message.includes("network"))
        ) {
          console.log("Network error, waiting 5 seconds before retry...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue; // Retry the same page
        } else {
          // For other errors, stop the process
          console.error("Fatal error, stopping backfill");
          break;
        }
      }
    }

    // Get final count
    const totalInDb = await prisma.release.count();

    console.log(`Backfill completed! Processed ${totalProcessed} releases, total in DB: ${totalInDb}`);

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      totalInDatabase: totalInDb,
      pagesProcessed: page - 1,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Backfill failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}