import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import type { ReleaseResponse, ReleasesResponse, ReleaseDetailResponse } from "./types/api";

export interface Release extends ReleaseResponse {}

export interface DetailedRelease extends ReleaseDetailResponse {}

export interface Document {
  id: string;
  title: string;
  description: string;
  format: string;
  datePublished: string;
  dateModified: string;
  url: string;
}

interface ReleasesParams {
  pageNumber: number;
  pageSize: number;
  dateFrom: string;
  dateTo: string;
  searchQuery?: string;
  industryFilter?: string;
  provinceFilter?: string;
}

// Fetch releases with pagination and filters
export const fetchReleases = async (
  params: ReleasesParams
): Promise<ReleasesResponse> => {
  const searchParams = new URLSearchParams({
    PageNumber: params.pageNumber.toString(),
    PageSize: params.pageSize.toString(),
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  if (params.searchQuery) {
    searchParams.append("search", params.searchQuery);
  }

  if (params.industryFilter) {
    // Convert "__all__" back to empty string for the API
    const apiValue = params.industryFilter === "__all__" ? "" : params.industryFilter;
    searchParams.append("mainProcurementCategory", apiValue);
  }

  if (params.provinceFilter) {
    // Convert "__all__" back to empty string for the API
    const apiValue = params.provinceFilter === "__all__" ? "" : params.provinceFilter;
    searchParams.append("province", apiValue);
  }

  // Add performance tracking
  const startTime = performance.now();
  
  console.log("Fetching releases with params:", Object.fromEntries(searchParams));
  const url = `/api/OCDSReleases?${searchParams}`;
  console.log("Fetching URL:", url);
  
  const response = await fetch(url);

  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Log slow queries (over 1 second)
  if (duration > 1000) {
    console.warn(`Slow API request: ${duration}ms for params`, params);
  }

  console.log("API response status:", response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("API error response:", errorText);
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  const jsonData = await response.json();
  console.log("API response data:", jsonData);
  
  return jsonData;
};

// Fetch single release detail
export const fetchReleaseDetail = async (ocid: string): Promise<DetailedRelease> => {
  const response = await fetch(
    `/api/OCDSReleases/release/${encodeURIComponent(ocid)}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Hook for fetching releases list
export const useReleases = (params: ReleasesParams) => {
  return useQuery<ReleasesResponse, Error>({
    queryKey: queryKeys.releases.list(params),
    queryFn: () => fetchReleases(params),
    enabled: Boolean(
      params.pageNumber && params.pageSize && params.dateFrom && params.dateTo
    ),
    staleTime: 0, // Always fetch fresh data for testing
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer for better UX
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: true, // Always refetch on component mount
  });
};

// Hook for fetching release detail
export const useReleaseDetail = (ocid: string | null) => {
  return useQuery({
    queryKey: queryKeys.releases.detail(ocid!),
    queryFn: () => fetchReleaseDetail(ocid!),
    enabled: Boolean(ocid),
    staleTime: 10 * 60 * 1000, // 10 minutes - details change less frequently than lists
    gcTime: 30 * 60 * 1000, // 30 minutes - keep details longer in cache since they're accessed repeatedly
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};
