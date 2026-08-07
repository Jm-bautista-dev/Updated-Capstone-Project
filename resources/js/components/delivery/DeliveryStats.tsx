import { AlertCircle, CheckCircle2, Navigation, Timer } from 'lucide-react';
import React from 'react';

import type { DeliveryStatsData } from './types';

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
    description: string;
}

const StatCard = React.memo(function StatCard({ label, value, icon, colorClass, description }: StatCardProps) {
    return (
        <div className="rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-5 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 space-y-3 font-['Outfit']">
            <div className="flex items-center justify-between">
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${colorClass}`}>{label}</p>
                <div className={`size-9 rounded-xl bg-[#FFF5F7] dark:bg-[#1C1C28] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-2xs ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
            <div>
                <h3 className={`text-2xl font-black font-mono tabular-nums leading-none ${colorClass}`}>{value}</h3>
                <p className="text-[8px] text-[#7D6B6E] dark:text-[#94A3B8] font-bold uppercase mt-1.5 tracking-widest">{description}</p>
            </div>
        </div>
    );
});

interface DeliveryStatsProps {
    stats: DeliveryStatsData;
}

const DeliveryStats = React.memo(function DeliveryStats({ stats }: DeliveryStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Pending" value={stats.pending} icon={<Timer className="size-4" />} colorClass="text-amber-500" description="Awaiting preparation" />
            <StatCard label="In Transit" value={stats.active} icon={<Navigation className="size-4" />} colorClass="text-blue-500" description="On the road" />
            <StatCard label="Delivered Today" value={stats.delivered} icon={<CheckCircle2 className="size-4" />} colorClass="text-emerald-500" description="Completed runs" />
            <StatCard label="Delayed" value={stats.delayed} icon={<AlertCircle className="size-4" />} colorClass="text-rose-500" description="Needs attention" />
        </div>
    );
});

export default DeliveryStats;
