import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface OCDSRelease {
  uri: string;
  version: string;
  publishedDate: string;
  publisher: {
    name: string;
    uri: string;
  };
  license: string;
  publicationPolicy: string;
  releases: Array<{
    ocid: string;
    id: string;
    date: string;
    tag: string[];
    initiationType: string;
    parties: Array<{
      id: string;
      name: string;
      roles: string[];
    }>;
    tender?: {
      id: string;
      title: string;
      description: string;
      status: string;
      value?: {
        amount: number;
        currency: string;
      };
      procurementMethod: string;
      procurementMethodDetails: string;
      tenderPeriod?: {
        startDate: string;
        endDate: string;
      };
      enquiryPeriod?: {
        startDate: string;
        endDate: string;
      };
      hasEnquiries: boolean;
      eligibilityCriteria: string;
      awardCriteria: string;
      awardCriteriaDetails: string;
      submissionMethod: string[];
      submissionMethodDetails: string;
      documents: Array<{
        id: string;
        documentType: string;
        title: string;
        description: string;
        url: string;
        datePublished: string;
        dateModified: string;
        format: string;
        language: string;
      }>;
    };
  }>;
}

interface OCDSResponse {
  releases: OCDSRelease[];
}

async function bulkIngest() {
  console.log("🚀 Starting bulk ingestion from Jan 1, 2024 to now...");

  const startDate = "2024-01-01T00:00:00Z";
  const endDate = new Date().toISOString();
  const pageSize = 10000;

  let page = 1;
  let totalProcessed = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    try {
      console.log(`📥 Fetching page ${page} (${pageSize} records per page)...`);

      const url = `https://ocds-api.etenders.gov.za/api/OCDSReleases?PageSize=${pageSize}&Page=${page}&PublishedFrom=${startDate}&PublishedTo=${endDate}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "OCDS-Cache-System/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OCDSResponse = await response.json();

      if (!data.releases || data.releases.length === 0) {
        console.log("📄 No more data found, stopping...");
        hasMoreData = false;
        break;
      }

      console.log(
        `📊 Processing ${data.releases.length} releases from page ${page}...`
      );

      // Process releases in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < data.releases.length; i += batchSize) {
        const batch = data.releases.slice(i, i + batchSize);

        const upsertPromises = batch
          .map((release) => {
            const firstRelease = release.releases[0];
            if (!firstRelease) return null;

            return prisma.oCDSRelease.upsert({
              where: { ocid: firstRelease.ocid },
              update: {
                data: JSON.stringify(release),
                lastUpdated: new Date(),
              },
              create: {
                ocid: firstRelease.ocid,
                data: JSON.stringify(release),
                publishedDate: new Date(release.publishedDate),
                lastUpdated: new Date(),
              },
            });
          })
          .filter(Boolean);

        await Promise.all(upsertPromises);
        console.log(
          `✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            data.releases.length / batchSize
          )} from page ${page}`
        );
      }

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
  const totalInDb = await prisma.oCDSRelease.count();

  console.log("\n🎉 Bulk ingestion completed!");
  console.log(`📊 Total releases processed: ${totalProcessed}`);
  console.log(`🗄️ Total releases in database: ${totalInDb}`);
  console.log(`📅 Date range: ${startDate} to ${endDate}`);

  await prisma.$disconnect();
}

// Run the bulk ingestion
bulkIngest().catch(console.error);
