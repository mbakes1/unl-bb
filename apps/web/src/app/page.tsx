"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchAndFiltersHeader } from "@/components/search-and-filters-header";

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
  const [searchQuery, setSearchQuery] = useState('');

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
      
      // Add search query if present
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
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
  }, [currentPage, pageSize, dateFrom, dateTo, searchQuery]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    loadReleases();
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-24 py-6">
      <SearchAndFiltersHeader />
      
      <div className="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <form onSubmit={handleSearch} className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="md:col-span-2">
            <Label htmlFor="search">
              Search
            </Label>
            <Input
              type="text"
              id="search"
              placeholder="Search tenders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="dateFrom">
              From Date:
            </Label>
            <Input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="dateTo">
              To Date:
            </Label>
            <Input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full"
            >
              Search
            </Button>
          </div>
        </form>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label htmlFor="pageSize">
              Page Size:
            </Label>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger id="pageSize">
                <SelectValue placeholder="Select page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
                <SelectItem value="5000">5000</SelectItem>
                <SelectItem value="10000">10000</SelectItem>
                <SelectItem value="20000">20000</SelectItem>
              </SelectContent>
            </Select>
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
          const tender = release.tender || { 
            id: '', 
            title: '', 
            description: '', 
            status: '', 
            procurementMethodDetails: '', 
            procurementMethod: '', 
            mainProcurementCategory: '',
            tenderPeriod: undefined, 
            procuringEntity: undefined,
            value: undefined
          };
          const tenderPeriod = tender.tenderPeriod || { startDate: undefined, endDate: undefined };
          const procuringEntity = tender.procuringEntity || { name: undefined, id: undefined };
          const buyer = release.buyer || { name: undefined };
          
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
        <Button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage <= 1}
          variant="outline"
        >
          Previous
        </Button>
        <Button
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={releases.length < pageSize}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}