import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
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

const playNotificationSound = () => {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.play().catch(e => console.error('Audio play failed:', e));
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
                    // Refresh data without page reload
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
                console.log('Real-time: New Order Received', e);
                
                // Play sound
                playNotificationSound();

                // Show Toast
                toast.success('🛒 New Order Received', {
                    description: `Order #${e.order_id} from ${e.branch_name} - ${e.customer_name}`,
                    duration: 10000,
                    action: {
                        label: 'View Order',
                        onClick: () => router.visit('/deliveries')
                    }
                });

                // Refresh relevant data including deliveries page props
                router.reload({ 
                    only: ['summary', 'recentOrders', 'orders', 'deliveries', 'stats'],
                });
            };

            const userRole = (auth?.user?.role || '').toLowerCase();
            const userBranchId = branchId || auth?.user?.branch_id;

            if (userRole === 'admin') {
                echo.private('admin.orders')
                    .listen('OrderCreated', handleOrderNotification)
                    .listen('.OrderCreated', handleOrderNotification);
            }

            if (userBranchId) {
                echo.private(`branch.${userBranchId}.orders`)
                    .listen('OrderCreated', handleOrderNotification)
                    .listen('.OrderCreated', handleOrderNotification);
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
