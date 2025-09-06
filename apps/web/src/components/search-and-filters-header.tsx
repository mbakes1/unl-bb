'use client'

import Link from 'next/link'
import { Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import React from 'react'
import { cn } from '@/lib/utils'

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
  onFilterToggle,
  isFilterOpen
}: SearchAndFiltersHeaderProps) => {
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
            <nav className="w-full px-2">
                <div className={cn('mx-auto max-w-6xl px-4 transition-all duration-300', isScrolled && 'py-1')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-4 py-3 lg:gap-0 lg:py-2">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <span className="text-xl font-bold">UNL</span>
                            </Link>

                            <button
                                onClick={onFilterToggle}
                                aria-label={isFilterOpen ? 'Close Filters' : 'Open Filters'}
                                className="relative z-20 -m-2.5 -mr-2 block cursor-pointer p-2.5 lg:hidden">
                                <Filter className={cn("m-auto size-5 duration-200", isFilterOpen && "rotate-180 scale-0 opacity-0")} />
                                <X className={cn("absolute inset-0 m-auto size-5 rotate-180 scale-0 opacity-0 duration-200", isFilterOpen && "rotate-0 scale-100 opacity-100")} />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <form onSubmit={onSearchSubmit} className="relative w-96">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search tenders..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                            </form>
                        </div>

                        <div className={cn(
                            "bg-white in-data-[state=active]:block lg:in-data-[state=active]:flex w-full flex-wrap items-center justify-end space-y-4 rounded-lg p-4 lg:m-0 lg:flex lg:w-fit lg:gap-3 lg:space-y-0 lg:p-0",
                            isFilterOpen ? "block" : "hidden lg:flex"
                        )}>
                            <div className="lg:hidden w-full">
                                <form onSubmit={onSearchSubmit} className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search tenders..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                    />
                                </form>
                            </div>
                            
                            <div className="w-full grid grid-cols-1 gap-3 md:grid-cols-3 lg:flex lg:gap-3 lg:w-fit">
                                <div>
                                    <label htmlFor="mobile-dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                                        From:
                                    </label>
                                    <Input
                                        type="date"
                                        id="mobile-dateFrom"
                                        value={dateFrom}
                                        onChange={(e) => onDateFromChange(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="mobile-dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                                        To:
                                    </label>
                                    <Input
                                        type="date"
                                        id="mobile-dateTo"
                                        value={dateTo}
                                        onChange={(e) => onDateToChange(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="mobile-pageSize" className="block text-sm font-medium text-gray-700 mb-1">
                                        Page Size:
                                    </label>
                                    <select 
                                        id="mobile-pageSize"
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
                            
                            <div className="flex w-full gap-2 lg:w-fit">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full lg:w-auto"
                                    onClick={onFilterToggle}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="w-full lg:w-auto"
                                    onClick={onSearchSubmit}>
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}