#!/usr/bin/env node

/**
 * DEPRECATED: This script is no longer needed
 * 
 * Data enrichment is now integrated directly into the main ingestion pipeline
 * in the processAndSavePage function. All new data is automatically enriched
 * upon ingestion, eliminating the need for this separate backfill script.
 * 
 * This script is kept for historical reference only and will be removed in
 * a future release.
 */

import { PrismaClient } from "@prisma/client";
import { extractIndustry } from "../src/lib/data-enrichment";

const prisma = new PrismaClient();

async function backfillIndustries() {
  console.log("🚀 Starting industry backfill...");

  try {
    console.log("⚠️  WARNING: This script is deprecated!");
    console.log("⚠️  Data enrichment is now integrated into the main ingestion pipeline.");
    console.log("⚠️  This script is kept for historical reference only.");

    // Get all releases that don't have a mainProcurementCategory or where it's empty
    const releases: any[] = await prisma.$queryRaw`
      SELECT "ocid", "title", "mainProcurementCategory"
      FROM "Release"
      WHERE "mainProcurementCategory" IS NULL OR "mainProcurementCategory" = ''
    `;

    console.log(`📊 Found ${releases.length} releases to process...`);

    let processedCount = 0;
    let updatedCount = 0;

    for (const release of releases) {
      try {
        // Extract industry from title
        const industry = extractIndustry(release.title || "");
        
        if (industry) {
          // Update the release with the new industry category
          await prisma.$executeRaw`
            UPDATE "Release"
            SET "mainProcurementCategory" = ${industry}
            WHERE "ocid" = ${release.ocid}
          `;
          updatedCount++;
        }

        processedCount++;
        
        // Log progress every 100 records
        if (processedCount % 100 === 0) {
          console.log(`✅ Processed ${processedCount}/${releases.length} releases (${updatedCount} updated with industries)`);
        }
      } catch (error) {
        console.error(`❌ Error processing release ${release.ocid}:`, error);
      }
    }

    console.log("\n🎉 Industry backfill completed!");
    console.log(`📊 Total releases processed: ${processedCount}`);
    console.log(`📈 Releases updated with industries: ${updatedCount}`);
    console.log("⚠️  Please note: This script is deprecated and will be removed in a future release.");
    
  } catch (error) {
    console.error("❌ Industry backfill failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Show deprecation warning when script is run
console.log("⚠️  WARNING: This script is deprecated!");
console.log("⚠️  Data enrichment is now integrated into the main ingestion pipeline.");
console.log("⚠️  This script is kept for historical reference only.");

// Run the backfill (deprecated)
backfillIndustries().catch(console.error);