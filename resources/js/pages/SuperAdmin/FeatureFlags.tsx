import { Head, router } from '@inertiajs/react';
import { Flag } from 'lucide-react';
import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    const [updating, setUpdating] = React.useState<number | null>(null);

    const toggleFlag = async (id: number, currentStatus: boolean) => {
        setUpdating(id);
        try {
            const res = await fetch(`/super-admin/features/${id}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ is_enabled: !currentStatus }),
            });
            const data = await res.json() as { success: boolean };
            if (data.success) {
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
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Flag className="size-6 text-amber-400" />
                        Controlled Feature Flags Matrix
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Enable or disable application feature modules dynamically with full audit logging
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flags.map((flag) => (
                        <div key={flag.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">{flag.name}</h3>
                                    <Badge className={`text-[10px] font-black uppercase ${
                                        flag.is_enabled
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                        {flag.is_enabled ? 'ENABLED' : 'DISABLED'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{flag.description}</p>
                                <p className="text-[10px] font-mono text-slate-500 mt-2">Key: {flag.key}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {flag.updated_by ? `Updated by ${flag.updated_by.name}` : 'Default State'}
                                </span>
                                <Button
                                    size="sm"
                                    onClick={() => void toggleFlag(flag.id, flag.is_enabled)}
                                    disabled={updating === flag.id}
                                    className={`h-8 px-4 text-xs font-bold rounded-xl transition-all ${
                                        flag.is_enabled
                                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    }`}
                                >
                                    {updating === flag.id ? 'Saving...' : (flag.is_enabled ? 'Disable' : 'Enable')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SuperAdminLayout>
    );
}
