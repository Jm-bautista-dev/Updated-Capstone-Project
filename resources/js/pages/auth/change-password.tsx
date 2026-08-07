import { Head, useForm } from '@inertiajs/react';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function ChangePassword() {
    const [showPassword, setShowPassword] = useState(false);
    
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/change-password');
    };

    const passwordRequirements = [
        { label: 'Minimum 8 characters', met: data.password.length >= 8 },
        { label: 'At least one letter', met: /[a-zA-Z]/.test(data.password) },
        { label: 'At least one number', met: /[0-9]/.test(data.password) },
        { label: 'Passwords match', met: data.password !== '' && data.password === data.password_confirmation },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
            <Head title="Security Update Required" />

            <div className="w-full max-w-[440px] animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4 text-primary shadow-inner">
                        <ShieldCheck className="size-8" />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-foreground dark:text-white uppercase">Security Update</h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">Mandatory Password Change</p>
                </div>

                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900 ring-1 ring-black/[0.03] dark:ring-white/[0.03]">
                    <CardHeader className="pt-10 px-10 pb-6 text-center border-b border-slate-50 dark:border-zinc-800/50">
                        <CardTitle className="text-xl font-bold tracking-tight">Protect Your Account</CardTitle>
                        <CardDescription className="text-sm font-medium leading-relaxed max-w-[280px] mx-auto mt-2">
                            For security, you must change your temporary password before continuing to the dashboard.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Secure Password</label>
                                <div className="relative group">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••••••"
                                        className={cn(
                                            "h-14 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-none transition-all focus:bg-white dark:focus:bg-zinc-800 ring-offset-background font-bold text-lg px-6 group-hover:bg-slate-100 dark:group-hover:bg-zinc-800",
                                            errors.password && "ring-2 ring-destructive"
                                        )}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2"
                                    >
                                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-destructive font-bold ml-1">{errors.password}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••••••"
                                        className={cn(
                                            "h-14 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-none transition-all focus:bg-white dark:focus:bg-zinc-800 font-bold text-lg px-6",
                                            errors.password_confirmation && "ring-2 ring-destructive"
                                        )}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        <Lock className="size-4 text-muted-foreground opacity-30" />
                                    </div>
                                </div>
                                {errors.password_confirmation && <p className="text-xs text-destructive font-bold ml-1">{errors.password_confirmation}</p>}
                            </div>

                            {/* Requirements Checklist */}
                            <div className="grid grid-cols-1 gap-2 pt-2 px-1">
                                {passwordRequirements.map((req, i) => (
                                    <div key={i} className={cn(
                                        "flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                                        req.met ? "text-emerald-500" : "text-slate-400 dark:text-zinc-600"
                                    )}>
                                        <div className={cn(
                                            "size-4 rounded-full flex items-center justify-center transition-all",
                                            req.met ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20" : "bg-slate-200 dark:bg-zinc-800 text-transparent"
                                        )}>
                                            <CheckCircle2 className="size-2.5" strokeWidth={4} />
                                        </div>
                                        {req.label}
                                    </div>
                                ))}
                            </div>

                            <Button
                                className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                                disabled={processing || !passwordRequirements.every(r => r.met)}
                            >
                                {processing ? 'Encrypting...' : 'Update & Continue'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                    Maki POS Enterprise Security System
                </p>
            </div>
        </div>
    );
}
