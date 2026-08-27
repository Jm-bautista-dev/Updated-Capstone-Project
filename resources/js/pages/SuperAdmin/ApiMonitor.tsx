import { Head } from '@inertiajs/react';
import { Terminal } from 'lucide-react';
import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';

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
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Terminal className="size-6 text-cyan-400" />
                        API Endpoint Monitoring & Performance
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Active tracking of mobile & web REST API routes, status codes, and error occurrences
                    </p>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monitored Endpoints</p>
                        <p className="text-2xl font-black text-white tabular-nums mt-1">{summary.totalMonitored}</p>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Active & Serving</p>
                        <p className="text-2xl font-black text-emerald-400 tabular-nums mt-1">{summary.activeEndpoints}</p>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">API Errors (24h)</p>
                        <p className="text-2xl font-black text-rose-400 tabular-nums mt-1">{summary.errorCount24h}</p>
                    </div>
                </div>

                {/* Endpoints Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-300">
                        Monitored API Route Registry
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-4">Method & Path</th>
                                    <th className="p-4">Endpoint Name</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                                {endpoints.map((ep, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4">
                                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[9px] mr-2 font-black">
                                                {ep.method}
                                            </Badge>
                                            <span className="text-slate-200">{ep.path}</span>
                                        </td>
                                        <td className="p-4 font-sans text-slate-300">{ep.name}</td>
                                        <td className="p-4">
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">
                                                {ep.status}
                                            </Badge>
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
