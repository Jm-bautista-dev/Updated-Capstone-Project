import { router, usePage } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import echo from '@/echo';
import { orderAlertManager } from '@/lib/order-alert-manager';
import { playOrderNotificationSound } from '@/lib/order-audio';

interface RealTimeOrderEvent {
    order_id?: number;
    order_number?: string;
    branch_id?: number;
    branch_name?: string;
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

                const formattedPrice = typeof e.total_amount === 'number' 
                    ? `₱${e.total_amount.toFixed(2)}` 
                    : e.total_amount 
                        ? `₱${e.total_amount}` 
                        : '';
                const itemDetails = e.items_count ? `${e.items_count} item${e.items_count > 1 ? 's' : ''}` : '';

                toast.custom((t) => (
                    React.createElement('div', {
                        className: "flex flex-col gap-3 p-4.5 bg-white dark:bg-[#121218] border-2 border-emerald-500/50 dark:border-emerald-400/60 rounded-3xl shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] backdrop-blur-2xl max-w-sm w-full font-['Outfit'] animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden"
                    }, [
                        React.createElement('div', { key: 'glow', className: "absolute -top-12 -right-12 size-32 rounded-full bg-emerald-500/10 dark:from-emerald-500/20 blur-2xl pointer-events-none" }),
                        React.createElement('div', { key: 'header', className: "flex items-center justify-between gap-2 relative z-10" }, [
                            React.createElement('div', { key: 'title-group', className: "flex items-center gap-2.5" }, [
                                React.createElement('div', { key: 'icon', className: "size-8.5 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-500/30" }, "🔔"),
                                React.createElement('div', { key: 'title-text', className: "min-w-0" }, [
                                    React.createElement('div', { key: 'badge-row', className: "flex items-center gap-1.5" }, [
                                        React.createElement('span', { key: 'badge', className: "text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block leading-tight" }, "NEW ONLINE ORDER"),
                                        React.createElement('span', { key: 'dot', className: "size-1.5 rounded-full bg-emerald-500 animate-ping" })
                                    ]),
                                    React.createElement('h4', { key: 'heading', className: "text-base font-extrabold font-mono text-gray-900 dark:text-white leading-tight truncate" }, displayOrderNum)
                                ])
                            ]),
                            formattedPrice ? React.createElement('span', { key: 'price', className: "text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800/60 shrink-0" }, formattedPrice) : null
                        ]),
                        React.createElement('div', { key: 'body', className: "text-xs text-muted-foreground leading-snug space-y-0.5 relative z-10 bg-muted/30 dark:bg-white/5 p-2.5 rounded-2xl border border-border/50" }, [
                            React.createElement('div', { key: 'cust-row', className: "flex items-center justify-between" }, [
                                React.createElement('span', { key: 'lbl', className: "text-[11px] font-medium text-muted-foreground" }, "Customer:"),
                                React.createElement('span', { key: 'val', className: "font-bold text-foreground text-xs" }, e.customer_name || 'Mobile Customer')
                            ]),
                            React.createElement('div', { key: 'branch-row', className: "flex items-center justify-between" }, [
                                React.createElement('span', { key: 'lbl2', className: "text-[11px] font-medium text-muted-foreground" }, "Branch & Items:"),
                                React.createElement('span', { key: 'val2', className: "font-semibold text-foreground text-xs" }, `${branchStr}${itemDetails ? ` • ${itemDetails}` : ''}`)
                            ])
                        ]),
                        React.createElement('div', { key: 'actions', className: "flex items-center gap-2 pt-0.5 relative z-10" }, [
                            React.createElement('button', {
                                key: 'view',
                                onClick: () => {
                                    toast.dismiss(t);
                                    const targetUrl = e.order_id 
                                        ? `/deliveries?order_id=${e.order_id}&order_number=${encodeURIComponent(displayOrderNum)}` 
                                        : '/deliveries';
                                    router.visit(targetUrl);
                                },
                                className: "flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                            }, [
                                React.createElement('span', { key: 'icon-v' }, "👁️"),
                                React.createElement('span', { key: 'txt-v' }, "VIEW ORDER")
                            ]),
                            React.createElement('button', {
                                key: 'dismiss',
                                onClick: () => toast.dismiss(t),
                                className: "px-3.5 h-9 text-xs font-bold text-muted-foreground hover:bg-muted/60 dark:hover:bg-white/10 rounded-2xl transition-all cursor-pointer active:scale-95"
                            }, "DISMISS")
                        ])
                    ])
                ), { duration: 15000, position: 'top-right' });

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

                toast.custom((t) => (
                    React.createElement('div', {
                        className: "flex flex-col gap-3 p-4.5 bg-white dark:bg-[#121218] border-2 border-amber-500/60 dark:border-amber-400/70 rounded-3xl shadow-[0_20px_40px_-15px_rgba(245,158,11,0.3)] backdrop-blur-2xl max-w-sm w-full font-['Outfit'] animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden"
                    }, [
                        React.createElement('div', { key: 'glow', className: "absolute -top-12 -right-12 size-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" }),
                        React.createElement('div', { key: 'header', className: "flex items-center justify-between gap-2 relative z-10" }, [
                            React.createElement('div', { key: 'title-group', className: "flex items-center gap-2.5" }, [
                                React.createElement('div', { key: 'icon', className: "size-8.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm shrink-0 border border-amber-500/30" }, "⚠"),
                                React.createElement('div', { key: 'title-text', className: "min-w-0" }, [
                                    React.createElement('div', { key: 'badge-row', className: "flex items-center gap-1.5" }, [
                                        React.createElement('span', { key: 'badge', className: "text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block leading-tight" }, "CANCELLATION REQUEST"),
                                        React.createElement('span', { key: 'dot', className: "size-1.5 rounded-full bg-amber-500 animate-ping" })
                                    ]),
                                    React.createElement('h4', { key: 'heading', className: "text-base font-extrabold font-mono text-gray-900 dark:text-white leading-tight truncate" }, displayOrderNum)
                                ])
                            ])
                        ]),
                        React.createElement('div', { key: 'body', className: "text-xs text-muted-foreground leading-snug space-y-1 relative z-10 bg-amber-500/5 p-3 rounded-2xl border border-amber-500/20" }, [
                            React.createElement('div', { key: 'rider-row', className: "flex items-center justify-between" }, [
                                React.createElement('span', { key: 'lbl', className: "text-[11px] font-medium text-muted-foreground" }, "Rider:"),
                                React.createElement('span', { key: 'val', className: "font-bold text-foreground text-xs" }, e.rider_name || 'Rider')
                            ]),
                            React.createElement('div', { key: 'cust-row', className: "flex items-center justify-between" }, [
                                React.createElement('span', { key: 'lbl2', className: "text-[11px] font-medium text-muted-foreground" }, "Customer:"),
                                React.createElement('span', { key: 'val2', className: "font-semibold text-foreground text-xs" }, e.customer_name || 'Customer')
                            ]),
                            React.createElement('div', { key: 'branch-row', className: "flex items-center justify-between" }, [
                                React.createElement('span', { key: 'lbl3', className: "text-[11px] font-medium text-muted-foreground" }, "Branch:"),
                                React.createElement('span', { key: 'val3', className: "font-semibold text-foreground text-xs" }, e.branch_name || 'Branch')
                            ]),
                            React.createElement('div', { key: 'reason-row', className: "mt-1 pt-1 border-t border-amber-500/10" }, [
                                React.createElement('span', { key: 'lbl4', className: "text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block" }, "Reason:"),
                                React.createElement('span', { key: 'val4', className: "font-medium text-foreground text-xs block" }, e.reason + (e.notes ? ` (${e.notes})` : ''))
                            ])
                        ]),
                        React.createElement('div', { key: 'actions', className: "flex items-center gap-2 pt-0.5 relative z-10" }, [
                            React.createElement('button', {
                                key: 'reject',
                                onClick: async () => {
                                    try {
                                        const res = await fetch(`/api/v1/cancellation-requests/${e.cancellation_request_id}/reject`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                                'Accept': 'application/json',
                                            },
                                            body: JSON.stringify({ rejection_reason: 'Rejected by cashier' })
                                        });
                                        const data = await res.json();
                                        if (res.ok && data.success) {
                                            toast.dismiss(t);
                                            toast.success(`Cancellation request for ${displayOrderNum} REJECTED.`);
                                            router.reload();
                                        } else {
                                            toast.error(data.message || 'Failed to reject cancellation request.');
                                        }
                                    } catch {
                                        toast.error('Network error while processing decision.');
                                    }
                                },
                                className: "px-3 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all cursor-pointer active:scale-95 shrink-0"
                            }, "REJECT"),
                            React.createElement('button', {
                                key: 'accept',
                                onClick: async () => {
                                    try {
                                        const res = await fetch(`/api/v1/cancellation-requests/${e.cancellation_request_id}/accept`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                                'Accept': 'application/json',
                                            },
                                        });
                                        const data = await res.json();
                                        if (res.ok && data.success) {
                                            toast.dismiss(t);
                                            toast.success(`Cancellation request for ${displayOrderNum} ACCEPTED. Order cancelled.`);
                                            router.reload();
                                        } else {
                                            toast.error(data.message || 'Failed to accept cancellation request.');
                                        }
                                    } catch {
                                        toast.error('Network error while processing decision.');
                                    }
                                },
                                className: "flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            }, [
                                React.createElement('span', { key: 'txt-a' }, "ACCEPT CANCELLATION")
                            ])
                        ])
                    ])
                ), { duration: 30000, position: 'top-right' });

                router.reload({
                    only: ['summary', 'recentOrders', 'orders', 'deliveries', 'stats'],
                });
            };

            const handleCancellationResolved = (e: CancellationResolvedEvent) => {
                console.log('Real-time: Cancellation Resolved Event Received', e);
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

            const handleStatusUpdate = (e: {
                order_id?: number;
                order_number?: string;
                status?: string;
                status_label?: string;
                updated_by?: string;
                customer_name?: string;
            }) => {
                console.log('Real-time: Order Status Updated', e);
                router.reload({
                    only: ['summary', 'recentOrders', 'orders', 'deliveries', 'stats', 'sales'],
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

            if (userRole === 'admin') {
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
