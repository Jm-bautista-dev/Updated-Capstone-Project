import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Building2, LayoutGrid, List, X } from 'lucide-react';
import { MobileFilter } from '@/components/shared/mobile-filter';
import { cn } from '@/lib/utils';
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
        <div className="w-full">
            {/* Desktop View */}
            <Card className="hidden lg:flex border-none shadow-md rounded-2xl">
                <CardContent className="p-4 flex flex-row gap-4 items-center w-full">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            id="delivery-search"
                            placeholder="Search by Order #, Customer, or Address..."
                            className="pl-10 h-11 rounded-xl border-none bg-muted/50 focus-visible:bg-background transition-all"
                            value={searchValue}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Select value={filters.status || 'all'} onValueChange={(v: string) => onFilterChange({ status: v })}>
                            <SelectTrigger className="h-10 w-[140px] rounded-xl bg-muted/50 border-none text-xs font-bold">
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
                            <SelectTrigger className="h-10 w-[140px] rounded-xl bg-muted/50 border-none text-xs font-bold">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="internal">Internal</SelectItem>
                                <SelectItem value="external">External</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.branch_id || 'all'} onValueChange={(v: string) => onFilterChange({ branch_id: v })}>
                            <SelectTrigger className="h-10 w-[160px] rounded-xl bg-muted/50 border-none text-xs font-bold">
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

                        {activeFilterCount > 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive"
                                        onClick={clearFilters}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</TooltipContent>
                            </Tooltip>
                        )}

                        <div className="w-px h-8 bg-border mx-1" />

                        <ToggleGroup
                            type="single"
                            value={viewMode}
                            onValueChange={(v) => v && onViewModeChange(v as ViewMode)}
                            variant="outline"
                        >
                            <ToggleGroupItem value="card" aria-label="Card view" className="h-10 w-10 rounded-xl">
                                <LayoutGrid className="size-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="table" aria-label="Table view" className="h-10 w-10 rounded-xl">
                                <List className="size-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile View */}
            <div className="flex lg:hidden flex-col gap-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search deliveries..."
                            className="pl-9 h-10 rounded-xl border-border bg-card shadow-sm text-sm"
                            value={searchValue}
                            onChange={handleSearchChange}
                        />
                    </div>
                    
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(v) => v && onViewModeChange(v as ViewMode)}
                        variant="outline"
                    >
                        <ToggleGroupItem value="card" className="h-10 w-10 rounded-xl bg-card">
                            <LayoutGrid className="size-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="table" className="h-10 w-10 rounded-xl bg-card">
                            <List className="size-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <MobileFilter
                    title="Delivery Filters"
                    activeFilterCount={activeFilterCount}
                    activeFilterSummary={`${filters.status || 'All Status'} • ${filters.type || 'All Types'} • ${filters.branch_id === 'all' ? 'All Branches' : (branches.find(b => String(b.id) === filters.branch_id)?.name || 'Filtered branch')}`}
                    onClear={clearFilters}
                >
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Delivery Status</span>
                            <div className="grid grid-cols-2 gap-2">
                                {['all', 'pending', 'preparing', 'out_for_delivery', 'delivered'].map(s => (
                                    <Button
                                        key={s}
                                        variant={filters.status === s ? "default" : "outline"}
                                        onClick={() => onFilterChange({ status: s })}
                                        className={cn("h-12 justify-start font-black uppercase text-[10px] tracking-widest px-4 rounded-xl", filters.status === s ? "bg-primary text-white" : "")}
                                    >
                                        {s.replace(/_/g, ' ')}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Fulfillment Type</span>
                            <div className="grid grid-cols-2 gap-2">
                                {['all', 'internal', 'external'].map(t => (
                                    <Button
                                        key={t}
                                        variant={filters.type === t ? "default" : "outline"}
                                        onClick={() => onFilterChange({ type: t })}
                                        className={cn("h-12 justify-start font-black uppercase text-[10px] tracking-widest px-4 rounded-xl", filters.type === t ? "bg-primary text-white" : "")}
                                    >
                                        {t === 'all' ? 'All Types' : t}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Origin Branch</span>
                            <Select value={filters.branch_id || 'all'} onValueChange={(v: string) => onFilterChange({ branch_id: v })}>
                                <SelectTrigger className="h-12 w-full rounded-xl bg-muted/30 border-none font-black uppercase text-[10px] tracking-widest px-4">
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all" className="font-bold py-3 uppercase text-[10px] tracking-widest">All Branches</SelectItem>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={String(b.id)} className="font-bold py-3 uppercase text-[10px] tracking-widest">{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </MobileFilter>
            </div>
        </div>
    );

});

export default DeliveryFilters;
