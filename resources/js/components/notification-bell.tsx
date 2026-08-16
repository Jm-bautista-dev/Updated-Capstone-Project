import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import { FiBell } from 'react-icons/fi';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface AuthState {
    user?: {
        id?: number;
        role?: string;
        [key: string]: unknown;
    };
}

export function NotificationBell() {
    const { auth } = usePage().props as unknown as { auth?: AuthState };
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!auth?.user) return;
        try {
            const response = await axios.get('/api/v1/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status !== 401) {
                console.error('Failed to fetch notifications:', error);
            }
        }
    }, [auth?.user]);

    useEffect(() => {
        if (!auth?.user) return;

        let active = true;

        const loadNotifications = async () => {
            try {
                const response = await axios.get('/api/v1/notifications');
                if (active) {
                    setNotifications(response.data.notifications);
                    setUnreadCount(response.data.unread_count);
                }
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status !== 401) {
                    console.error('Failed to fetch notifications:', error);
                }
            }
        };

        // Defer initial fetch to prevent synchronous setState during effect setup
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
    }, [auth?.user]);

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
                    notifications={notifications} 
                    onMarkAllAsRead={handleMarkAsRead}
                />
            </PopoverContent>
        </Popover>
    );
}
