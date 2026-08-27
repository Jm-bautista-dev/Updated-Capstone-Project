import React from 'react';

export type SystemStatusType =
    | 'healthy'
    | 'operational'
    | 'online'
    | 'warning'
    | 'degraded'
    | 'critical'
    | 'error'
    | 'offline'
    | 'maintenance'
    | 'info'
    | 'neutral';

interface SystemStatusBadgeProps {
    status: SystemStatusType | string;
    label?: string;
    showPulse?: boolean;
    className?: string;
}

export const SystemStatusBadge: React.FC<SystemStatusBadgeProps> = ({
    status,
    label,
    showPulse = true,
    className = '',
}) => {
    const normalized = (status || 'neutral').toLowerCase();

    let style = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    let dotStyle = 'bg-slate-400';

    if (['healthy', 'operational', 'online'].includes(normalized)) {
        style = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
        dotStyle = 'bg-emerald-500';
    } else if (['warning', 'degraded'].includes(normalized)) {
        style = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
        dotStyle = 'bg-amber-500';
    } else if (['critical', 'error', 'offline'].includes(normalized)) {
        style = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
        dotStyle = 'bg-rose-500';
    } else if (normalized === 'maintenance') {
        style = 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40';
        dotStyle = 'bg-amber-400';
    } else if (normalized === 'info') {
        style = 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30';
        dotStyle = 'bg-sky-500';
    }

    const displayLabel = label || normalized.toUpperCase();

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${style} ${className}`}
        >
            <span className={`size-1.5 rounded-full ${dotStyle} ${showPulse ? 'animate-pulse' : ''}`} />
            <span>{displayLabel}</span>
        </span>
    );
};
