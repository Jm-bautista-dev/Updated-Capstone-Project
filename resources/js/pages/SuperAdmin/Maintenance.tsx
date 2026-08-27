import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Wrench, ShieldAlert, CheckCircle2, Clock, Info } from 'lucide-react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    const [enabled, setEnabled] = React.useState(maintenance.isEnabled);
    const [title, setTitle] = React.useState(maintenance.title);
    const [message, setMessage] = React.useState(maintenance.message);
    const [eta, setEta] = React.useState(maintenance.estimatedRestorationTime);
    const [saving, setSaving] = React.useState(false);

    const handleSave = async (newEnabledStatus: boolean) => {
        setSaving(true);
        try {
            const res = await fetch('/super-admin/maintenance/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    enabled: newEnabledStatus,
                    title,
                    message,
                    estimated_restoration_time: eta,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setEnabled(newEnabledStatus);
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
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Wrench className="size-6 text-amber-500" />
                        Global Maintenance Mode Control
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Central Laravel maintenance controller for Web and Mobile applications
                    </p>
                </div>

                {/* Maintenance Banner Card */}
                <div className={`p-6 rounded-3xl border ${
                    enabled
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <Badge className={`uppercase text-[10px] font-black tracking-wider px-3 py-1 ${
                                    enabled ? 'bg-amber-500 text-slate-950 font-black' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}>
                                    {enabled ? 'MAINTENANCE MODE ACTIVE' : 'SYSTEM OPERATIONAL'}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-400">
                                {enabled
                                    ? 'Web users will receive a 503 Maintenance Page. Mobile clients will be notified to halt order submissions.'
                                    : 'All services, web ordering, POS, and mobile APIs are running normally.'}
                            </p>
                        </div>

                        <Button
                            onClick={() => handleSave(!enabled)}
                            disabled={saving}
                            className={`h-11 px-6 font-black text-xs rounded-2xl shadow-lg transition-all ${
                                enabled
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                            }`}
                        >
                            {enabled ? 'DISABLE MAINTENANCE MODE' : 'ENABLE MAINTENANCE MODE'}
                        </Button>
                    </div>
                </div>

                {/* Configuration Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                    <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Maintenance Notice Customization</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-1">Maintenance Title</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-1">Maintenance Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs outline-none focus:border-amber-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-1">Estimated Restoration Time</label>
                            <Input
                                value={eta}
                                onChange={(e) => setEta(e.target.value)}
                                placeholder="e.g. 30 minutes, 1 hour, 2:00 PM UTC"
                                className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={() => handleSave(enabled)}
                                disabled={saving}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs h-10 px-6 rounded-xl border border-slate-700"
                            >
                                Save Notice Configuration
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
