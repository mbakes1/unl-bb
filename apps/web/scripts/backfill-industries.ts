import { PrismaClient } from "@prisma/client";
import { extractIndustry } from "../src/lib/data-enrichment";

const prisma = new PrismaClient();

async function backfillIndustries() {
  console.log("🚀 Starting industry backfill...");

  try {
    // Get all releases that don't have a mainProcurementCategory or where it's empty
    // Note: We're using 'any' here because the Prisma types are based on the old schema
    const releases = await prisma.release.findMany({
      where: {
        OR: [
          { mainProcurementCategory: null as any },
          { mainProcurementCategory: "" as any }
        ]
      } as any,
      select: {
        ocid: true,
        // title and data fields no longer exist in the new schema
        // We'll need to get this data from the related Tender model
      }
    });

    console.log(`📊 Found ${releases.length} releases to process...`);

    let processedCount = 0;
    let updatedCount = 0;

    for (const release of releases) {
      try {
        // Extract industry from title
        // Since we no longer have the title directly in the Release model,
        // we need to get it from the related Tender model
        const tender = await prisma.tender.findUnique({
          where: { releaseId: release.ocid as any }
        });
        
        const industry = extractIndustry(tender?.title || "");
        
        if (industry && tender) {
          // Update the tender with the new industry category
          await prisma.tender.update({
            where: { releaseId: release.ocid as any },
            data: {
              mainProcurementCategory: industry
            }
          });
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