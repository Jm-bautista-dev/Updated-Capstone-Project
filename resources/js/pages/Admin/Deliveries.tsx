import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import DeliveryCard from '@/components/delivery/DeliveryCard';
import DeliveryDetailSheet from '@/components/delivery/DeliveryDetailSheet';
import DeliveryEmptyState from '@/components/delivery/DeliveryEmptyState';
import DeliveryFilters from '@/components/delivery/DeliveryFilters';
import { DeliveryHero } from '@/components/delivery/DeliveryHero';
import { DeliveryQuickActions } from '@/components/delivery/DeliveryQuickActions';
import DeliveryStats from '@/components/delivery/DeliveryStats';
import DeliveryStatusGroup from '@/components/delivery/DeliveryStatusGroup';
import DeliveryTable from '@/components/delivery/DeliveryTable';
import { DeliveryTimelineSection } from '@/components/delivery/DeliveryTimelineSection';
import { LiveRiderMap } from '@/components/delivery/LiveRiderMap';
import PreparingConfirmationModal from '@/components/delivery/PreparingConfirmationModal';
import RiderAssignmentModal from '@/components/delivery/RiderAssignmentModal';
import { RiderFleetSection } from '@/components/delivery/RiderFleetSection';
import type {
    Branch, Delivery, DeliveryFilters as FilterType,
    DeliveryPagination, DeliveryStatsData, Rider, ViewMode
} from '@/components/delivery/types';
import { Button } from '@/components/ui/button';
import echo from '@/echo';
import AppLayout from '@/layouts/app-layout';

interface Props {
    deliveries: DeliveryPagination;
    availableRiders: Rider[];
    allRiders?: Array<{ id: number; name: string }>;
    branches: Branch[];
    filters: FilterType;
    stats: DeliveryStatsData;
}

export default function DeliveryIndex({ deliveries, availableRiders, allRiders = [], branches, filters, stats }: Props) {
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

    const { auth } = usePage().props as unknown as { auth?: { user?: { id?: number; role?: string; branch_id?: number } } };
    const userRole = (auth?.user?.role || '').toLowerCase();
    const isFilteredBranch = Boolean(filters.branch_id && filters.branch_id !== 'all');
    const branchFilterId = isFilteredBranch ? filters.branch_id : null;

    // Local reactive available riders state
    const [localAvailableRiders, setLocalAvailableRiders] = useState<Rider[]>(availableRiders);

    useEffect(() => {
        setLocalAvailableRiders(availableRiders);
    }, [availableRiders]);

    // Real-time updates via Pusher / Reverb (Strict Branch Isolated + Admin Global)
    useEffect(() => {
        if (!echo) return;

        // Determine channels to subscribe to
        const channelsToSubscribe: string[] = [];
        if (userRole === 'admin') {
            channelsToSubscribe.push('admin.orders');
            if (branchFilterId) {
                channelsToSubscribe.push(`branch.${branchFilterId}.orders`);
            }
        } else if (auth?.user?.branch_id) {
            channelsToSubscribe.push(`branch.${auth.user.branch_id}.orders`);
        }

        if (channelsToSubscribe.length === 0) return;

        const handleNewOrder = (e: unknown) => {
            console.log('Real-time new order received in Deliveries page:', e);
            router.reload({
                only: ['deliveries', 'stats', 'availableRiders', 'allRiders'],
                preserveScroll: true,
                preserveState: true,
            } as Parameters<typeof router.reload>[0]);
        };

        const handleStatusUpdate = (e: {
            delivery_id?: number;
            order_id?: number;
            sale_id?: number;
            order_number?: string;
            status?: string;
            status_label?: string;
            rider_id?: number | null;
            rider_name?: string | null;
            proof_of_delivery_url?: string | null;
            delivered_at?: string | null;
            timestamp?: string;
        }) => {
            console.log('Real-time order status update received in Deliveries page:', e);

            // 1. Instantly update local React state for zero-latency UI update
            if (e.delivery_id || e.order_id || e.sale_id) {
                setAccumulatedDeliveries(prev =>
                    prev.map(item => {
                        const matches = (e.delivery_id && item.id === e.delivery_id) ||
                                        (e.order_id && item.order_id === e.order_id) ||
                                        (e.sale_id && item.sale_id === e.sale_id) ||
                                        (e.order_id && item.sale_id === e.order_id);
                        if (matches && e.status) {
                            return {
                                ...item,
                                status: e.status,
                                status_label: e.status_label || e.status.replace('_', ' '),
                                is_delivered: e.status === 'delivered',
                                delivered_at: e.delivered_at || (e.status === 'delivered' ? (e.timestamp || new Date().toISOString()) : item.delivered_at),
                                rider_id: e.rider_id !== undefined ? e.rider_id : item.rider_id,
                                rider: e.rider_name ? ({ ...item.rider, id: e.rider_id, name: e.rider_name } as unknown as Rider) : item.rider,
                                proof_of_delivery: e.proof_of_delivery_url || item.proof_of_delivery,
                                proof_of_delivery_url: e.proof_of_delivery_url || item.proof_of_delivery_url,
                                updated_at: e.timestamp || new Date().toISOString(),
                            };
                        }
                        return item;
                    })
                );

                setSelectedDelivery(prev => {
                    if (!prev) return null;
                    const matches = (e.delivery_id && prev.id === e.delivery_id) ||
                                    (e.order_id && prev.order_id === e.order_id) ||
                                    (e.sale_id && prev.sale_id === e.sale_id) ||
                                    (e.order_id && prev.sale_id === e.order_id);
                    if (matches && e.status) {
                        return {
                            ...prev,
                            status: e.status,
                            status_label: e.status_label || e.status.replace('_', ' '),
                            is_delivered: e.status === 'delivered',
                            delivered_at: e.delivered_at || (e.status === 'delivered' ? (e.timestamp || new Date().toISOString()) : prev.delivered_at),
                            rider_id: e.rider_id !== undefined ? e.rider_id : prev.rider_id,
                            rider: e.rider_name ? ({ ...prev.rider, id: e.rider_id, name: e.rider_name } as unknown as Rider) : prev.rider,
                            proof_of_delivery: e.proof_of_delivery_url || prev.proof_of_delivery,
                            proof_of_delivery_url: e.proof_of_delivery_url || prev.proof_of_delivery_url,
                            updated_at: e.timestamp || new Date().toISOString(),
                        };
                    }
                    return prev;
                });
            }

            // 2. Refresh Inertia props without full page reload
            router.reload({
                only: ['deliveries', 'stats', 'availableRiders', 'allRiders'],
                preserveScroll: true,
                preserveState: true,
            } as Parameters<typeof router.reload>[0]);
        };

        const handleRiderUpdate = (e: {
            rider_id?: number;
            id?: number;
            name?: string;
            is_active?: boolean;
            account_status?: string;
            status?: 'available' | 'busy' | 'offline';
            branch_name?: string;
            is_out_for_delivery?: boolean;
            can_be_assigned?: boolean;
            active_deliveries?: number;
            active_in_transit_count?: number;
            active_pickup_count?: number;
        }) => {
            console.log('Real-time rider status update received in Deliveries page:', e);
            const riderId = e.rider_id || e.id;
            if (riderId) {
                setLocalAvailableRiders(prev => {
                    const exists = prev.some(r => r.id === riderId);
                    if (exists) {
                        return prev.map(r => {
                            if (r.id === riderId) {
                                return {
                                    ...r,
                                    name: e.name || r.name,
                                    status: e.status || r.status,
                                    branch_name: e.branch_name || r.branch_name,
                                    is_out_for_delivery: e.is_out_for_delivery !== undefined ? e.is_out_for_delivery : r.is_out_for_delivery,
                                    can_be_assigned: e.can_be_assigned !== undefined ? e.can_be_assigned : r.can_be_assigned,
                                    active_deliveries: e.active_deliveries !== undefined ? e.active_deliveries : r.active_deliveries,
                                };
                            }
                            return r;
                        });
                    } else if (e.is_active && e.name) {
                        return [
                            ...prev,
                            {
                                id: riderId,
                                name: e.name,
                                status: e.status || 'available',
                                branch_name: e.branch_name || 'Global',
                                active_deliveries: e.active_deliveries || 0,
                                active_in_transit_count: e.active_in_transit_count || 0,
                                active_pickup_count: e.active_pickup_count || 0,
                                is_out_for_delivery: Boolean(e.is_out_for_delivery),
                                can_be_assigned: e.can_be_assigned !== undefined ? e.can_be_assigned : true,
                            }
                        ];
                    }
                    return prev;
                });
            }

            router.reload({
                only: ['deliveries', 'availableRiders', 'allRiders', 'stats'],
                preserveScroll: true,
                preserveState: true,
            } as Parameters<typeof router.reload>[0]);
        };

        const activeChannels = channelsToSubscribe.map(chName => {
            const ch = echo!.private(chName);
            ch.listen('.OrderCreated', handleNewOrder)
              .listen('OrderCreated', handleNewOrder)
              .listen('App\\Events\\OrderCreated', handleNewOrder)
              .listen('.order-status-updated', handleStatusUpdate)
              .listen('OrderStatusUpdated', handleStatusUpdate)
              .listen('App\\Events\\OrderStatusUpdated', handleStatusUpdate)
              .listen('.rider.status.updated', handleRiderUpdate)
              .listen('RiderStatusUpdated', handleRiderUpdate)
              .listen('App\\Events\\RiderStatusUpdated', handleRiderUpdate)
              .listen('.CancellationRequested', handleStatusUpdate)
              .listen('CancellationRequested', handleStatusUpdate)
              .listen('.CancellationResolved', handleStatusUpdate)
              .listen('CancellationResolved', handleStatusUpdate);
            return chName;
        });

        return () => {
            activeChannels.forEach(chName => {
                echo?.leave(chName);
            });
        };
    }, [userRole, branchFilterId, auth?.user?.branch_id]);

    // Auto-select delivery sheet if navigated from high-priority order toast
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const targetOrderId = urlParams.get('order_id');
            const targetOrderNum = urlParams.get('order_number');

            if (targetOrderId || targetOrderNum) {
                const match = accumulatedDeliveries.find(d => 
                    (targetOrderId && String(d.order_id || d.order?.id) === String(targetOrderId)) ||
                    (targetOrderNum && (d.order?.order_number === targetOrderNum || d.sale?.order_number === targetOrderNum))
                );
                if (match) {
                    const timer = setTimeout(() => setSelectedDelivery(match), 0);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [accumulatedDeliveries]);

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
                if (selectedDelivery?.id === id) {
                    setSelectedDelivery(null);
                }
            },
            onFinish: () => setIsUpdating(false),
        });
    }, [selectedDelivery]);

    const handleUpdateStatus = useCallback((id: number) => {
        const delivery = accumulatedDeliveries.find(d => d.id === id);

        if (delivery && delivery.status === 'pending') {
            setConfirmingDeliveryId(id);
            return;
        }

        executeStatusUpdate(id);
    }, [accumulatedDeliveries, executeStatusUpdate]);

    const handleFailDelivery = useCallback((id: number) => {
        if (confirm('Are you sure you want to mark this delivery as failed? The rider will be freed and you can reassign a new rider.')) {
            router.post(`/deliveries/${id}/fail`, {}, { preserveState: true });
        }
    }, []);

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

            <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full max-w-7xl min-w-0 mx-auto font-['Outfit'] transition-colors duration-300 box-border">
                {/* 1. HERO BANNER */}
                <DeliveryHero
                    currentStatusFilter={filters.status || 'all'}
                    onStatusFilterChange={(status) => handleFilterChange({ status })}
                    groupByStatus={groupByStatus}
                    onToggleGroupByStatus={() => setGroupByStatus(v => !v)}
                />

                {/* 2. DELIVERY KPIS & PIPELINE */}
                <DeliveryStats
                    stats={stats}
                    onStatusFilterClick={(status) => handleFilterChange({ status })}
                />

                {/* 3. QUICK ACTIONS */}
                <DeliveryQuickActions />

                {/* 4. SEARCH & FILTERS TOOLBAR */}
                <DeliveryFilters
                    filters={filters}
                    branches={branches}
                    allRiders={allRiders}
                    viewMode={viewMode}
                    onFilterChange={handleFilterChange}
                    onViewModeChange={handleViewModeChange}
                />

                {/* 5. DELIVERY LIST (Grouped / Table / Cards) */}
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
                            onFailDelivery={handleFailDelivery}
                        />
                    ) : viewMode === 'table' ? (
                        /* Flat Table View */
                        <DeliveryTable
                            deliveries={accumulatedDeliveries}
                            onSelect={handleSelectDelivery}
                            onUpdateStatus={handleUpdateStatus}
                            onAssignRider={handleAssignRider}
                            onFailDelivery={handleFailDelivery}
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
                                    onFailDelivery={handleFailDelivery}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination Bar */}
                    {accumulatedDeliveries.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 rounded-3xl shadow-xs backdrop-blur-2xl gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                <span>Showing</span>
                                <span className="font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {accumulatedDeliveries.length}
                                </span>
                                <span>of</span>
                                <span className="font-mono text-[#E75480] dark:text-[#FF4F81]">{deliveries.total}</span>
                                <span>deliveries</span>
                            </div>

                            <div className="flex items-center gap-3">
                                {hasMore && (
                                    <Button
                                        variant="outline"
                                        className="h-10 px-6 rounded-2xl gap-2 font-bold text-xs uppercase tracking-wider border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] hover:bg-[#FFF5F7] dark:hover:bg-[#1C1C28] cursor-pointer"
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>Load More</>
                                        )}
                                    </Button>
                                )}

                                {deliveries.last_page > 1 && (
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={deliveries.links[0]?.url || '#'}
                                            disabled={!deliveries.links[0]?.url}
                                            preserveState
                                        >
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-2xl size-10 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10 cursor-pointer"
                                                disabled={!deliveries.links[0]?.url}
                                            >
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                        </Link>
                                        <Link
                                            href={deliveries.links[deliveries.links.length - 1]?.url || '#'}
                                            disabled={!deliveries.links[deliveries.links.length - 1]?.url}
                                            preserveState
                                        >
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-2xl size-10 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10 cursor-pointer"
                                                disabled={!deliveries.links[deliveries.links.length - 1]?.url}
                                            >
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. REAL-TIME LIVE RIDER TRACKING MAP */}
                <LiveRiderMap />

                {/* 7. ASSIGNED RIDERS SECTION */}
                <RiderFleetSection riders={localAvailableRiders} />

                {/* 8. RECENT DELIVERY ACTIVITY TIMELINE */}
                <DeliveryTimelineSection
                    deliveries={accumulatedDeliveries}
                    onSelectDelivery={handleSelectDelivery}
                />
            </div>

            {/* Detail Sheet */}
            <DeliveryDetailSheet
                delivery={selectedDelivery}
                open={!!selectedDelivery}
                onClose={handleCloseSheet}
                onUpdateStatus={handleUpdateStatus}
                onAssignRider={handleAssignRider}
            />

            {/* Modals */}
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
                riders={localAvailableRiders}
                delivery={assigningDelivery}
                processing={isAssigning}
            />
        </AppLayout>
    );
}
