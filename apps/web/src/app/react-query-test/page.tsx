// Test React Query functionality
"use client";

import { useQuery } from "@tanstack/react-query";

function fetchTestData() {
  console.log("Fetching test data...");
  return fetch("/api/OCDSReleases?PageNumber=1&PageSize=10&dateFrom=2024-01-01&dateTo=2025-12-31")
    .then(response => {
      console.log("Test API response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Test API response data:", data);
      return data;
    });
}

export default function ReactQueryTest() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["test-data"],
    queryFn: fetchTestData,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0,    // Don't cache
  });

  console.log("React Query test state:", { data, isLoading, error });

  return (
    <div className="p-4">
      <h1>React Query Test</h1>
      <div>
        <p>Loading: {isLoading ? "Yes" : "No"}</p>
        {error && <p className="text-red-500">Error: {error.message}</p>}
        <p>Data: {data ? "Available" : "Not available"}</p>
        {data && <p>Releases count: {data.releases?.length || 0}</p>}
        <button 
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refetch
        </button>
      </div>
    </div>
  );
}