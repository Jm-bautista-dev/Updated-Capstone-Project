import { Head } from '@inertiajs/react';
import { Database } from 'lucide-react';
import React from 'react';
import { SystemStatusBadge } from '@/components/super-admin/SystemStatusBadge';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface TableRecord {
    name: string;
    rows: number;
    size_mb: number;
}

interface DatabaseHealthProps {
    database: {
        connection: string;
        driver: string;
        isConnected: boolean;
        latencyMs: number;
        appliedMigrations: number;
    };
    tables: TableRecord[];
}

export default function DatabaseHealth({ database, tables }: DatabaseHealthProps) {
    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Database Health & Metrics" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Database className="size-6 text-sky-500" />
                        Database Health & Read-Only Metrics
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Read-only inspection of connection latency, migration status, and table disk utilization
                    </p>
                </div>

                {/* Connection Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database Engine</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{database.driver}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connection State</p>
                        <div>
                            <SystemStatusBadge status={database.isConnected ? 'healthy' : 'offline'} />
                        </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Query Latency</p>
                        <p className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono">{database.latencyMs} ms</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Applied Migrations</p>
                        <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{database.appliedMigrations}</p>
                    </div>
                </div>

                {/* Table Sizes */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Database Table Disk Allocation (Read-Only)</span>
                        <span className="text-[10px] font-mono text-slate-400">Direct SQL mutations restricted</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-4">Table Name</th>
                                    <th className="p-4">Estimated Row Count</th>
                                    <th className="p-4 text-right">Disk Size (MB)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                                {tables.map((table, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 font-bold text-slate-900 dark:text-slate-200">{table.name}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{table.rows.toLocaleString()} rows</td>
                                        <td className="p-4 text-right text-sky-600 dark:text-sky-400 font-bold">{table.size_mb} MB</td>
                                    </tr>
                                ))}
                                {tables.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-12 text-center text-slate-400 italic font-sans">
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
