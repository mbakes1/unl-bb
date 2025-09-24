import { prisma } from '@/lib/prisma';
import { extractProvince } from '@/lib/data-enrichment';

async function checkDataForProvinces() {
  try {
    // Get a sample of releases to check for province information
    const releases = await prisma.release.findMany({
      take: 20,
      select: {
        title: true,
        data: true
      }
    });
    
    console.log('Checking releases for province information...');
    
    let provinceCount = 0;
    const provinceCounts: Record<string, number> = {};
    
    releases.forEach((release, index) => {
      // Check if province can be extracted from title
      const provinceFromTitle = extractProvince(release.title || '');
      if (provinceFromTitle) {
        provinceCount++;
        provinceCounts[provinceFromTitle] = (provinceCounts[provinceFromTitle] || 0) + 1;
        console.log(`Found province '${provinceFromTitle}' in release ${index + 1}: ${release.title}`);
      } else {
        // Check if province exists in the full data
        const dataStr = JSON.stringify(release.data);
        const provinces = [
          'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
          'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
        ];
        
        const foundProvinces = provinces.filter(province => dataStr.includes(province));
        if (foundProvinces.length > 0) {
          provinceCount++;
          foundProvinces.forEach(province => {
            provinceCounts[province] = (provinceCounts[province] || 0) + 1;
          });
          console.log(`Found province(s) '${foundProvinces.join(', ')}' in data for release ${index + 1}: ${release.title}`);
        }
      }
    });
    
    console.log(`
Summary:`);
    console.log(`  Releases with province info: ${provinceCount} out of ${releases.length}`);
    console.log(`  Province breakdown:`);
    Object.entries(provinceCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([province, count]) => {
        console.log(`    ${province}: ${count}`);
      });
  } catch (error) {
    console.error('Error checking data for provinces:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataForProvinces();