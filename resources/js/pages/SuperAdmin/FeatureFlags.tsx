import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Flag } from 'lucide-react';
import React, { useState } from 'react';
import { SystemStatusBadge } from '@/components/super-admin/SystemStatusBadge';
import { Button } from '@/components/ui/button';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface FeatureFlagRecord {
    id: number;
    key: string;
    name: string;
    description?: string;
    is_enabled: boolean;
    updated_by?: { name: string };
}

interface FeatureFlagsProps {
    flags: FeatureFlagRecord[];
}

export default function FeatureFlags({ flags }: FeatureFlagsProps) {
    const [updating, setUpdating] = useState<number | null>(null);

    const toggleFlag = async (id: number, currentStatus: boolean) => {
        setUpdating(id);
        try {
            const res = await axios.post(`/super-admin/features/${id}/toggle`, {
                is_enabled: !currentStatus,
            });
            if (res.data?.success) {
                router.reload();
            }
        } catch {
            /* handled gracefully */
        } finally {
            setUpdating(null);
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Feature Flags Matrix" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Flag className="size-6 text-amber-500" />
                        Controlled Feature Flags Matrix
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Dynamically toggle application feature modules with full developer audit logging
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flags.map((flag) => (
                        <div
                            key={flag.id}
                            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 flex flex-col justify-between shadow-xs"
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{flag.name}</h3>
                                    <SystemStatusBadge status={flag.is_enabled ? 'healthy' : 'neutral'} label={flag.is_enabled ? 'ENABLED' : 'DISABLED'} />
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{flag.description}</p>
                                <p className="text-[10px] font-mono text-slate-400 mt-2">Key: {flag.key}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {flag.updated_by ? `Updated by ${flag.updated_by.name}` : 'Default State'}
                                </span>
                                <Button
                                    size="sm"
                                    onClick={() => void toggleFlag(flag.id, flag.is_enabled)}
                                    disabled={updating === flag.id}
                                    className={`h-8 px-4 text-xs font-bold rounded-xl transition-all ${
                                        flag.is_enabled
                                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                                    }`}
                                >
                                    {updating === flag.id ? 'Saving...' : flag.is_enabled ? 'Disable Flag' : 'Enable Flag'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SuperAdminLayout>
    );
}
