// Test the exact same call that the frontend makes
import { queryKeys } from '@/lib/query-keys';

async function testExactCall() {
  console.log('Testing exact call...');
  
  // These are the exact params that should be passed by the frontend
  const params = {
    pageNumber: 1,
    pageSize: 50,
    dateFrom: '2024-01-01',
    dateTo: new Date().toISOString().split('T')[0],
    searchQuery: '',
    industryFilter: ''
  };
  
  console.log('Params:', params);
  
  // Check if enabled condition would pass
  const isEnabled = Boolean(
    params.pageNumber && params.pageSize && params.dateFrom && params.dateTo
  );
  console.log('Would be enabled:', isEnabled);
  
  // Generate query key
  const queryKey = queryKeys.releases.list(params);
  console.log('Query key:', queryKey);
  
  // Test the fetch function directly by importing the module
  const queriesModule = await import('@/lib/queries');
  const fetchReleases = queriesModule.fetchReleases;
  
  try {
    console.log('Calling fetchReleases...');
    const data = await fetchReleases(params);
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

testExactCall();