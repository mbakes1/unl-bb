"use client";

import { Search, Filter } from "lucide-react";
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
}: SearchAndFiltersHeaderProps) => {
  const [dateFromObj, setDateFromObj] = React.useState<Date | undefined>(
    dateFrom ? new Date(dateFrom) : undefined
  );
  const [dateToObj, setDateToObj] = React.useState<Date | undefined>(
    dateTo ? new Date(dateTo) : undefined
  );

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFromObj(date);
    onDateFromChange(date ? date.toISOString().split("T")[0] : "");
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateToObj(date);
    onDateToChange(date ? date.toISOString().split("T")[0] : "");
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
  };

  const FiltersContent = () => (
    <div className="space-y-4">
      {/* Search Bar */}
      <div>
        <form onSubmit={onSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search tenders..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </form>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            From Date:
          </label>
          <DatePicker
            date={dateFromObj}
            onDateChange={handleDateFromChange}
            placeholder="Select start date"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            To Date:
          </label>
          <DatePicker
            date={dateToObj}
            onDateChange={handleDateToChange}
            placeholder="Select end date"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Page Size:
          </label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-full">
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

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={resetFilters}
        >
          Reset
        </Button>
        <Button
          type="submit"
          size="sm"
          className="flex-1 bg-gray-900 hover:bg-gray-800"
          onClick={onSearchSubmit}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-6 top-6 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Search & Filters
        </h2>
        <FiltersContent />
      </div>

      {/* Mobile Floating Filter Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              size="lg"
              className="rounded-full shadow-lg bg-gray-900 hover:bg-gray-800"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Search & Filters</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">
              <FiltersContent />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};
