import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import type { ViewMode } from './types';

interface DeliverySkeletonLoaderProps {
    viewMode: ViewMode;
    count?: number;
}

function TableSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="rounded-2xl border overflow-hidden">
            {/* Header */}
            <div className="bg-muted/30 px-6 py-3 flex gap-4 items-center border-b">
                {[80, 100, 120, 80, 100, 80, 80, 60].map((w, i) => (
                    <Skeleton key={i} className="h-3 rounded-full" style={{ width: w }} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="px-6 py-4 flex gap-4 items-center border-b last:border-b-0"
                    style={{ animationDelay: `${i * 75}ms` }}
                >
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            ))}
        </div>
    );
}

function CardSkeleton() {
    return (
        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-28 rounded" />
                    </div>
                    <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-20 rounded" />
                        <Skeleton className="h-3 w-16 rounded" />
                    </div>
                </div>
                <div className="border-t border-dashed pt-4 flex gap-4">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-4 w-28 rounded" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-4 w-24 rounded" />
                    </div>
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
            </CardContent>
        </Card>
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
