import { PrismaClient } from "@prisma/client";
import { processAndSavePage } from "../src/lib/processAndSavePage";

const prisma = new PrismaClient();

async function bulkIngest() {
  console.log("🚀 Starting bulk ingestion from Jan 1, 2024 to now...");

  const startDate = "2024-01-01";
  const endDate = new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD format
  const pageSize = 10000;

  let page = 1;
  let totalProcessed = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    try {
      console.log(`📥 Fetching page ${page} (${pageSize} records per page)...`);

      const url = `https://ocds-api.etenders.gov.za/api/OCDSReleases?PageSize=${pageSize}&Page=${page}&dateFrom=${startDate}&dateTo=${endDate}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "OCDS-Cache-System/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.releases || data.releases.length === 0) {
        console.log("📄 No more data found, stopping...");
        hasMoreData = false;
        break;
      }

      console.log(
        `📊 Processing ${data.releases.length} releases from page ${page}...`
      );

      // Process releases using the new processAndSavePage function
      await processAndSavePage(data.releases);
      
      totalProcessed += data.releases.length;
      console.log(`📈 Total processed so far: ${totalProcessed} releases`);

      // If we got less than the page size, we've reached the end
      if (data.releases.length < pageSize) {
        hasMoreData = false;
        console.log("📄 Reached end of data (partial page received)");
      } else {
        page++;
        // Add a small delay to be respectful to the API
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error on page ${page}:`, error);

      // If it's a network error, wait and retry
      if (
        error instanceof Error &&
        (error.message.includes("fetch") || error.message.includes("network"))
      ) {
        console.log("⏳ Network error, waiting 5 seconds before retry...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue; // Retry the same page
      } else {
        // For other errors, stop the process
        console.error("💥 Fatal error, stopping ingestion");
        break;
      }
    }
  }

  // Get final count
  const totalInDb = await prisma.release.count();

  console.log("\n🎉 Bulk ingestion completed!");
  console.log(`📊 Total releases processed: ${totalProcessed}`);
  console.log(`🗄️ Total releases in database: ${totalInDb}`);
  console.log(`📅 Date range: ${startDate} to ${endDate}`);

  await prisma.$disconnect();
}

// Run the bulk ingestion
bulkIngest().catch(console.error);
