import { prisma } from '@/lib/prisma';
import { extractProvince } from '@/lib/data-enrichment';

async function analyzeProvinceData() {
  try {
    // Get a larger sample of releases to analyze
    const totalReleases = await prisma.release.count();
    console.log(`Total releases in database: ${totalReleases}`);
    
    // Get a sample of releases to analyze
    const releases = await prisma.release.findMany({
      take: 100,
      select: {
        title: true,
        data: true
      }
    });
    
    console.log(`Analyzing ${releases.length} releases for province information...`);
    
    let titleProvinces = 0;
    let dataProvinces = 0;
    const provinceCounts: Record<string, number> = {};
    
    releases.forEach((release) => {
      // Check if province info can be extracted from the title
      const provinceFromTitle = extractProvince(release.title || '');
      if (provinceFromTitle) {
        titleProvinces++;
        provinceCounts[provinceFromTitle] = (provinceCounts[provinceFromTitle] || 0) + 1;
      }
      
      // Check if province info exists in the full data
      const dataStr = JSON.stringify(release.data);
      const provinces = [
        'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
        'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
      ];
      
      const foundProvinces = provinces.filter(province => dataStr.includes(province));
      if (foundProvinces.length > 0) {
        dataProvinces++;
        foundProvinces.forEach(province => {
          provinceCounts[province] = (provinceCounts[province] || 0) + 1;
        });
      }
    });
    
    console.log(`
Results:`);
    console.log(`  Releases with province in title: ${titleProvinces}`);
    console.log(`  Releases with province in data: ${dataProvinces}`);
    console.log(`  Percentage with province info: ${((dataProvinces / releases.length) * 100).toFixed(1)}%`);
    
    console.log(`
Province breakdown:`);
    Object.entries(provinceCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([province, count]) => {
        console.log(`  ${province}: ${count}`);
      });
      
  } catch (error) {
    console.error('Error analyzing province data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeProvinceData();