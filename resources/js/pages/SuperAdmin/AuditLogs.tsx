import React from 'react';
import { Head, router } from '@inertiajs/react';
import { FileText, Search, Shield, UserCheck, Terminal } from 'lucide-react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AuditLogsProps {
    logs: {
        data: Array<any>;
        current_page: number;
        last_page: number;
        total: number;
    };
    actionTypes: Array<string>;
    filters: Record<string, any>;
}

export default function AuditLogs({ logs, actionTypes, filters }: AuditLogsProps) {
    const [search, setSearch] = React.useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/super-admin/audit-logs', { ...filters, search }, { preserveState: true });
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Immutable Audit Logs" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <FileText className="size-6 text-amber-500" />
                        Immutable Developer Audit Logs
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Security-hardened trail of all privileged Super Admin actions and system state modifications
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search action, actor, IP address, or target..."
                            className="bg-slate-900 border-slate-800 text-white pl-10 h-10 text-xs rounded-xl"
                        />
                    </div>
                    <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 px-5 rounded-xl">
                        Filter Audit Logs
                    </Button>
                </form>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Actor</th>
                                    <th className="p-4">Target</th>
                                    <th className="p-4">IP Address</th>
                                    <th className="p-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 font-bold text-amber-400">
                                            {log.action}
                                        </td>
                                        <td className="p-4 text-slate-200">
                                            {log.actor_name} <span className="text-slate-500 text-[10px]">({log.actor_role})</span>
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            {log.target || '—'}
                                        </td>
                                        <td className="p-4 text-slate-400 text-[11px]">
                                            {log.ip_address || '127.0.0.1'}
                                        </td>
                                        <td className="p-4 text-slate-400 text-[11px]">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500 italic font-sans">
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
