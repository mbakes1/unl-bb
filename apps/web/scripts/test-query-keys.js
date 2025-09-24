// Test query keys generation
import { queryKeys } from '@/lib/query-keys';

console.log('Testing query keys generation...');

const testParams = {
  pageNumber: 1,
  pageSize: 50,
  dateFrom: '2024-01-01',
  dateTo: '2025-12-31',
  searchQuery: '',
  industryFilter: ''
};

const queryKey = queryKeys.releases.list(testParams);
console.log('Generated query key:', queryKey);

// Test serialization
const serialized = JSON.stringify(queryKey);
console.log('Serialized query key:', serialized);

// Test deserialization
const deserialized = JSON.parse(serialized);
console.log('Deserialized query key:', deserialized);

console.log('Keys match:', JSON.stringify(queryKey) === JSON.stringify(deserialized));