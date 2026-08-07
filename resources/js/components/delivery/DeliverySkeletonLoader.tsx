import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

import type { ViewMode } from './types';

interface DeliverySkeletonLoaderProps {
    viewMode: ViewMode;
    count?: number;
}

function TableSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="rounded-4xl border border-white/90 dark:border-white/10 overflow-hidden bg-white/80 dark:bg-[#121218]/80 backdrop-blur-2xl">
            {/* Header */}
            <div className="bg-[#FFF5F7]/70 dark:bg-[#181824]/70 px-6 py-3.5 flex gap-4 items-center border-b border-[#F8C8DC]/60 dark:border-white/10">
                {[80, 100, 120, 80, 100, 80, 80, 60].map((w, i) => (
                    <Skeleton key={i} className="h-3 rounded-full bg-[#F8C8DC]/40 dark:bg-white/10" style={{ width: w }} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="px-6 py-4 flex gap-4 items-center border-b border-[#F8C8DC]/30 dark:border-white/5 last:border-b-0"
                    style={{ animationDelay: `${i * 75}ms` }}
                >
                    <Skeleton className="h-6 w-20 rounded-full bg-[#F8C8DC]/30 dark:bg-white/10" />
                    <Skeleton className="h-4 w-24 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                    <Skeleton className="h-4 w-32 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                    <Skeleton className="h-5 w-16 rounded-full bg-[#F8C8DC]/30 dark:bg-white/10" />
                    <Skeleton className="h-4 w-24 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                    <Skeleton className="h-4 w-20 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                    <Skeleton className="h-4 w-16 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                    <Skeleton className="h-8 w-8 rounded-lg bg-[#F8C8DC]/30 dark:bg-white/10" />
                </div>
            ))}
        </div>
    );
}

function CardSkeleton() {
    return (
        <div className="rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-20 rounded-full bg-[#F8C8DC]/30 dark:bg-white/10" />
                        <Skeleton className="h-5 w-28 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                    </div>
                    <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-20 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                        <Skeleton className="h-3 w-16 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                    </div>
                </div>
                <div className="border-t border-[#F8C8DC]/30 dark:border-white/5 border-dashed pt-4 flex gap-4">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-16 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                        <Skeleton className="h-4 w-28 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-16 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                        <Skeleton className="h-4 w-24 rounded bg-[#F8C8DC]/30 dark:bg-white/10" />
                    </div>
                </div>
                <Skeleton className="h-10 w-full rounded-xl bg-[#F8C8DC]/30 dark:bg-white/10" />
            </div>
        </div>
    );
}

const DeliverySkeletonLoader = React.memo(function DeliverySkeletonLoader({
    viewMode,
    count = 6,
}: DeliverySkeletonLoaderProps) {
    if (viewMode === 'table') {
        return <TableSkeleton count={count} />;
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
});

export default DeliverySkeletonLoader;
