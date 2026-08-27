import { Head } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Copy,
    Download,
    Pause,
    Play,
    RefreshCw,
    ScrollText,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FilterBar } from '@/components/super-admin/FilterBar';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogEntry {
    id: string;
    timestamp: string;
    environment: string;
    level: string;
    message: string;
    context?: string | null;
    trace?: string | null;
    exception?: string | null;
    file?: string | null;
    line?: number | null;
}

interface LogStats {
    total: number;
    debug: number;
    info: number;
    notice: number;
    warning: number;
    error: number;
    critical: number;
    alert: number;
    emergency: number;
}

interface SourceStatus {
    available: boolean;
    reason: string;
    path_hint: string | null;
    source: string;
}

interface LogFile {
    filename: string;
    size: number;
    modified: number;
}

interface LogViewerProps {
    sourceStatuses: Record<string, SourceStatus>;
    logFiles: LogFile[];
    entries: LogEntry[];
    total: number;
    stats: LogStats;
    page: number;
    perPage: number;
    lastPage: number;
    filters: {
        source: string;
        filename: string | null;
        level: string;
        search: string;
        date_from: string | null;
        date_to: string | null;
    };
}

// ─── Level Badge ─────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
    EMERGENCY: 'bg-rose-700 text-white font-black border-rose-700',
    ALERT:     'bg-rose-600 text-white font-black border-rose-600',
    CRITICAL:  'bg-rose-600 text-white font-black border-rose-600',
    ERROR:     'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    WARNING:   'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    NOTICE:    'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    INFO:      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    DEBUG:     'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const LevelBadge: React.FC<{ level: string }> = ({ level }) => {
    const style = LEVEL_STYLES[level?.toUpperCase()] ?? LEVEL_STYLES.DEBUG;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider ${style}`}>
            {level}
        </span>
    );
};

const LEVELS = ['all', 'debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];

// ─── Log Detail Drawer ────────────────────────────────────────────────────────

const LogDetailDrawer: React.FC<{ entry: LogEntry | null; onClose: () => void }> = ({ entry, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (!entry) return null;

    const copyAll = () => {
        const text = [
            `Timestamp : ${entry.timestamp}`,
            `Level     : ${entry.level}`,
            `Env       : ${entry.environment}`,
            `Message   : ${entry.message}`,
            entry.exception ? `Exception : ${entry.exception}` : '',
            entry.file ? `File      : ${entry.file}:${entry.line ?? '?'}` : '',
            entry.context ? `\nContext:\n${entry.context}` : '',
            entry.trace ? `\nStack Trace:\n${entry.trace}` : '',
        ].filter(Boolean).join('\n');
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                            <LevelBadge level={entry.level} />
                            {entry.exception && (
                                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 truncate">{entry.exception}</span>
                            )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{entry.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={copyAll} className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
                            <Copy className="size-3.5" />
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={onClose} className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-500">
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Message */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 break-all">
                        {entry.message}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        {entry.environment && (
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Environment</span>
                                <p className="text-slate-800 dark:text-slate-200">{entry.environment}</p>
                            </div>
                        )}
                        {entry.file && (
                            <div className="col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Source File & Line</span>
                                <p className="text-slate-800 dark:text-slate-200 break-all">{entry.file}{entry.line ? `:${entry.line}` : ''}</p>
                            </div>
                        )}
                    </div>

                    {/* Context JSON */}
                    {entry.context && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Context JSON</span>
                            <pre className="p-4 rounded-2xl bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                                {entry.context}
                            </pre>
                        </div>
                    )}

                    {/* Stack Trace */}
                    {entry.trace && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Stack Trace</span>
                            <pre className="p-4 rounded-2xl bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-80 whitespace-pre-wrap">
                                {entry.trace}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LogViewer({
    sourceStatuses,
    logFiles,
    entries: initialEntries,
    total: initialTotal,
    stats: initialStats,
    page: initialPage,
    perPage: initialPerPage,
    lastPage: initialLastPage,
    filters,
}: LogViewerProps) {
    const [entries, setEntries]   = useState<LogEntry[]>(initialEntries);
    const [total, setTotal]       = useState(initialTotal);
    const [stats, setStats]       = useState<LogStats>(initialStats);
    const [page, setPage]         = useState(initialPage);
    const [lastPage, setLastPage] = useState(initialLastPage);
    const [perPage, setPerPage]   = useState(initialPerPage);

    const [source, setSource]     = useState(filters.source);
    const [filename, setFilename] = useState(filters.filename ?? 'laravel.log');
    const [level, setLevel]       = useState(filters.level);
    const [search, setSearch]     = useState(filters.search);
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]     = useState(filters.date_to ?? '');

    const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
    const [loading, setLoading]             = useState(false);
    const [liveMode, setLiveMode]           = useState(false);
    const [livePaused, setLivePaused]       = useState(false);
    const [latestTimestamp, setLatestTimestamp] = useState<string>('');
    const [newCount, setNewCount]           = useState(0);
    const liveRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const buildQuery = useCallback((overrides: Record<string, unknown> = {}) => {
        const q: Record<string, unknown> = {
            source,
            filename,
            level,
            search,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            per_page: perPage,
            page,
            ...overrides,
        };
        return Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== ''));
    }, [source, filename, level, search, dateFrom, dateTo, perPage, page]);

    const fetchEntries = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(buildQuery({ page: p }) as Record<string, string>);
            const res = await fetch(`/super-admin/logs/entries?${params.toString()}`);
            const data = (await res.json()) as {
                success: boolean;
                entries: LogEntry[];
                total: number;
                stats: LogStats;
                page: number;
                lastPage: number;
            };
            if (data.success) {
                setEntries(data.entries);
                setTotal(data.total);
                setStats(data.stats);
                setPage(data.page);
                setLastPage(data.lastPage);
                if (data.entries.length > 0) {
                    setLatestTimestamp(data.entries[0].timestamp);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [buildQuery]);

    const pollLive = useCallback(async () => {
        if (livePaused) return;
        try {
            const params = new URLSearchParams({ source, filename, after: latestTimestamp });
            const res = await fetch(`/super-admin/logs/live?${params.toString()}`);
            const data = (await res.json()) as { success: boolean; entries: LogEntry[]; count: number };
            if (data.success && data.count > 0) {
                setEntries(prev => [...data.entries, ...prev].slice(0, 200));
                setLatestTimestamp(data.entries[0].timestamp);
                setNewCount(n => n + data.count);
            }
        } catch { /* ignore poll errors */ }
    }, [livePaused, source, filename, latestTimestamp]);

    // Start/stop live polling
    useEffect(() => {
        if (liveMode) {
            liveRef.current = setInterval(() => void pollLive(), 5000);
        }
        return () => {
            if (liveRef.current) clearInterval(liveRef.current);
        };
    }, [liveMode, pollLive]);

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        setNewCount(0);
        void fetchEntries(1, true);
    };

    const handleSourceChange = (newSource: string) => {
        setSource(newSource);
        if (newSource === 'laravel') {
            setFilename('laravel.log');
        }
        setPage(1);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    const availableSources = Object.entries(sourceStatuses).filter(([, s]) => s.available);
    const unavailableSources = Object.entries(sourceStatuses).filter(([, s]) => !s.available);

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Developer Log Viewer" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <ScrollText className="size-6 text-rose-600 dark:text-rose-500" />
                            Developer Log Viewer
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Inspect all Laravel application activity — INFO, WARNING, ERROR, DEBUG — from your Hostinger production log files
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Live Mode Toggle */}
                        <button
                            onClick={() => {
                                if (liveMode) {
                                    setLiveMode(false);
                                    setLivePaused(false);
                                } else {
                                    setLiveMode(true);
                                    setLivePaused(false);
                                    setNewCount(0);
                                }
                            }}
                            className={`h-9 px-4 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${
                                liveMode
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-500'
                            }`}
                        >
                            <span className={`size-2 rounded-full ${liveMode ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                            {liveMode ? 'LIVE' : 'GO LIVE'}
                        </button>

                        {liveMode && (
                            <button
                                onClick={() => setLivePaused(p => !p)}
                                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
                            >
                                {livePaused ? <><Play className="size-3.5" />Resume</> : <><Pause className="size-3.5" />Pause</>}
                            </button>
                        )}

                        {newCount > 0 && (
                            <button onClick={() => { setNewCount(0); void fetchEntries(1); }} className="h-9 px-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors">
                                +{newCount} new — reload
                            </button>
                        )}

                        <a
                            href={`/super-admin/logs/download?source=${source}&filename=${filename}`}
                            className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors bg-white dark:bg-slate-900"
                        >
                            <Download className="size-4" />
                            Download
                        </a>
                    </div>
                </div>

                {/* Source Status Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Log Source Availability</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {Object.entries(sourceStatuses).map(([key, status]) => (
                            <div
                                key={key}
                                onClick={() => status.available && handleSourceChange(key)}
                                className={`p-3.5 rounded-2xl border transition-all text-xs space-y-1.5 ${
                                    status.available
                                        ? source === key
                                            ? 'border-rose-500/50 bg-rose-500/10 cursor-pointer'
                                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700'
                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 opacity-60 cursor-not-allowed'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-black uppercase tracking-widest text-[9px] text-slate-500">{key}</span>
                                    <span className={`size-2 rounded-full ${status.available ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                </div>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-snug">
                                    {status.available ? 'Available' : 'Unavailable'}
                                </p>
                            </div>
                        ))}
                    </div>
                    {unavailableSources.length > 0 && (
                        <p className="text-[11px] text-slate-500 italic">
                            Unavailable sources cannot be accessed from the current Hostinger PHP environment. This is a normal hosting limitation.
                        </p>
                    )}
                </div>

                {/* Source Selector & File Selector */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5">
                        {availableSources.map(([key]) => (
                            <button
                                key={key}
                                onClick={() => handleSourceChange(key)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    source === key
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {key === 'laravel' ? 'Laravel App' : key.charAt(0).toUpperCase() + key.slice(1)}
                            </button>
                        ))}
                    </div>

                    {source === 'laravel' && logFiles.length > 0 && (
                        <select
                            value={filename}
                            onChange={e => setFilename(e.target.value)}
                            className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500"
                        >
                            {logFiles.map(f => (
                                <option key={f.filename} value={f.filename}>
                                    {f.filename} ({formatSize(f.size)})
                                </option>
                            ))}
                        </select>
                    )}

                    <select
                        value={perPage}
                        onChange={e => { setPerPage(Number(e.target.value)); void fetchEntries(1); }}
                        className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500"
                    >
                        {[25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
                    </select>
                </div>

                {/* Level Filters */}
                <div className="flex flex-wrap gap-1.5">
                    {LEVELS.map(lvl => {
                        const count = lvl === 'all' ? stats.total : (stats[lvl as keyof LogStats] ?? 0);
                        return (
                            <button
                                key={lvl}
                                onClick={() => { setLevel(lvl); void fetchEntries(1); }}
                                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${
                                    level === lvl
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                            >
                                {lvl} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-slate-900 dark:text-white' },
                        { label: 'Info', value: stats.info + stats.debug + stats.notice, color: 'text-slate-600 dark:text-slate-400' },
                        { label: 'Warning', value: stats.warning, color: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Error', value: stats.error, color: 'text-rose-600 dark:text-rose-400' },
                        { label: 'Critical', value: stats.critical + stats.alert + stats.emergency, color: 'text-rose-700 dark:text-rose-400 font-black' },
                    ].map(s => (
                        <div key={s.label} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                            <p className={`text-xl font-black tabular-nums mt-0.5 ${s.color}`}>{s.value.toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Search & Date Filters */}
                <form onSubmit={handleApplyFilters} className="space-y-2">
                    <FilterBar
                        search={search}
                        onSearchChange={setSearch}
                        onSubmit={handleApplyFilters}
                        placeholder="Search message, exception, file, context, stack trace..."
                    >
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500 font-mono"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500 font-mono"
                        />
                    </FilterBar>
                </form>

                {/* Log Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            {total.toLocaleString()} Log Entries · {sourceStatuses[source]?.source ?? 'Application Log'}
                        </span>
                        <button
                            onClick={() => void fetchEntries(page)}
                            disabled={loading}
                            className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-3.5 w-40">Timestamp</th>
                                    <th className="p-3.5 w-24">Level</th>
                                    <th className="p-3.5">Message</th>
                                    <th className="p-3.5 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono">
                                {loading && entries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-slate-400 font-sans italic">
                                            Loading log entries…
                                        </td>
                                    </tr>
                                )}
                                {!loading && entries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-slate-400 font-sans italic">
                                            No log entries match your current filters.
                                        </td>
                                    </tr>
                                )}
                                {entries.map(entry => (
                                    <tr
                                        key={entry.id}
                                        onClick={() => setSelectedEntry(entry)}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                    >
                                        <td className="p-3.5 text-slate-500 text-[10px] whitespace-nowrap">
                                            {entry.timestamp.replace('T', ' ').split('.')[0]}
                                        </td>
                                        <td className="p-3.5">
                                            <LevelBadge level={entry.level} />
                                        </td>
                                        <td className="p-3.5 text-slate-800 dark:text-slate-200 max-w-sm truncate font-sans">
                                            {entry.exception && (
                                                <span className="text-rose-600 dark:text-rose-400 font-mono mr-2 text-[10px]">
                                                    {entry.exception}:
                                                </span>
                                            )}
                                            {entry.message}
                                        </td>
                                        <td className="p-3.5 text-right">
                                            {(entry.trace || entry.context) && (
                                                <span className="text-[9px] text-slate-400 hover:text-rose-600">→</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {lastPage > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                            <span className="text-[11px] text-slate-500 font-mono">
                                Page {page} of {lastPage}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => void fetchEntries(page - 1)}
                                    disabled={page <= 1}
                                    className="size-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                                    const p = Math.max(1, Math.min(page - 2 + i, lastPage - 4 + i));
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => void fetchEntries(p)}
                                            className={`size-8 rounded-xl border text-xs font-bold transition-all ${
                                                p === page
                                                    ? 'bg-rose-600 text-white border-rose-600'
                                                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => void fetchEntries(page + 1)}
                                    disabled={page >= lastPage}
                                    className="size-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Log Detail Drawer */}
            <LogDetailDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        </SuperAdminLayout>
    );
}
