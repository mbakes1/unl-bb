"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchAndFiltersHeader } from "@/components/search-and-filters-header";
import { ReleasesLoading } from "@/components/releases-loading";
import { useReleases } from "@/lib/queries";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const dateFrom = searchParams.get("dateFrom") || "2024-01-01";
  const dateTo =
    searchParams.get("dateTo") || new Date().toISOString().split("T")[0];
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const searchQuery = searchParams.get("search") || "";
  const isFilterOpen = searchParams.get("filterOpen") === "true";

  const { data, isLoading, error, refetch, isFetching } = useReleases({
    pageNumber: currentPage,
    pageSize,
    dateFrom,
    dateTo,
    searchQuery,
  });

  const releases = data?.releases || [];
  const hasNextPage = Boolean(data?.links?.next);

  // Helper function to update URL parameters
  const updateUrlParams = (
    updates: Record<string, string | number | boolean>
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.push(`?${params.toString()}`, { scroll: false });
  };

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
    updateUrlParams({ page: 1, filterOpen: false }); // Reset to first page when searching
  };

  const toggleFilter = () => {
    updateUrlParams({ filterOpen: !isFilterOpen });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  const handleDateFromChange = (newDateFrom: string) => {
    updateUrlParams({ dateFrom: newDateFrom, page: 1 });
  };

  const handleDateToChange = (newDateTo: string) => {
    updateUrlParams({ dateTo: newDateTo, page: 1 });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateUrlParams({ pageSize: newPageSize, page: 1 });
  };

  const handleSearchQueryChange = (newSearchQuery: string) => {
    updateUrlParams({ search: newSearchQuery, page: 1 });
  };

  const handleApplyFilters = () => {
    // This will trigger a refetch with current filter values
    updateUrlParams({ page: 1 });
  };

  return (
    <div className="min-h-screen bg-background">
      <SearchAndFiltersHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchQueryChange}
        onSearchSubmit={handleSearch}
        dateFrom={dateFrom}
        onDateFromChange={handleDateFromChange}
        dateTo={dateTo}
        onDateToChange={handleDateToChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onFilterToggle={toggleFilter}
        isFilterOpen={isFilterOpen}
        onApplyFilters={handleApplyFilters}
      />

      <div className="lg:ml-96 px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && <ReleasesLoading />}

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <div className="flex justify-between items-center">
              <p className="text-destructive">{error.message}</p>
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
          <div className="mb-4 rounded-lg bg-primary/10 border border-primary/20 p-3 text-primary text-sm">
            Refreshing data...
          </div>
        )}

        <div className="mb-4 flex justify-between items-center text-sm text-muted-foreground">
          <span>
            Showing {releases.length} results on page {currentPage}
            {hasNextPage && " (more pages available)"}
          </span>
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
                className={`block rounded-lg border-l-4 bg-card p-5 shadow-sm hover:shadow-md transition-all ${getStatusClass(
                  tender.status
                )}`}
              >
                {tender.description && (
                  <div className="mb-3 border-b border-border pb-3 text-muted-foreground">
                    {tender.description}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-foreground font-medium">
                    {procuringEntity.name || buyer.name || "N/A"}
                  </div>
                  <div className="text-muted-foreground">
                    {tender.procurementMethodDetails ||
                      tender.procurementMethod ||
                      "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateISO(tenderPeriod.startDate)}
                    <br />
                    {formatDateISO(tenderPeriod.endDate)}
                  </div>
                </div>
              </Link>
            );
          })}

          {releases.length === 0 && !isLoading && !error && (
            <div className="col-span-full rounded-lg bg-card p-8 text-center shadow-sm">
              <p className="text-muted-foreground">
                No releases found for the selected criteria.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2">
          <Button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<ReleasesLoading />}>
      <HomeContent />
    </Suspense>
  );
}
