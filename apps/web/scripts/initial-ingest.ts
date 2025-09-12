import { PrismaClient } from "@prisma/client";
import { processAndSavePage } from "../src/lib/processAndSavePage";

const prisma = new PrismaClient();

async function initialIngest() {
  console.log("Starting initial data ingestion...");

  try {
    // Fetch multiple pages to get a good initial dataset
    const pages = [1, 2, 3, 4, 5]; // Adjust as needed
    let totalIngested = 0;

    for (const page of pages) {
      console.log(`Fetching page ${page}...`);

      // Add required date parameters
      const dateTo = new Date().toISOString().split("T")[0]; // Today
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]; // 30 days ago

      const response = await fetch(
        `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=100&PageNumber=${page}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) {
        console.error(`Failed to fetch page ${page}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const releases = data.releases || [];

      console.log(
        `Processing ${releases.length} releases from page ${page}...`
      );

      // Process releases using the new processAndSavePage function
      await processAndSavePage(releases);
      
      totalIngested += releases.length;

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
