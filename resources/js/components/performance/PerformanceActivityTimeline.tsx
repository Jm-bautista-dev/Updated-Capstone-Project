import { Activity } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';

interface ActivityItem {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'milestone' | 'target' | 'efficiency';
}

export function PerformanceActivityTimeline() {
    const activities: ActivityItem[] = [
        {
            id: '1',
            title: 'Daily Sales Target Achieved',
            description: 'Branch registers crossed the ₱50,000 threshold for the current period.',
            timestamp: '10 minutes ago',
            type: 'target',
        },
        {
            id: '2',
            title: 'High Transaction Volume Alert',
            description: 'Lunch peak register velocity reached 120 completed transactions per hour.',
            timestamp: '1 hour ago',
            type: 'milestone',
        },
        {
            id: '3',
            title: 'Cashier Efficiency Audit Complete',
            description: 'All register cash drawer closing balances matched expected totals perfectly.',
            timestamp: '3 hours ago',
            type: 'efficiency',
        },
    ];

    return (
        <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 p-6 sm:p-7 space-y-5 font-['Outfit']">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-2xs">
                        <Activity className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Recent Performance Activity
                        </h3>
                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Real-time operational events, milestones, and register telemetry
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F8C8DC]/40 dark:before:bg-white/10">
                {activities.map((act) => (
                    <div key={act.id} className="relative flex items-start justify-between gap-4">
                        <div className="absolute -left-6 top-1.5 size-3.5 rounded-full bg-[#E75480] dark:bg-[#FF4F81] ring-4 ring-white dark:ring-[#121218]" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-2">
                                <span>{act.title}</span>
                                <Badge className="bg-[#FFF5F7] dark:bg-[#181824] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 text-[9px] font-black uppercase">
                                    {act.type}
                                </Badge>
                            </h4>
                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                {act.description}
                            </p>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[#7D6B6E] dark:text-[#94A3B8] shrink-0">
                            {act.timestamp}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
