// Simple fetch test page
"use client";

import { useState, useEffect } from "react";

export default function SimpleFetchTest() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Making fetch request...");
        const response = await fetch("/api/OCDSReleases?PageNumber=1&PageSize=10&dateFrom=2024-01-01&dateTo=2025-12-31");
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        console.log("Received data:", jsonData);
        setData(jsonData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-4">
      <h1>Simple Fetch Test</h1>
      <div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {data && (
          <div>
            <p>Releases count: {data.releases?.length || 0}</p>
            {data.releases?.length > 0 && (
              <div>
                <h2>First release:</h2>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(data.releases[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}