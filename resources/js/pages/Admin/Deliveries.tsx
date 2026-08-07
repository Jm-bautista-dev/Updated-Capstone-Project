import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Layers, Loader2, Navigation } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import DeliveryCard from '@/components/delivery/DeliveryCard';
import DeliveryDetailSheet from '@/components/delivery/DeliveryDetailSheet';
import DeliveryEmptyState from '@/components/delivery/DeliveryEmptyState';
import DeliveryFilters from '@/components/delivery/DeliveryFilters';
import DeliveryStats from '@/components/delivery/DeliveryStats';
import DeliveryStatusGroup from '@/components/delivery/DeliveryStatusGroup';
import DeliveryTable from '@/components/delivery/DeliveryTable';
import PreparingConfirmationModal from '@/components/delivery/PreparingConfirmationModal';
import RiderAssignmentModal from '@/components/delivery/RiderAssignmentModal';
import type {
    Branch, Delivery, DeliveryFilters as FilterType,
    DeliveryPagination, DeliveryStatsData, Rider, ViewMode
} from '@/components/delivery/types';
import { Button } from '@/components/ui/button';
import echo from '@/echo';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface Props {
    deliveries: DeliveryPagination;
    availableRiders: Rider[];
    branches: Branch[];
    filters: FilterType;
    stats: DeliveryStatsData;
}

export default function DeliveryIndex({ deliveries, availableRiders, branches, filters, stats }: Props) {
    // ... existing state ...
    const [assigningDelivery, setAssigningDelivery] = useState<Delivery | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    const handleAssignRider = useCallback((delivery: Delivery) => {
        setAssigningDelivery(delivery);
    }, []);

    const executeAssignment = useCallback((riderId: number) => {
        if (!assigningDelivery) return;
        
        setIsAssigning(true);
        router.post(`/deliveries/${assigningDelivery.id}/assign-rider`, { rider_id: riderId }, {
            preserveState: true,
            onSuccess: () => {
                setAssigningDelivery(null);
            },
            onFinish: () => setIsAssigning(false),
        });
    }, [assigningDelivery]);
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
    const [prevDeliveries, setPrevDeliveries] = useState(deliveries);

    // Sync state during render when Inertia sends new data (e.g. after a status update or filter change)
    if (prevDeliveries !== deliveries) {
        setPrevDeliveries(deliveries);
        if (deliveries.current_page === 1) {
            setAccumulatedDeliveries(deliveries.data);
            setCurrentPage(1);
        }
    }

    // Real-time updates via Pusher
    useEffect(() => {
        if (!echo) return;

        const channel = echo.channel('deliveries');
        
        channel.listen('.order-status-updated', () => {
            // Only reload the relevant parts without full page refresh
            router.reload({
                only: ['deliveries', 'stats'],
                preserveScroll: true,
                preserveState: true,
            } as Parameters<typeof router.reload>[0]);
        });

        return () => {
            echo?.leaveChannel('deliveries');
        };
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
    }, [accumulatedDeliveries, executeStatusUpdate]);

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
                onSuccess: (page) => {
                    const newDeliveries = (page as unknown as Record<string, Record<string, { data: Delivery[] }>>).props.deliveries.data;
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

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-[calc(100vh-64px)] overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">

                {/* ── HERO BANNER ── */}
                <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-white via-[#FFF5F7]/80 to-[#FADADD]/40 dark:from-[#121218] dark:via-[#161622]/90 dark:to-[#0A0A10] p-6 sm:p-8 lg:p-10 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors duration-300">
                    <div className="absolute -top-24 -right-24 size-96 rounded-full bg-linear-to-br from-[#E75480]/20 to-transparent dark:from-[#E1062C]/20 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-linear-to-tr from-[#F8C8DC]/30 to-transparent dark:from-[#FF4F81]/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs">
                                        <Navigation className="size-3.5" />
                                        Delivery Operations Center
                                    </span>
                                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Live Tracking</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                    Delivery Management
                                </h1>
                                <p className="text-xs sm:text-sm font-medium text-[#7D6B6E] dark:text-[#94A3B8] max-w-xl">
                                    Track deliveries, assign riders, and manage logistics operations in real time.
                                </p>
                            </div>

                            {/* Status Tab Pills + Group Toggle */}
                            <div className="flex items-center gap-3 flex-wrap self-start lg:self-center">
                                <div className="flex items-center bg-white/60 dark:bg-[#1C1C28]/60 rounded-2xl p-1 border border-[#F8C8DC]/40 dark:border-white/10 backdrop-blur-xl">
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'pending', label: 'Pending' },
                                        { id: 'preparing', label: 'Preparing' },
                                        { id: 'in_transit', label: 'In Transit' },
                                        { id: 'delivered', label: 'Delivered' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleFilterChange({ status: tab.id })}
                                            className={cn(
                                                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer",
                                                (filters.status || 'all') === tab.id 
                                                    ? "bg-white dark:bg-[#121218] shadow-sm text-[#E75480] dark:text-[#FF4F81] ring-1 ring-[#F8C8DC]/60 dark:ring-white/10" 
                                                    : (tab.id === 'pending' && filters.status === 'waiting_for_kitchen')
                                                        ? "bg-white dark:bg-[#121218] shadow-sm text-[#E75480] dark:text-[#FF4F81] ring-1 ring-[#F8C8DC]/60 dark:ring-white/10"
                                                        : "text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    variant={groupByStatus ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-9 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest border-[#F8C8DC]/60 dark:border-white/10 cursor-pointer"
                                    onClick={() => setGroupByStatus(v => !v)}
                                >
                                    <Layers className="size-3.5" />
                                    {groupByStatus ? 'Grouped' : 'Flat'} View
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── STATS STRIP ── */}
                <DeliveryStats stats={stats} />

                {/* ── FILTERS ── */}
                <DeliveryFilters
                    filters={filters}
                    branches={branches}
                    viewMode={viewMode}
                    onFilterChange={handleFilterChange}
                    onViewModeChange={handleViewModeChange}
                />

                {/* ── CONTENT AREA ── */}
                <div className="space-y-6 w-full">
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
                            onAssignRider={handleAssignRider}
                        />
                    ) : viewMode === 'table' ? (
                        /* Flat Table View */
                        <DeliveryTable
                            deliveries={accumulatedDeliveries}
                            onSelect={handleSelectDelivery}
                            onUpdateStatus={handleUpdateStatus}
                            onAssignRider={handleAssignRider}
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
                                    onAssignRider={handleAssignRider}
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
                                    className="h-11 px-8 rounded-2xl gap-2 font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] hover:bg-[#FFF5F7] dark:hover:bg-[#1C1C28] cursor-pointer"
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
                                <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium uppercase tracking-widest">
                                    Showing <span className="text-[#3D2C2E] dark:text-[#F8FAFC] font-bold">{accumulatedDeliveries.length}</span> of {deliveries.total} deliveries
                                    {deliveries.last_page > 1 && (
                                        <> • Page <span className="text-[#3D2C2E] dark:text-[#F8FAFC] font-bold">{currentPage}</span> of {deliveries.last_page}</>
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
                                            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 border-[#F8C8DC]/60 dark:border-white/10 cursor-pointer">
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                        </Link>
                                        <Link
                                            href={deliveries.links[deliveries.links.length - 1]?.url || '#'}
                                            className={!deliveries.links[deliveries.links.length - 1]?.url ? 'pointer-events-none opacity-40' : ''}
                                            preserveState
                                        >
                                            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 border-[#F8C8DC]/60 dark:border-white/10 cursor-pointer">
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
                onAssignRider={handleAssignRider}
            />
            {/* Confirmation Modal for Starting Preparation */}
            <PreparingConfirmationModal
                open={!!confirmingDeliveryId}
                onClose={() => setConfirmingDeliveryId(null)}
                onConfirm={() => confirmingDeliveryId && executeStatusUpdate(confirmingDeliveryId)}
                processing={isUpdating}
            />

            <RiderAssignmentModal
                open={!!assigningDelivery}
                onClose={() => setAssigningDelivery(null)}
                onAssign={executeAssignment}
                riders={availableRiders}
                delivery={assigningDelivery}
                processing={isAssigning}
            />
        </AppLayout>
    );
}
