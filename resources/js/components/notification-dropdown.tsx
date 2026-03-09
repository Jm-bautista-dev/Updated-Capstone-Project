import React from 'react';
import { Link } from '@inertiajs/react';
import { FiShoppingBag, FiPackage, FiSettings, FiCheckCircle, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface Notification {
    id: number;
    employee_name: string;
    action: 'Added' | 'Deducted' | 'Alert';
    ingredient_name: string;
    quantity_change: string;
    remaining: string;
    source: string;
    branch_name: string;
    created_at: string;
    time_ago: string;
    is_unread: boolean;
    type: 'activity' | 'low_stock' | 'out_of_stock';
}

interface NotificationDropdownProps {
    notifications: Notification[];
    onMarkAllAsRead: () => void;
}

export function NotificationDropdown({ notifications, onMarkAllAsRead }: NotificationDropdownProps) {
    const getIcon = (source: string, type: string) => {
        if (type === 'out_of_stock') return <FiAlertOctagon className="size-4" />;
        if (type === 'low_stock') return <FiAlertTriangle className="size-4" />;
        const s = source.toLowerCase();
        if (s.includes('sale')) return <FiShoppingBag className="size-4" />;
        if (s.includes('stock') || s.includes('initial')) return <FiPackage className="size-4" />;
        return <FiSettings className="size-4" />;
    };

    const getSourceLabel = (source: string) => {
        const s = source.toLowerCase();
        if (s.includes('sale')) return 'POS Sale';
        if (s.includes('initial')) return 'Initial Stock';
        if (s.includes('manual')) return 'Manual Stock';
        return source;
    };

    return (
        <div className="flex flex-col bg-popover rounded-lg shadow-lg border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <h3 className="text-sm font-bold tracking-tight">Inventory Notifications</h3>
                <button 
                    onClick={onMarkAllAsRead}
                    className="text-[10px] font-bold uppercase text-primary hover:underline"
                >
                    Mark all as read
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <FiCheckCircle className="size-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No recent activity</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id}
                                className={cn(
                                    "px-4 py-3 transition-colors hover:bg-muted/30 flex gap-3",
                                    notif.is_unread && "bg-primary/5",
                                    notif.type === 'out_of_stock' && "bg-red-500/5 hover:bg-red-500/10",
                                    notif.type === 'low_stock' && "bg-orange-500/5 hover:bg-orange-500/10"
                                )}
                            >
                                <div className={cn(
                                    "size-8 rounded-full flex items-center justify-center shrink-0",
                                    notif.type === 'out_of_stock' ? "bg-red-500/20 text-red-600" :
                                    notif.type === 'low_stock' ? "bg-orange-500/20 text-orange-600" :
                                    notif.action === 'Added' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                )}>
                                    {getIcon(notif.source, notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {notif.type === 'activity' ? (
                                        <p className="text-xs leading-tight">
                                            <span className="font-bold">{notif.employee_name}</span>
                                            {' '}
                                            <span className={cn(
                                                "font-medium",
                                                notif.action === 'Added' ? "text-green-600" : "text-red-500"
                                            )}>
                                                {notif.action.toLowerCase()}
                                            </span>
                                            {' '}
                                            <span className="font-bold">{notif.quantity_change}</span>
                                            {' '}
                                            <span className="font-medium">{notif.ingredient_name}</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs leading-tight">
                                            <span className={cn(
                                                "font-bold",
                                                notif.type === 'out_of_stock' ? "text-red-600" : "text-orange-600"
                                            )}>
                                                {notif.type === 'out_of_stock' ? 'Out of Stock Alert' : 'Low Stock Alert'}
                                            </span>
                                            <br />
                                            <span className="font-medium">
                                                {notif.ingredient_name} is {notif.type === 'out_of_stock' ? 'out of stock' : 'running low'}
                                            </span>
                                            {notif.type === 'low_stock' && (
                                                <span className="block text-muted-foreground mt-0.5">
                                                    Remaining: {notif.remaining}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            {notif.type === 'activity' ? getSourceLabel(notif.source) : 'Alert'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground opacity-50">•</span>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            {notif.branch_name}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">
                                        {notif.time_ago}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Link 
                href="/inventory/activity" 
                className="block py-2 text-center text-xs font-bold border-t bg-muted/20 hover:bg-muted/40 transition-colors uppercase tracking-widest text-muted-foreground"
            >
                View All Activity
            </Link>
        </div>
    );
}
