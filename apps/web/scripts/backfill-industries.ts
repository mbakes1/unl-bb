import { PrismaClient } from "@prisma/client";
import { extractIndustry } from "../src/lib/data-enrichment";

const prisma = new PrismaClient();

async function backfillIndustries() {
  console.log("🚀 Starting industry backfill...");

  try {
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
    
  } catch (error) {
    console.error("❌ Industry backfill failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillIndustries().catch(console.error);