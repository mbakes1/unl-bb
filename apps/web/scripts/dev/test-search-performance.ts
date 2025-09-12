import { performance } from 'perf_hooks';
import { prisma } from '@/lib/prisma';

async function testSearchPerformance() {
  console.log('🔍 Testing search performance...\n');
  
  // Test with a common search term
  const searchTerm = 'construction';
  
  // Test the old search method (simulated)
  console.log('Testing old search method (simulated)...');
  const startTime1 = performance.now();
  
  // This simulates the old search approach
  // Note: We're using 'any' here because the Prisma types are based on the old schema
  const oldResults = await prisma.release.findMany({
    where: {
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: 'insensitive'
          } as any
        },
        {
          buyerName: {
            contains: searchTerm,
            mode: 'insensitive'
          } as any
        },
        {
          status: {
            contains: searchTerm,
            mode: 'insensitive'
          } as any
        },
        {
          procurementMethod: {
            contains: searchTerm,
            mode: 'insensitive'
          } as any
        }
      ]
    } as any,
    take: 10
  });
  
  const endTime1 = performance.now();
  console.log(`Old search method took: ${(endTime1 - startTime1).toFixed(2)} milliseconds`);
  console.log(`Results found: ${oldResults.length}\n`);
  
  // Test the new full-text search method
  console.log('Testing new full-text search method...');
  const startTime2 = performance.now();
  
  // This uses the new full-text search approach
  const newResults: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "public"."Release" 
     WHERE "searchVector" @@ to_tsquery('english', $1)
     LIMIT 10`,
    searchTerm
  );
  
  const endTime2 = performance.now();
  console.log(`New full-text search method took: ${(endTime2 - startTime2).toFixed(2)} milliseconds`);
  console.log(`Results found: ${newResults.length}\n`);
  
  // Calculate improvement
  const improvement = ((endTime1 - startTime1) - (endTime2 - startTime2)) / (endTime1 - startTime1) * 100;
  console.log(`Performance improvement: ${improvement.toFixed(2)}%`);
  
  console.log('\n✅ Performance test completed!');
}

testSearchPerformance().catch(console.error);