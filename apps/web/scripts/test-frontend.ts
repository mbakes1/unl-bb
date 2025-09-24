// Test script to check frontend data fetching
import { useReleases } from '@/lib/queries';

// Mock component to test the hook
function TestComponent() {
  const { data, isLoading, error } = useReleases({
    pageNumber: 1,
    pageSize: 10,
    dateFrom: '2024-01-01',
    dateTo: '2025-12-31',
    searchQuery: '',
    industryFilter: ''
  });
  
  console.log('Data:', data);
  console.log('Loading:', isLoading);
  console.log('Error:', error);
  
  return null;
}