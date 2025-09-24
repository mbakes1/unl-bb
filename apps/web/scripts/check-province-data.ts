import { prisma } from '@/lib/prisma';
import { extractProvince } from '@/lib/data-enrichment';

async function checkProvinceData() {
  try {
    // Get a few sample releases to see if province info is in the data
    const releases = await prisma.release.findMany({
      take: 10,
      select: {
        title: true,
        data: true
      }
    });
    
    console.log('Sample releases:');
    let provincesFound = 0;
    
    releases.forEach((release, index) => {
      console.log(`\nRelease ${index + 1}:`);
      console.log(`  Title: ${release.title}`);
      
      // Check if province info can be extracted from the title
      const provinceFromTitle = extractProvince(release.title || '');
      if (provinceFromTitle) {
        console.log(`  Province from title: ${provinceFromTitle}`);
        provincesFound++;
      }
      
      // Check if province info exists in the full data
      const dataStr = JSON.stringify(release.data);
      const provinces = [
        'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
        'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
      ];
      
      const foundProvinces = provinces.filter(province => dataStr.includes(province));
      if (foundProvinces.length > 0) {
        console.log(`  Found provinces in data: ${foundProvinces.join(', ')}`);
        provincesFound++;
      }
    });
    
    console.log(`\nTotal releases with province info: ${provincesFound} out of ${releases.length}`);
  } catch (error) {
    console.error('Error checking province data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProvinceData();