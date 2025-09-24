// Test the exact same API call that the frontend makes
async function testExactAPICall() {
  console.log('Testing exact API call...');
  
  // These are the exact params that should be passed by the frontend
  const params = {
    PageNumber: '1',
    PageSize: '50',
    dateFrom: '2024-01-01',
    dateTo: new Date().toISOString().split('T')[0],
    searchQuery: '',
    industryFilter: ''
  };
  
  console.log('Params:', params);
  
  // Build the search params exactly as the frontend does
  const searchParams = new URLSearchParams({
    PageNumber: params.PageNumber,
    PageSize: params.PageSize,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  if (params.searchQuery) {
    searchParams.append("search", params.searchQuery);
  }

  if (params.industryFilter) {
    // Convert "__all__" back to empty string for the API
    const apiValue = params.industryFilter === "__all__" ? "" : params.industryFilter;
    searchParams.append("mainProcurementCategory", apiValue);
  }
  
  console.log('Search params:', Object.fromEntries(searchParams));
  
  const url = `http://localhost:3001/api/OCDSReleases?${searchParams}`;
  console.log('Full URL:', url);
  
  try {
    console.log('Making API call...');
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Success! Data:', {
      releasesCount: data.releases?.length,
      hasLinks: !!data.links,
      firstRelease: data.releases?.[0] ? {
        ocid: data.releases[0].ocid,
        hasTender: !!data.releases[0].tender
      } : null
    });
  } catch (error) {
    console.error('Error making API call:', error);
  }
}

testExactAPICall();