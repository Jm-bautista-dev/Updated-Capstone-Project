import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
    return (
        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#12131A] animate-pulse flex items-center gap-3.5">
            <div className="size-14 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-2.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
                <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
            </div>
        </div>
    );
};

export const ReviewCardSkeleton: React.FC = () => {
    return (
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#12131A] animate-pulse space-y-3.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                        <div className="h-2.5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    </div>
                </div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
            <div className="h-14 w-full bg-slate-100 dark:bg-[#181924] rounded-xl" />
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/6">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="flex gap-2">
                    <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
            </div>
        </div>
    );
};
