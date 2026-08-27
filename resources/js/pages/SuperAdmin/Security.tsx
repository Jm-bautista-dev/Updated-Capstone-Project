import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Shield, KeyRound, UserCheck, Lock, AlertTriangle } from 'lucide-react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SecurityProps {
    superAdmins: Array<any>;
    recentSecurityLogs: Array<any>;
    securityStats: {
        totalSuperAdmins: number;
        twoFactorEnabled: boolean;
        lastPasswordChange?: string;
    };
}

export default function Security({ superAdmins, recentSecurityLogs, securityStats }: SecurityProps) {
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [updating, setUpdating] = React.useState(false);
    const [message, setMessage] = React.useState<string | null>(null);

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
            const data = await res.json();
            if (data.success) {
                setMessage('✅ Super Admin password updated successfully.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage(`❌ ${data.message}`);
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
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Shield className="size-6 text-rose-500" />
                        Security Center & Password Management
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Super Admin account credentials, privilege audit, and authentication controls
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Password Change Form */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                            <KeyRound className="size-4 text-amber-400" />
                            <h3 className="text-sm font-bold text-white">Change Super Admin Password</h3>
                        </div>

                        {message && (
                            <p className="text-xs font-bold p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                                {message}
                            </p>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">Current Password</label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">New Password (min 8 chars)</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">Confirm New Password</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={updating}
                                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black text-xs h-10 rounded-xl shadow-lg shadow-rose-500/20"
                            >
                                {updating ? 'Updating Password...' : 'Update Super Admin Password'}
                            </Button>
                        </form>
                    </div>

                    {/* Authorized Super Admins */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                            <UserCheck className="size-4 text-emerald-400" />
                            <h3 className="text-sm font-bold text-white">Authorized Super Admin Accounts</h3>
                        </div>

                        <div className="space-y-3">
                            {superAdmins.map((admin) => (
                                <div key={admin.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-200">{admin.name}</p>
                                        <p className="text-[10px] font-mono text-slate-500">{admin.email}</p>
                                    </div>
                                    <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[9px] font-black">
                                        SUPER ADMIN
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
