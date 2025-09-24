// Test page to debug data fetching
"use client";

import { useReleases } from "@/lib/queries";
import { useEffect } from "react";

export default function TestPage() {
  const { data, isLoading, error, refetch } = useReleases({
    pageNumber: 1,
    pageSize: 10,
    dateFrom: "2024-01-01",
    dateTo: "2025-12-31",
    searchQuery: "",
    industryFilter: "",
  });

  useEffect(() => {
    console.log("Query state changed:");
    console.log("  Data:", data);
    console.log("  Loading:", isLoading);
    console.log("  Error:", error);
    
    if (error) {
      console.log("Error details:", error);
    }
    
    if (data) {
      console.log("Data details:");
      console.log("  Releases count:", data.releases?.length);
      console.log("  Has links:", !!data.links);
      if (data.releases?.length > 0) {
        console.log("  First release preview:", {
          ocid: data.releases[0].ocid,
          title: data.releases[0].tender?.title,
        });
      }
    }
  }, [data, isLoading, error]);

  return (
    <div className="p-4">
      <h1>Debug Page</h1>
      <div>
        <p>Loading: {isLoading ? "Yes" : "No"}</p>
        {error && <p className="text-red-500">Error: {error.message}</p>}
        <p>Releases count: {data?.releases?.length || 0}</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refetch
        </button>
        {data?.releases && (
          <div className="mt-4">
            <h2>First release:</h2>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(data.releases[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}