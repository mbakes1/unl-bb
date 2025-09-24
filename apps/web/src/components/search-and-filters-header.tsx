"use client";

import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { INDUSTRIES, PROVINCES } from "@/lib/filter-options";

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
  industryFilter: string;
  onIndustryFilterChange: (value: string) => void;
  provinceFilter: string; // Add province filter prop
  onProvinceFilterChange: (value: string) => void; // Add province filter change handler
  onApplyFilters: () => void;
  onResetFilters: () => void;
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
  industryFilter,
  onIndustryFilterChange,
  provinceFilter, // Add province filter
  onProvinceFilterChange, // Add province filter change handler
  onApplyFilters,
  onResetFilters,
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
  const [localIndustryFilter, setLocalIndustryFilter] = React.useState(industryFilter);
  const [localProvinceFilter, setLocalProvinceFilter] = React.useState(provinceFilter); // Add local province filter state

  // Use shorter debounce for better UX, with leading edge for immediate feedback and maxWait for guaranteed updates
  const debouncedSearchQuery = useDebouncedValue(localSearchQuery, 300, { leading: true, maxWait: 1000 });

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
    setLocalIndustryFilter(industryFilter || "");
  }, [industryFilter]);

  React.useEffect(() => {
    setLocalProvinceFilter(provinceFilter || ""); // Sync province filter
  }, [provinceFilter]);

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

  const handleIndustryFilterChange = (value: string) => {
    // Convert "__all__" back to empty string for the API
    const apiValue = value === "__all__" ? "" : value;
    setLocalIndustryFilter(apiValue);
    onIndustryFilterChange(apiValue);
  };

  const handleProvinceFilterChange = (value: string) => {
    // Convert "__all__" back to empty string for the API
    const apiValue = value === "__all__" ? "" : value;
    setLocalProvinceFilter(apiValue);
    onProvinceFilterChange(apiValue);
  };

  const resetFilters = () => {
    const today = new Date();
    const startOfYear = new Date(2024, 0, 1);

    setDateFromObj(startOfYear);
    setDateToObj(today);
    onDateFromChange("2024-01-01");
    onDateToChange(today.toISOString().split("T")[0]);
    setLocalSearchQuery("");
    onSearchChange("");
    setLocalPageSize(50);
    onPageSizeChange(50);
    setLocalIndustryFilter("");
    onIndustryFilterChange("");
    setLocalProvinceFilter(""); // Reset province filter
    onProvinceFilterChange(""); // Reset province filter
    onResetFilters();
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

      {/* Date Filters */}
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

        {/* Industry Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Industry:
          </label>
          <Select value={localIndustryFilter || "__all__"} onValueChange={handleIndustryFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Industries</SelectItem>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Province Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Province:
          </label>
          <Select value={localProvinceFilter || "__all__"} onValueChange={handleProvinceFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Provinces</SelectItem>
              {PROVINCES.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Results per page:
          </label>
          <select
            value={localPageSize}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="500">500 results</option>
            <option value="1000">1000 results</option>
            <option value="5000">5000 results</option>
            <option value="10000">10000 results</option>
            <option value="20000">20000 results (default)</option>
          </select>
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
