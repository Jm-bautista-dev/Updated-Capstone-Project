import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import { FiBell } from 'react-icons/fi';
import { toast } from 'sonner';
import { NotificationDropdown, type Notification } from '@/components/notification-dropdown';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { globalNotificationManager } from '@/lib/global-notification-manager';
import { playOrderNotificationSound } from '@/lib/order-audio';

interface AuthState {
    user?: {
        id?: number;
        role?: string;
        [key: string]: unknown;
    };
}

export interface NotificationItem {
    id: string | number;
    order_id?: number;
    order_number?: string;
    employee_name?: string;
    action?: string;
    ingredient_name?: string;
    quantity_change?: string;
    branch_name?: string;
    is_unread?: boolean;
    type?: string;
    remaining?: string;
    source?: string;
    created_at?: string;
    time_ago?: string;
    url?: string;
}

const alertedNotificationIds = new Set<string | number>();

const triggerToastAlert = (notif: NotificationItem) => {
    const keyId = notif.order_id || notif.id;
    if (!keyId || alertedNotificationIds.has(keyId)) return;

    alertedNotificationIds.add(keyId);
    if (alertedNotificationIds.size > 200) {
        const first = alertedNotificationIds.values().next().value;
        if (first !== undefined) alertedNotificationIds.delete(first);
    }

    const displayOrderNum = notif.order_number || notif.ingredient_name || (notif.order_id ? `ORD-${notif.order_id}` : 'ORD-NEW');
    const custName = notif.employee_name || 'Mobile Customer';
    const amountStr = notif.quantity_change || '';
    const branchStr = notif.branch_name || 'Branch';

    globalNotificationManager.notify({
        id: notif.order_id || notif.id,
        type: notif.type === 'new_pickup' ? 'pickup' : 'order',
        title: notif.type === 'new_pickup' ? 'New Pickup Order' : 'New Online Order',
        order_number: displayOrderNum,
        customer_name: custName,
        branch_name: branchStr,
        total_amount: amountStr,
        link_url: notif.order_id
            ? (notif.type === 'new_pickup'
                ? `/pickups?order_id=${notif.order_id}&order_number=${encodeURIComponent(displayOrderNum)}`
                : `/deliveries?order_id=${notif.order_id}&order_number=${encodeURIComponent(displayOrderNum)}`)
            : '/deliveries',
        link_text: 'VIEW ORDER',
        duration_ms: 5000,
        auto_dismiss: true,
        created_at: Date.now(),
    });
};

const alertedCancellationIds = new Set<string | number>();

const triggerCancellationToast = (notif: NotificationItem) => {
    const keyId = notif.id;
    if (!keyId || alertedCancellationIds.has(keyId)) return;

    alertedCancellationIds.add(keyId);
    if (alertedCancellationIds.size > 200) {
        const first = alertedCancellationIds.values().next().value;
        if (first !== undefined) alertedCancellationIds.delete(first);
    }

    const displayOrderNum = notif.order_number || notif.ingredient_name || (notif.order_id ? `ORD-${notif.order_id}` : 'ORD');
    const riderName = notif.employee_name || 'Rider';
    const reason = notif.quantity_change || 'No reason provided';
    const branchStr = notif.branch_name || 'Branch';

    globalNotificationManager.notify({
        id: notif.id,
        type: 'cancellation',
        title: 'Cancellation Request',
        order_number: displayOrderNum,
        customer_name: riderName,
        branch_name: branchStr,
        reason: reason,
        link_url: notif.order_id 
            ? `/deliveries?order_id=${notif.order_id}&order_number=${encodeURIComponent(displayOrderNum)}`
            : '/deliveries',
        link_text: 'REVIEW REQUEST',
        duration_ms: 8000,
        auto_dismiss: true,
        created_at: Date.now(),
    });
};

export function NotificationBell() {
    const { auth } = usePage().props as unknown as { auth?: AuthState };
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const processNotifications = useCallback((items: NotificationItem[]) => {
        setNotifications(items);
        const unread = items.filter(i => i.is_unread).length;
        setUnreadCount(unread);

        // Check for new unread notifications to alert cashier
        items.forEach(item => {
            if (item.is_unread) {
                if (item.type === 'new_order') {
                    triggerToastAlert(item);
                } else if (item.type === 'cancellation_request') {
                    triggerCancellationToast(item);
                }
            }
        });
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!auth?.user) return;
        try {
            const response = await axios.get('/api/v1/notifications');
            processNotifications(response.data.notifications || []);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status !== 401) {
                console.error('Failed to fetch notifications:', error);
            }
        }
    }, [auth?.user, processNotifications]);

    useEffect(() => {
        if (!auth?.user) return;

        let active = true;

        const loadNotifications = async () => {
            try {
                const response = await axios.get('/api/v1/notifications');
                if (active && response.data.notifications) {
                    processNotifications(response.data.notifications);
                }
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status !== 401) {
                    console.error('Failed to fetch notifications:', error);
                }
            }
        };

        // Initial load & 5-second polling loop
        const timer = setTimeout(loadNotifications, 0);
        const interval = setInterval(loadNotifications, 5000);

        const handleNewOrder = () => {
            loadNotifications();
        };
        window.addEventListener('new-order-received', handleNewOrder);

        return () => {
            active = false;
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('new-order-received', handleNewOrder);
        };
    }, [auth?.user, processNotifications]);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            handleMarkAsRead();
        }
    };

    const handleMarkAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await axios.post('/api/v1/notifications/mark-as-read');
            setUnreadCount(0);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button className="relative p-2.5 rounded-2xl bg-white/80 dark:bg-[#121218]/80 hover:bg-white dark:hover:bg-[#1C1C28] border border-[#F8C8DC]/60 dark:border-white/10 shadow-xs backdrop-blur-xl transition-all duration-300 focus:outline-none group cursor-pointer">
                    <FiBell className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                key={unreadCount} // Re-trigger animation on count change
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: 1 
                                }}
                                transition={{ 
                                    scale: { duration: 0.3 },
                                    opacity: { duration: 0.2 }
                                }}
                                className="absolute -top-1.5 -right-1.5"
                            >
                                <Badge 
                                    variant="destructive"
                                    className="min-w-4.5 h-4.5 rounded-full flex items-center justify-center p-0.5 text-[9px] font-black bg-rose-600 text-white border-white dark:border-[#121218] border-[1.5px] shadow-xs tabular-nums"
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
                <NotificationDropdown 
                    notifications={notifications as unknown as Notification[]} 
                    onMarkAllAsRead={handleMarkAsRead}
                />
            </PopoverContent>
        </Popover>
    );
}
