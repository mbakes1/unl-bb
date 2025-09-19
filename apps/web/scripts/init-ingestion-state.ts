// scripts/init-ingestion-state.ts
import { prisma } from '../src/lib/prisma';

async function main() {
  // Create the IngestionState table if it doesn't exist
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "IngestionState" (
      "id" TEXT PRIMARY KEY,
      "isBackfillComplete" BOOLEAN NOT NULL DEFAULT false,
      "lastHistoricalPage" INTEGER NOT NULL DEFAULT 0,
      "lastDailySync" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00 +00:00',
      "lastModified" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `;
  
  // Insert or update the singleton record
  await prisma.$executeRaw`
    INSERT INTO "IngestionState" ("id") 
    VALUES ('singleton')
    ON CONFLICT ("id") DO NOTHING
  `;
  
  console.log('IngestionState initialized');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });