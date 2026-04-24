import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Building2, LayoutGrid, List, X } from 'lucide-react';
import debounce from 'lodash/debounce';
import type { DeliveryFilters as FilterType, Branch, ViewMode } from './types';

interface DeliveryFiltersProps {
    filters: FilterType;
    branches: Branch[];
    viewMode: ViewMode;
    onFilterChange: (updates: Partial<FilterType>) => void;
    onViewModeChange: (mode: ViewMode) => void;
}

const DeliveryFilters = React.memo(function DeliveryFilters({
    filters,
    branches,
    viewMode,
    onFilterChange,
    onViewModeChange,
}: DeliveryFiltersProps) {
    const [searchValue, setSearchValue] = useState(filters.search || '');

    const debouncedSearch = useCallback(
        debounce((value: string) => onFilterChange({ search: value }), 300),
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
        filters.search,
    ].filter(Boolean).length;

    const clearFilters = useCallback(() => {
        setSearchValue('');
        onFilterChange({ status: 'all', type: 'all', branch_id: 'all', search: '' });
    }, [onFilterChange]);

    return (
        <Card className="border-none shadow-md rounded-2xl">
            <CardContent className="p-4 flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        id="delivery-search"
                        placeholder="Search by Order #, Customer, or Address..."
                        className="pl-10 h-11 rounded-xl border-none bg-muted/20 focus-visible:bg-background transition-all"
                        value={searchValue}
                        onChange={handleSearchChange}
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                    <Select value={filters.status || 'all'} onValueChange={(v: string) => onFilterChange({ status: v })}>
                        <SelectTrigger className="h-10 w-[140px] rounded-xl bg-muted/20 border-none text-xs font-bold shrink-0">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="out_for_delivery">In Transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.type || 'all'} onValueChange={(v: string) => onFilterChange({ type: v })}>
                        <SelectTrigger className="h-10 w-[140px] rounded-xl bg-muted/20 border-none text-xs font-bold shrink-0">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="external">External</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.branch_id || 'all'} onValueChange={(v: string) => onFilterChange({ branch_id: v })}>
                        <SelectTrigger className="h-10 w-[160px] rounded-xl bg-muted/20 border-none text-xs font-bold shrink-0">
                            <Building2 className="size-3 mr-1" />
                            <SelectValue placeholder="Branch" />
                        </SelectTrigger>
                        <SelectContent>
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
                                    className="h-10 w-10 rounded-xl shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={clearFilters}
                                >
                                    <X className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</TooltipContent>
                        </Tooltip>
                    )}

                    {/* Separator */}
                    <div className="w-px h-8 bg-border shrink-0 hidden lg:block" />

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
                                <ToggleGroupItem value="card" aria-label="Card view" className="h-10 w-10 rounded-xl">
                                    <LayoutGrid className="size-4" />
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Card View</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <ToggleGroupItem value="table" aria-label="Table view" className="h-10 w-10 rounded-xl">
                                    <List className="size-4" />
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Table View</TooltipContent>
                        </Tooltip>
                    </ToggleGroup>
                </div>
            </CardContent>
        </Card>
    );
});

export default DeliveryFilters;
