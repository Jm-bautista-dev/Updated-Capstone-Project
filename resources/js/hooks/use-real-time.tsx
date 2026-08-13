import { router, usePage } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import echo from '@/echo';

interface RealTimeOrderEvent {
    order_id?: number;
    branch_id?: number;
    branch_name?: string;
    customer_name?: string;
    total_amount?: number;
    message?: string;
}

interface AuthState {
    user?: {
        id?: number;
        role?: string;
        branch_id?: number | null;
    };
}

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

// Deduplication tracking to prevent duplicate alerts/sounds for the same order ID
const notifiedOrderIds = new Set<number>();

const playNotificationSound = () => {
    try {
        const soundEnabled = localStorage.getItem('order_notification_sound') !== 'disabled';
        if (!soundEnabled) return;

        const audio = new Audio(NOTIFICATION_SOUND);
        audio.volume = 0.8;
        const promise = audio.play();
        if (promise !== undefined) {
            promise.catch(err => {
                console.warn('[Audio Autoplay] Sound playback prevented by browser interaction policy:', err);
            });
        }
    } catch (err) {
        console.warn('[Audio Error] Unable to initialize notification sound:', err);
    }
};

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
            
            echo.private(`branch.${targetId}`)
                .listen('SaleCreated', (e: Record<string, unknown>) => {
                    console.log('Real-time: New Sale in Branch', e);
                    router.reload({ 
                        only: ['products', 'summary', 'recentOrders', 'sales'],
                    });
                })
                .listen('StockUpdated', (e: Record<string, unknown>) => {
                    console.log('Real-time: Stock Level Changed', e);
                    router.reload({ 
                        only: ['products', 'ingredients', 'summary'],
                    });
                })
                .listen('ProductUpdated', (e: Record<string, unknown>) => {
                    console.log('Real-time: Product Data Sync', e);
                    router.reload({ 
                        only: ['products'],
                    });
                });
        }

        // 3. Listen for Orders (Admin or Branch Specific)
        if (echo) {
            const handleOrderNotification = (e: RealTimeOrderEvent) => {
                console.log('Real-time: New Order Event Received', e);
                
                // DEDUPLICATION: Prevent duplicate sounds & toasts for the same order
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
                }

                // LAYER 2: Play audio notification chime
                playNotificationSound();

                // LAYER 1: Prominent, non-blocking custom visual alert card using React.createElement
                const formattedPrice = typeof e.total_amount === 'number' 
                    ? `₱${e.total_amount.toFixed(2)}` 
                    : e.total_amount 
                        ? `₱${e.total_amount}` 
                        : '';

                toast.custom((t) => (
                    React.createElement('div', {
                        className: "flex flex-col gap-2.5 p-4 bg-white dark:bg-[#1C1C28] border-2 border-emerald-500/40 dark:border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-xl max-w-sm w-full font-['Outfit'] animate-in fade-in slide-in-from-top-4 duration-300"
                    }, [
                        React.createElement('div', { key: 'header', className: "flex items-center justify-between gap-2" }, [
                            React.createElement('div', { key: 'title-group', className: "flex items-center gap-2.5" }, [
                                React.createElement('div', { key: 'icon', className: "size-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0" }, "🛒"),
                                React.createElement('div', { key: 'title-text', className: "min-w-0" }, [
                                    React.createElement('span', { key: 'badge', className: "text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block leading-tight" }, "NEW CUSTOMER ORDER"),
                                    React.createElement('h4', { key: 'heading', className: "text-sm font-bold text-gray-900 dark:text-white leading-tight truncate" }, `Order #${e.order_id || 'New'}`)
                                ])
                            ]),
                            formattedPrice ? React.createElement('span', { key: 'price', className: "text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40 shrink-0" }, formattedPrice) : null
                        ]),
                        React.createElement('p', { key: 'body', className: "text-xs text-muted-foreground leading-snug" }, [
                            "Customer ",
                            React.createElement('span', { key: 'cust', className: "font-semibold text-foreground" }, e.customer_name || 'Customer'),
                            " placed an order at ",
                            React.createElement('span', { key: 'branch', className: "font-semibold text-foreground" }, e.branch_name || 'Branch'),
                            "."
                        ]),
                        React.createElement('div', { key: 'actions', className: "flex items-center gap-2 pt-1" }, [
                            React.createElement('button', {
                                key: 'view',
                                onClick: () => {
                                    toast.dismiss(t);
                                    router.visit('/deliveries');
                                },
                                className: "flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center"
                            }, "View Order"),
                            React.createElement('button', {
                                key: 'dismiss',
                                onClick: () => toast.dismiss(t),
                                className: "px-3 h-8 text-xs font-bold text-muted-foreground hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
                            }, "Dismiss")
                        ])
                    ])
                ), { duration: 12000, position: 'top-right' });

                // LAYER 3: Refresh page props to update deliveries navigation & notification bell
                router.reload({ 
                    only: ['summary', 'recentOrders', 'orders', 'deliveries', 'stats'],
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
                    preserveState: true,
                });
            };

            const userRole = (auth?.user?.role || '').toLowerCase();
            const userBranchId = branchId || auth?.user?.branch_id;

            if (userRole === 'admin') {
                echo.private('admin.orders')
                    .listen('OrderCreated', handleOrderNotification)
                    .listen('.OrderCreated', handleOrderNotification)
                    .listen('OrderStatusUpdated', handleStatusUpdate)
                    .listen('.order-status-updated', handleStatusUpdate);
            }

            if (userBranchId) {
                echo.private(`branch.${userBranchId}.orders`)
                    .listen('OrderCreated', handleOrderNotification)
                    .listen('.OrderCreated', handleOrderNotification)
                    .listen('OrderStatusUpdated', handleStatusUpdate)
                    .listen('.order-status-updated', handleStatusUpdate);
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
