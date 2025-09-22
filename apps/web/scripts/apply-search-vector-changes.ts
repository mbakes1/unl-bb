import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applySearchVectorChanges() {
  try {
    console.log('Applying search vector changes...');
    
    // Add searchVector column
    await prisma.$executeRaw`
      ALTER TABLE "Release" ADD COLUMN IF NOT EXISTS "searchVector" TSVECTOR
    `;
    console.log('Added searchVector column');
    
    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Release_searchVector_idx" ON "Release" USING GIN ("searchVector")
    `;
    console.log('Created searchVector index');
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Release_ocid_idx" ON "Release"("ocid")
    `;
    console.log('Created ocid index');
    
    // Create trigger function
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_release_search_vector() RETURNS TRIGGER AS $$
      BEGIN
        NEW."searchVector" := 
          setweight(to_tsvector('english', COALESCE(NEW."title", '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW."buyerName", '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(NEW."status", '')), 'C') ||
          setweight(to_tsvector('english', COALESCE(NEW."procurementMethod", '')), 'C') ||
          setweight(to_tsvector('english', COALESCE(NEW."mainProcurementCategory", '')), 'C');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    console.log('Created trigger function');
    
    // Create trigger
    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS update_release_search_vector_trigger ON "Release"
    `;
    
    await prisma.$executeRaw`
      CREATE TRIGGER update_release_search_vector_trigger
        BEFORE INSERT OR UPDATE ON "Release"
        FOR EACH ROW EXECUTE FUNCTION update_release_search_vector()
    `;
    console.log('Created trigger');
    
    // Populate searchVector for existing records (if any)
    await prisma.$executeRaw`
      UPDATE "Release" 
      SET "searchVector" = 
        setweight(to_tsvector('english', COALESCE("title", '')), 'A') ||
        setweight(to_tsvector('english', COALESCE("buyerName", '')), 'B') ||
        setweight(to_tsvector('english', COALESCE("status", '')), 'C') ||
        setweight(to_tsvector('english', COALESCE("procurementMethod", '')), 'C') ||
        setweight(to_tsvector('english', COALESCE("mainProcurementCategory", '')), 'C')
      WHERE "searchVector" IS NULL
    `;
    console.log('Populated searchVector for existing records');
    
    console.log('All search vector changes applied successfully!');
  } catch (error) {
    console.error('Error applying search vector changes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applySearchVectorChanges();