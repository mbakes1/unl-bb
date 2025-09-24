// Test API endpoint directly
async function testAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/OCDSReleases?PageNumber=1&PageSize=10&dateFrom=2024-01-01&dateTo=2025-12-31');
    console.log('Status:', response.status);
    console.log('Headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Data structure:', Object.keys(data));
      console.log('Releases count:', data.releases?.length);
      console.log('First release keys:', data.releases?.[0] ? Object.keys(data.releases[0]) : 'No releases');
    } else {
      console.log('Error response:', await response.text());
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testAPI();