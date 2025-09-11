"use client";

import { Search, Filter, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import React from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";

interface SearchAndFiltersHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  onFilterToggle: () => void;
  isFilterOpen: boolean;
  onApplyFilters: () => void;
  // New filter props
  status: string;
  onStatusChange: (value: string) => void;
  procurementMethod: string;
  onProcurementMethodChange: (value: string) => void;
  buyerName: string;
  onBuyerNameChange: (value: string) => void;
  minValue: string;
  onMinValueChange: (value: string) => void;
  maxValue: string;
  onMaxValueChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export const SearchAndFiltersHeader = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  pageSize,
  onPageSizeChange,
  onApplyFilters,
  // New filter props
  status,
  onStatusChange,
  procurementMethod,
  onProcurementMethodChange,
  buyerName,
  onBuyerNameChange,
  minValue,
  onMinValueChange,
  maxValue,
  onMaxValueChange,
  currency,
  onCurrencyChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: SearchAndFiltersHeaderProps) => {
  // Local state for form inputs
  const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery);
  const [dateFromObj, setDateFromObj] = React.useState<Date | undefined>(
    dateFrom ? new Date(dateFrom) : undefined
  );
  const [dateToObj, setDateToObj] = React.useState<Date | undefined>(
    dateTo ? new Date(dateTo) : undefined
  );
  const [localPageSize, setLocalPageSize] = React.useState(pageSize);
  const [localStatus, setLocalStatus] = React.useState(status);
  const [localProcurementMethod, setLocalProcurementMethod] = React.useState(procurementMethod);
  const [localBuyerName, setLocalBuyerName] = React.useState(buyerName);
  const [localMinValue, setLocalMinValue] = React.useState(minValue);
  const [localMaxValue, setLocalMaxValue] = React.useState(maxValue);
  const [localCurrency, setLocalCurrency] = React.useState(currency);
  const [localSortBy, setLocalSortBy] = React.useState(sortBy);
  const [localSortOrder, setLocalSortOrder] = React.useState(sortOrder);

  // Increase debounce delay to allow typing full words
  const debouncedSearchQuery = useDebouncedValue(localSearchQuery, 1000);

  // Update parent when debounced value changes
  React.useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      onSearchChange(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchQuery, onSearchChange]);

  // Sync local state with props when they change externally
  React.useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    setDateFromObj(dateFrom ? new Date(dateFrom) : undefined);
  }, [dateFrom]);

  React.useEffect(() => {
    setDateToObj(dateTo ? new Date(dateTo) : undefined);
  }, [dateTo]);

  React.useEffect(() => {
    setLocalPageSize(pageSize);
  }, [pageSize]);

  React.useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  React.useEffect(() => {
    setLocalProcurementMethod(procurementMethod);
  }, [procurementMethod]);

  React.useEffect(() => {
    setLocalBuyerName(buyerName);
  }, [buyerName]);

  React.useEffect(() => {
    setLocalMinValue(minValue);
  }, [minValue]);

  React.useEffect(() => {
    setLocalMaxValue(maxValue);
  }, [maxValue]);

  React.useEffect(() => {
    setLocalCurrency(currency);
  }, [currency]);

  React.useEffect(() => {
    setLocalSortBy(sortBy);
  }, [sortBy]);

  React.useEffect(() => {
    setLocalSortOrder(sortOrder);
  }, [sortOrder]);

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFromObj(date);
    onDateFromChange(date ? date.toISOString().split("T")[0] : "");
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateToObj(date);
    onDateToChange(date ? date.toISOString().split("T")[0] : "");
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    setLocalPageSize(newSize);
    onPageSizeChange(newSize);
  };

  const handleStatusChange = (value: string) => {
    setLocalStatus(value);
    onStatusChange(value);
  };

  const handleProcurementMethodChange = (value: string) => {
    setLocalProcurementMethod(value);
    onProcurementMethodChange(value);
  };

  const handleBuyerNameChange = (value: string) => {
    setLocalBuyerName(value);
    onBuyerNameChange(value);
  };

  const handleMinValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalMinValue(value);
    onMinValueChange(value);
  };

  const handleMaxValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalMaxValue(value);
    onMaxValueChange(value);
  };

  const handleCurrencyChange = (value: string) => {
    setLocalCurrency(value);
    onCurrencyChange(value);
  };

  const handleSortByChange = (value: string) => {
    setLocalSortBy(value);
    onSortByChange(value);
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    setLocalSortOrder(value);
    onSortOrderChange(value);
  };

  const resetFilters = () => {
    const today = new Date();
    const startOfYear = new Date(2024, 0, 1);

    setDateFromObj(startOfYear);
    setDateToObj(today);
    onDateFromChange("2024-01-01");
    onDateToChange(today.toISOString().split("T")[0]);
    onSearchChange("");
    onPageSizeChange(50);
    onStatusChange("");
    onProcurementMethodChange("");
    onBuyerNameChange("");
    onMinValueChange("");
    onMaxValueChange("");
    onCurrencyChange("");
    onSortByChange("releaseDate");
    onSortOrderChange("desc");
  };

  const FiltersContent = () => (
    <div className="space-y-4">
      {/* Search Bar */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Search:
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <form onSubmit={onSearchSubmit}>
            <Input
              type="search"
              placeholder="Search tenders..."
              className="pl-10 w-full"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
            />
          </form>
          {localSearchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setLocalSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {localSearchQuery !== searchQuery && (
          <p className="text-xs text-muted-foreground mt-1">
            Search will update automatically...
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              From Date:
            </label>
            <DatePicker
              date={dateFromObj}
              onDateChange={handleDateFromChange}
              placeholder="Select start date"
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              To Date:
            </label>
            <DatePicker
              date={dateToObj}
              onDateChange={handleDateToChange}
              placeholder="Select end date"
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Status:
            </label>
            <Select value={localStatus || "all"} onValueChange={(value) => handleStatusChange(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Procurement Method:
            </label>
            <Input
              type="text"
              placeholder="Filter by procurement method..."
              value={localProcurementMethod}
              onChange={(e) => handleProcurementMethodChange(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Buyer Name:
          </label>
          <Input
            type="text"
            placeholder="Filter by buyer name..."
            value={localBuyerName}
            onChange={(e) => handleBuyerNameChange(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Min Value:
            </label>
            <Input
              type="number"
              placeholder="Min value"
              value={localMinValue}
              onChange={handleMinValueChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Max Value:
            </label>
            <Input
              type="number"
              placeholder="Max value"
              value={localMaxValue}
              onChange={handleMaxValueChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Currency:
            </label>
            <Input
              type="text"
              placeholder="Currency (e.g. ZAR)"
              value={localCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Sort By:
            </label>
            <Select
              value={localSortBy}
              onValueChange={handleSortByChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sort field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="releaseDate">Release Date</SelectItem>
                <SelectItem value="valueAmount">Value Amount</SelectItem>
                <SelectItem value="buyerName">Buyer Name</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Sort Order:
            </label>
            <Select
              value={localSortOrder}
              onValueChange={(value) => handleSortOrderChange(value as 'asc' | 'desc')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  <div className="flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Descending
                  </div>
                </SelectItem>
                <SelectItem value="asc">
                  <div className="flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-2 rotate-180" />
                    Ascending
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Results per page:
          </label>
          <Select
            value={localPageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 results</SelectItem>
              <SelectItem value="50">50 results</SelectItem>
              <SelectItem value="100">100 results</SelectItem>
              <SelectItem value="500">500 results</SelectItem>
              <SelectItem value="1000">1000 results</SelectItem>
              <SelectItem value="5000">5000 results</SelectItem>
              <SelectItem value="10000">10000 results</SelectItem>
              <SelectItem value="20000">20000 results</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={resetFilters}
        >
          Reset All
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          onClick={onApplyFilters}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-6 top-6 z-50 w-80 bg-card border border-border rounded-lg shadow-lg p-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Search & Filters
        </h2>
        <FiltersContent />
      </div>

      {/* Mobile Floating Filter Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Drawer>
          <DrawerTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle>Search & Filters</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              <FiltersContent />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};
