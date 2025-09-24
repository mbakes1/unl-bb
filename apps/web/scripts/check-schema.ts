import { prisma } from '@/lib/prisma';

async function checkSchema() {
  try {
    // Try to query with different schema references
    console.log('Testing query with "Release" (no schema)...');
    const count1 = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Release"`;
    console.log('Count with "Release":', count1);
    
    console.log('Testing query with "public"."Release"...');
    const count2 = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "public"."Release"`;
    console.log('Count with "public"."Release":', count2);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();