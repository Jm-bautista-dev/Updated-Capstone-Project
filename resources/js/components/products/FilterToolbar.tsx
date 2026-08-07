import { Search, Plus, MapPin, Filter } from 'lucide-react';

import { ViewSwitcher, type ViewMode } from '@/components/products/ViewSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Category {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
}

interface FilterToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    filterCategory: string;
    onCategoryChange: (value: string) => void;
    filterStockStatus: string;
    onStockStatusChange: (value: string) => void;
    currentBranchId?: number | string;
    branches: Branch[];
    categories: Category[];
    isAdmin: boolean;
    onBranchFilter: (value: string) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onOpenAddModal: () => void;
}

export function FilterToolbar({
    search,
    onSearchChange,
    filterCategory,
    onCategoryChange,
    filterStockStatus,
    onStockStatusChange,
    currentBranchId,
    branches,
    categories,
    isAdmin,
    onBranchFilter,
    viewMode,
    onViewModeChange,
    onOpenAddModal,
}: FilterToolbarProps) {
    return (
        <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] p-4 sm:p-6 backdrop-blur-2xl transition-colors duration-300 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative flex-1 min-w-60">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A08E91] dark:text-[#64748B] focus-within:text-[#E75480] dark:focus-within:text-[#FF4F81] transition-colors">
                        <Search className="size-4" />
                    </div>
                    <Input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search products by name, SKU..."
                        className="h-12 pl-11 pr-4 bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] rounded-2xl focus:ring-4 focus:ring-[#E75480]/15 dark:focus:ring-[#E1062C]/20 focus:border-[#E75480] dark:focus:border-[#E1062C] transition-all placeholder:text-[#C5B8BA] dark:placeholder:text-[#64748B] font-medium text-sm shadow-2xs hover:border-[#E75480]/40 dark:hover:border-white/20"
                    />
                </div>

                {/* Filter Dropdowns & Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Branch Filter (Admin Only) */}
                    {isAdmin && (
                        <Select
                            value={currentBranchId ? String(currentBranchId) : 'all'}
                            onValueChange={onBranchFilter}
                        >
                            <SelectTrigger className="w-44 h-12 bg-white/90 dark:bg-[#181820]/90 border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs rounded-2xl font-bold text-xs uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer hover:border-[#E75480]/40 dark:hover:border-white/20 transition-all">
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

                    {/* Category Filter */}
                    <Select
                        value={filterCategory || 'all'}
                        onValueChange={(val) => onCategoryChange(val === 'all' ? '' : val)}
                    >
                        <SelectTrigger className="w-44 h-12 bg-white/90 dark:bg-[#181820]/90 border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs rounded-2xl font-bold text-xs uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer hover:border-[#E75480]/40 dark:hover:border-white/20 transition-all">
                            <div className="flex items-center gap-2">
                                <Filter className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                <SelectValue placeholder="All Categories" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                            <SelectItem value="all" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">
                                All Categories
                            </SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)} className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Stock Status Filter */}
                    <Select
                        value={filterStockStatus || 'all'}
                        onValueChange={(val) => onStockStatusChange(val === 'all' ? '' : val)}
                    >
                        <SelectTrigger className="w-40 h-12 bg-white/90 dark:bg-[#181820]/90 border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs rounded-2xl font-bold text-xs uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer hover:border-[#E75480]/40 dark:hover:border-white/20 transition-all">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                            <SelectItem value="all" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">
                                All Statuses
                            </SelectItem>
                            <SelectItem value="In Stock" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-emerald-600 dark:text-emerald-400 cursor-pointer dark:focus:bg-white/10">
                                In Stock
                            </SelectItem>
                            <SelectItem value="Low Stock" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-amber-600 dark:text-amber-400 cursor-pointer dark:focus:bg-white/10">
                                Low Stock
                            </SelectItem>
                            <SelectItem value="Out of Stock" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-rose-600 dark:text-rose-400 cursor-pointer dark:focus:bg-white/10">
                                Out of Stock
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* View Switcher */}
                    <ViewSwitcher mode={viewMode} onChange={onViewModeChange} />

                    {/* Add Product Button (Admin Only) */}
                    {isAdmin && (
                        <Button
                            onClick={onOpenAddModal}
                            className="h-12 px-5 bg-linear-to-r from-[#E75480] via-[#F472B6] to-[#E75480] dark:from-[#E1062C] dark:via-[#FF4F81] dark:to-[#E1062C] bg-size-[200%_auto] hover:bg-right text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-[0_10px_25px_-5px_rgba(231,84,128,0.35)] dark:shadow-[0_10px_25px_-5px_rgba(225,6,44,0.4)] hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-300 flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add Product</span>
                        </Button>
                    )}

                </div>
            </div>
        </div>
    );
}
