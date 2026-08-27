import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SettingsProps {
    settings: Array<any>;
}

export default function SettingsPage({ settings: initialSettings }: SettingsProps) {
    const [settingsList, setSettingsList] = React.useState(initialSettings);
    const [saving, setSaving] = React.useState(false);
    const [message, setMessage] = React.useState<string | null>(null);

    const handleChange = (key: string, value: string) => {
        setSettingsList((prev) =>
            prev.map((item) => (item.key === key ? { ...item, value } : item))
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/super-admin/settings/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    settings: settingsList.map((item) => ({ key: item.key, value: item.value })),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('✅ System settings saved successfully.');
                router.reload();
            }
        } catch {
            setMessage('❌ Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — System Settings" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Settings className="size-6 text-cyan-400" />
                        Developer System Settings
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Central configuration parameters for application defaults and API limits
                    </p>
                </div>

                {message && (
                    <p className="text-xs font-bold p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                        {message}
                    </p>
                )}

                <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                    <div className="space-y-4">
                        {settingsList.map((item) => (
                            <div key={item.key} className="space-y-1 p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                                <label className="text-xs font-bold text-slate-200 font-mono block">
                                    {item.key} <span className="text-slate-500 font-sans text-[10px]">({item.group})</span>
                                </label>
                                {item.description && (
                                    <p className="text-[11px] text-slate-400 mb-1">{item.description}</p>
                                )}
                                <Input
                                    value={item.value || ''}
                                    onChange={(e) => handleChange(item.key, e.target.value)}
                                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs h-9"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-rose-500/20 gap-2"
                        >
                            <Save className="size-4" />
                            {saving ? 'Saving...' : 'Save All Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </SuperAdminLayout>
    );
}
