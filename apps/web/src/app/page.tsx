"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchAndFiltersHeader } from "@/components/search-and-filters-header";
import { ReleasesLoading } from "@/components/releases-loading";
import { useReleases } from "@/lib/queries";

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [pageSize, setPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useReleases({
    pageNumber: currentPage,
    pageSize,
    dateFrom,
    dateTo,
    searchQuery,
  });

  const releases = data?.releases || [];
  const totalReleases = releases.length;

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
        {isLoading && <ReleasesLoading />}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-700">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {isFetching && !isLoading && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-700 text-sm">
            Refreshing data...
          </div>
        )}

        <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
          <span>Total: {totalReleases}</span>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <span>Page: {currentPage}</span>
          </div>
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

          {releases.length === 0 && !isLoading && !error && (
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
