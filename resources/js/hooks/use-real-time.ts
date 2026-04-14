import { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import echo from '@/echo';

export function useRealTime(branchId?: number | null) {
    const { auth } = usePage().props as any;

    useEffect(() => {
        // 1. Listen for Global Category Updates
        echo.channel('global')
            .listen('CategoryUpdated', (e: any) => {
                console.log('Real-time: Global Categories Updated', e);
                router.reload({ preserveScroll: true } as any);
            });

        // 2. Listen for Branch-Specific Updates
        if (branchId || auth?.user?.branch_id) {
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

        return () => {
            echo.leave('global');
            if (branchId || auth?.user?.branch_id) {
                echo.leave(`branch.${branchId || auth?.user?.branch_id}`);
            }
        };
    }, [branchId, auth?.user?.branch_id]);
}
