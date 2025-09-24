// Query key factory for better organization and type safety
export const queryKeys = {
  releases: {
    all: ["releases"] as const,
    lists: () => [...queryKeys.releases.all, "list"] as const,
    list: (params: {
      pageNumber: number;
      pageSize: number;
      dateFrom: string;
      dateTo: string;
      searchQuery?: string;
      industryFilter?: string;
    }) => [...queryKeys.releases.lists(), params] as const,
    details: () => [...queryKeys.releases.all, "detail"] as const,
    detail: (ocid: string) => [...queryKeys.releases.details(), ocid] as const,
  },
} as const;
