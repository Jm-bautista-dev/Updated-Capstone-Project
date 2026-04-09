import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Navigation, CheckCircle2, AlertCircle } from 'lucide-react';
import type { DeliveryStatsData } from './types';

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bg: string;
}

const StatCard = React.memo(function StatCard({ label, value, icon, color, bg }: StatCardProps) {
    return (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-shadow duration-300">
            <CardContent className={`p-4 flex items-center justify-between ${bg}`}>
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-70 ${color}`}>{label}</p>
                    <p className={`text-xl font-black tabular-nums transition-all duration-500 ${color}`}>{value}</p>
                </div>
                <div className={`size-8 rounded-xl flex items-center justify-center ${color} bg-white/50 ring-1 ring-black/5 group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
});

interface DeliveryStatsProps {
    stats: DeliveryStatsData;
}

const DeliveryStats = React.memo(function DeliveryStats({ stats }: DeliveryStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Pending" value={stats.pending} icon={<Timer className="size-4" />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/30" />
            <StatCard label="In Transit" value={stats.active} icon={<Navigation className="size-4" />} color="text-violet-600" bg="bg-violet-50 dark:bg-violet-950/30" />
            <StatCard label="Delivered Today" value={stats.delivered} icon={<CheckCircle2 className="size-4" />} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/30" />
            <StatCard label="Delayed" value={stats.delayed} icon={<AlertCircle className="size-4" />} color="text-rose-600" bg="bg-rose-50 dark:bg-rose-950/30" />
        </div>
    );
});

export default DeliveryStats;
