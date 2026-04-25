import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Navigation, ChevronLeft, ChevronRight, Loader2, Layers } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';

// Delivery components
import DeliveryStats from '@/components/delivery/DeliveryStats';
import DeliveryFilters from '@/components/delivery/DeliveryFilters';
import DeliveryTable from '@/components/delivery/DeliveryTable';
import DeliveryCard from '@/components/delivery/DeliveryCard';
import DeliveryStatusGroup from '@/components/delivery/DeliveryStatusGroup';
import DeliveryDetailSheet from '@/components/delivery/DeliveryDetailSheet';
import DeliveryEmptyState from '@/components/delivery/DeliveryEmptyState';
import DeliverySkeletonLoader from '@/components/delivery/DeliverySkeletonLoader';
import PreparingConfirmationModal from '@/components/delivery/PreparingConfirmationModal';

import type {
    Delivery, DeliveryPagination, DeliveryFilters as FilterType,
    DeliveryStatsData, Branch, ViewMode
} from '@/components/delivery/types';

interface Props {
    deliveries: DeliveryPagination;
    branches: Branch[];
    filters: FilterType;
    stats: DeliveryStatsData;
}

export default function DeliveryIndex({ deliveries, branches, filters, stats }: Props) {
    // View mode (persisted in localStorage)
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('delivery-view-mode') as ViewMode) || 'card';
        }
        return 'card';
    });

    // Grouped or flat view
    const [groupByStatus, setGroupByStatus] = useState(true);

    // Collapsed groups
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Selected delivery for detail sheet
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

    // Loading state for "Load More"
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Accumulated deliveries for "Load More"
    const [accumulatedDeliveries, setAccumulatedDeliveries] = useState<Delivery[]>(deliveries.data);
    const [currentPage, setCurrentPage] = useState(deliveries.current_page);

    // Update state when Inertia sends new data (e.g. after a status update or filter change)
    useEffect(() => {
        // Only reset accumulated if we're on page 1 (meaning it's likely a fresh search or refresh)
        if (deliveries.current_page === 1) {
            setAccumulatedDeliveries(deliveries.data);
            setCurrentPage(1);
        }
    }, [deliveries.data, deliveries.current_page]);

    // Polling for real-time updates (every 15 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['deliveries', 'stats'],
                preserveScroll: true,
                preserveState: true,
            } as any);
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    // ---- Callbacks ----

    const handleViewModeChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('delivery-view-mode', mode);
    }, []);

    const handleFilterChange = useCallback((updates: Partial<FilterType>) => {
        router.get('/deliveries', { ...filters, ...updates }, { preserveState: true, replace: true });
    }, [filters]);

    const handleClearFilters = useCallback(() => {
        router.get('/deliveries', {}, { preserveState: true, replace: true });
    }, []);

    // Selected delivery for status update confirmation
    const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<number | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateStatus = useCallback((id: number) => {
        // Find the delivery to check its current status
        const delivery = accumulatedDeliveries.find(d => d.id === id);
        
        // If the delivery is pending, the next status is 'preparing'
        // We show a confirmation modal before deducting inventory
        if (delivery && delivery.status === 'pending') {
            setConfirmingDeliveryId(id);
            return;
        }

        executeStatusUpdate(id);
    }, [accumulatedDeliveries]);

    const executeStatusUpdate = useCallback((id: number) => {
        setIsUpdating(true);
        router.put(`/deliveries/${id}/status`, {}, {
            preserveState: true,
            onSuccess: () => {
                setConfirmingDeliveryId(null);
                // Close sheet if the updated delivery is currently selected
                if (selectedDelivery?.id === id) {
                    setSelectedDelivery(null);
                }
            },
            onFinish: () => setIsUpdating(false),
        });
    }, [selectedDelivery]);

    const handleSelectDelivery = useCallback((delivery: Delivery) => {
        setSelectedDelivery(delivery);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setSelectedDelivery(null);
    }, []);

    const handleToggleGroup = useCallback((key: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    const handleLoadMore = useCallback(() => {
        if (currentPage >= deliveries.last_page || isLoadingMore) return;

        setIsLoadingMore(true);
        const nextPage = currentPage + 1;

        router.get(
            '/deliveries',
            { ...filters, page: nextPage },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['deliveries'],
                onSuccess: (page: any) => {
                    const newDeliveries = page.props.deliveries.data;
                    setAccumulatedDeliveries(prev => [...prev, ...newDeliveries]);
                    setCurrentPage(nextPage);
                    setIsLoadingMore(false);
                },
                onError: () => {
                    setIsLoadingMore(false);
                },
            }
        );
    }, [currentPage, deliveries.last_page, isLoadingMore, filters]);

    // ---- Derived state ----

    const hasFilters = !!(filters.search || (filters.status && filters.status !== 'all') ||
        (filters.type && filters.type !== 'all') || (filters.branch_id && filters.branch_id !== 'all'));

    const hasMore = currentPage < deliveries.last_page;

    return (
        <AppLayout breadcrumbs={[{ title: 'Delivery Dashboard', href: '/deliveries' }]}>
            <Head title="Delivery Management" />

            <div className="flex flex-col h-full">
                {/* Sticky Header: title + stats + filters */}
                <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
                    <div className="p-4 md:p-6 space-y-4">
                        {/* Title row */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                                    <Navigation className="size-7 text-primary" />
                                    Delivery Dashboard
                                </h1>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Track and manage active deliveries across your operations.
                                </p>
                            </div>

                            {/* Group toggle */}
                            <Button
                                variant={groupByStatus ? 'secondary' : 'outline'}
                                size="sm"
                                className="h-9 rounded-xl gap-2 text-xs font-bold shrink-0 self-start lg:self-auto"
                                onClick={() => setGroupByStatus(v => !v)}
                            >
                                <Layers className="size-3.5" />
                                {groupByStatus ? 'Grouped' : 'Flat'} View
                            </Button>
                        </div>

                        {/* Stats */}
                        <DeliveryStats stats={stats} />

                        {/* Filters */}
                        <DeliveryFilters
                            filters={filters}
                            branches={branches}
                            viewMode={viewMode}
                            onFilterChange={handleFilterChange}
                            onViewModeChange={handleViewModeChange}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-4 md:p-6 space-y-6">
                    {accumulatedDeliveries.length === 0 ? (
                        <DeliveryEmptyState
                            hasFilters={hasFilters}
                            onClearFilters={handleClearFilters}
                        />
                    ) : groupByStatus ? (
                        /* Grouped View */
                        <DeliveryStatusGroup
                            deliveries={accumulatedDeliveries}
                            viewMode={viewMode}
                            collapsedGroups={collapsedGroups}
                            onToggleGroup={handleToggleGroup}
                            onSelect={handleSelectDelivery}
                            onUpdateStatus={handleUpdateStatus}
                        />
                    ) : viewMode === 'table' ? (
                        /* Flat Table View */
                        <DeliveryTable
                            deliveries={accumulatedDeliveries}
                            onSelect={handleSelectDelivery}
                            onUpdateStatus={handleUpdateStatus}
                            containerHeight={Math.min(700, accumulatedDeliveries.length * 56)}
                        />
                    ) : (
                        /* Flat Card View */
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {accumulatedDeliveries.map(delivery => (
                                <DeliveryCard
                                    key={delivery.id}
                                    delivery={delivery}
                                    onSelect={handleSelectDelivery}
                                    onUpdateStatus={handleUpdateStatus}
                                />
                            ))}
                        </div>
                    )}

                    {/* Load More / Pagination */}
                    {accumulatedDeliveries.length > 0 && (
                        <div className="flex flex-col items-center gap-4 pt-4">
                            {/* Load More Button */}
                            {hasMore && (
                                <Button
                                    variant="outline"
                                    className="h-11 px-8 rounded-2xl gap-2 font-bold"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>Load More Deliveries</>
                                    )}
                                </Button>
                            )}

                            {/* Pagination Info */}
                            <div className="flex items-center gap-4">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                    Showing <span className="text-foreground font-bold">{accumulatedDeliveries.length}</span> of {deliveries.total} deliveries
                                    {deliveries.last_page > 1 && (
                                        <> • Page <span className="text-foreground font-bold">{currentPage}</span> of {deliveries.last_page}</>
                                    )}
                                </p>

                                {/* Traditional pagination arrows */}
                                {deliveries.last_page > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        <Link
                                            href={deliveries.links[0]?.url || '#'}
                                            className={!deliveries.links[0]?.url ? 'pointer-events-none opacity-40' : ''}
                                            preserveState
                                        >
                                            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                        </Link>
                                        <Link
                                            href={deliveries.links[deliveries.links.length - 1]?.url || '#'}
                                            className={!deliveries.links[deliveries.links.length - 1]?.url ? 'pointer-events-none opacity-40' : ''}
                                            preserveState
                                        >
                                            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Sheet */}
            <DeliveryDetailSheet
                delivery={selectedDelivery}
                open={!!selectedDelivery}
                onClose={handleCloseSheet}
                onUpdateStatus={handleUpdateStatus}
            />
            {/* Confirmation Modal for Starting Preparation */}
            <PreparingConfirmationModal
                open={!!confirmingDeliveryId}
                onClose={() => setConfirmingDeliveryId(null)}
                onConfirm={() => confirmingDeliveryId && executeStatusUpdate(confirmingDeliveryId)}
                processing={isUpdating}
            />
        </AppLayout>
    );
}
