import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReviewPaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage?: number;
    from?: number | null;
    to?: number | null;
    label?: string;
    isLoading?: boolean;
    onPageChange: (page: number, perPage?: number) => void;
    perPageOptions?: number[];
    onPerPageChange?: (size: number) => void;
    compact?: boolean;
    className?: string;
}

function getPaginationPages(currentPage: number, lastPage: number): (number | '...')[] {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, '...', lastPage];
    }

    if (currentPage >= lastPage - 3) {
        return [1, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', lastPage];
}

export const ReviewPagination: React.FC<ReviewPaginationProps> = ({
    currentPage,
    lastPage,
    total,
    perPage = 10,
    from,
    to,
    label = 'items',
    isLoading = false,
    onPageChange,
    perPageOptions,
    onPerPageChange,
    compact = false,
    className,
}) => {
    if (total === 0) return null;

    const startItem = from ?? (currentPage - 1) * perPage + 1;
    const endItem = to ?? Math.min(currentPage * perPage, total);
    const pages = getPaginationPages(currentPage, lastPage);

    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-white/8 select-none',
                className
            )}
        >
            {/* Information Label */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1">
                    <span>Showing</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {startItem}
                    </span>
                    <span>to</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {endItem}
                    </span>
                    <span>of</span>
                    <span className="font-mono font-black text-[#FF3366] dark:text-[#FF4F81]">
                        {total}
                    </span>
                    <span>{label}</span>
                    {isLoading && <Loader2 className="size-3.5 animate-spin text-[#FF3366] ml-1" />}
                </div>

                {/* Per-Page Selector (Optional) */}
                {perPageOptions && onPerPageChange && (
                    <div className="flex items-center gap-1.5 pl-2 sm:border-l border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400">Per page:</span>
                        {perPageOptions.map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => onPerPageChange(size)}
                                className={cn(
                                    'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer',
                                    perPage === size
                                        ? 'bg-[#FF3366] text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-[#181924] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/8'
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {lastPage > 1 && (
                <div className="flex items-center gap-1">
                    {/* Previous Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1 || isLoading}
                        className={cn(
                            'rounded-xl text-xs font-bold gap-1 border-slate-200/80 dark:border-white/8 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all',
                            compact ? 'h-7 px-2 text-[10px]' : 'h-8 px-2.5'
                        )}
                        aria-label="Previous Page"
                    >
                        <ChevronLeft className={compact ? 'size-3' : 'size-3.5'} />
                        <span className={compact ? 'inline' : 'hidden sm:inline'}>Prev</span>
                    </Button>

                    {/* Page Numbers */}
                    {pages.map((item, idx) => {
                        if (item === '...') {
                            return (
                                <span
                                    key={`dots-${idx}`}
                                    className="px-1 text-xs text-slate-400 font-bold"
                                >
                                    ...
                                </span>
                            );
                        }

                        const pageNum = item as number;
                        const isActive = pageNum === currentPage;

                        return (
                            <Button
                                key={pageNum}
                                type="button"
                                size="sm"
                                variant={isActive ? 'default' : 'outline'}
                                onClick={() => onPageChange(pageNum)}
                                disabled={isLoading}
                                className={cn(
                                    'p-0 rounded-xl font-mono font-bold transition-all cursor-pointer',
                                    compact ? 'size-7 text-[10px]' : 'size-8 text-xs',
                                    isActive
                                        ? 'bg-[#FF3366] hover:bg-[#E1062C] text-white shadow-xs border-0 scale-105'
                                        : 'border-slate-200/80 dark:border-white/8 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                )}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}

                    {/* Next Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
                        disabled={currentPage >= lastPage || isLoading}
                        className={cn(
                            'rounded-xl text-xs font-bold gap-1 border-slate-200/80 dark:border-white/8 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all',
                            compact ? 'h-7 px-2 text-[10px]' : 'h-8 px-2.5'
                        )}
                        aria-label="Next Page"
                    >
                        <span className={compact ? 'inline' : 'hidden sm:inline'}>Next</span>
                        <ChevronRight className={compact ? 'size-3' : 'size-3.5'} />
                    </Button>
                </div>
            )}
        </div>
    );
};
