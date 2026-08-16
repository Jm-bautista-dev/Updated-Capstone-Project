import debounce from 'lodash/debounce';
import { Building2, Calendar, Clock, History, LayoutGrid, List, Search, User, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { Branch, DeliveryFilters as FilterType, ViewMode } from './types';

interface DeliveryFiltersProps {
    filters: FilterType;
    branches: Branch[];
    allRiders?: Array<{ id: number; name: string }>;
    viewMode: ViewMode;
    onFilterChange: (updates: Partial<FilterType>) => void;
    onViewModeChange: (mode: ViewMode) => void;
}

const DeliveryFilters = React.memo(function DeliveryFilters({
    filters,
    branches,
    allRiders = [],
    viewMode,
    onFilterChange,
    onViewModeChange,
}: DeliveryFiltersProps) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const currentView = filters.view || 'today';

    const debouncedSearch = useMemo(
        () => debounce((value: string) => onFilterChange({ search: value }), 300),
        [onFilterChange]
    );

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
        debouncedSearch(e.target.value);
    }, [debouncedSearch]);

    const activeFilterCount = [
        filters.status && filters.status !== 'all',
        filters.type && filters.type !== 'all',
        filters.branch_id && filters.branch_id !== 'all',
        filters.rider_id && filters.rider_id !== 'all',
        filters.date_preset && filters.date_preset !== 'all',
        filters.search,
    ].filter(Boolean).length;

    const clearFilters = useCallback(() => {
        setSearchValue('');
        onFilterChange({
            status: 'all',
            type: 'all',
            branch_id: 'all',
            rider_id: 'all',
            date_preset: 'all',
            start_date: '',
            end_date: '',
            search: ''
        });
    }, [onFilterChange]);

    return (
        <div className="flex flex-col gap-4">
            {/* View Navigation Switcher: Today's Operations vs Delivery Archive */}
            <div className="flex items-center justify-between gap-3 p-1.5 rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 backdrop-blur-2xl shadow-[0_10px_30px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] font-['Outfit']">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => onFilterChange({ view: 'today' })}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                            currentView === 'today'
                                ? 'bg-linear-to-r from-[#E75480] to-[#FF4F81] text-white shadow-md shadow-[#E75480]/20'
                                : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:bg-[#F8C8DC]/20 dark:hover:bg-white/5'
                        }`}
                    >
                        <Clock className="size-4" />
                        <span>Today's Operations</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onFilterChange({ view: 'archive' })}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                            currentView === 'archive'
                                ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                                : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:bg-[#F8C8DC]/20 dark:hover:bg-white/5'
                        }`}
                    >
                        <History className="size-4" />
                        <span>Delivery Archive</span>
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                    <span>Mode:</span>
                    <span className="uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                        {currentView === 'today' ? 'Live Operations' : 'Historical Records'}
                    </span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 backdrop-blur-2xl shadow-[0_10px_30px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] p-4 font-['Outfit']">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-3 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                        <Input
                            id="delivery-search"
                            placeholder={currentView === 'archive' ? "Search archive by Order #, Customer, Phone, or Rider..." : "Search by Order #, Customer, or Address..."}
                            className="pl-10 h-10 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC] focus-visible:ring-[#E75480]/30"
                            value={searchValue}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                        {/* Archive Specific Date Filter */}
                        {currentView === 'archive' && (
                            <Select value={filters.date_preset || 'all'} onValueChange={(v: string) => onFilterChange({ date_preset: v as FilterType['date_preset'] })}>
                                <SelectTrigger className="h-10 w-35 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold shrink-0 text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    <Calendar className="size-3 mr-1 text-purple-500" />
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820]">
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {/* Custom Date Inputs */}
                        {currentView === 'archive' && filters.date_preset === 'custom' && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Input
                                    type="date"
                                    value={filters.start_date || ''}
                                    onChange={(e) => onFilterChange({ start_date: e.target.value })}
                                    className="h-10 w-32.5 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]"
                                />
                                <span className="text-xs text-muted-foreground">to</span>
                                <Input
                                    type="date"
                                    value={filters.end_date || ''}
                                    onChange={(e) => onFilterChange({ end_date: e.target.value })}
                                    className="h-10 w-32.5 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]"
                                />
                            </div>
                        )}

                        {/* Rider Filter */}
                        {allRiders.length > 0 && (
                            <Select value={filters.rider_id || 'all'} onValueChange={(v: string) => onFilterChange({ rider_id: v })}>
                                <SelectTrigger className="h-10 w-35 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold shrink-0 text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    <User className="size-3 mr-1 text-indigo-500" />
                                    <SelectValue placeholder="Rider" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820]">
                                    <SelectItem value="all">All Riders</SelectItem>
                                    {allRiders.map(r => (
                                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Select value={filters.type || 'all'} onValueChange={(v: string) => onFilterChange({ type: v })}>
                            <SelectTrigger className="h-10 w-32.5 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold shrink-0 text-[#3D2C2E] dark:text-[#F8FAFC]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820]">
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="internal">Internal</SelectItem>
                                <SelectItem value="external">External</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.branch_id || 'all'} onValueChange={(v: string) => onFilterChange({ branch_id: v })}>
                            <SelectTrigger className="h-10 w-37.5 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold shrink-0 text-[#3D2C2E] dark:text-[#F8FAFC]">
                                <Building2 className="size-3 mr-1 text-[#E75480] dark:text-[#FF4F81]" />
                                <SelectValue placeholder="Branch" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820]">
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        {activeFilterCount > 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl shrink-0 text-[#7D6B6E] dark:text-[#94A3B8] hover:text-rose-500"
                                        onClick={clearFilters}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</TooltipContent>
                            </Tooltip>
                        )}

                        {/* Separator */}
                        <div className="w-px h-8 bg-[#F8C8DC]/40 dark:bg-white/10 shrink-0 hidden lg:block" />

                        {/* View Toggle */}
                        <ToggleGroup
                            type="single"
                            value={viewMode}
                            onValueChange={(v) => v && onViewModeChange(v as ViewMode)}
                            variant="outline"
                            className="shrink-0"
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem value="card" aria-label="Card view" className="h-10 w-10 rounded-xl border-[#F8C8DC]/60 dark:border-white/10">
                                        <LayoutGrid className="size-4" />
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent>Card View</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem value="table" aria-label="Table view" className="h-10 w-10 rounded-xl border-[#F8C8DC]/60 dark:border-white/10">
                                        <List className="size-4" />
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent>Table View</TooltipContent>
                            </Tooltip>
                        </ToggleGroup>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default DeliveryFilters;
