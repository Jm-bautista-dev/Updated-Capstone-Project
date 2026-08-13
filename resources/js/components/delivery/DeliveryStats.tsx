import { motion } from 'framer-motion';
import { AlertTriangle, Bike, ChefHat, CheckCircle2, Clock, Navigation, PackageCheck } from 'lucide-react';
import React from 'react';
import type { DeliveryStatsData } from './types';

interface DeliveryStatsProps {
    stats: DeliveryStatsData;
    onStatusFilterClick?: (status: string) => void;
}

export default function DeliveryStats({ stats, onStatusFilterClick }: DeliveryStatsProps) {
    const pipelineItems = [
        {
            key: 'waiting_for_kitchen',
            label: 'New Orders',
            count: stats.waiting ?? stats.pending ?? 0,
            subtext: 'Awaiting kitchen start',
            icon: Clock,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-100/60 dark:bg-orange-950/40',
            border: 'border-orange-200 dark:border-orange-900/30',
        },
        {
            key: 'preparing',
            label: 'Preparing',
            count: stats.preparing ?? 0,
            subtext: 'Kitchen active',
            icon: ChefHat,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100/60 dark:bg-blue-950/40',
            border: 'border-blue-200 dark:border-blue-900/30',
        },
        {
            key: 'ready_for_pickup',
            label: 'Ready for Pickup',
            count: stats.ready ?? 0,
            subtext: 'Needs rider',
            icon: PackageCheck,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-100/60 dark:bg-amber-950/40',
            border: 'border-amber-200 dark:border-amber-900/30',
        },
        {
            key: 'assigned_to_rider',
            label: 'Assigned',
            count: stats.assigned ?? 0,
            subtext: 'Rider dispatching',
            icon: Bike,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-100/60 dark:bg-indigo-950/40',
            border: 'border-indigo-200 dark:border-indigo-900/30',
        },
        {
            key: 'in_transit',
            label: 'In Transit',
            count: stats.in_transit ?? stats.active ?? 0,
            subtext: 'On delivery route',
            icon: Navigation,
            color: 'text-violet-600 dark:text-violet-400',
            bg: 'bg-violet-100/60 dark:bg-violet-950/40',
            border: 'border-violet-200 dark:border-violet-900/30',
        },
        {
            key: 'delivered',
            label: 'Delivered Today',
            count: stats.delivered,
            subtext: 'Completed today',
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100/60 dark:bg-emerald-950/40',
            border: 'border-emerald-200 dark:border-emerald-900/30',
        },
        {
            key: 'delayed',
            label: 'Delayed / Attention',
            count: (stats.delayed ?? 0) + (stats.failed ?? 0),
            subtext: 'Requires action',
            icon: AlertTriangle,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-100/60 dark:bg-rose-950/40',
            border: 'border-rose-200 dark:border-rose-900/30',
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 sm:gap-3 font-['Outfit'] w-full min-w-0 max-w-full">
            {pipelineItems.map((item) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={item.key}
                        whileHover={{ y: -2 }}
                        onClick={() => onStatusFilterClick?.(item.key)}
                        className={`p-3 sm:p-3.5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border ${item.border} shadow-xs backdrop-blur-xl flex flex-col justify-between transition-all cursor-pointer group min-w-0 w-full`}
                    >
                        <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] truncate">
                                {item.label}
                            </span>
                            <div className={`p-1.5 rounded-xl ${item.bg} ${item.color} shrink-0`}>
                                <Icon className="size-3.5" />
                            </div>
                        </div>

                        <div className="mt-2">
                            <h3 className={`text-xl font-black ${item.color} font-mono leading-none`}>
                                {item.count}
                            </h3>
                            <p className="text-[10px] text-[#9E8B8E] dark:text-[#64748B] mt-1 truncate">
                                {item.subtext}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
