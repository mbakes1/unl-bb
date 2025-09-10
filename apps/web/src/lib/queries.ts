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

  const response = await fetch(`/api/OCDSReleases?${searchParams}`);

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
  return useQuery({
    queryKey: queryKeys.releases.list(params),
    queryFn: () => fetchReleases(params),
    enabled: Boolean(
      params.pageNumber && params.pageSize && params.dateFrom && params.dateTo
    ),
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 minutes
  });
};

// Hook for fetching release detail
export const useReleaseDetail = (ocid: string | null) => {
  return useQuery({
    queryKey: queryKeys.releases.detail(ocid!),
    queryFn: () => fetchReleaseDetail(ocid!),
    enabled: Boolean(ocid),
    staleTime: 5 * 60 * 1000, // 5 minutes - details change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep details longer in cache
  });
};
