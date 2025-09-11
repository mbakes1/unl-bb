"use client";

import { Suspense, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchAndFiltersHeader } from "@/components/search-and-filters-header";
import { ReleasesLoading } from "@/components/releases-loading";
import { useReleases } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL parameters
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const dateFrom = searchParams.get("dateFrom") || "2024-01-01";
  const dateTo =
    searchParams.get("dateTo") || new Date().toISOString().split("T")[0];
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const searchQuery = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const procurementMethod = searchParams.get("procurementMethod") || "";
  const buyerName = searchParams.get("buyerName") || "";
  const minValue = searchParams.get("minValue") || "";
  const maxValue = searchParams.get("maxValue") || "";
  const currency = searchParams.get("currency") || "";
  const sortBy = searchParams.get("sortBy") || "releaseDate";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const isFilterOpen = searchParams.get("filterOpen") === "true";

  const { data, isLoading, error, refetch, isFetching } = useReleases({
    pageNumber: currentPage,
    pageSize,
    dateFrom,
    dateTo,
    searchQuery,
    status,
    procurementMethod,
    buyerName,
    minValue: minValue ? parseFloat(minValue) : undefined,
    maxValue: maxValue ? parseFloat(maxValue) : undefined,
    currency,
    sortBy,
    sortOrder: sortOrder as "asc" | "desc",
  });

  const releases = data?.releases || [];
  const hasNextPage = Boolean(data?.links?.next);

  // Memoize expensive date calculations
  const isNewTender = useCallback((releaseDate: string | undefined) => {
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    return release > twoDaysAgo;
  }, []);

  const formatClosingDate = useCallback((endDate: string | undefined) => {
    if (!endDate) return { text: "No closing date", urgent: false };

    try {
      const closing = new Date(endDate);
      const now = new Date();

      // Reset time to start of day for accurate day comparison
      const closingDay = new Date(
        closing.getFullYear(),
        closing.getMonth(),
        closing.getDate()
      );
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const diffTime = closingDay.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const daysPast = Math.abs(diffDays);
        if (daysPast === 1) {
          return { text: "Closed yesterday", urgent: false };
        } else if (daysPast <= 7) {
          return { text: `Closed ${daysPast} days ago`, urgent: false };
        } else {
          return { text: "Closed", urgent: false };
        }
      } else if (diffDays === 0) {
        return { text: "Closes today", urgent: true };
      } else if (diffDays === 1) {
        return { text: "Closes tomorrow", urgent: true };
      } else if (diffDays <= 3) {
        return { text: `Closes in ${diffDays} days`, urgent: true };
      } else if (diffDays <= 7) {
        return { text: `Closes in ${diffDays} days`, urgent: true };
      } else if (diffDays <= 30) {
        return {
          text: `Closes in ${diffDays} days (${closing.toLocaleDateString(
            "en-ZA",
            {
              day: "numeric",
              month: "short",
            }
          )})`,
          urgent: false,
        };
      } else {
        return {
          text: `Closing: ${closing.toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`,
          urgent: false,
        };
      }
    } catch {
      return { text: endDate, urgent: false };
    }
  }, []);

  const getStatusClass = useCallback((status: string | undefined) => {
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
  }, []);

  // Memoize processed releases to avoid recalculating on every render
  const processedReleases = useMemo(() => {
    return releases.map((release) => {
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

      return {
        ...release,
        tender,
        tenderPeriod,
        procuringEntity,
        buyer,
        closingInfo: formatClosingDate(tenderPeriod.endDate),
        showNewBadge: isNewTender(release.date),
        statusClass: getStatusClass(tender.status),
      };
    });
  }, [releases, formatClosingDate, isNewTender, getStatusClass]);

  // Helper function to update URL parameters
  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | boolean>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

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

  const handleStatusChange = (newStatus: string) => {
    updateUrlParams({ status: newStatus, page: 1 });
  };

  const handleProcurementMethodChange = (newProcurementMethod: string) => {
    updateUrlParams({ procurementMethod: newProcurementMethod, page: 1 });
  };

  const handleBuyerNameChange = (newBuyerName: string) => {
    updateUrlParams({ buyerName: newBuyerName, page: 1 });
  };

  const handleMinValueChange = (newMinValue: string) => {
    updateUrlParams({ minValue: newMinValue, page: 1 });
  };

  const handleMaxValueChange = (newMaxValue: string) => {
    updateUrlParams({ maxValue: newMaxValue, page: 1 });
  };

  const handleCurrencyChange = (newCurrency: string) => {
    updateUrlParams({ currency: newCurrency, page: 1 });
  };

  const handleSortByChange = (newSortBy: string) => {
    updateUrlParams({ sortBy: newSortBy, page: 1 });
  };

  const handleSortOrderChange = (newSortOrder: 'asc' | 'desc') => {
    updateUrlParams({ sortOrder: newSortOrder, page: 1 });
  };

  const handleApplyFilters = () => {
    // This will trigger a refetch with current filter values
    updateUrlParams({ page: 1 });
  };

  // Prefetch detail page data when user hovers over a release link
  const prefetchReleaseDetail = useCallback(
    (ocid: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.releases.detail(ocid),
        queryFn: async () => {
          const response = await fetch(
            `/api/OCDSReleases/release/${encodeURIComponent(ocid)}`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    },
    [queryClient]
  );

  // Smart cache current page releases in background for better performance
  const smartCacheCurrentPage = useCallback(async () => {
    if (releases.length === 0) return;

    const ocids = releases.map((r) => r.ocid);
    try {
      await fetch("/api/smart-cache/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocids }),
      });
    } catch (error) {
      // Silent fail - this is a background optimization
      console.log("Smart cache failed:", error);
    }
  }, [releases]);

  // Trigger smart cache when releases change
  useMemo(() => {
    if (releases.length > 0) {
      // Delay to avoid blocking the UI
      setTimeout(smartCacheCurrentPage, 1000);
    }
  }, [releases, smartCacheCurrentPage]);

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
        // New filter props
        status={status}
        onStatusChange={handleStatusChange}
        procurementMethod={procurementMethod}
        onProcurementMethodChange={handleProcurementMethodChange}
        buyerName={buyerName}
        onBuyerNameChange={handleBuyerNameChange}
        minValue={minValue}
        onMinValueChange={handleMinValueChange}
        maxValue={maxValue}
        onMaxValueChange={handleMaxValueChange}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortOrder={sortOrder as 'asc' | 'desc'}
        onSortOrderChange={handleSortOrderChange}
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
          {processedReleases.map((release) => (
            <Link
              key={release.ocid}
              href={`/detail?ocid=${encodeURIComponent(release.ocid)}`}
              className={`block rounded-lg border-l-4 bg-card p-5 shadow-sm hover:shadow-md transition-all ${release.statusClass}`}
              onMouseEnter={() => prefetchReleaseDetail(release.ocid)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  {release.tender.description && (
                    <div className="border-b border-border pb-3 text-muted-foreground">
                      {release.tender.description}
                    </div>
                  )}
                </div>
                {release.showNewBadge && (
                  <Badge
                    variant="default"
                    className="ml-2 bg-green-500 text-white hover:bg-green-600 flex-shrink-0 animate-pulse"
                  >
                    NEW
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-foreground font-medium">
                  {release.procuringEntity.name || release.buyer.name || "N/A"}
                </div>
                <div className="text-muted-foreground">
                  {release.tender.procurementMethodDetails ||
                    release.tender.procurementMethod ||
                    "N/A"}
                </div>
                <div
                  className={`flex items-center gap-2 text-sm font-medium ${
                    release.closingInfo.urgent
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-muted-foreground"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  {release.closingInfo.text}
                </div>
              </div>
            </Link>
          ))}

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
