import { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import echo from '@/echo';
import { toast } from 'sonner';

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const playNotificationSound = () => {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.play().catch(e => console.error('Audio play failed:', e));
};

export function useRealTime(branchId?: number | null) {
    const { auth } = usePage().props as any;

    useEffect(() => {
        // 1. Listen for Global Category Updates
        if (echo) {
            echo.channel('global')
                .listen('CategoryUpdated', (e: any) => {
                    console.log('Real-time: Global Categories Updated', e);
                    router.reload({ preserveScroll: true } as any);
                });
        }

        // 2. Listen for Branch-Specific Updates
        if (echo && (branchId || auth?.user?.branch_id)) {
            const targetId = branchId || auth?.user?.branch_id;
            
            echo.private(`branch.${targetId}`)
                .listen('SaleCreated', (e: any) => {
                    console.log('Real-time: New Sale in Branch', e);
                    // Refresh data without page reload
                    router.reload({ 
                        only: ['products', 'summary', 'recentOrders', 'sales'],
                        preserveScroll: true 
                    } as any);
                })
                .listen('StockUpdated', (e: any) => {
                    console.log('Real-time: Stock Level Changed', e);
                    router.reload({ 
                        only: ['products', 'ingredients', 'summary'],
                        preserveScroll: true 
                    } as any);
                })
                .listen('ProductUpdated', (e: any) => {
                    console.log('Real-time: Product Data Sync', e);
                    router.reload({ 
                        only: ['products'],
                        preserveScroll: true 
                    } as any);
                });
        }

        // 3. Listen for Orders (Admin or Branch Specific)
        if (echo) {
            const handleOrderNotification = (e: any) => {
                console.log('Real-time: New Order Received', e);
                
                // Play sound
                playNotificationSound();

                // Show Toast
                toast.success('🛒 New Order Received', {
                    description: `Order #${e.order_id} from ${e.branch_name} - ${e.customer_name}`,
                    duration: 10000,
                    action: {
                        label: 'View Order',
                        onClick: () => router.visit('/deliveries') // Fixed from /orders to /deliveries
                    }
                });

                // Refresh relevant data
                router.reload({ 
                    only: ['summary', 'recentOrders', 'orders'],
                    preserveScroll: true 
                } as any);
            };

            if (auth?.user?.role === 'admin') {
                echo.private('admin.orders').listen('OrderCreated', handleOrderNotification);
            } else if (auth?.user?.branch_id) {
                echo.private(`branch.${auth.user.branch_id}.orders`).listen('OrderCreated', handleOrderNotification);
            }
        }

        return () => {
            if (echo) {
                echo.leave('global');
                if (branchId || auth?.user?.branch_id) {
                    echo.leave(`branch.${branchId || auth?.user?.branch_id}`);
                    echo.leave(`branch.${auth?.user?.branch_id}.orders`);
                }
                if (auth?.user?.role === 'admin') {
                    echo.leave('admin.orders');
                }
            }
        };
    }, [branchId, auth?.user?.branch_id]);
}
