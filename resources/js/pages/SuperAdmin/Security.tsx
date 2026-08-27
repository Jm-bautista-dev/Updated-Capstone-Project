import { Head } from '@inertiajs/react';
import { KeyRound, Shield, UserCheck } from 'lucide-react';
import React, { useState } from 'react';
import { SystemStatusBadge } from '@/components/super-admin/SystemStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface AdminUser {
    id: number;
    name: string;
    email: string;
}

interface SecurityProps {
    superAdmins: AdminUser[];
}

export default function Security({ superAdmins }: SecurityProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            const res = await fetch('/super-admin/security/password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });
            const data = (await res.json()) as { success: boolean; message?: string };
            if (data.success) {
                setMessage('✅ Super Admin password updated successfully.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage(`❌ ${data.message ?? 'Password update failed.'}`);
            }
        } catch {
            setMessage('❌ Failed to update password.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Security Center" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Shield className="size-6 text-rose-600 dark:text-rose-500" />
                        Security Center & Credential Management
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Super Admin developer credentials, privileged accounts, and authentication controls
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Password Change Form */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                            <KeyRound className="size-4 text-amber-500" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Super Admin Password</h3>
                        </div>

                        {message && (
                            <p className="text-xs font-bold p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                                {message}
                            </p>
                        )}

                        <form onSubmit={(e) => void handlePasswordChange(e)} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Current Password</label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs h-10"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">New Password (min 8 chars)</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs h-10"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Confirm New Password</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs h-10"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={updating}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs h-10 rounded-xl shadow-lg shadow-rose-600/20"
                            >
                                {updating ? 'Updating Credentials...' : 'Update Super Admin Password'}
                            </Button>
                        </form>
                    </div>

                    {/* Authorized Super Admins */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                            <UserCheck className="size-4 text-emerald-500" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Authorized Super Admin Accounts</h3>
                        </div>

                        <div className="space-y-3">
                            {superAdmins.map((admin) => (
                                <div
                                    key={admin.id}
                                    className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-200">{admin.name}</p>
                                        <p className="text-[10px] font-mono text-slate-500">{admin.email}</p>
                                    </div>
                                    <SystemStatusBadge status="healthy" label="SUPER ADMIN" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
