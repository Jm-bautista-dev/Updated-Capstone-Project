import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Wrench } from 'lucide-react';
import React, { useState } from 'react';
import { ConfirmDangerDialog } from '@/components/super-admin/ConfirmDangerDialog';
import { SystemStatusBadge } from '@/components/super-admin/SystemStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface MaintenanceProps {
    maintenance: {
        isEnabled: boolean;
        title: string;
        message: string;
        estimatedRestorationTime: string;
        lastUpdated?: string;
    };
}

export default function Maintenance({ maintenance }: MaintenanceProps) {
    const [enabled, setEnabled] = useState(maintenance.isEnabled);
    const [title, setTitle] = useState(maintenance.title);
    const [message, setMessage] = useState(maintenance.message);
    const [eta, setEta] = useState(maintenance.estimatedRestorationTime);
    const [saving, setSaving] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingState, setPendingState] = useState<boolean>(false);

    const openConfirm = (newStatus: boolean) => {
        setPendingState(newStatus);
        setIsConfirmOpen(true);
    };

    const handleSave = async (newEnabledStatus: boolean) => {
        setSaving(true);
        try {
            const res = await axios.post('/super-admin/maintenance/toggle', {
                enabled: newEnabledStatus,
                title,
                message,
                estimated_restoration_time: eta,
            });
            if (res.data?.success) {
                setEnabled(newEnabledStatus);
                setIsConfirmOpen(false);
                router.reload();
            }
        } catch {
            /* handled gracefully */
        } finally {
            setSaving(false);
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Maintenance Mode Control" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Wrench className="size-6 text-amber-500" />
                        Global Maintenance Mode Control
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        High-impact central operational switch for Web, API, and Mobile client access
                    </p>
                </div>

                {/* Maintenance Status Banner Card */}
                <div
                    className={`p-6 rounded-3xl border shadow-xs transition-all ${
                        enabled
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <SystemStatusBadge status={enabled ? 'maintenance' : 'healthy'} />
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {enabled
                                    ? 'Web users will receive a 503 Maintenance Page. Mobile clients will receive 503 HTTP notices to pause order submission.'
                                    : 'All services, web ordering, POS sync, and mobile APIs are running normally.'}
                            </p>
                        </div>

                        <Button
                            onClick={() => openConfirm(!enabled)}
                            disabled={saving}
                            className={`h-11 px-6 font-black text-xs rounded-2xl shadow-lg transition-all ${
                                enabled
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                            }`}
                        >
                            {enabled ? 'DISABLE MAINTENANCE MODE' : 'ENABLE MAINTENANCE MODE'}
                        </Button>
                    </div>
                </div>

                {/* Notice Customization Configuration */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                        Maintenance Page & API Notice Customization
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                Maintenance Title
                            </label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs h-10"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                Maintenance Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:border-amber-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                Estimated Restoration Time
                            </label>
                            <Input
                                value={eta}
                                onChange={(e) => setEta(e.target.value)}
                                placeholder="e.g. 30 minutes, 1 hour, 2:00 PM UTC"
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs h-10"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={() => void handleSave(enabled)}
                                disabled={saving}
                                className="bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs h-10 px-6 rounded-xl border border-slate-700"
                            >
                                Save Notice Configuration
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDangerDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => void handleSave(pendingState)}
                title={pendingState ? 'Activate Maintenance Mode?' : 'Deactivate Maintenance Mode?'}
                description={
                    pendingState
                        ? 'Activating maintenance mode will immediately serve 503 Service Unavailable responses to all customer web pages and mobile APIs.'
                        : 'Deactivating maintenance mode will immediately restore live customer web ordering and mobile API endpoints.'
                }
                confirmText={pendingState ? 'Enable Maintenance Now' : 'Restore Operations Now'}
                isDangerous={pendingState}
                isLoading={saving}
            />
        </SuperAdminLayout>
    );
}
