import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    FileText,
    Flag,
    Server,
    Shield,
    Wrench,
} from 'lucide-react';
import React, { useState } from 'react';
import { ErrorDetailDrawer } from '@/components/super-admin/ErrorDetailDrawer';
import type { ErrorRecordDetail } from '@/components/super-admin/ErrorDetailDrawer';
import { IncidentBanner } from '@/components/super-admin/IncidentBanner';
import { SeverityBadge } from '@/components/super-admin/SeverityBadge';
import { SystemStatusBadge } from '@/components/super-admin/SystemStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface Service {
    status: string;
    message: string;
    latency_ms?: number;
}

interface OverviewProps {
    application: {
        name: string;
        version: string;
        environment: string;
        laravelVersion: string;
        phpVersion: string;
        apiVersion: string;
        lastDeployment: string;
        status: 'healthy' | 'warning' | 'critical' | 'maintenance';
        isMaintenance: boolean;
    };
    services: Record<string, Service>;
    stats: {
        totalUsers: number;
        superAdmins: number;
        unresolvedErrors: number;
        criticalErrors: number;
        enabledFlags: number;
        totalFlags: number;
    };
    recentAuditLogs: Array<{
        id: number;
        action: string;
        actor_name: string;
        actor_role: string;
        created_at: string;
    }>;
    recentErrors: Array<ErrorRecordDetail>;
}

export default function Overview({
    application,
    services,
    stats,
    recentAuditLogs,
    recentErrors,
}: OverviewProps) {
    const [selectedError, setSelectedError] = useState<ErrorRecordDetail | null>(null);

    const handleToggleResolved = async (errorId: number) => {
        try {
            await fetch(`/super-admin/errors/${errorId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            setSelectedError(null);
            window.location.reload();
        } catch {
            /* handled gracefully */
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Operations Cockpit" />

            {/* Top Operations Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Developer Operations Cockpit
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Real-time infrastructure health, service telemetry, and incident oversight
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/super-admin/maintenance"
                        className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                            application.isMaintenance
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                        }`}
                    >
                        <Wrench className="size-4" />
                        {application.isMaintenance ? 'Maintenance Active' : 'Maintenance Control'}
                    </Link>

                    <Link
                        href="/super-admin/system-health"
                        className="h-10 px-4 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
                    >
                        <Activity className="size-4" />
                        Run Diagnostics
                    </Link>
                </div>
            </div>

            {/* Active Incident Banner */}
            <IncidentBanner
                status={application.status}
                isMaintenance={application.isMaintenance}
                unresolvedCount={stats.unresolvedErrors}
                criticalCount={stats.criticalErrors}
            />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                            Unresolved Errors
                            <AlertTriangle className="size-4 text-rose-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums">{stats.unresolvedErrors}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {stats.criticalErrors > 0 ? `${stats.criticalErrors} critical error alert(s)` : 'No critical exceptions active'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                            Feature Flags
                            <Flag className="size-4 text-amber-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                            {stats.enabledFlags} / {stats.totalFlags}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Active feature toggles</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                            Framework Stack
                            <Server className="size-4 text-sky-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Laravel v{application.laravelVersion}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">PHP Engine {application.phpVersion}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                            Users & Credentials
                            <Shield className="size-4 text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.totalUsers}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{stats.superAdmins} Super Admin developer user(s)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Core Subsystems Status */}
            <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Core Subsystems Telemetry</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(services).map(([key, service]) => (
                        <div
                            key={key}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs"
                        >
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                                    {key.replace('_', ' ')}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{service.message}</p>
                            </div>
                            <SystemStatusBadge status={service.status} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Active Errors & Audit Log Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Unresolved Errors */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-rose-500" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Application Exceptions</h3>
                        </div>
                        <Link
                            href="/super-admin/errors"
                            className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1"
                        >
                            View Log ({stats.unresolvedErrors}) <ArrowUpRight className="size-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentErrors.map((err) => (
                            <div
                                key={err.id}
                                className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                                onClick={() => setSelectedError(err)}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <SeverityBadge severity={err.severity} />
                                        <span className="font-mono font-bold text-slate-900 dark:text-slate-200 truncate max-w-xs">
                                            {err.exception_class}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">x{err.occurrences}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">{err.message}</p>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                    <span>{err.endpoint ? `/${err.endpoint}` : 'CLI / Task'}</span>
                                    <span>{new Date(err.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))}
                        {recentErrors.length === 0 && (
                            <div className="py-8 text-center text-slate-400 italic text-xs">
                                No active application exceptions logged.
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit Logs Timeline */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-amber-500" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Developer Audit Trail</h3>
                        </div>
                        <Link
                            href="/super-admin/audit-logs"
                            className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                        >
                            View Audit Log <ArrowUpRight className="size-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentAuditLogs.map((log) => (
                            <div
                                key={log.id}
                                className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{log.action}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                        Actor: {log.actor_name} ({log.actor_role})
                                    </p>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {recentAuditLogs.length === 0 && (
                            <div className="py-8 text-center text-slate-400 italic text-xs">
                                No developer audit actions recorded.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Detail Inspector Drawer */}
            <ErrorDetailDrawer
                error={selectedError}
                onClose={() => setSelectedError(null)}
                onToggleResolved={handleToggleResolved}
            />
        </SuperAdminLayout>
    );
}
