import { AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import React from 'react';
import { SystemStatusBadge } from './SystemStatusBadge';

interface IncidentBannerProps {
    status: 'healthy' | 'warning' | 'critical' | 'maintenance' | string;
    isMaintenance: boolean;
    unresolvedCount: number;
    criticalCount: number;
    activeIncidentTitle?: string;
}

export const IncidentBanner: React.FC<IncidentBannerProps> = ({
    status,
    isMaintenance,
    unresolvedCount,
    criticalCount,
    activeIncidentTitle,
}) => {
    if (isMaintenance) {
        return (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Wrench className="size-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold tracking-tight">GLOBAL MAINTENANCE MODE ACTIVE</h2>
                            <SystemStatusBadge status="maintenance" showPulse={false} />
                        </div>
                        <p className="text-xs opacity-90 mt-0.5">
                            Customer ordering & POS sync APIs are serving 503 notices to prevent data conflict.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (criticalCount > 0 || status === 'critical' || status === 'warning') {
        return (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400 animate-bounce" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold tracking-tight text-rose-600 dark:text-rose-400">
                                {criticalCount > 0 ? `${criticalCount} CRITICAL INCIDENT(S) ACTIVE` : 'DEGRADED SYSTEM PERFORMANCE'}
                            </h2>
                            <SystemStatusBadge status={status} />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-mono">
                            {activeIncidentTitle || `${unresolvedCount} unresolved application exception(s) require developer review.`}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            ALL SYSTEMS OPERATIONAL
                        </h2>
                        <SystemStatusBadge status="healthy" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Database queries, API routes, storage disks, and cache drivers are serving request load normally.
                    </p>
                </div>
            </div>
        </div>
    );
};
