import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertOctagon,
    Filter,
    RefreshCw,
    Search,
    Shield,
} from 'lucide-react';
import React, { useState } from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface ModerationCaseRecord {
    id: number;
    case_number: string;
    target_type: 'user' | 'rider';
    target_id: number;
    reported_by?: { name: string; email: string; role: string };
    resolved_by?: { name: string; email: string; role: string };
    reason_category: string;
    title: string;
    description: string;
    evidence_notes?: string;
    status: 'open' | 'under_review' | 'resolved' | 'dismissed';
    resolution_decision?: string;
    resolution_notes?: string;
    created_at: string;
    resolved_at?: string;
}

interface ModerationCasesProps {
    cases: {
        data: ModerationCaseRecord[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: Record<string, string>;
}

export default function ModerationCases({ cases, filters }: ModerationCasesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [reasonCategory, setReasonCategory] = useState(filters.reason_category || '');

    // Modal state
    const [selectedCase, setSelectedCase] = useState<ModerationCaseRecord | null>(null);
    const [decision, setDecision] = useState('warning');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleFilterSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/super-admin/moderation-cases',
            { search, status, reason_category: reasonCategory },
            { preserveState: true }
        );
    };

    const openResolveModal = (c: ModerationCaseRecord) => {
        setSelectedCase(c);
        setDecision('warning');
        setNotes('');
        setFeedback(null);
    };

    const handleResolveCase = async () => {
        if (!selectedCase) return;
        setSubmitting(true);
        setFeedback(null);

        try {
            const res = await axios.post(`/super-admin/moderation-cases/${selectedCase.id}/resolve`, {
                decision,
                notes,
            });

            setFeedback({ type: 'success', message: res.data.message || 'Case resolved.' });
            setTimeout(() => {
                setSelectedCase(null);
                router.reload();
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = axios.isAxiosError(err)
                ? err.response?.data?.message || err.message
                : 'Failed to resolve case.';
            setFeedback({
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'open':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            case 'under_review':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'resolved':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'dismissed':
                return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Moderation Cases" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <AlertOctagon className="size-6 text-amber-500" />
                        Moderation & Fraud Investigation Cases
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Review staff-reported incidents, telemetry discrepancies, suspicious COD activity, and take decisive action.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="lg:col-span-2 relative">
                            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search case #, title, description..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            >
                                <option value="">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="under_review">Under Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="dismissed">Dismissed</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={reasonCategory}
                                onChange={(e) => setReasonCategory(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            >
                                <option value="">All Incident Types</option>
                                <option value="suspected_fraud">Suspected Fraud</option>
                                <option value="fake_delivery">Fake Delivery</option>
                                <option value="cod_abuse">COD Abuse</option>
                                <option value="customer_complaint">Customer Complaint</option>
                                <option value="unauthorized_behavior">Unauthorized Behavior</option>
                                <option value="gps_manipulation">GPS Manipulation</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20"
                            >
                                <Filter className="size-3.5" />
                                Filter Cases
                            </button>
                        </div>
                    </form>
                </div>

                {/* Cases Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-4">Case Number</th>
                                    <th className="p-4">Incident Title</th>
                                    <th className="p-4">Target Type</th>
                                    <th className="p-4">Reported By</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                                {cases.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                                            #{c.case_number}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-slate-100">{c.title}</div>
                                            <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{c.description}</div>
                                        </td>
                                        <td className="p-4 font-mono text-[11px] uppercase">
                                            {c.target_type} #{c.target_id}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">
                                            {c.reported_by?.name || 'Staff'}{' '}
                                            <span className="text-[10px] text-slate-400">({c.reported_by?.role || 'user'})</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(c.status)}`}>
                                                {c.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {c.status === 'open' || c.status === 'under_review' ? (
                                                <button
                                                    onClick={() => openResolveModal(c)}
                                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold transition shadow-xs"
                                                >
                                                    Investigate & Resolve
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    {c.resolution_decision?.toUpperCase()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {cases.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                            No moderation cases found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL: Resolve Case */}
                {selectedCase && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Shield className="size-5 text-amber-500" />
                                    Resolve Case #{selectedCase.case_number}
                                </h3>
                                <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                                    ✕
                                </button>
                            </div>

                            {feedback && (
                                <div className={`p-3 rounded-2xl text-xs font-semibold border ${
                                    feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                    {feedback.message}
                                </div>
                            )}

                            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                                <div className="font-bold text-slate-900 dark:text-slate-100">{selectedCase.title}</div>
                                <div className="text-slate-600 dark:text-slate-400">{selectedCase.description}</div>
                                {selectedCase.evidence_notes && (
                                    <div className="text-[11px] text-slate-500 font-mono pt-1">
                                        Evidence: {selectedCase.evidence_notes}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Sanction / Decision
                                    </label>
                                    <select
                                        value={decision}
                                        onChange={(e) => setDecision(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                                    >
                                        <option value="clear">Clear (No violation, restore account)</option>
                                        <option value="warning">Warning (Log formal caution)</option>
                                        <option value="restrict">Restrict (Restrict specific actions)</option>
                                        <option value="suspend">Suspend (Immediate account suspension)</option>
                                        <option value="deactivate">Deactivate (Permanent deactivation)</option>
                                        <option value="dismiss">Dismiss (Invalid report)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Resolution Notes (Audit Trail)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Enter decision rationale and evidence review summary..."
                                        rows={3}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setSelectedCase(null)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting || !notes.trim()}
                                    onClick={handleResolveCase}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 rounded-2xl text-xs font-bold text-white transition flex items-center gap-1.5"
                                >
                                    {submitting ? <RefreshCw className="size-3.5 animate-spin" /> : null}
                                    Apply Resolution
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
