// Test the fetchReleases function directly
async function testFetchReleases() {
  console.log('Testing fetchReleases function...');
  
  const testParams = {
    pageNumber: 1,
    pageSize: 10,
    dateFrom: '2024-01-01',
    dateTo: '2025-12-31',
    searchQuery: '',
    industryFilter: ''
  };
  
  // Import the module dynamically
  const queriesModule = await import('@/lib/queries');
  const fetchReleases = queriesModule.fetchReleases;
  
  try {
    console.log('Calling fetchReleases with params:', testParams);
    const data = await fetchReleases(testParams);
    console.log('Success! Data:', {
      releasesCount: data.releases?.length,
      hasLinks: !!data.links,
      firstRelease: data.releases?.[0] ? {
        ocid: data.releases[0].ocid,
        hasTender: !!data.releases[0].tender
      } : null
    });
  } catch (error) {
    console.error('Error calling fetchReleases:', error);
  }
}

testFetchReleases();