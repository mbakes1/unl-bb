import { prisma } from '@/lib/prisma';

async function checkSchema() {
  try {
    // Get the column information for the Release table
    const columns: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Release' 
      ORDER BY ordinal_position
    `;
    
    console.log('Current Release table schema:');
    columns.forEach(column => {
      console.log(`  ${column.column_name}: ${column.data_type}`);
    });
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();