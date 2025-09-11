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
  const [loadError, setLoadError] = useState(false);

  if (!document.url) {
    return null;
  }

  // Detect format from URL or provided format
  const getDocumentFormat = () => {
    const format = document.format?.toLowerCase();
    if (format) return format;

    // Try to detect from URL extension
    if (document.url) {
      const urlParts = document.url.split(".");
      const extension = urlParts[urlParts.length - 1]
        ?.toLowerCase()
        .split("?")[0];
      return extension;
    }
    return undefined;
  };

  const format = getDocumentFormat();
  const isPreviewable =
    format &&
    [
      "pdf",
      "png",
      "jpg",
      "jpeg",
      "gif",
      "svg",
      "webp",
      "bmp",
      "txt",
      "html",
      "htm",
    ].includes(format);

  if (!isPreviewable) {
    return null;
  }

  const renderPreview = () => {
    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
          <FileText className="h-12 w-12" />
          <div className="text-center">
            <p className="font-medium">Unable to preview document</p>
            <p className="text-sm">
              This document type may not support preview in the browser.
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <a href={document.url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Open in new tab
              </a>
            </Button>
          </div>
        </div>
      );
    }

    if (format === "pdf") {
      // Use Google Docs Viewer as fallback for PDFs that don't embed well
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        document.url || ""
      )}&embedded=true`;

      return (
        <div className="w-full h-full">
          <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0"
            title={document.title || "Document Preview"}
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    if (
      ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(format || "")
    ) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={document.url}
            alt={document.title || "Document Preview"}
            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    if (["txt", "html", "htm"].includes(format || "")) {
      return (
        <iframe
          src={document.url}
          className="w-full h-full border-0"
          title={document.title || "Document Preview"}
          onError={() => setLoadError(true)}
        />
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Preview not available for this document type</p>
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
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <FileText className="mr-2 h-3 w-3" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0 border-b">
          <DialogTitle className="text-left">
            {document.title || "Document Preview"}
          </DialogTitle>
          {document.description && (
            <p className="text-sm text-muted-foreground text-left mt-1">
              {document.description}
            </p>
          )}
          {format && (
            <p className="text-xs text-muted-foreground text-left mt-1">
              Format: {format.toUpperCase()}
            </p>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <div className="w-full h-full bg-muted/30">{renderPreview()}</div>
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
