"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  Clock,
  Building2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback, Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useReleaseDetail } from "@/lib/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Document Preview Component
function DocumentPreview({
  document,
}: {
  document: {
    id?: string;
    title?: string;
    description?: string;
    url?: string;
    format?: string;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  if (!document.url) {
    return null;
  }

  // Detect format from URL or provided format with enhanced detection
  const getDocumentFormat = () => {
    const format = document.format?.toLowerCase();
    if (format) return format;

    // Try to detect from URL extension
    if (document.url) {
      try {
        const urlObj = new URL(document.url);
        const pathname = urlObj.pathname;
        const urlParts = pathname.split(".");
        const extension = urlParts[urlParts.length - 1]
          ?.toLowerCase()
          .split("?")[0]
          .split("#")[0];
        return extension;
      } catch (e) {
        // Fallback to simple split if URL parsing fails
        const urlParts = document.url.split(".");
        const extension = urlParts[urlParts.length - 1]
          ?.toLowerCase()
          .split("?")[0]
          .split("#")[0];
        return extension;
      }
    }
    return undefined;
  };

  const format = getDocumentFormat();
  
  // Extended list of previewable formats with better categorization
  const previewableFormats = [
    "pdf",
    "png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico",
    "txt", "html", "htm", "xml", "json", "csv",
    "doc", "docx", "xls", "xlsx", "ppt", "pptx"
  ];
  
  const isPreviewable = format && previewableFormats.includes(format);
  const isPDF = format === "pdf";
  const isImage = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"].includes(format || "");
  const isText = ["txt", "html", "htm", "xml", "json", "csv"].includes(format || "");

  if (!isPreviewable) {
    return null;
  }

  const handlePreviewLoad = () => {
    setIsLoading(false);
  };

  const handlePreviewError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  const renderPreview = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Loading preview...</p>
        </div>
      );
    }

    // Show error state
    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 p-6">
          <FileText className="h-12 w-12" />
          <div className="text-center space-y-2">
            <p className="font-medium">Unable to preview document</p>
            <p className="text-sm">
              {isPDF 
                ? "The PDF could not be loaded. This might be due to file size, format compatibility, or network issues."
                : isImage 
                ? "The image could not be loaded. The file might be corrupted or in an unsupported format."
                : isText
                ? "The text document could not be loaded. The file might be corrupted or in an unsupported format."
                : "This document could not be previewed in the browser."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setLoadError(false);
                  setIsLoading(true);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Preview
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={document.url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </a>
              </Button>
              {isPDF && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                >
                  <a href={document.url} target="_blank" rel="noopener noreferrer">
                    Open PDF in New Tab
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // PDF Preview with better handling
    if (isPDF) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between p-2 bg-muted border-b text-sm">
            <span className="text-muted-foreground">PDF Document</span>
            <Button variant="ghost" size="sm" asChild>
              <a href={document.url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
          </div>
          <div className="flex-1 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading PDF...</span>
                </div>
              </div>
            )}
            <iframe
              src={document.url}
              className="w-full h-full border-0"
              title={document.title || "PDF Preview"}
              onLoad={handlePreviewLoad}
              onError={handlePreviewError}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      );
    }

    // Image Preview with better loading and error handling
    if (isImage) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-2 bg-muted border-b text-sm">
            <span className="text-muted-foreground">Image Preview</span>
            <Button variant="ghost" size="sm" asChild>
              <a href={document.url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </a>
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading image...</span>
                </div>
              </div>
            )}
            <img
              src={document.url}
              alt={document.title || "Image Preview"}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              onLoad={handlePreviewLoad}
              onError={handlePreviewError}
            />
          </div>
        </div>
      );
    }

    // Text-based documents
    if (isText) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between p-2 bg-muted border-b text-sm">
            <span className="text-muted-foreground">Text Document</span>
            <Button variant="ghost" size="sm" asChild>
              <a href={document.url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download File
              </a>
            </Button>
          </div>
          <div className="flex-1 overflow-auto relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading document...</span>
                </div>
              </div>
            )}
            <iframe
              src={document.url}
              className="w-full h-full border-0"
              title={document.title || "Text Document Preview"}
              onLoad={handlePreviewLoad}
              onError={handlePreviewError}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      );
    }

    // Fallback for other previewable formats
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 p-6">
        <FileText className="h-12 w-12" />
        <div className="text-center space-y-2">
          <p className="font-medium">Preview Available</p>
          <p className="text-sm">
            This {format?.toUpperCase() || "document"} can be previewed but requires download for full viewing.
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <a href={document.url} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download {format?.toUpperCase() || "File"}
            </a>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setLoadError(false);
          setIsLoading(false);
        } else {
          // Reset states when opening
          setLoadError(false);
          setIsLoading(true);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <FileText className="mr-2 h-3 w-3" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col sm:max-h-[90vh] sm:h-[90vh]">
        <DialogHeader className="p-4 sm:p-6 pb-0 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <DialogTitle className="text-left break-words">
              {document.title || "Document Preview"}
            </DialogTitle>
            <Badge variant="secondary" className="text-xs w-fit">
              {format?.toUpperCase() || "FILE"}
            </Badge>
          </div>
          {document.description && (
            <p className="text-sm text-muted-foreground text-left mt-1 break-words">
              {document.description}
            </p>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <div className="w-full h-full bg-muted/30">
            {renderPreview()}
          </div>
        </div>
        <div className="p-2 border-t bg-muted/50 flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <a href={document.url} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download Original
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TenderDetailContent() {
  const searchParams = useSearchParams();
  const ocid = searchParams.get("ocid");
  const [countdown, setCountdown] = useState<string>("");

  const {
    data: release,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useReleaseDetail(ocid);

  // Memoize expensive date formatting functions for better performance
  const formatDateISO = useCallback((dateString: string | undefined) => {
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
  }, []);

  const calculateCountdown = useCallback((endDate: string | undefined) => {
    if (!endDate) return "No closing date";

    try {
      const closing = new Date(endDate);
      const now = new Date();
      const diffTime = closing.getTime() - now.getTime();

      if (diffTime <= 0) {
        return "Closed";
      }

      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch {
      return endDate;
    }
  }, []);

  const getCountdownColor = useCallback((endDate: string | undefined) => {
    if (!endDate) return "text-muted-foreground";

    try {
      const closing = new Date(endDate);
      const now = new Date();
      const diffTime = closing.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return "text-muted-foreground";
      if (diffDays <= 3) return "text-red-600 dark:text-red-400";
      if (diffDays <= 7) return "text-orange-600 dark:text-orange-400";
      return "text-green-600 dark:text-green-400";
    } catch {
      return "text-muted-foreground";
    }
  }, []);

  // Memoize processed release data to avoid recalculating on every render
  const processedRelease = useMemo(() => {
    if (!release) return null;

    const tender = release?.tender || {};
    const tenderPeriod = tender.tenderPeriod || {
      startDate: undefined,
      endDate: undefined,
    };
    const procuringEntity = tender.procuringEntity || {
      name: undefined,
      id: undefined,
    };
    const buyer = release?.buyer || { name: undefined };
    const value = tender.value || { amount: undefined, currency: undefined };
    const documents = tender.documents || [];

    // Consolidate categories
    const allCategories = [
      tender.mainProcurementCategory,
      ...(tender.additionalProcurementCategories || []),
    ].filter(Boolean);
    const uniqueCategories = [...new Set(allCategories)];

    return {
      ...release,
      tender,
      tenderPeriod,
      procuringEntity,
      buyer,
      value,
      documents,
      uniqueCategories,
    };
  }, [release]);

  // Update countdown every minute with optimized effect
  useEffect(() => {
    if (!processedRelease?.tenderPeriod?.endDate) return;

    const updateCountdown = () => {
      setCountdown(calculateCountdown(processedRelease.tenderPeriod.endDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [processedRelease?.tenderPeriod?.endDate, calculateCountdown]);

  if (!ocid) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-6">
            <p className="text-destructive">No tender ID provided</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4">
          <Button variant="link" asChild className="mb-4 px-0">
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Link>
          </Button>
          <Skeleton className="h-10 w-64 mb-4" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5 mt-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  </div>
                ))}
              </div>

              <div>
                <Skeleton className="h-6 w-48 mb-4" />
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 mb-4">
                    <Skeleton className="h-5 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-3 mt-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-9 w-24 mt-4" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <Button variant="link" asChild className="mb-4 px-0">
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Link>
          </Button>
        </div>
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <p className="text-destructive">{error.message}</p>
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
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!processedRelease) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <Button variant="link" asChild className="mb-4 px-0">
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No tender details found.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 mt-4"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    tender,
    tenderPeriod,
    procuringEntity,
    buyer,
    value,
    documents,
    uniqueCategories,
  } = processedRelease;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tender Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {isFetching && !isLoading && (
          <div className="mb-4 rounded-lg bg-primary/10 border border-primary/20 p-3 text-primary text-sm">
            Refreshing tender details...
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">Tender ID: {ocid}</div>
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
        </div>
      </div>

      {/* Key Info Header */}
      <Card className="mb-4 border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="lg:col-span-2">
              <h1 className="text-xl font-bold mb-2">
                {tender.title || "Untitled Tender"}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                <span className="font-medium">
                  Tender Number: {tender.id || processedRelease.ocid}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {procuringEntity.name || buyer.name || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right">
              <div className="mb-4">
                <div className="flex items-center justify-center lg:justify-end gap-2 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium">Closing Date</span>
                </div>
                <div
                  className={`text-xl font-bold ${getCountdownColor(
                    tenderPeriod.endDate
                  )}`}
                >
                  {countdown}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateISO(tenderPeriod.endDate)}
                </div>
              </div>

              {documents.length > 0 && (
                <Button size="lg" className="w-full lg:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download All Documents
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {tender.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {tender.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tender Information - Consolidated */}
          <Card>
            <CardHeader>
              <CardTitle>Tender Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Procurement Details */}
              <div>
                <h4 className="font-semibold mb-3">Procurement Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Method:
                    </span>
                    <p>
                      {tender.procurementMethodDetails ||
                        tender.procurementMethod ||
                        "N/A"}
                    </p>
                  </div>
                  {uniqueCategories.length > 0 && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Categories:
                      </span>
                      <p>{uniqueCategories.join(", ")}</p>
                    </div>
                  )}

                  {value.amount && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Value:
                      </span>
                      <p>
                        {value.currency} {value.amount?.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tender Period */}
              <div>
                <h4 className="font-semibold mb-3">Tender Period</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Start Date:
                    </span>
                    <p>{formatDateISO(tenderPeriod.startDate)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      End Date:
                    </span>
                    <p>{formatDateISO(tenderPeriod.endDate)}</p>
                  </div>
                </div>
              </div>

              {/* Release Information */}
              <div>
                <h4 className="font-semibold mb-3">Release Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Release Date:
                    </span>
                    <p>{release?.date ? formatDateISO(release.date) : "N/A"}</p>
                  </div>
                  {release?.language && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Language:
                      </span>
                      <p>{release?.language || "N/A"}</p>
                    </div>
                  )}
                  {release?.tag && release.tag.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-muted-foreground">
                        Tags:
                      </span>
                      <p>{release?.tag?.join(", ") || "N/A"}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Procuring Entity Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Procuring Entity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">
                    {procuringEntity.name || buyer.name || "N/A"}
                  </p>
                  {procuringEntity.id && (
                    <p className="text-sm text-muted-foreground">
                      ID: {procuringEntity.id}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id || index}
                      className="border-b border-border pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="mb-2">
                        <h4 className="font-medium text-sm">
                          {doc.title || "Untitled Document"}
                        </h4>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                          {doc.format && (
                            <span>{doc.format.toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                      {doc.url && (
                        <div className="space-y-2">
                          <DocumentPreview document={doc} />
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="mr-2 h-3 w-3" />
                              Download
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TenderDetail() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="mb-4">
            <Button variant="link" asChild className="mb-4 px-0">
              <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Listings
              </Link>
            </Button>
            <Skeleton className="h-10 w-64 mb-4" />
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5 mt-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-6 w-40 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <TenderDetailContent />
    </Suspense>
  );
}
