import { Navigation, SearchX } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface DeliveryEmptyStateProps {
    hasFilters: boolean;
    onClearFilters?: () => void;
}

const DeliveryEmptyState = React.memo(function DeliveryEmptyState({ hasFilters, onClearFilters }: DeliveryEmptyStateProps) {
    return (
        <div className="col-span-full py-24 rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 backdrop-blur-2xl flex flex-col items-center justify-center text-[#7D6B6E] dark:text-[#94A3B8] gap-5 font-['Outfit'] shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)]">
            <div className="relative">
                {hasFilters ? (
                    <SearchX className="size-16 stroke-1 text-[#E75480]/20 dark:text-[#FF4F81]/20 animate-[bounce_3s_ease-in-out_infinite]" />
                ) : (
                    <Navigation className="size-16 stroke-1 text-[#E75480]/20 dark:text-[#FF4F81]/20 animate-[bounce_3s_ease-in-out_infinite]" />
                )}
                <div className="absolute inset-0 size-16 bg-[#E75480]/5 rounded-full blur-2xl" />
            </div>
            <div className="text-center space-y-1">
                <p className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                    {hasFilters ? 'No deliveries match your filters' : 'No active deliveries found'}
                </p>
                <p className="text-sm font-medium max-w-md">
                    {hasFilters
                        ? 'Try adjusting your search term or filter criteria to find what you\'re looking for.'
                        : 'New delivery orders from the POS will appear here automatically.'}
                </p>
            </div>
            {hasFilters && onClearFilters && (
                <Button
                    variant="outline"
                    className="rounded-2xl gap-2 mt-2 border-[#F8C8DC]/60 dark:border-white/10 text-[#E75480] dark:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-[#1C1C28] font-bold"
                    onClick={onClearFilters}
                >
                    <SearchX className="size-4" />
                    Clear All Filters
                </Button>
            )}
        </div>
    );
});

export default DeliveryEmptyState;
