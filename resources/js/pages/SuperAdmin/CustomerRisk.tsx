import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    CheckCircle2,
    Filter,
    RefreshCw,
    Search,
    Sliders,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface CustomerRiskRecord {
    id: number;
    name: string;
    email: string;
    mobile_number?: string;
    is_phone_verified: boolean;
    phone_verified_at?: string;
    cod_restricted: boolean;
    cod_restriction_reason?: string;
    risk_level_override?: string;
    risk_level: string;
    metrics: {
        total_orders: number;
        completed_orders: number;
        successful_cod_orders: number;
        failed_cod_orders: number;
        customer_refusals: number;
        customer_unavailable_events: number;
        invalid_address_events: number;
        customer_attributable_failures: number;
        business_rider_system_failures: number;
        active_orders_count: number;
    };
    created_at: string;
}

interface CustomerRiskProps {
    customers: {
        data: CustomerRiskRecord[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: Record<string, string>;
}

export default function CustomerRisk({ customers, filters }: CustomerRiskProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [riskLevel, setRiskLevel] = useState(filters.risk_level || '');
    const [filterType, setFilterType] = useState(filters.filter || '');

    // Override Modal
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerRiskRecord | null>(null);
    const [codRestricted, setCodRestricted] = useState(false);
    const [riskOverride, setRiskOverride] = useState('AUTO');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleFilterSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/super-admin/customer-risk',
            { search, risk_level: riskLevel, filter: filterType },
            { preserveState: true }
        );
    };

    const openOverrideModal = (c: CustomerRiskRecord) => {
        setSelectedCustomer(c);
        setCodRestricted(Boolean(c.cod_restricted));
        setRiskOverride(c.risk_level_override || 'AUTO');
        setReason('');
        setFeedback(null);
    };

    const handleSaveOverride = async () => {
        if (!selectedCustomer) return;
        setSubmitting(true);
        setFeedback(null);

        try {
            const res = await axios.post(`/super-admin/customer-risk/${selectedCustomer.id}/override`, {
                cod_restricted: codRestricted,
                risk_level_override: riskOverride,
                reason,
            });

            setFeedback({ type: 'success', message: res.data.message || 'COD status updated.' });
            setTimeout(() => {
                setSelectedCustomer(null);
                router.reload();
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = axios.isAxiosError(err)
                ? err.response?.data?.message || err.message
                : 'Failed to update COD override.';
            setFeedback({
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getRiskBadge = (r: string) => {
        switch (r) {
            case 'LOW_RISK':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'MEDIUM_RISK':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'HIGH_RISK':
                return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
            case 'RESTRICTED':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Customer COD Risk Management" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Sliders className="size-6 text-rose-600" />
                        Customer COD Trust & Risk Heuristics
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Authoritative customer delivery performance metrics, COD failure attribution, and manual override controls.
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
                                placeholder="Search customer name, email, phone..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <select
                                value={riskLevel}
                                onChange={(e) => setRiskLevel(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            >
                                <option value="">All Risk Levels</option>
                                <option value="LOW_RISK">Low Risk</option>
                                <option value="MEDIUM_RISK">Medium Risk</option>
                                <option value="HIGH_RISK">High Risk</option>
                                <option value="RESTRICTED">Restricted</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            >
                                <option value="">All Verification</option>
                                <option value="unverified_phone">Unverified Phone Only</option>
                            </select>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20"
                            >
                                <Filter className="size-3.5" />
                                Filter Risk
                            </button>
                        </div>
                    </form>
                </div>

                {/* Customers Risk Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Risk Level</th>
                                    <th className="p-4">COD Status</th>
                                    <th className="p-4">Completed / COD</th>
                                    <th className="p-4">Refusals / Issues</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                                {customers.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                {c.name}
                                                {c.is_phone_verified && (
                                                    <span className="text-emerald-500 text-[10px] font-mono font-bold">✓ Verified</span>
                                                )}
                                            </div>
                                            <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                                                {c.email} {c.mobile_number ? `• ${c.mobile_number}` : ''}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getRiskBadge(c.risk_level)}`}>
                                                {c.risk_level.replace('_', ' ')}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            {c.cod_restricted ? (
                                                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                                    <XCircle className="size-3.5" /> Restricted
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="size-3.5" /> Allowed
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                            {c.metrics.completed_orders} orders / {c.metrics.successful_cod_orders} COD
                                        </td>

                                        <td className="p-4 font-mono text-[11px]">
                                            {c.metrics.customer_refusals > 0 ? (
                                                <span className="text-rose-600 font-bold">
                                                    {c.metrics.customer_refusals} refusals
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">0 refusals</span>
                                            )}
                                            {c.metrics.failed_cod_orders > 0 && ` • ${c.metrics.failed_cod_orders} failed COD`}
                                        </td>

                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => openOverrideModal(c)}
                                                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1"
                                            >
                                                <Sliders className="size-3" />
                                                Override COD
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {customers.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                            No customers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL: Override COD */}
                {selectedCustomer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sliders className="size-5 text-rose-600" />
                                    Manual COD Override: {selectedCustomer.name}
                                </h3>
                                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600 font-bold">
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

                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={codRestricted}
                                            onChange={(e) => setCodRestricted(e.target.checked)}
                                            className="rounded-md border-slate-300 text-rose-600"
                                        />
                                        <span>Restrict Cash on Delivery (COD)</span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Manual Risk Level Override
                                    </label>
                                    <select
                                        value={riskOverride}
                                        onChange={(e) => setRiskOverride(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                                    >
                                        <option value="AUTO">Auto (System Evaluated)</option>
                                        <option value="LOW_RISK">Low Risk</option>
                                        <option value="MEDIUM_RISK">Medium Risk</option>
                                        <option value="HIGH_RISK">High Risk</option>
                                        <option value="RESTRICTED">Restricted</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Mandatory Override Reason (Audit Trail)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Explain reason for manually modifying COD status..."
                                        rows={3}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting || !reason.trim()}
                                    onClick={handleSaveOverride}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 rounded-2xl text-xs font-bold text-white transition flex items-center gap-1.5"
                                >
                                    {submitting ? <RefreshCw className="size-3.5 animate-spin" /> : null}
                                    Save Override
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
