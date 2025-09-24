// Test the enabled condition for useReleases hook
function testEnabledCondition() {
  const testParams = {
    pageNumber: 1,
    pageSize: 50,
    dateFrom: '2024-01-01',
    dateTo: '2025-12-31',
    searchQuery: '',
    industryFilter: ''
  };
  
  console.log('Test params:', testParams);
  
  const isEnabled = Boolean(
    testParams.pageNumber && testParams.pageSize && testParams.dateFrom && testParams.dateTo
  );
  
  console.log('Would be enabled:', isEnabled);
  
  // Check each condition separately
  console.log('pageNumber check:', Boolean(testParams.pageNumber));
  console.log('pageSize check:', Boolean(testParams.pageSize));
  console.log('dateFrom check:', Boolean(testParams.dateFrom));
  console.log('dateTo check:', Boolean(testParams.dateTo));
}

testEnabledCondition();