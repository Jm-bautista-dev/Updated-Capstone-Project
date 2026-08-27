import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Copy, Search } from 'lucide-react';
import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ErrorRecord {
    id: number;
    uuid: string;
    exception_class: string;
    message: string;
    occurrences: number;
    severity: string;
    method?: string;
    endpoint?: string;
    file: string;
    line: number;
    trace: string;
    is_resolved: boolean;
    last_seen_at: string;
}

interface ErrorLogsProps {
    errors: {
        data: ErrorRecord[];
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
    filters: Record<string, string>;
}

export default function ErrorLogs({ errors, stats, filters }: ErrorLogsProps) {
    const [search, setSearch] = React.useState(filters.search || '');
    const [selectedError, setSelectedError] = React.useState<ErrorRecord | null>(null);
    const [copied, setCopied] = React.useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/super-admin/errors', { ...filters, search }, { preserveState: true });
    };

    const toggleResolved = async (errorId: number) => {
        try {
            const res = await fetch(`/super-admin/errors/${errorId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            const data = await res.json() as { success: boolean; is_resolved: boolean };
            if (data.success) {
                router.reload();
                if (selectedError?.id === errorId) {
                    setSelectedError({ ...selectedError, is_resolved: data.is_resolved });
                }
            }
        } catch {
            /* handled gracefully */
        }
    };

    const copyTrace = () => {
        if (!selectedError) return;
        const text = `Exception: ${selectedError.exception_class}\nMessage: ${selectedError.message}\nFile: ${selectedError.file}:${selectedError.line}\nTrace:\n${selectedError.trace}`;
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Application Error Logs" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <AlertTriangle className="size-6 text-rose-500" />
                        Application Error Logs & Grouping
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Real-time error fingerprinting, sensitive field redaction, and error resolution ledger</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            if (confirm('Clear all resolved error logs?')) {
                                await fetch('/super-admin/errors/clear-resolved', {
                                    method: 'POST',
                                    headers: {
                                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                    },
                                });
                                router.reload();
                            }
                        }}
                        className="h-9 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold"
                    >
                        Clear Resolved ({stats.resolved})
                    </Button>
                </div>
            </div>

            {/* Filter Bar & Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Logged</p>
                    <p className="text-2xl font-black text-white tabular-nums mt-0.5">{stats.total}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Unresolved</p>
                    <p className="text-2xl font-black text-rose-400 tabular-nums mt-0.5">{stats.unresolved}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Critical Alerts</p>
                    <p className="text-2xl font-black text-amber-400 tabular-nums mt-0.5">{stats.critical}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Resolved</p>
                    <p className="text-2xl font-black text-emerald-400 tabular-nums mt-0.5">{stats.resolved}</p>
                </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search exception class, message, endpoint, or file path..."
                        className="bg-slate-900 border-slate-800 text-white pl-10 h-10 text-xs rounded-xl"
                    />
                </div>
                <Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-10 px-5 rounded-xl">
                    Filter
                </Button>
            </form>

            {/* Error Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="p-4">Severity / Exception</th>
                                <th className="p-4">Message</th>
                                <th className="p-4">Endpoint</th>
                                <th className="p-4">Occurrences</th>
                                <th className="p-4">Last Seen</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs">
                            {errors.data.map((err) => (
                                <tr key={err.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-4 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-[9px] font-black uppercase px-1.5 py-0 ${
                                                err.severity === 'critical'
                                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                                    : err.severity === 'warning'
                                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}>
                                                {err.severity}
                                            </Badge>
                                            <span className="font-mono font-bold text-slate-200 truncate max-w-50">{err.exception_class}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 max-w-xs truncate text-slate-300 font-medium">
                                        {err.message}
                                    </td>
                                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                                        <span className="text-slate-500 font-bold mr-1">{err.method}</span>
                                        {err.endpoint ?? 'CLI / Task'}
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-200">
                                        x{err.occurrences}
                                    </td>
                                    <td className="p-4 text-slate-400 text-[11px]">
                                        {new Date(err.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setSelectedError(err)}
                                            className="h-8 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                        >
                                            Inspect
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {errors.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                                        No error log records match your filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Error Detail Inspector Modal */}
            <Dialog open={Boolean(selectedError)} onOpenChange={() => setSelectedError(null)}>
                {selectedError && (
                    <DialogContent className="max-w-3xl bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden rounded-3xl">
                        <DialogHeader className="p-6 pb-4 border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center justify-between">
                                <div>
                                    <DialogTitle className="text-lg font-black text-white font-mono flex items-center gap-2">
                                        <AlertTriangle className="size-5 text-rose-400" />
                                        {selectedError.exception_class}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-400 mt-1 font-mono">
                                        ID: {selectedError.uuid} • Occurrences: x{selectedError.occurrences}
                                    </DialogDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => void toggleResolved(selectedError.id)}
                                    className={selectedError.is_resolved ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold'}
                                >
                                    {selectedError.is_resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 font-mono text-xs leading-relaxed">
                                {selectedError.message}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                    <span className="text-slate-500 block text-[10px] uppercase font-bold">File & Line</span>
                                    <span className="text-slate-200">{selectedError.file}:{selectedError.line}</span>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Endpoint</span>
                                    <span className="text-slate-200">{selectedError.method} /{selectedError.endpoint}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stack Trace (Sanitized)</span>
                                    <Button size="sm" variant="outline" onClick={copyTrace} className="h-7 text-xs border-slate-800 text-slate-300 gap-1">
                                        <Copy className="size-3" /> {copied ? 'Copied!' : 'Copy Stack Trace'}
                                    </Button>
                                </div>
                                <pre className="p-4 bg-slate-950 text-slate-400 rounded-2xl border border-slate-800 text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap">
                                    {selectedError.trace}
                                </pre>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </SuperAdminLayout>
    );
}
