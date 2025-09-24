// Test script to check API response structure
async function testAPIResponse() {
  try {
    console.log('Testing API response structure...');
    
    // Test the exact same parameters used by the frontend
    const params = new URLSearchParams({
      PageNumber: '1',
      PageSize: '50',
      dateFrom: '2024-01-01',
      dateTo: new Date().toISOString().split('T')[0],
    });
    
    const url = `http://localhost:3001/api/OCDSReleases?${params}`;
    console.log('Making request to:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Response data structure:');
    console.log('  Keys:', Object.keys(data));
    console.log('  Releases type:', Array.isArray(data.releases) ? 'array' : typeof data.releases);
    console.log('  Releases count:', data.releases?.length || 0);
    console.log('  Has links:', !!data.links);
    
    if (data.releases?.length > 0) {
      console.log('  First release keys:', Object.keys(data.releases[0]));
      console.log('  First release ocid:', data.releases[0].ocid);
      console.log('  First release tender:', !!data.releases[0].tender);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPIResponse();