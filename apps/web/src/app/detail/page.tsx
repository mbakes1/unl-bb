"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Download } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Document {
  id: string;
  title: string;
  description: string;
  format: string;
  datePublished: string;
  dateModified: string;
  url: string;
}

interface Release {
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

export default function TenderDetail() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const ocid = searchParams.get('ocid');

  useEffect(() => {
    if (!ocid) {
      setError('No tender ID provided');
      setLoading(false);
      return;
    }

    const loadTenderDetail = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/OCDSReleases/release/${encodeURIComponent(ocid)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setRelease(data);
      } catch (err) {
        console.error('Error loading tender detail:', err);
        setError(`Error loading tender details: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    loadTenderDetail();
  }, [ocid]);

  const formatDateISO = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <Button variant="link" asChild className="mb-4 px-0">
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Link>
          </Button>
          <Skeleton className="h-10 w-64 mb-6" />
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No tender details found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tender = release.tender;
  const tenderPeriod = tender.tenderPeriod || { startDate: undefined, endDate: undefined };
  const procuringEntity = tender.procuringEntity || { name: undefined, id: undefined };
  const buyer = release.buyer || { name: undefined };
  const value = tender.value || { amount: undefined, currency: undefined };
  const documents = tender.documents || [];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
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
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tender Details</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{tender.title || 'Untitled Tender'}</CardTitle>
          <CardDescription className="flex flex-wrap gap-2">
            <Badge variant="secondary">OCID: {release.ocid}</Badge>
            <Badge variant="secondary">ID: {tender.id || 'N/A'}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">
              {tender.description || 'No description available'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Procuring Entity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {procuringEntity.name || buyer.name || 'N/A'}
                </p>
                {procuringEntity.id && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ID: {procuringEntity.id}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Procurement Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Method:</span>{' '}
                    {tender.procurementMethodDetails || tender.procurementMethod || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span>{' '}
                    {tender.mainProcurementCategory || 'N/A'}
                  </p>
                  {tender.additionalProcurementCategories && tender.additionalProcurementCategories.length > 0 && (
                    <p>
                      <span className="font-medium">Additional Categories:</span>{' '}
                      {tender.additionalProcurementCategories.join(', ')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tender Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Start:</span>{' '}
                    {formatDateISO(tenderPeriod.startDate)}
                  </p>
                  <p>
                    <span className="font-medium">End:</span>{' '}
                    {formatDateISO(tenderPeriod.endDate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Release Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {formatDateISO(release.date)}
                  </p>
                  <p>
                    <span className="font-medium">Language:</span>{' '}
                    {release.language || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Tags:</span>{' '}
                    {release.tag ? release.tag.join(', ') : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {documents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Documents ({documents.length})
              </h3>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <h4 className="font-medium text-lg">
                          {doc.title || 'Untitled Document'}
                        </h4>
                        {doc.description && (
                          <p className="text-muted-foreground mt-1">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                          <span>Format: {doc.format || 'N/A'}</span>
                          <span>Published: {formatDateISO(doc.datePublished)}</span>
                          {doc.dateModified && (
                            <span>Modified: {formatDateISO(doc.dateModified)}</span>
                          )}
                        </div>
                      </div>
                      {doc.url && (
                        <Button asChild size="sm">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}