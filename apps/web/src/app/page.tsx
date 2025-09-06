"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Release {
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

export default function Home() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReleases, setTotalReleases] = useState(0);
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [pageSize, setPageSize] = useState(50);

  const loadReleases = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        PageNumber: currentPage.toString(),
        PageSize: pageSize.toString(),
        dateFrom,
        dateTo
      });
      
      const response = await fetch(`/api/OCDSReleases?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setReleases(data.releases || []);
      setTotalReleases(data.releases?.length || 0);
    } catch (err) {
      console.error('Error loading releases:', err);
      setError(`Error loading data: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, [currentPage, pageSize, dateFrom, dateTo]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

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

  const getStatusClass = (status: string | undefined) => {
    if (!status) return '';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('open')) {
      return 'border-l-green-500';
    } else if (statusLower.includes('complete') || statusLower.includes('closed')) {
      return 'border-l-blue-500';
    } else if (statusLower.includes('cancel')) {
      return 'border-l-red-500';
    }
    return 'border-l-gray-500';
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">OCDS Releases</h1>
        <p className="text-gray-600 dark:text-gray-300">South African Government Procurement Data</p>
      </header>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              From Date:
            </label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              To Date:
            </label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="pageSize" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Page Size:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="10">10</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="5000">5000</option>
              <option value="10000">10000</option>
              <option value="20000">20000</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadReleases}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Load Releases
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mb-6 rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-100">
          {error}
        </div>
      )}

      <div className="mb-4 flex justify-between text-sm text-gray-600 dark:text-gray-300">
        <span>Total: {totalReleases}</span>
        <span>Page: {currentPage}</span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {releases.map((release) => {
          const tender = release.tender || {};
          const tenderPeriod = tender.tenderPeriod || {};
          const procuringEntity = tender.procuringEntity || {};
          const buyer = release.buyer || {};
          
          return (
            <Link 
              key={release.ocid} 
              href={`/detail?ocid=${encodeURIComponent(release.ocid)}`}
              className={`block rounded-lg border-l-4 bg-white p-5 shadow transition-all hover:shadow-md dark:bg-gray-800 ${getStatusClass(tender.status)}`}
            >
              {tender.description && (
                <div className="mb-3 border-b border-gray-200 pb-3 text-gray-700 dark:border-gray-700 dark:text-gray-300">
                  {tender.description}
                </div>
              )}
              
              <div className="space-y-2">
                <div className="text-gray-800 dark:text-gray-200">
                  {procuringEntity.name || buyer.name || 'N/A'}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {tender.procurementMethodDetails || tender.procurementMethod || 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  {formatDateISO(tenderPeriod.startDate)}<br />
                  {formatDateISO(tenderPeriod.endDate)}
                </div>
              </div>
            </Link>
          );
        })}
        
        {releases.length === 0 && !loading && !error && (
          <div className="col-span-full rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-300">No releases found for the selected criteria.</p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage <= 1}
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={releases.length < pageSize}
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Next
        </button>
      </div>
    </div>
  );
}
