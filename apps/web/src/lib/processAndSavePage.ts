// /apps/web/src/lib/processAndSavePage.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { extractIndustry, extractProvince } from '@/lib/data-enrichment';

// This function processes and saves a page of releases using bulk operations for better performance
export async function processAndSavePage(releases: any[]) {
  console.log(`Processing ${releases.length} releases in bulk...`);
  
  // Process releases in batches to avoid memory issues and long-running transactions
  const batchSize = 100;
  let totalProcessed = 0;
  
  for (let i = 0; i < releases.length; i += batchSize) {
    const batch = releases.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(releases.length/batchSize)} (${batch.length} releases)`);
    
    try {
      // Process the batch using bulk operations
      await processBatch(batch);
      totalProcessed += batch.length;
      console.log(`Successfully processed batch. Total so far: ${totalProcessed}/${releases.length}`);
    } catch (error) {
      console.error(`Error processing batch starting at index ${i}:`, error);
      // Continue with the next batch instead of stopping completely
    }
  }
  
  console.log(`Finished processing ${totalProcessed} releases`);
}

async function processBatch(releases: any[]) {
  // Extract data for bulk insert/update
  const releaseData: any[] = [];
  
  for (const release of releases) {
    try {
      const title = release.tender?.title || "";
      const buyerName = release.buyer?.name || release.tender?.procuringEntity?.name || "";
      const status = release.tender?.status || "";
      const procurementMethod = release.tender?.procurementMethod || "";
      const valueAmount = release.tender?.value?.amount || null;
      const currency = release.tender?.value?.currency || null;
      const releaseDate = release.date ? new Date(release.date) : new Date();
      
      // Extract industry category using data enrichment logic
      // This replaces the need for a separate backfill script
      const mainProcurementCategory = extractIndustry(title) || release.tender?.mainProcurementCategory || "";
      
      // Extract province information
      const province = extractProvince(title) || extractProvinceFromData(release) || "";
      
      releaseData.push({
        ocid: release.ocid,
        releaseDate: releaseDate,
        data: release,
        title: title,
        buyerName: buyerName,
        status: status,
        procurementMethod: procurementMethod,
        mainProcurementCategory: mainProcurementCategory,
        province: province,
        valueAmount: valueAmount,
        currency: currency,
      });
    } catch (error) {
      console.error(`Error preparing data for release ${release.ocid}:`, error);
    }
  }
  
  // Perform bulk upsert using a single raw SQL statement for all releases in the batch
  if (releaseData.length > 0) {
    try {
      // Use a single raw SQL statement for bulk upsert with proper parameterization
      const values = releaseData.map(release => 
        Prisma.sql`(${release.ocid}, ${release.releaseDate}, ${release.data}, ${release.title}, ${release.buyerName}, ${release.status}, ${release.procurementMethod}, ${release.mainProcurementCategory}, ${release.province || null}, ${release.valueAmount}, ${release.currency}, NOW(), NOW())`
      );
      
      await prisma.$executeRaw`
        INSERT INTO "Release" (
          "ocid", "releaseDate", "data", "title", "buyerName", "status", 
          "procurementMethod", "mainProcurementCategory", "province", "valueAmount", "currency", "createdAt", "updatedAt"
        ) VALUES ${Prisma.join(values, ', ')}
        ON CONFLICT ("ocid") DO UPDATE SET
          "releaseDate" = EXCLUDED."releaseDate",
          "data" = EXCLUDED."data",
          "title" = EXCLUDED."title",
          "buyerName" = EXCLUDED."buyerName",
          "status" = EXCLUDED."status",
          "procurementMethod" = EXCLUDED."procurementMethod",
          "mainProcurementCategory" = EXCLUDED."mainProcurementCategory",
          "province" = EXCLUDED."province",
          "valueAmount" = EXCLUDED."valueAmount",
          "currency" = EXCLUDED."currency",
          "updatedAt" = NOW()
      `;
    } catch (error) {
      console.error(`Error bulk upserting releases:`, error);
      
      // Fallback to individual upserts if bulk upsert fails
      for (const release of releaseData) {
        try {
          await prisma.$executeRaw`
            INSERT INTO "Release" (
              "ocid", "releaseDate", "data", "title", "buyerName", "status", 
              "procurementMethod", "mainProcurementCategory", "province", "valueAmount", "currency", "createdAt", "updatedAt"
            ) VALUES (
              ${release.ocid}, ${release.releaseDate}, ${release.data}, ${release.title}, ${release.buyerName}, ${release.status},
              ${release.procurementMethod}, ${release.mainProcurementCategory}, ${release.province || null}, ${release.valueAmount}, ${release.currency}, NOW(), NOW()
            )
            ON CONFLICT ("ocid") DO UPDATE SET
              "releaseDate" = EXCLUDED."releaseDate",
              "data" = EXCLUDED."data",
              "title" = EXCLUDED."title",
              "buyerName" = EXCLUDED."buyerName",
              "status" = EXCLUDED."status",
              "procurementMethod" = EXCLUDED."procurementMethod",
              "mainProcurementCategory" = EXCLUDED."mainProcurementCategory",
              "province" = EXCLUDED."province",
              "valueAmount" = EXCLUDED."valueAmount",
              "currency" = EXCLUDED."currency",
              "updatedAt" = NOW()
          `;
        } catch (error) {
          console.error(`Error upserting release ${release.ocid}:`, error);
        }
      }
    }
  }
}

// Helper function to extract province information from the full data object
function extractProvinceFromData(data: any): string | null {
  // Try to find province information in various fields of the data object
  const dataStr = JSON.stringify(data);
  
  // Common province names in South Africa
  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
    'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
  ];
  
  // Check if any province name appears in the data
  for (const province of provinces) {
    if (dataStr.includes(province)) {
      return province;
    }
  }
  
  return null;
}