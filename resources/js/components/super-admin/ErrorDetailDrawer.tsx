import { AlertTriangle, CheckCircle2, Copy, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from './SeverityBadge';

export interface ErrorRecordDetail {
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

interface ErrorDetailDrawerProps {
    error: ErrorRecordDetail | null;
    onClose: () => void;
    onToggleResolved: (errorId: number) => Promise<void>;
}

export const ErrorDetailDrawer: React.FC<ErrorDetailDrawerProps> = ({
    error,
    onClose,
    onToggleResolved,
}) => {
    const [copied, setCopied] = useState(false);
    const [isResolving, setIsResolving] = useState(false);

    if (!error) return null;

    const copyTrace = () => {
        const payload = `Exception: ${error.exception_class}\nMessage: ${error.message}\nFile: ${error.file}:${error.line}\nMethod: ${error.method} /${error.endpoint}\nOccurrences: ${error.occurrences}\n\nStack Trace:\n${error.trace}`;
        void navigator.clipboard.writeText(payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResolveClick = async () => {
        setIsResolving(true);
        try {
            await onToggleResolved(error.id);
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
            <div
                className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
            >
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                            <SeverityBadge severity={error.severity} />
                            <h2 className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 truncate">
                                {error.exception_class}
                            </h2>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                            UUID: {error.uuid} • Occurrences: x{error.occurrences}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-500"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error Message Card */}
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-300 font-mono text-xs leading-relaxed">
                        {error.message}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Source File & Line</span>
                            <p className="text-slate-800 dark:text-slate-200 break-all">{error.file}:{error.line}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">HTTP Route</span>
                            <p className="text-slate-800 dark:text-slate-200">
                                <span className="font-bold text-rose-500 mr-1.5">{error.method}</span>
                                /{error.endpoint}
                            </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">First / Last Seen</span>
                            <p className="text-slate-800 dark:text-slate-200">{new Date(error.last_seen_at).toLocaleString()}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Status</span>
                            <span className={error.is_resolved ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                                {error.is_resolved ? 'Resolved' : 'Unresolved Active'}
                            </span>
                        </div>
                    </div>

                    {/* Stack Trace Code Block */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Sanitized Stack Trace</span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={copyTrace}
                                className="h-7 text-xs rounded-xl border-slate-200 dark:border-slate-800 gap-1.5 font-bold"
                            >
                                <Copy className="size-3" />
                                {copied ? 'Copied!' : 'Copy Stack Trace'}
                            </Button>
                        </div>

                        <pre className="p-4 rounded-2xl bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-80 whitespace-pre-wrap">
                            {error.trace}
                        </pre>
                    </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold"
                    >
                        Close Inspector
                    </Button>

                    <Button
                        onClick={() => void handleResolveClick()}
                        disabled={isResolving}
                        className={`rounded-xl text-xs font-bold gap-2 shadow-md ${
                            error.is_resolved
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                    >
                        <CheckCircle2 className="size-4" />
                        {error.is_resolved ? 'Mark Unresolved' : 'Mark Exception Resolved'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
