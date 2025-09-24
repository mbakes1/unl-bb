import { prisma } from '@/lib/prisma';

async function addProvinceColumn() {
  try {
    // Check if the province column already exists
    const columns: any[] = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Release' AND column_name = 'province'
    `;
    
    if (columns.length > 0) {
      console.log('Province column already exists');
      return;
    }
    
    // Add the province column
    console.log('Adding province column to Release table...');
    await prisma.$executeRaw`
      ALTER TABLE "Release" ADD COLUMN "province" TEXT
    `;
    
    // Add index for the province column
    console.log('Adding index for province column...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Release_province_idx" ON "Release"("province")
    `;
    
    console.log('Province column added successfully');
  } catch (error) {
    console.error('Error adding province column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addProvinceColumn();