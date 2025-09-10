"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchAndFiltersHeader } from "@/components/search-and-filters-header";

interface Release {
  ocid: string;
  date: string;
  tag: string[];
  tender?: {
    id: string;
    title: string;
    description: string;
    status: string;
    procurementMethodDetails: string;
    procurementMethod: string;
    mainProcurementCategory: string;
    tenderPeriod?: {
      startDate: string;
      endDate: string;
    };
    procuringEntity?: {
      name: string;
      id: string;
    };
    value?: {
      amount: number;
      currency: string;
    };
  };
  buyer?: {
    name: string;
  };
}

export default function Home() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReleases, setTotalReleases] = useState(0);
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [pageSize, setPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const loadReleases = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        PageNumber: currentPage.toString(),
        PageSize: pageSize.toString(),
        dateFrom,
        dateTo,
      });

      // Add search query if present
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/OCDSReleases?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReleases(data.releases || []);
      setTotalReleases(data.releases?.length || 0);
    } catch (err) {
      console.error("Error loading releases:", err);
      setError(`Error loading data: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, [currentPage, pageSize, dateFrom, dateTo, searchQuery]);

  const formatDateISO = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const getStatusClass = (status: string | undefined) => {
    if (!status) return "";

    const statusLower = status.toLowerCase();
    if (statusLower.includes("active") || statusLower.includes("open")) {
      return "border-l-green-500";
    } else if (
      statusLower.includes("complete") ||
      statusLower.includes("closed")
    ) {
      return "border-l-blue-500";
    } else if (statusLower.includes("cancel")) {
      return "border-l-red-500";
    }
    return "border-l-gray-500";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    setIsFilterOpen(false); // Close filter panel on search
    loadReleases();
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchAndFiltersHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        onFilterToggle={toggleFilter}
        isFilterOpen={isFilterOpen}
      />

      <div className="lg:ml-96 px-4 sm:px-6 lg:px-8 py-6">
        {loading && (
          <div className="mb-6 rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">Loading...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 flex justify-between text-sm text-gray-600">
          <span>Total: {totalReleases}</span>
          <span>Page: {currentPage}</span>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {releases.map((release) => {
            const tender = release.tender || {
              id: "",
              title: "",
              description: "",
              status: "",
              procurementMethodDetails: "",
              procurementMethod: "",
              mainProcurementCategory: "",
              tenderPeriod: undefined,
              procuringEntity: undefined,
              value: undefined,
            };
            const tenderPeriod = tender.tenderPeriod || {
              startDate: undefined,
              endDate: undefined,
            };
            const procuringEntity = tender.procuringEntity || {
              name: undefined,
              id: undefined,
            };
            const buyer = release.buyer || { name: undefined };

            return (
              <Link
                key={release.ocid}
                href={`/detail?ocid=${encodeURIComponent(release.ocid)}`}
                className={`block rounded-lg border-l-4 bg-white p-5 shadow-sm hover:shadow-md transition-all ${getStatusClass(
                  tender.status
                )}`}
              >
                {tender.description && (
                  <div className="mb-3 border-b border-gray-200 pb-3 text-gray-700">
                    {tender.description}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-gray-800 font-medium">
                    {procuringEntity.name || buyer.name || "N/A"}
                  </div>
                  <div className="text-gray-600">
                    {tender.procurementMethodDetails ||
                      tender.procurementMethod ||
                      "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDateISO(tenderPeriod.startDate)}
                    <br />
                    {formatDateISO(tenderPeriod.endDate)}
                  </div>
                </div>
              </Link>
            );
          })}

          {releases.length === 0 && !loading && !error && (
            <div className="col-span-full rounded-lg bg-white p-8 text-center shadow-sm">
              <p className="text-gray-600">
                No releases found for the selected criteria.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={releases.length < pageSize}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
