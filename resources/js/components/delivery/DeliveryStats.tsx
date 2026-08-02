import React from 'react';
import { Timer, Navigation, CheckCircle2, AlertCircle } from 'lucide-react';
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
        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between mb-2">
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${colorClass}`}>{label}</p>
                <div className={`${colorClass} opacity-80 group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
            <div>
                <h3 className={`text-2xl font-black tabular-nums leading-none ${colorClass}`}>{value}</h3>
                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">{description}</p>
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
