import React from 'react';
import { Head } from '@inertiajs/react';
import { Database, ShieldCheck, HardDrive, Layers, Server } from 'lucide-react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';

interface DatabaseHealthProps {
    database: {
        connection: string;
        driver: string;
        isConnected: boolean;
        latencyMs: number;
        appliedMigrations: number;
    };
    tables: Array<{
        name: string;
        rows: number;
        size_mb: number;
    }>;
}

export default function DatabaseHealth({ database, tables }: DatabaseHealthProps) {
    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Database Health & Metrics" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Database className="size-6 text-cyan-400" />
                        Database Health & Read-Only Metrics
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Read-only inspection of connection latency, table row counts, and migration status
                    </p>
                </div>

                {/* Connection Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Database Driver</p>
                        <p className="text-lg font-black text-white font-mono">{database.driver}</p>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
                        <Badge className={database.isConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400'}>
                            {database.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                        </Badge>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Query Latency</p>
                        <p className="text-lg font-black text-cyan-400 font-mono">{database.latencyMs} ms</p>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Migrations Applied</p>
                        <p className="text-lg font-black text-amber-400 font-mono">{database.appliedMigrations}</p>
                    </div>
                </div>

                {/* Table Sizes */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-300 flex items-center justify-between">
                        <span>Database Tables Overview (Read-Only)</span>
                        <span className="text-[10px] font-mono text-slate-500">Safety Guard: Direct SQL modifications disabled</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-4">Table Name</th>
                                    <th className="p-4">Estimated Row Count</th>
                                    <th className="p-4 text-right">Disk Size (MB)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                                {tables.map((table, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 font-bold text-slate-200">{table.name}</td>
                                        <td className="p-4 text-slate-300">{table.rows.toLocaleString()} rows</td>
                                        <td className="p-4 text-right text-cyan-400 font-bold">{table.size_mb} MB</td>
                                    </tr>
                                ))}
                                {tables.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-slate-500 italic font-sans">
                                            No table statistics available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
