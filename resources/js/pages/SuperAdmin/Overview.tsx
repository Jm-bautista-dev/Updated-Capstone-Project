import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    FileText,
    Flag,
    GitCommit,
    LayoutDashboard,
    Server,
    Shield,
    Wrench,
} from 'lucide-react';
import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    recentErrors: Array<{
        id: number;
        exception_class: string;
        message: string;
        occurrences: number;
        endpoint?: string;
        method?: string;
        last_seen_at: string;
    }>;
}

export default function Overview({ application, services, stats, recentAuditLogs, recentErrors }: OverviewProps) {
    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Developer Operations Dashboard" />

            {/* Top Banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-white">{application.name}</h1>
                        <Badge className={`uppercase text-[10px] font-black tracking-wider px-2.5 py-0.5 ${
                            application.isMaintenance
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : application.status === 'healthy'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                            {application.isMaintenance ? 'MAINTENANCE MODE' : application.status.toUpperCase()}
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                        Developer & Infrastructure Operations Console • Environment: <span className="text-rose-400 font-mono font-bold">{application.environment}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/super-admin/maintenance"
                        className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                            application.isMaintenance
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                    >
                        <Wrench className="size-4" />
                        {application.isMaintenance ? 'Maintenance Active' : 'Configure Maintenance'}
                    </Link>
                    <Link
                        href="/super-admin/system-health"
                        className="h-10 px-4 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all"
                    >
                        <Activity className="size-4" />
                        Run Diagnostics
                    </Link>
                </div>
            </div>

            {/* Quick Metrics Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                            Unresolved Errors
                            <AlertTriangle className="size-4 text-rose-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-rose-400 tabular-nums">{stats.unresolvedErrors}</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {stats.criticalErrors > 0 ? `${stats.criticalErrors} critical error alert(s)` : 'No critical active issues'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                            Feature Flags
                            <Flag className="size-4 text-amber-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-400 tabular-nums">
                            {stats.enabledFlags} / {stats.totalFlags}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Active system feature toggles</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                            Framework Info
                            <Server className="size-4 text-cyan-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-100">Laravel v{application.laravelVersion}</div>
                        <p className="text-[11px] text-slate-400 mt-1">PHP {application.phpVersion}</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                            Registered Users
                            <Shield className="size-4 text-emerald-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-400 tabular-nums">{stats.totalUsers}</div>
                        <p className="text-[11px] text-slate-400 mt-1">{stats.superAdmins} Super Admin account(s)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Services Status Grid */}
            <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Core Services & Subsystems</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(services).map(([key, service]) => (
                        <div key={key} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">{key.replace('_', ' ')}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{service.message}</p>
                            </div>
                            <Badge className={`text-[10px] font-black uppercase ${
                                service.status === 'healthy'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : service.status === 'warning'
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}>
                                {service.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>

            {/* Split Section: Errors & Audit Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Error Alerts */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-rose-400" />
                            <h3 className="text-sm font-bold text-white">Recent Active Errors</h3>
                        </div>
                        <Link href="/super-admin/errors" className="text-xs text-rose-400 font-bold hover:underline flex items-center gap-1">
                            View All ({stats.unresolvedErrors}) <ArrowUpRight className="size-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentErrors.map((err) => (
                            <div key={err.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-mono font-bold text-rose-400 truncate max-w-xs">{err.exception_class}</span>
                                    <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[9px] font-mono">
                                        x{err.occurrences}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-300 line-clamp-1">{err.message}</p>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                    <span>{err.endpoint ?? 'Internal Task'}</span>
                                    <span>{err.last_seen_at}</span>
                                </div>
                            </div>
                        ))}
                        {recentErrors.length === 0 && (
                            <p className="text-xs text-slate-500 italic text-center py-6">No unresolved application errors logged.</p>
                        )}
                    </div>
                </div>

                {/* Audit Trail Timeline */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-amber-400" />
                            <h3 className="text-sm font-bold text-white">Developer Audit Trail</h3>
                        </div>
                        <Link href="/super-admin/audit-logs" className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1">
                            View Audit Log <ArrowUpRight className="size-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentAuditLogs.map((log) => (
                            <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs font-bold text-slate-200 truncate">{log.action}</p>
                                    <p className="text-[10px] text-slate-400 font-mono truncate">Actor: {log.actor_name} ({log.actor_role})</p>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">{log.created_at}</span>
                            </div>
                        ))}
                        {recentAuditLogs.length === 0 && (
                            <p className="text-xs text-slate-500 italic text-center py-6">No developer audit actions recorded.</p>
                        )}
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
