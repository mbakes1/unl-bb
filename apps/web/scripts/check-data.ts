import { prisma } from '@/lib/prisma';

async function checkData() {
  try {
    const count = await prisma.release.count();
    console.log(`Total releases in database: ${count}`);
    
    if (count > 0) {
      const releases = await prisma.release.findMany({
        take: 5,
        select: {
          ocid: true,
          title: true,
          releaseDate: true
        }
      });
      console.log('Sample releases:', releases);
    } else {
      console.log('No releases found in database');
    }
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();