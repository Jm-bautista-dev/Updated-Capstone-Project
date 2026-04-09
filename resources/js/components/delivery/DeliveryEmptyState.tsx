import React from 'react';
import { Navigation, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeliveryEmptyStateProps {
    hasFilters: boolean;
    onClearFilters?: () => void;
}

const DeliveryEmptyState = React.memo(function DeliveryEmptyState({ hasFilters, onClearFilters }: DeliveryEmptyStateProps) {
    return (
        <div className="col-span-full py-24 bg-muted/10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground gap-5">
            <div className="relative">
                {hasFilters ? (
                    <SearchX className="size-16 stroke-1 opacity-20 animate-[bounce_3s_ease-in-out_infinite]" />
                ) : (
                    <Navigation className="size-16 stroke-1 opacity-20 animate-[bounce_3s_ease-in-out_infinite]" />
                )}
                <div className="absolute inset-0 size-16 bg-primary/5 rounded-full blur-2xl" />
            </div>
            <div className="text-center space-y-1">
                <p className="text-lg font-bold">
                    {hasFilters ? 'No deliveries match your filters' : 'No active deliveries found'}
                </p>
                <p className="text-sm max-w-md">
                    {hasFilters
                        ? 'Try adjusting your search term or filter criteria to find what you\'re looking for.'
                        : 'New delivery orders from the POS will appear here automatically.'}
                </p>
            </div>
            {hasFilters && onClearFilters && (
                <Button
                    variant="outline"
                    className="rounded-xl gap-2 mt-2"
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
