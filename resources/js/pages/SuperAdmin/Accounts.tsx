import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    CheckCircle2,
    Filter,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface AccountRecord {
    id: number;
    type: 'user' | 'rider';
    name: string;
    email: string;
    phone?: string;
    role: string;
    account_status: string;
    status_reason?: string;
    branch: string;
    branch_id?: number;
    is_order_restricted?: boolean;
    is_delivery_restricted?: boolean;
    active_deliveries?: number;
    created_at: string;
}

interface BranchOption {
    id: number;
    name: string;
    code: string;
}

interface AccountsProps {
    accounts: {
        data: AccountRecord[];
        current_page: number;
        last_page: number;
        total: number;
    };
    branches: BranchOption[];
    filters: Record<string, string>;
}

export default function Accounts({ accounts, branches, filters }: AccountsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [status, setStatus] = useState(filters.status || '');
    const [branchId, setBranchId] = useState(filters.branch_id || '');

    // Modal States
    const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);
    const [actionType, setActionType] = useState<'status' | 'restore' | 'delete' | null>(null);
    const [newStatus, setNewStatus] = useState('suspended');
    const [reason, setReason] = useState('');
    const [force, setForce] = useState(false);
    const [restrictNewOnly, setRestrictNewOnly] = useState(false);
    const [isOrderRestricted, setIsOrderRestricted] = useState(false);
    const [isDeliveryRestricted, setIsDeliveryRestricted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleFilterSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/super-admin/accounts',
            { search, role, status, branch_id: branchId },
            { preserveState: true }
        );
    };

    const openActionModal = (account: AccountRecord, type: 'status' | 'restore' | 'delete') => {
        setSelectedAccount(account);
        setActionType(type);
        setReason('');
        setForce(false);
        setRestrictNewOnly(false);
        setIsOrderRestricted(Boolean(account.is_order_restricted));
        setIsDeliveryRestricted(Boolean(account.is_delivery_restricted));
        setFeedback(null);

        if (type === 'status') {
            setNewStatus(account.account_status === 'active' ? 'suspended' : account.account_status);
        }
    };

    const handleExecuteAction = async () => {
        if (!selectedAccount || !actionType) return;
        setSubmitting(true);
        setFeedback(null);

        try {
            if (actionType === 'status') {
                const res = await axios.post(
                    `/super-admin/accounts/${selectedAccount.type}/${selectedAccount.id}/status`,
                    {
                        status: newStatus,
                        reason,
                        force,
                        restrict_new_only: restrictNewOnly,
                        is_order_restricted: isOrderRestricted,
                        is_delivery_restricted: isDeliveryRestricted,
                    }
                );

                if (res.data.requires_confirmation) {
                    setFeedback({
                        type: 'error',
                        message: res.data.message || 'Active deliveries detected. Check Force or Restrict New Only.',
                    });
                    setSubmitting(false);
                    return;
                }

                setFeedback({ type: 'success', message: res.data.message || 'Status updated successfully.' });
            } else if (actionType === 'restore') {
                const res = await axios.post(
                    `/super-admin/accounts/${selectedAccount.type}/${selectedAccount.id}/restore`,
                    { reason: reason || 'Restored by Super Admin' }
                );
                setFeedback({ type: 'success', message: res.data.message || 'Account restored.' });
            } else if (actionType === 'delete') {
                const res = await axios.delete(
                    `/super-admin/accounts/${selectedAccount.type}/${selectedAccount.id}`,
                    { data: { reason } }
                );
                setFeedback({ type: 'success', message: res.data.message || 'Operation complete.' });
            }

            setTimeout(() => {
                setActionType(null);
                setSelectedAccount(null);
                router.reload();
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = axios.isAxiosError(err)
                ? err.response?.data?.message || err.message
                : 'Action failed. Please check parameters.';
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
            case 'active':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'under_review':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'restricted':
                return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
            case 'suspended':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            case 'deactivated':
                return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getRoleBadge = (r: string) => {
        switch (r) {
            case 'super_admin':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            case 'admin':
                return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
            case 'rider':
                return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
            case 'cashier':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            default:
                return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Account Governance" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Users className="size-6 text-rose-600" />
                            Account Governance & Moderation
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Authoritative control center for investigating, restricting, suspending, and moderating accounts across MAKI DESU.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        {/* Search Input */}
                        <div className="lg:col-span-2 relative">
                            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name, email, or mobile..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        {/* Role Select */}
                        <div>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            >
                                <option value="">All Roles</option>
                                <option value="customer">Customer</option>
                                <option value="rider">Rider</option>
                                <option value="cashier">Cashier</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        {/* Status Select */}
                        <div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="under_review">Under Review</option>
                                <option value="restricted">Restricted</option>
                                <option value="suspended">Suspended</option>
                                <option value="deactivated">Deactivated</option>
                            </select>
                        </div>

                        {/* Branch Select */}
                        <div>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-rose-600 text-slate-900 dark:text-slate-100"
                            >
                                <option value="">All Branches</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20"
                            >
                                <Filter className="size-3.5" />
                                Filter
                            </button>
                        </div>
                    </form>
                </div>

                {/* Accounts Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-4">Account</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Branch</th>
                                    <th className="p-4">Created</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                                {accounts.data.map((acc) => (
                                    <tr key={`${acc.type}-${acc.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        {/* Name & Contact */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                {acc.name}
                                                {acc.active_deliveries ? (
                                                    <span className="bg-amber-500/10 text-amber-600 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold">
                                                        {acc.active_deliveries} active delivery
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                                                {acc.email} {acc.phone ? `• ${acc.phone}` : ''}
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getRoleBadge(acc.role)}`}>
                                                {acc.role}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(acc.account_status)}`}>
                                                {acc.account_status.replace('_', ' ')}
                                            </span>
                                            {acc.status_reason && (
                                                <p className="text-[10px] text-slate-400 italic mt-1 truncate max-w-xs">
                                                    &quot;{acc.status_reason}&quot;
                                                </p>
                                            )}
                                        </td>

                                        {/* Branch */}
                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-semibold">
                                            {acc.branch}
                                        </td>

                                        {/* Created */}
                                        <td className="p-4 text-slate-400 text-[11px] font-mono">
                                            {new Date(acc.created_at).toLocaleDateString()}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right space-x-1.5">
                                            {acc.account_status === 'suspended' || acc.account_status === 'deactivated' ? (
                                                <button
                                                    onClick={() => openActionModal(acc, 'restore')}
                                                    className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1"
                                                >
                                                    <UserCheck className="size-3" />
                                                    Restore
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => openActionModal(acc, 'status')}
                                                    className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1"
                                                >
                                                    <Shield className="size-3" />
                                                    Moderate
                                                </button>
                                            )}

                                            <button
                                                onClick={() => openActionModal(acc, 'delete')}
                                                className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1"
                                            >
                                                <Trash2 className="size-3" />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {accounts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                            No accounts matched the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL: Moderate / Restore / Delete */}
                {actionType && selectedAccount && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    {actionType === 'status' && <Shield className="size-5 text-amber-500" />}
                                    {actionType === 'restore' && <CheckCircle2 className="size-5 text-emerald-500" />}
                                    {actionType === 'delete' && <AlertTriangle className="size-5 text-rose-500" />}
                                    {actionType === 'status' && `Moderate: ${selectedAccount.name}`}
                                    {actionType === 'restore' && `Restore Account: ${selectedAccount.name}`}
                                    {actionType === 'delete' && `Safe Delete: ${selectedAccount.name}`}
                                </h3>
                                <button
                                    onClick={() => setActionType(null)}
                                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            {feedback && (
                                <div
                                    className={`p-3 rounded-2xl text-xs font-semibold border ${
                                        feedback.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                >
                                    {feedback.message}
                                </div>
                            )}

                            {actionType === 'status' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Target Status
                                        </label>
                                        <select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                                        >
                                            <option value="under_review">Under Review (Flagged for investigation)</option>
                                            <option value="restricted">Restricted (Block specific capabilities)</option>
                                            <option value="suspended">Suspended (Block login & operations)</option>
                                            <option value="deactivated">Deactivated (Preserve records, block access)</option>
                                        </select>
                                    </div>

                                    {selectedAccount.type === 'rider' && (
                                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={restrictNewOnly}
                                                    onChange={(e) => setRestrictNewOnly(e.target.checked)}
                                                    className="rounded-md border-slate-300 text-rose-600"
                                                />
                                                <span>Restrict New Deliveries Only (Allow in-flight deliveries to finish)</span>
                                            </label>

                                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={force}
                                                    onChange={(e) => setForce(e.target.checked)}
                                                    className="rounded-md border-slate-300 text-rose-600"
                                                />
                                                <span>Force Status Change (Override active delivery warnings)</span>
                                            </label>
                                        </div>
                                    )}

                                    {selectedAccount.type === 'user' && selectedAccount.role === 'customer' && (
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={isOrderRestricted}
                                                    onChange={(e) => setIsOrderRestricted(e.target.checked)}
                                                    className="rounded-md border-slate-300 text-rose-600"
                                                />
                                                <span>Block New Orders (Leave login active)</span>
                                            </label>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Mandatory Reason (Audit Log)
                                        </label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Explain why this administrative action is being applied..."
                                            rows={3}
                                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                </div>
                            )}

                            {actionType === 'restore' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        This will restore <strong>{selectedAccount.name}</strong> to <strong>ACTIVE</strong> status and re-enable login and platform privileges.
                                    </p>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Restoration Notes (Optional)
                                        </label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Optional explanation for restoration..."
                                            rows={3}
                                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                </div>
                            )}

                            {actionType === 'delete' && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-700 dark:text-amber-400">
                                        <strong>Zero-Data-Loss Protection:</strong> If this account has historical orders, deliveries, or payments, it will be safely <strong>deactivated</strong> instead of deleted to protect business records.
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Deletion Reason
                                        </label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Mandatory reason for deletion / deactivation..."
                                            rows={3}
                                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setActionType(null)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting || (actionType !== 'restore' && !reason.trim())}
                                    onClick={handleExecuteAction}
                                    className={`px-5 py-2 rounded-2xl text-xs font-bold text-white transition flex items-center gap-1.5 ${
                                        actionType === 'delete'
                                            ? 'bg-rose-600 hover:bg-rose-700'
                                            : actionType === 'restore'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-amber-600 hover:bg-amber-700'
                                    }`}
                                >
                                    {submitting ? <RefreshCw className="size-3.5 animate-spin" /> : null}
                                    Confirm Action
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
