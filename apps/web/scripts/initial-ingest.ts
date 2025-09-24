import { PrismaClient } from "@prisma/client";
import { processAndSavePage } from "../src/lib/processAndSavePage";

const prisma = new PrismaClient();

async function initialIngest() {
  console.log("Starting initial data ingestion...");

  try {
    let totalIngested = 0;
    let page = 1;
    const maxPages = 10; // Fetch up to 10 pages
    let hasMoreData = true;

    // Add required date parameters (use broader date range)
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = "2024-01-01"; // Start from beginning of 2024

    while (page <= maxPages && hasMoreData) {
      console.log(`Fetching page ${page}...`);

      const response = await fetch(
        `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=100&PageNumber=${page}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) {
        console.error(`Failed to fetch page ${page}: ${response.status}`);
        page++;
        continue;
      }

      const data = await response.json();
      const releases = data.releases || [];

      console.log(
        `Processing ${releases.length} releases from page ${page}...`
      );

      if (releases.length === 0) {
        // No more data, break out of the loop
        console.log("No more data found, stopping...");
        hasMoreData = false;
        break;
      }

      // Process releases using the new processAndSavePage function
      await processAndSavePage(releases);
      
      totalIngested += releases.length;

      // If we received less than a full page, there's no more data
      if (releases.length < 100) {
        hasMoreData = false;
      }

      page++;

      // Add a small delay between pages to be respectful to the API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `✅ Initial ingestion complete! Processed ${totalIngested} releases.`
    );
  } catch (error) {
    console.error("❌ Initial ingestion failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

initialIngest();
