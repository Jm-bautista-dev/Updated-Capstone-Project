import { Head, router } from '@inertiajs/react';
import { Save, Settings } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface SystemSettingRecord {
    key: string;
    value?: string;
    group?: string;
    description?: string;
}

interface SettingsProps {
    settings: SystemSettingRecord[];
}

export default function SettingsPage({ settings: initialSettings }: SettingsProps) {
    const [settingsList, setSettingsList] = useState<SystemSettingRecord[]>(initialSettings);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

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
            const data = (await res.json()) as { success: boolean };
            if (data.success) {
                setMessage('✅ System configuration settings saved successfully.');
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
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Settings className="size-6 text-sky-500" />
                        Developer System Settings
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Central configuration parameters for application defaults, mobile version thresholds, and system names
                    </p>
                </div>

                {message && (
                    <p className="text-xs font-bold p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 shadow-xs">
                        {message}
                    </p>
                )}

                <form
                    onSubmit={(e) => void handleSave(e)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs"
                >
                    <div className="space-y-4">
                        {settingsList.map((item) => (
                            <div key={item.key} className="space-y-1 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <label className="text-xs font-bold text-slate-900 dark:text-slate-200 font-mono block">
                                    {item.key} <span className="text-slate-400 font-sans text-[10px]">({item.group})</span>
                                </label>
                                {item.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{item.description}</p>
                                )}
                                <Input
                                    value={item.value ?? ''}
                                    onChange={(e) => handleChange(item.key, e.target.value)}
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs h-9"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-rose-600/20 gap-2"
                        >
                            <Save className="size-4" />
                            {saving ? 'Saving Changes...' : 'Save System Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </SuperAdminLayout>
    );
}
