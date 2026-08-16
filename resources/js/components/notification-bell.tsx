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

    // Play Web Audio / Fallback sound chime
    playOrderNotificationSound();

    // Display High-Priority Toast Alert Card
    const displayOrderNum = notif.order_number || notif.ingredient_name || (notif.order_id ? `ORD-${notif.order_id}` : 'ORD-NEW');
    const custName = notif.employee_name || 'Mobile Customer';
    const amountStr = notif.quantity_change || '';
    const branchStr = notif.branch_name || 'Branch';

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
                amountStr ? React.createElement('span', { key: 'price', className: "text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800/60 shrink-0" }, amountStr) : null
            ]),
            React.createElement('div', { key: 'body', className: "text-xs text-muted-foreground leading-snug space-y-0.5 relative z-10 bg-muted/30 dark:bg-white/5 p-2.5 rounded-2xl border border-border/50" }, [
                React.createElement('div', { key: 'cust-row', className: "flex items-center justify-between" }, [
                    React.createElement('span', { key: 'lbl', className: "text-[11px] font-medium text-muted-foreground" }, "Customer:"),
                    React.createElement('span', { key: 'val', className: "font-bold text-foreground text-xs" }, custName)
                ]),
                React.createElement('div', { key: 'branch-row', className: "flex items-center justify-between" }, [
                    React.createElement('span', { key: 'lbl2', className: "text-[11px] font-medium text-muted-foreground" }, "Branch:"),
                    React.createElement('span', { key: 'val2', className: "font-semibold text-foreground text-xs" }, branchStr)
                ])
            ]),
            React.createElement('div', { key: 'actions', className: "flex items-center gap-2 pt-0.5 relative z-10" }, [
                React.createElement('button', {
                    key: 'view',
                    onClick: () => {
                        toast.dismiss(t);
                        const targetUrl = notif.order_id 
                            ? `/deliveries?order_id=${notif.order_id}&order_number=${encodeURIComponent(displayOrderNum)}` 
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

        // Check for new unread order notifications to alert cashier
        items.forEach(item => {
            if (item.type === 'new_order' && item.is_unread) {
                triggerToastAlert(item);
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
