import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

export interface Release {
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

export interface DetailedRelease {
  ocid: string;
  date: string;
  language: string;
  tag: string[];
  tender: {
    id: string;
    title: string;
    description: string;
    procurementMethodDetails: string;
    procurementMethod: string;
    mainProcurementCategory: string;
    additionalProcurementCategories: string[];
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
    documents: Document[];
  };
  buyer?: {
    name: string;
  };
}

export interface Document {
  id: string;
  title: string;
  description: string;
  format: string;
  datePublished: string;
  dateModified: string;
  url: string;
}

interface ReleasesResponse {
  releases: Release[];
  links?: {
    next?: string;
  };
}

interface ReleasesParams {
  pageNumber: number;
  pageSize: number;
  dateFrom: string;
  dateTo: string;
  searchQuery?: string;
  industryFilter?: string;
}

// Fetch releases with pagination and filters
const fetchReleases = async (
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

  // Add performance tracking
  const startTime = performance.now();
  
  const response = await fetch(`/api/OCDSReleases?${searchParams}`);

  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Log slow queries (over 1 second)
  if (duration > 1000) {
    console.warn(`Slow API request: ${duration}ms for params`, params);
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Fetch single release detail
const fetchReleaseDetail = async (ocid: string): Promise<DetailedRelease> => {
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
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer for better UX
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
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
