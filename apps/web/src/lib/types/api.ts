// API response types for the OCDS API Viewer

export interface ReleaseResponse {
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
    additionalProcurementCategories?: string[];
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
    documents?: Document[];
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

export interface ReleasesResponse {
  releases: ReleaseResponse[];
  links?: {
    next?: string;
  };
  meta?: {
    lastUpdated?: string;
    hoursSinceUpdate?: number;
    totalCount?: number;
    currentPage?: number;
    totalPages?: number;
  };
}

export interface ReleaseDetailResponse extends ReleaseResponse {
  language: string;
  tender: NonNullable<ReleaseResponse['tender']> & {
    documents: Document[];
  };
}

export interface IngestionResponse {
  success: boolean;
  fetched?: number;
  message?: string;
  error?: string;
  timestamp: string;
}