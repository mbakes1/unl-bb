"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const router = useRouter();
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
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-300">Loading tender details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-100">
          {error}
        </div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-300">No tender details found.</p>
        </div>
      </div>
    );
  }

  const tender = release.tender;
  const tenderPeriod = tender.tenderPeriod || {};
  const procuringEntity = tender.procuringEntity || {};
  const buyer = release.buyer || {};
  const value = tender.value || {};
  const documents = tender.documents || [];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6">
        <Link 
          href="/" 
          className="mb-2 inline-block text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Listings
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tender Details</h1>
      </header>

      <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-700">
          <h2 className="mb-3 text-2xl font-bold text-gray-800 dark:text-white">
            {tender.title || 'Untitled Tender'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              OCID: {release.ocid}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              ID: {tender.id || 'N/A'}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">Description</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {tender.description || 'No description available'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">Procuring Entity</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {procuringEntity.name || buyer.name || 'N/A'}
            </p>
            {procuringEntity.id && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ID: {procuringEntity.id}
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">Procurement Details</h3>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Method:</strong> {tender.procurementMethodDetails || tender.procurementMethod || 'N/A'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Category:</strong> {tender.mainProcurementCategory || 'N/A'}
            </p>
            {tender.additionalProcurementCategories && tender.additionalProcurementCategories.length > 0 && (
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Additional Categories:</strong> {tender.additionalProcurementCategories.join(', ')}
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">Tender Period</h3>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Start:</strong> {formatDateISO(tenderPeriod.startDate)}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>End:</strong> {formatDateISO(tenderPeriod.endDate)}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">Release Information</h3>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Date:</strong> {formatDateISO(release.date)}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Language:</strong> {release.language || 'N/A'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Tags:</strong> {release.tag ? release.tag.join(', ') : 'N/A'}
            </p>
          </div>
        </div>

        {documents.length > 0 && (
          <div>
            <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
              Documents ({documents.length})
            </h3>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="rounded-md border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="mb-2">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white">
                      {doc.title || 'Untitled Document'}
                    </h4>
                    {doc.description && (
                      <p className="mt-1 text-gray-700 dark:text-gray-300">
                        {doc.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>Format: {doc.format || 'N/A'}</span>
                      <span>Published: {formatDateISO(doc.datePublished)}</span>
                      {doc.dateModified && (
                        <span>Modified: {formatDateISO(doc.dateModified)}</span>
                      )}
                    </div>
                  </div>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}