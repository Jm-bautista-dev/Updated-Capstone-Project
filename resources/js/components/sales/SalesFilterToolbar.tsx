import {
    Search,
    Filter,
    LayoutGrid,
    Table as TableIcon,
    Download,
    Printer
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Branch = { id: number; name: string };

interface SalesFilterToolbarProps {
    search: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusChange: (val: string) => void;
    branchFilter: string;
    onBranchChange: (val: string) => void;
    viewMode: 'table' | 'cards';
    onViewModeChange: (mode: 'table' | 'cards') => void;
    density: 'compact' | 'comfortable';
    onDensityChange: (d: 'compact' | 'comfortable') => void;
    branches: Branch[];
    isAdmin?: boolean;
    onExportSales: () => void;
    onPrintReport: () => void;
}

export function SalesFilterToolbar({
    search,
    onSearchChange,
    statusFilter,
    onStatusChange,
    branchFilter,
    onBranchChange,
    viewMode,
    onViewModeChange,
    density,
    onDensityChange,
    branches,
    isAdmin = false,
    onExportSales,
    onPrintReport,
}: SalesFilterToolbarProps) {
    return (
        <div className="rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-5 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-4 font-['Outfit']">
            
            {/* ROW 1: Search & Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                    <Input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by order #, receipt, cashier, customer..."
                        className="pl-11 h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white/90 dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] placeholder:text-[#9E8B8E] dark:placeholder:text-[#64748B] text-xs font-bold shadow-2xs focus-visible:ring-[#E75480] dark:focus-visible:ring-[#FF4F81]"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#E75480] dark:hover:text-[#FF4F81] font-bold cursor-pointer"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Export CSV & Print Report Actions */}
                <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
                    
                    <Button
                        type="button"
                        onClick={onExportSales}
                        className="h-11 px-4 rounded-2xl bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                    >
                        <Download className="size-4" />
                        <span>Export CSV</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onPrintReport}
                        className="h-11 px-4 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-xs font-bold gap-2 cursor-pointer shadow-2xs"
                    >
                        <Printer className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                        <span>Print Report</span>
                    </Button>

                </div>

            </div>

            {/* ROW 2: Filter Selectors & View Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F8C8DC]/40 dark:border-white/10">
                
                {/* Status & Branch Filters */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-1.5">
                        <Filter className="size-3.5 text-[#7D6B6E] dark:text-[#94A3B8]" />
                        <span className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase tracking-wider">Status:</span>
                        <Select value={statusFilter} onValueChange={onStatusChange}>
                            <SelectTrigger className="w-36 h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] text-xs font-bold">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                <SelectItem value="all" className="text-xs font-bold">All Statuses</SelectItem>
                                <SelectItem value="completed" className="text-xs font-bold">Completed</SelectItem>
                                <SelectItem value="preparing" className="text-xs font-bold">Preparing</SelectItem>
                                <SelectItem value="pending" className="text-xs font-bold">Pending</SelectItem>
                                <SelectItem value="cancelled" className="text-xs font-bold">Cancelled / Void</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Branch Filter (Admin Only) */}
                    {isAdmin && branches.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase tracking-wider">Branch:</span>
                            <Select value={branchFilter} onValueChange={onBranchChange}>
                                <SelectTrigger className="w-40 h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] text-xs font-bold">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                    <SelectItem value="all" className="text-xs font-bold">All Branches</SelectItem>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={String(b.id)} className="text-xs font-bold">{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                </div>

                {/* Right Controls: View Mode Switcher & Density */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    
                    {/* Table Density Toggle */}
                    <div className="hidden sm:flex items-center gap-1 bg-[#FFF5F7] dark:bg-[#181820] p-1 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => onDensityChange('compact')}
                            className={cn(
                                'px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                                density === 'compact'
                                    ? 'bg-white dark:bg-[#222230] text-[#E75480] dark:text-[#FF4F81] shadow-2xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8]'
                            )}
                        >
                            Compact
                        </button>
                        <button
                            type="button"
                            onClick={() => onDensityChange('comfortable')}
                            className={cn(
                                'px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                                density === 'comfortable'
                                    ? 'bg-white dark:bg-[#222230] text-[#E75480] dark:text-[#FF4F81] shadow-2xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8]'
                            )}
                        >
                            Comfortable
                        </button>
                    </div>

                    {/* View Mode Switcher (Table vs Card Grid) */}
                    <div className="flex items-center p-1 rounded-2xl bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 shadow-inner">
                        <button
                            type="button"
                            onClick={() => onViewModeChange('table')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                viewMode === 'table'
                                    ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-white'
                            )}
                        >
                            <TableIcon className="size-3.5" />
                            <span>Table</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange('cards')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                viewMode === 'cards'
                                    ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-white'
                            )}
                        >
                            <LayoutGrid className="size-3.5" />
                            <span>Cards</span>
                        </button>
                    </div>

                </div>

            </div>

        </div>
    );
}
