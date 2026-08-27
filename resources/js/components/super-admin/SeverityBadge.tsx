import React from 'react';

export type SeverityType = 'critical' | 'error' | 'warning' | 'info' | string;

interface SeverityBadgeProps {
    severity: SeverityType;
    className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
    const normalized = (severity || 'info').toLowerCase();

    let style = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';

    if (normalized === 'critical') {
        style = 'bg-rose-600 text-white font-black shadow-sm shadow-rose-600/30 border-rose-600';
    } else if (normalized === 'error') {
        style = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    } else if (normalized === 'warning') {
        style = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    } else if (normalized === 'info') {
        style = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30';
    }

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider ${style} ${className}`}
        >
            {normalized}
        </span>
    );
};
