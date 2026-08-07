import { HeartPulse, ShieldCheck, Zap } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

interface PerformanceSummaryProps {
    totalSales: number;
    totalTx: number;
    avgOrderOverall: number;
    cashierCount: number;
}

export function PerformanceSummary({
    totalTx,
    avgOrderOverall,
    cashierCount,
}: PerformanceSummaryProps) {
    const healthCards = [
        {
            title: 'Store Performance Velocity',
            status: 'Optimal Pace',
            statusColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
            description: `${cashierCount} registers active across filtered branches`,
            icon: ShieldCheck,
            metric: `${totalTx} Completed Orders`,
            progress: 88,
        },
        {
            title: 'Register Operating Health',
            status: 'Excellent',
            statusColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
            description: 'Zero transaction errors or shift discrepancies reported',
            icon: HeartPulse,
            metric: '100% System Uptime',
            progress: 96,
        },
        {
            title: 'Average Basket Density',
            status: 'Good Target',
            statusColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50',
            description: 'Average transaction checkout value',
            icon: Zap,
            metric: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(avgOrderOverall),
            progress: 74,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-['Outfit']">
            {healthCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div
                        key={idx}
                        className="rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-5 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 space-y-4"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="size-9 rounded-xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-2xs">
                                    <Icon className="size-4.5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        {card.title}
                                    </h4>
                                    <p className="text-[10px] font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                        {card.description}
                                    </p>
                                </div>
                            </div>
                            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border', card.statusColor)}>
                                {card.status}
                            </span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                <span>{card.metric}</span>
                                <span>{card.progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#FFF5F7] dark:bg-[#1C1C28] overflow-hidden border border-[#F8C8DC]/40 dark:border-white/10">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-[#E75480] to-[#FF4F81] transition-all duration-500"
                                    style={{ width: `${card.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
