import { PrismaClient } from "@prisma/client";
import { extractIndustry } from "../src/lib/data-enrichment";

const prisma = new PrismaClient();

async function backfillIndustries() {
  console.log("🚀 Starting industry backfill...");

  try {
    // Get all releases that don't have a mainProcurementCategory or where it's empty
    const releases = await prisma.release.findMany({
      where: {
        OR: [
          { mainProcurementCategory: null },
          { mainProcurementCategory: "" }
        ]
      },
      select: {
        ocid: true,
        title: true,
        data: true
      }
    });

    console.log(`📊 Found ${releases.length} releases to process...`);

    let processedCount = 0;
    let updatedCount = 0;

    for (const release of releases) {
      try {
        // Extract industry from title
        const industry = extractIndustry(release.title || "");
        
        if (industry) {
          // Ensure release.data is an object before spreading
          const releaseData = typeof release.data === 'object' && release.data !== null 
            ? release.data 
            : {};
          
          // Update the release with the new industry category
          await prisma.release.update({
            where: { ocid: release.ocid },
            data: {
              mainProcurementCategory: industry,
              data: {
                ...releaseData,
                tender: {
                  ...(typeof releaseData === 'object' && releaseData !== null && 'tender' in releaseData 
                    ? (releaseData as any).tender 
                    : {}),
                  mainProcurementCategory: industry
                }
              }
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