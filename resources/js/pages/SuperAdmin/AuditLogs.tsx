import { Head, router } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import React, { useState } from 'react';
import { FilterBar } from '@/components/super-admin/FilterBar';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface AuditLogRecord {
    id: number;
    action: string;
    actor_name: string;
    actor_role: string;
    target?: string;
    ip_address?: string;
    created_at: string;
}

interface AuditLogsProps {
    logs: {
        data: AuditLogRecord[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: Record<string, string>;
}

export default function AuditLogs({ logs, filters }: AuditLogsProps) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/super-admin/audit-logs', { ...filters, search }, { preserveState: true });
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Immutable Audit Logs" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <FileText className="size-6 text-amber-500" />
                        Immutable Developer Audit Logs
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Security-hardened ledger tracking all privileged Super Admin operations and system state modifications
                    </p>
                </div>

                <FilterBar
                    search={search}
                    onSearchChange={setSearch}
                    onSubmit={handleSearch}
                    placeholder="Search action, actor name, IP address, or target resource..."
                />

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Actor</th>
                                    <th className="p-4">Target Resource</th>
                                    <th className="p-4">IP Address</th>
                                    <th className="p-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs font-mono">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 font-bold text-amber-600 dark:text-amber-400">
                                            {log.action}
                                        </td>
                                        <td className="p-4 text-slate-900 dark:text-slate-200">
                                            {log.actor_name}{' '}
                                            <span className="text-slate-400 text-[10px]">({log.actor_role})</span>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">
                                            {log.target ?? '—'}
                                        </td>
                                        <td className="p-4 text-slate-500 text-[11px]">
                                            {log.ip_address ?? '127.0.0.1'}
                                        </td>
                                        <td className="p-4 text-slate-500 text-[11px]">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400 italic font-sans">
                                            No audit log entries recorded yet.
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
