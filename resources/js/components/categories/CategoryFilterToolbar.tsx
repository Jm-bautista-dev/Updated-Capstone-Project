import { Search, Plus, Maximize2, Minimize2 } from 'lucide-react';

import { ViewSwitcher, type ViewMode } from '@/components/products/ViewSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CategoryFilterToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    density: 'compact' | 'comfortable';
    onDensityChange: (density: 'compact' | 'comfortable') => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    isAdmin: boolean;
    onOpenAddModal: () => void;
}

export function CategoryFilterToolbar({
    search,
    onSearchChange,
    density,
    onDensityChange,
    viewMode,
    onViewModeChange,
    isAdmin,
    onOpenAddModal,
}: CategoryFilterToolbarProps) {
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
                        placeholder="Search categories by name, description..."
                        className="h-12 pl-11 pr-4 bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] rounded-2xl focus:ring-4 focus:ring-[#E75480]/15 dark:focus:ring-[#E1062C]/20 focus:border-[#E75480] dark:focus:border-[#E1062C] transition-all placeholder:text-[#C5B8BA] dark:placeholder:text-[#64748B] font-medium text-sm shadow-2xs hover:border-[#E75480]/40 dark:hover:border-white/20"
                    />
                </div>

                {/* Filter Controls & CTA */}
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

                    {/* View Switcher */}
                    <ViewSwitcher mode={viewMode} onChange={onViewModeChange} />

                    {/* Add Category Button (Admin Only) */}
                    {isAdmin && (
                        <Button
                            onClick={onOpenAddModal}
                            className="h-12 px-5 bg-linear-to-r from-[#E75480] via-[#F472B6] to-[#E75480] dark:from-[#E1062C] dark:via-[#FF4F81] dark:to-[#E1062C] bg-size-[200%_auto] hover:bg-right text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-[0_10px_25px_-5px_rgba(231,84,128,0.35)] dark:shadow-[0_10px_25px_-5px_rgba(225,6,44,0.4)] hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-300 flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add Category</span>
                        </Button>
                    )}

                </div>
            </div>
        </div>
    );
}
