import React from 'react';
import { cn } from '@/lib/utils';

export type RiderStatus = 'available' | 'busy' | 'offline' | 'active' | 'inactive' | string;

interface RiderStatusBadgeProps {
    status: RiderStatus;
    isActive?: boolean;
    className?: string;
}

export function RiderStatusBadge({ status, isActive, className }: RiderStatusBadgeProps) {
    const normalizeStatus = status?.toLowerCase() || 'offline';

    const getStatusDetails = (s: string) => {
        if (isActive === false || s === 'inactive') {
            return {
                label: 'Inactive',
                style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30',
                dot: 'bg-rose-500',
            };
        }

        switch (s) {
            case 'available':
            case 'active':
                return {
                    label: 'Available',
                    style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
                    dot: 'bg-emerald-500',
                };
            case 'busy':
                return {
                    label: 'On Delivery',
                    style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',
                    dot: 'bg-amber-500 animate-pulse',
                };
            case 'offline':
                return {
                    label: 'Offline',
                    style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-slate-500/30',
                    dot: 'bg-slate-400',
                };
            default:
                return {
                    label: status,
                    style: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
                    dot: 'bg-gray-400',
                };
        }
    };

    const details = getStatusDetails(normalizeStatus);

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors select-none',
                details.style,
                className
            )}
        >
            <span className={cn('size-1.5 rounded-full shrink-0', details.dot)} />
            <span>{details.label}</span>
        </span>
    );
}
