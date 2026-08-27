import { Head } from '@inertiajs/react';
import { Terminal } from 'lucide-react';
import React from 'react';
import { SystemStatusBadge } from '@/components/super-admin/SystemStatusBadge';
import { Badge } from '@/components/ui/badge';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface Endpoint {
    path: string;
    method: string;
    name: string;
    status: string;
}

interface ApiMonitorProps {
    endpoints: Endpoint[];
    summary: {
        totalMonitored: number;
        activeEndpoints: number;
        errorCount24h: number;
    };
}

export default function ApiMonitor({ endpoints, summary }: ApiMonitorProps) {
    return (
        <SuperAdminLayout>
            <Head title="Super Admin — API Monitoring & Endpoint Performance" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Terminal className="size-6 text-sky-500" />
                        API Endpoint Telemetry & Performance
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Active tracking of mobile REST API routes, HTTP status codes, and endpoint availability
                    </p>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monitored Routes</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">{summary.totalMonitored}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active & Serving</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">{summary.activeEndpoints}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">API Errors (24h)</p>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums mt-1">{summary.errorCount24h}</p>
                    </div>
                </div>

                {/* Endpoints Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
                        Monitored API Route Registry
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-4">Method & Path</th>
                                    <th className="p-4">Endpoint Name</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                                {endpoints.map((ep, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4">
                                            <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[9px] mr-2.5 font-black">
                                                {ep.method}
                                            </Badge>
                                            <span className="text-slate-900 dark:text-slate-200">{ep.path}</span>
                                        </td>
                                        <td className="p-4 font-sans text-slate-600 dark:text-slate-300">{ep.name}</td>
                                        <td className="p-4">
                                            <SystemStatusBadge status={ep.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
