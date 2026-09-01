import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { ErrorDetailDrawer } from '@/components/super-admin/ErrorDetailDrawer';
import type { ErrorRecordDetail } from '@/components/super-admin/ErrorDetailDrawer';
import { FilterBar } from '@/components/super-admin/FilterBar';
import { SeverityBadge } from '@/components/super-admin/SeverityBadge';
import { Button } from '@/components/ui/button';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface ErrorLogsProps {
    errors: {
        data: ErrorRecordDetail[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: {
        total: number;
        unresolved: number;
        critical: number;
        resolved: number;
    };
    filters: {
        severity?: string;
        status?: string;
        search?: string;
    };
}

export default function ErrorLogs({ errors, stats, filters }: ErrorLogsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedError, setSelectedError] = useState<ErrorRecordDetail | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/super-admin/errors', { ...filters, search }, { preserveState: true });
    };

    const toggleResolved = async (errorId: number) => {
        try {
            const res = await axios.post(`/super-admin/errors/${errorId}/resolve`);
            if (res.data?.success) {
                router.reload();
                if (selectedError?.id === errorId) {
                    setSelectedError({ ...selectedError, is_resolved: res.data.is_resolved });
                }
            }
        } catch {
            /* handled gracefully */
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Application Error Logs" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <AlertTriangle className="size-6 text-rose-600 dark:text-rose-500" />
                        Application Exceptions & Error Observability
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Real-time fingerprinting, stack trace redaction, and exception resolution ledger
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            if (confirm('Clear all resolved error logs?')) {
                                await axios.post('/super-admin/errors/clear-resolved');
                                router.reload();
                            }
                        }}
                        className="h-9 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl"
                    >
                        Clear Resolved ({stats.resolved})
                    </Button>
                </div>
            </div>

            {/* Stats Overview Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Logged</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">{stats.total}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Unresolved Active</p>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">{stats.unresolved}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Critical Alerts</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">{stats.critical}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Resolved</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">{stats.resolved}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <FilterBar
                search={search}
                onSearchChange={setSearch}
                onSubmit={handleSearch}
                placeholder="Search exception class, message, HTTP route, or file path..."
            />

            {/* Dense Developer Errors Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="p-4">Severity & Exception</th>
                                <th className="p-4">Message</th>
                                <th className="p-4">Route</th>
                                <th className="p-4">Occurrences</th>
                                <th className="p-4">Last Seen</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                            {errors.data.map((err) => (
                                <tr key={err.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="p-4 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <SeverityBadge severity={err.severity} />
                                            <span className="font-mono font-bold text-slate-900 dark:text-slate-200 truncate max-w-50">
                                                {err.exception_class}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 max-w-xs truncate text-slate-700 dark:text-slate-300 font-medium">
                                        {err.message}
                                    </td>
                                    <td className="p-4 font-mono text-slate-500 text-[11px]">
                                        <span className="text-rose-500 font-bold mr-1">{err.method}</span>
                                        {err.endpoint ? `/${err.endpoint}` : 'CLI / Task'}
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-200">
                                        x{err.occurrences}
                                    </td>
                                    <td className="p-4 text-slate-500 text-[11px]">
                                        {new Date(err.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setSelectedError(err)}
                                            className="h-8 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                                        >
                                            Inspect Trace
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {errors.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                        No error log records match your filter criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Error Detail Inspector Drawer */}
            <ErrorDetailDrawer
                error={selectedError}
                onClose={() => setSelectedError(null)}
                onToggleResolved={toggleResolved}
            />
        </SuperAdminLayout>
    );
}
