import React, { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationDropdown } from '@/components/notification-dropdown';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { usePage } from '@inertiajs/react';

export function NotificationBell() {
    const { auth } = usePage().props as any;
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        if (!auth?.user) return;
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            // Only log if it's not a 401 (just in case auth state shifted)
            if (axios.isAxiosError(error) && error.response?.status !== 401) {
                console.error('Failed to fetch notifications:', error);
            }
        }
    };

    useEffect(() => {
        if (!auth?.user) return;
        
        fetchNotifications();
        // Refresh every 5 seconds
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
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
            await axios.post('/api/notifications/mark-as-read');
            setUnreadCount(0);
            // Optionally refresh the list to update "unread" highlights
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-muted/50 transition-colors focus:outline-none">
                    <FiBell className="size-5 text-muted-foreground" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute top-1 right-1"
                            >
                                <Badge className="min-w-[18px] h-[18px] flex items-center justify-center p-0 text-[10px] font-bold bg-destructive text-destructive-foreground border-none">
                                    {unreadCount > 9 ? '9+' : unreadCount}
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
