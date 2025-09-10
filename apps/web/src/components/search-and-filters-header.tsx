"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  return (
    <div className="fixed left-4 top-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
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
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              From:
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              To:
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Page Size:
            </label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              onDateFromChange("2024-01-01");
              onDateToChange(new Date().toISOString().split("T")[0]);
              onSearchChange("");
              onPageSizeChange(50);
            }}
          >
            Cancel
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
    </div>
  );
};
