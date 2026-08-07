import { Search, Plus, MapPin, Filter, RefreshCw, FileText, Maximize2, Minimize2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Branch {
    id: number;
    name: string;
}

interface InventoryFilterToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    filterUnit: string;
    onUnitChange: (value: string) => void;
    filterStatus: string;
    onStatusChange: (value: string) => void;
    quickFilter: 'all' | 'low' | 'out' | 'updated' | 'restocked';
    onQuickFilterChange: (filter: 'all' | 'low' | 'out' | 'updated' | 'restocked') => void;
    density: 'compact' | 'comfortable';
    onDensityChange: (density: 'compact' | 'comfortable') => void;
    currentBranchId?: number | string;
    branches: Branch[];
    isAdmin: boolean;
    onBranchFilter: (value: string) => void;
    selectedIds: number[];
    onOpenAddModal: () => void;
    onOpenMassRestockModal: () => void;
    onOpenReceiptScanner: () => void;
    onBulkDelete: () => void;
}

export function InventoryFilterToolbar({
    search,
    onSearchChange,
    filterUnit,
    onUnitChange,
    filterStatus,
    onStatusChange,
    quickFilter,
    onQuickFilterChange,
    density,
    onDensityChange,
    currentBranchId,
    branches,
    isAdmin,
    onBranchFilter,
    selectedIds,
    onOpenAddModal,
    onOpenMassRestockModal,
    onOpenReceiptScanner,
    onBulkDelete,
}: InventoryFilterToolbarProps) {
    return (
        <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] p-4 sm:p-6 backdrop-blur-2xl transition-colors duration-300 space-y-4">
            
            {/* ROW 1: Search Bar & Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1 min-w-60">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A08E91] dark:text-[#64748B] focus-within:text-[#E75480] dark:focus-within:text-[#FF4F81] transition-colors">
                        <Search className="size-4" />
                    </div>
                    <Input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search inventory by item name, SKU (e.g. ING-00001), unit..."
                        className="h-12 pl-11 pr-4 bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] rounded-2xl focus:ring-4 focus:ring-[#E75480]/15 dark:focus:ring-[#E1062C]/20 focus:border-[#E75480] dark:focus:border-[#E1062C] transition-all placeholder:text-[#C5B8BA] dark:placeholder:text-[#64748B] font-medium text-sm shadow-2xs hover:border-[#E75480]/40 dark:hover:border-white/20"
                    />
                </div>

                {/* Primary Actions: Add Ingredient & Bulk Dropdown */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Bulk Actions Dropdown */}
                    {selectedIds.length > 0 && isAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    className="h-12 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider gap-2 cursor-pointer shadow-xs"
                                >
                                    <span>Bulk ({selectedIds.length})</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] p-1.5 shadow-xl w-44 font-['Outfit']">
                                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] px-3 py-1.5">
                                    Bulk Operations
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[#F8C8DC]/40 dark:bg-white/10 my-1" />
                                <DropdownMenuItem
                                    onClick={onBulkDelete}
                                    className="rounded-xl px-3 py-2 text-xs font-bold gap-2 cursor-pointer text-rose-600 dark:text-rose-400 dark:focus:bg-rose-950/30"
                                >
                                    <Trash2 className="size-3.5" />
                                    <span>Delete Selected</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Add Ingredient Button */}
                    {isAdmin && (
                        <Button
                            onClick={onOpenAddModal}
                            className="h-12 px-5 bg-linear-to-r from-[#E75480] via-[#F472B6] to-[#E75480] dark:from-[#E1062C] dark:via-[#FF4F81] dark:to-[#E1062C] bg-size-[200%_auto] hover:bg-right text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-[0_10px_25px_-5px_rgba(231,84,128,0.35)] dark:shadow-[0_10px_25px_-5px_rgba(225,6,44,0.4)] hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-300 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="size-4" />
                            <span>Add Ingredient</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ROW 2: Filter Controls & Tools */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Branch Filter (Admin Only) */}
                    {isAdmin && (
                        <Select
                            value={currentBranchId ? String(currentBranchId) : 'all'}
                            onValueChange={onBranchFilter}
                        >
                            <SelectTrigger className="w-44 h-11 bg-white/90 dark:bg-[#181820]/90 border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs rounded-2xl font-bold text-xs uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer hover:border-[#E75480]/40 dark:hover:border-white/20 transition-all">
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                    <SelectValue placeholder="All Branches" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                <SelectItem value="all" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">
                                    All Branches
                                </SelectItem>
                                {branches?.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)} className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Unit Filter */}
                    <Select value={filterUnit} onValueChange={onUnitChange}>
                        <SelectTrigger className="w-36 h-11 bg-white/90 dark:bg-[#181820]/90 border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs rounded-2xl font-bold text-xs uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer hover:border-[#E75480]/40 dark:hover:border-white/20 transition-all">
                            <div className="flex items-center gap-2">
                                <Filter className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                <SelectValue placeholder="All Units" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                            <SelectItem value="all" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">All Units</SelectItem>
                            <SelectItem value="g" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">Grams (g)</SelectItem>
                            <SelectItem value="kg" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">Kilograms (kg)</SelectItem>
                            <SelectItem value="pcs" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">Pieces (pcs)</SelectItem>
                            <SelectItem value="liters" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">Liters (L)</SelectItem>
                            <SelectItem value="ml" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">Milliliters (ml)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Stock Status Filter */}
                    <Select value={filterStatus} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-40 h-11 bg-white/90 dark:bg-[#181820]/90 border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs rounded-2xl font-bold text-xs uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer hover:border-[#E75480]/40 dark:hover:border-white/20 transition-all">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                            <SelectItem value="all" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">All Statuses</SelectItem>
                            <SelectItem value="optimal" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-emerald-600 dark:text-emerald-400 cursor-pointer dark:focus:bg-white/10">Optimal</SelectItem>
                            <SelectItem value="low" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-amber-600 dark:text-amber-400 cursor-pointer dark:focus:bg-white/10">Low Stock</SelectItem>
                            <SelectItem value="out" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-rose-600 dark:text-rose-400 cursor-pointer dark:focus:bg-white/10">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Density Control */}
                    <div className="flex items-center bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl p-1 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => onDensityChange('compact')}
                            className={cn(
                                'p-2 rounded-xl text-xs transition-all cursor-pointer',
                                density === 'compact'
                                    ? 'bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                            )}
                            title="Compact Row Density"
                        >
                            <Minimize2 className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDensityChange('comfortable')}
                            className={cn(
                                'p-2 rounded-xl text-xs transition-all cursor-pointer',
                                density === 'comfortable'
                                    ? 'bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                            )}
                            title="Comfortable Row Density"
                        >
                            <Maximize2 className="size-4" />
                        </button>
                    </div>

                    {/* Mass Restock Button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onOpenMassRestockModal}
                        className="h-11 px-4 border-[#F8C8DC]/60 dark:border-white/10 text-[#E75480] dark:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/10 rounded-2xl font-bold text-xs uppercase tracking-wider gap-2 cursor-pointer shadow-2xs"
                    >
                        <RefreshCw className="size-4" />
                        <span className="hidden xl:inline">Mass Restock</span>
                    </Button>

                    {/* Scan Receipt Button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onOpenReceiptScanner}
                        className="h-11 px-4 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:text-[#E75480] dark:hover:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/10 rounded-2xl font-bold text-xs uppercase tracking-wider gap-2 cursor-pointer shadow-2xs"
                    >
                        <FileText className="size-4 text-purple-600 dark:text-purple-400" />
                        <span className="hidden xl:inline">Scan Receipt</span>
                    </Button>
                </div>
            </div>

            {/* ROW 3: Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F8C8DC]/30 dark:border-white/10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] mr-1">Quick Filters:</span>
                {[
                    { id: 'all', label: 'All Items' },
                    { id: 'low', label: 'Low Stock' },
                    { id: 'out', label: 'Out of Stock' },
                    { id: 'updated', label: 'Updated Today' },
                    { id: 'restocked', label: 'Restocked Today' },
                ].map((chip) => (
                    <button
                        key={chip.id}
                        type="button"
                        onClick={() => onQuickFilterChange(chip.id as 'all' | 'low' | 'out' | 'updated' | 'restocked')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                            quickFilter === chip.id
                                ? 'bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent shadow-xs'
                                : 'bg-white dark:bg-[#181820] text-[#7D6B6E] dark:text-[#94A3B8] border-[#F8C8DC]/60 dark:border-white/10 hover:border-[#E75480]/40'
                        )}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
