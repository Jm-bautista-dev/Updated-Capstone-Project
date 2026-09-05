import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import echo from '@/echo';
import { globalNotificationManager } from '@/lib/global-notification-manager';
import { orderAlertManager } from '@/lib/order-alert-manager';
import { playOrderNotificationSound } from '@/lib/order-audio';

interface RealTimeOrderEvent {
    order_id?: number;
    order_number?: string;
    branch_id?: number;
    branch_name?: string;
    fulfillment_type?: string;
    is_pickup?: boolean;
    customer_name?: string;
    total_amount?: number;
    items_count?: number;
    message?: string;
    timestamp?: string;
}

interface CancellationRequestedEvent {
    cancellation_request_id: number;
    order_id: number;
    order_number: string;
    delivery_id?: number;
    rider_id?: number;
    rider_name?: string;
    customer_name?: string;
    branch_id?: number;
    branch_name?: string;
    reason: string;
    notes?: string;
    status: string;
    requested_at?: string;
}

interface CancellationResolvedEvent {
    cancellation_request_id: number;
    order_id: number;
    order_number: string;
    cancellation_request_status: string;
    order_status: string;
    reviewed_by_name?: string;
}

interface AuthState {
    user?: {
        id?: number;
        role?: string;
        branch_id?: number | null;
    };
}

// Deduplication tracking to prevent duplicate alerts/sounds
const notifiedOrderIds = new Set<number>();
const notifiedCancellationIds = new Set<number>();

export function useRealTime(branchId?: number | null) {
    const { auth } = usePage().props as unknown as { auth: AuthState };

    useEffect(() => {
        // 1. Listen for Global Category Updates
        if (echo) {
            echo.channel('global')
                .listen('CategoryUpdated', (e: Record<string, unknown>) => {
                    console.log('Real-time: Global Categories Updated', e);
                    router.reload();
                });
        }

        // 2. Listen for Branch-Specific Updates
        if (echo && (branchId || auth?.user?.branch_id)) {
            const targetId = branchId || auth?.user?.branch_id;
            
            const handleSaleCreated = (e: Record<string, unknown>) => {
                console.log('Real-time: New Sale in Branch', e);
                router.reload({ 
                    only: ['products', 'summary', 'recentOrders', 'sales', 'stats', 'branchStats', 'salesOverTime', 'topProductCosts', 'salesByPaymentMethod'],
                });
            };

            echo.private(`branch.${targetId}`)
                .listen('SaleCreated', handleSaleCreated)
                .listen('.SaleCreated', handleSaleCreated)
                .listen('App\\Events\\SaleCreated', handleSaleCreated)
                .listen('.App\\Events\\SaleCreated', handleSaleCreated)
                .listen('StockUpdated', (e: Record<string, unknown>) => {
                    console.log('Real-time: Stock Level Changed', e);
                    router.reload({ 
                        only: ['products', 'ingredients', 'summary', 'stats'],
                    });
                })
                .listen('ProductUpdated', (e: Record<string, unknown>) => {
                    console.log('Real-time: Product Data Sync', e);
                    router.reload({ 
                        only: ['products'],
                    });
                })
                .listen('RiderStatusUpdated', (e: Record<string, unknown>) => {
                    console.log('Real-time: Rider Status Sync', e);
                    router.reload({ 
                        only: ['riders', 'availableRiders', 'allRiders', 'stats', 'branchStats'],
                    });
                })
                .listen('.rider.status.updated', (e: Record<string, unknown>) => {
                    console.log('Real-time: Rider Status Sync', e);
                    router.reload({ 
                        only: ['riders', 'availableRiders', 'allRiders', 'stats', 'branchStats'],
                    });
                });
        }

        // 3. Listen for Orders & Cancellation Requests
        if (echo) {
            const handleOrderNotification = (e: RealTimeOrderEvent) => {
                console.log('Real-time: New Order Event Received', e);
                
                const displayOrderNum = e.order_number || (e.order_id ? `ORD-${e.order_id}` : 'ORD-NEW');
                const parsedTotal = typeof e.total_amount === 'number' 
                    ? e.total_amount 
                    : parseFloat(String(e.total_amount || 0));
                const branchStr = e.branch_name || 'Branch';

                if (e.order_id) {
                    if (notifiedOrderIds.has(e.order_id)) {
                        console.log(`Real-time: Order #${e.order_id} already notified. Skipping duplicate alert.`);
                        return;
                    }
                    notifiedOrderIds.add(e.order_id);
                    if (notifiedOrderIds.size > 500) {
                        const firstId = notifiedOrderIds.values().next().value;
                        if (firstId !== undefined) {
                            notifiedOrderIds.delete(firstId);
                        }
                    }

                    // Enqueue in authoritative persistent repeating alert manager
                    orderAlertManager.addAlert({
                        id: e.order_id,
                        order_number: displayOrderNum,
                        customer_name: e.customer_name || 'Mobile Customer',
                        branch_id: e.branch_id,
                        branch_name: branchStr,
                        fulfillment_type: e.fulfillment_type || (e.is_pickup ? 'pickup' : 'delivery'),
                        is_pickup: e.is_pickup ?? (e.fulfillment_type === 'pickup'),
                        total_amount: parsedTotal,
                        items_count: e.items_count || 1,
                        timestamp: e.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        received_at: Date.now(),
                    });
                } else {
                    playOrderNotificationSound();
                }

                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('new-order-received', { detail: e }));
                }

                // Post into centralized 5-second queue with max-3 stack limit
                const isPickup = e.fulfillment_type === 'pickup' || e.is_pickup;
                globalNotificationManager.notify({
                    id: e.order_id || `order_${Date.now()}`,
                    order_id: e.order_id,
                    type: isPickup ? 'pickup' : 'order',
                    fulfillment_type: isPickup ? 'pickup' : 'delivery',
                    is_pickup: isPickup,
                    title: isPickup ? 'New Pickup Order' : 'New Online Order',
                    order_number: displayOrderNum,
                    customer_name: e.customer_name || 'Mobile Customer',
                    branch_name: branchStr,
                    total_amount: e.total_amount,
                    items_count: e.items_count || 1,
                    link_url: e.order_id
                        ? (isPickup
                            ? `/pickups?order_id=${e.order_id}&order_number=${encodeURIComponent(displayOrderNum)}`
                            : `/deliveries?order_id=${e.order_id}&order_number=${encodeURIComponent(displayOrderNum)}`)
                        : (isPickup ? '/pickups' : '/deliveries'),
                    link_text: 'VIEW ORDER',
                    duration_ms: 5000,
                    auto_dismiss: true,
                    created_at: Date.now(),
                });

                router.reload({ 
                    only: ['summary', 'recentOrders', 'orders', 'deliveries', 'stats'],
                });
            };

            const handleCancellationRequested = (e: CancellationRequestedEvent) => {
                console.log('Real-time: Cancellation Requested Event Received', e);
                const reqId = e.cancellation_request_id || e.order_id;
                if (reqId && notifiedCancellationIds.has(reqId)) {
                    return;
                }
                if (reqId) {
                    notifiedCancellationIds.add(reqId);
                }

                playOrderNotificationSound();

                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('new-order-received', { detail: e }));
                }

                const displayOrderNum = e.order_number || (e.order_id ? `ORD-${e.order_id}` : 'ORD-NEW');
                const branchStr = e.branch_name || 'Branch';

                // Post into centralized managed queue
                globalNotificationManager.notify({
                    id: `cancel_req_${e.cancellation_request_id || e.order_id}`,
                    type: 'cancellation',
                    title: 'Cancellation Request',
                    order_number: displayOrderNum,
                    customer_name: e.customer_name || 'Customer',
                    branch_name: branchStr,
                    reason: e.reason + (e.notes ? ` (${e.notes})` : ''),
                    link_url: `/deliveries?order_id=${e.order_id}&order_number=${encodeURIComponent(displayOrderNum)}`,
                    link_text: 'REVIEW REQUEST',
                    duration_ms: 8000,
                    auto_dismiss: true,
                    created_at: Date.now(),
                });

                router.reload({
                    only: ['summary', 'recentOrders', 'orders', 'deliveries', 'stats'],
                });
            };

            const handleCancellationResolved = (e: CancellationResolvedEvent) => {
                console.log('Real-time: Cancellation Resolved', e);
                const statusUpper = (e.cancellation_request_status || '').toUpperCase();
                if (statusUpper === 'APPROVED' || statusUpper === 'ACCEPTED') {
                    toast.info(`Cancellation for Order ${e.order_number} was ACCEPTED by ${e.reviewed_by_name || 'Cashier'}.`);
                } else {
                    toast.info(`Cancellation for Order ${e.order_number} was REJECTED by ${e.reviewed_by_name || 'Cashier'}. Order remains active.`);
                }
                router.reload({
                    only: ['summary', 'recentOrders', 'orders', 'deliveries', 'stats', 'sales'],
                });
            };

            const handleSaleCreated = (e: {
                sale_id?: number;
                order_id?: number;
                order_number?: string;
                branch_id?: number;
                branch_name?: string;
                subtotal?: number;
                delivery_fee?: number;
                total?: number;
                cost_total?: number;
                profit?: number;
                payment_method?: string;
                type?: string;
                timestamp?: string;
            }) => {
                console.log('Real-time: Sale Created / Recognized', e);
                router.reload({
                    only: [
                        'summary',
                        'recentOrders',
                        'orders',
                        'deliveries',
                        'stats',
                        'sales',
                        'branchStats',
                        'salesOverTime',
                        'topProductCosts',
                        'salesByPaymentMethod',
                        'recentActivity',
                        'financialSummary',
                        'reportData',
                        'products'
                    ],
                });
            };

            const handleStatusUpdate = (e: {
                delivery_id?: number;
                order_id?: number;
                sale_id?: number;
                order_number?: string;
                status?: string;
                status_label?: string;
                updated_by?: string;
                customer_name?: string;
            }) => {
                console.log('Real-time: Order Status Updated', e);
                router.reload({
                    only: [
                        'summary',
                        'recentOrders',
                        'orders',
                        'deliveries',
                        'stats',
                        'sales',
                        'branchStats',
                        'salesOverTime',
                        'topProductCosts',
                        'salesByPaymentMethod',
                        'recentActivity',
                        'availableRiders',
                        'allRiders',
                        'financialSummary',
                        'reportData'
                    ],
                });
            };

            const handleRiderStatusUpdate = (e: {
                rider_id?: number;
                id?: number;
                name?: string;
                is_active?: boolean;
                status?: string;
                branch_id?: number;
            }) => {
                console.log('Real-time: Rider Status Sync', e);
                router.reload({
                    only: ['riders', 'availableRiders', 'allRiders', 'stats', 'branchStats'],
                });
            };

            const userRole = (auth?.user?.role || '').toLowerCase();
            const userBranchId = branchId || auth?.user?.branch_id;

            if (userRole === 'admin' || userRole === 'super_admin') {
                echo.private('admin.orders')
                    .listen('OrderCreated', handleOrderNotification)
                    .listen('.OrderCreated', handleOrderNotification)
                    .listen('App\\Events\\OrderCreated', handleOrderNotification)
                    .listen('.App\\Events\\OrderCreated', handleOrderNotification)
                    .listen('CancellationRequested', handleCancellationRequested)
                    .listen('.CancellationRequested', handleCancellationRequested)
                    .listen('App\\Events\\CancellationRequested', handleCancellationRequested)
                    .listen('.App\\Events\\CancellationRequested', handleCancellationRequested)
                    .listen('CancellationResolved', handleCancellationResolved)
                    .listen('.CancellationResolved', handleCancellationResolved)
                    .listen('App\\Events\\CancellationResolved', handleCancellationResolved)
                    .listen('.App\\Events\\CancellationResolved', handleCancellationResolved)
                    .listen('OrderStatusUpdated', handleStatusUpdate)
                    .listen('.order-status-updated', handleStatusUpdate)
                    .listen('SaleCreated', handleSaleCreated)
                    .listen('.SaleCreated', handleSaleCreated)
                    .listen('App\\Events\\SaleCreated', handleSaleCreated)
                    .listen('.App\\Events\\SaleCreated', handleSaleCreated)
                    .listen('RiderStatusUpdated', handleRiderStatusUpdate)
                    .listen('.RiderStatusUpdated', handleRiderStatusUpdate)
                    .listen('App\\Events\\RiderStatusUpdated', handleRiderStatusUpdate)
                    .listen('.App\\Events\\RiderStatusUpdated', handleRiderStatusUpdate)
                    .listen('.rider.status.updated', handleRiderStatusUpdate);
            }

            if (userBranchId) {
                echo.private(`branch.${userBranchId}.orders`)
                    .listen('OrderCreated', handleOrderNotification)
                    .listen('.OrderCreated', handleOrderNotification)
                    .listen('App\\Events\\OrderCreated', handleOrderNotification)
                    .listen('.App\\Events\\OrderCreated', handleOrderNotification)
                    .listen('CancellationRequested', handleCancellationRequested)
                    .listen('.CancellationRequested', handleCancellationRequested)
                    .listen('App\\Events\\CancellationRequested', handleCancellationRequested)
                    .listen('.App\\Events\\CancellationRequested', handleCancellationRequested)
                    .listen('CancellationResolved', handleCancellationResolved)
                    .listen('.CancellationResolved', handleCancellationResolved)
                    .listen('App\\Events\\CancellationResolved', handleCancellationResolved)
                    .listen('.App\\Events\\CancellationResolved', handleCancellationResolved)
                    .listen('OrderStatusUpdated', handleStatusUpdate)
                    .listen('.order-status-updated', handleStatusUpdate)
                    .listen('SaleCreated', handleSaleCreated)
                    .listen('.SaleCreated', handleSaleCreated)
                    .listen('App\\Events\\SaleCreated', handleSaleCreated)
                    .listen('.App\\Events\\SaleCreated', handleSaleCreated)
                    .listen('RiderStatusUpdated', handleRiderStatusUpdate)
                    .listen('.RiderStatusUpdated', handleRiderStatusUpdate)
                    .listen('App\\Events\\RiderStatusUpdated', handleRiderStatusUpdate)
                    .listen('.App\\Events\\RiderStatusUpdated', handleRiderStatusUpdate)
                    .listen('.rider.status.updated', handleRiderStatusUpdate);
            }
        }

        return () => {
            if (echo) {
                echo.leave('global');
                const userBranchId = branchId || auth?.user?.branch_id;
                if (userBranchId) {
                    echo.leave(`branch.${userBranchId}`);
                    echo.leave(`branch.${userBranchId}.orders`);
                }
                if ((auth?.user?.role || '').toLowerCase() === 'admin') {
                    echo.leave('admin.orders');
                }
            }
        };
    }, [branchId, auth?.user?.branch_id, auth?.user?.role]);
}
