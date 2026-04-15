import { Form, Head, Link, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { motion } from 'framer-motion';
import { FiShield, FiArrowLeft } from 'react-icons/fi';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({
    status,
    canResetPassword,
}: Props) {
    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 font-['Outfit'] antialiased transition-colors duration-300">
            <Head title="Operations Gateway Login" />
            
            {/* Sakura-style radial pulses (Design System Consistency) */}
            <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-rose-500/[0.03] dark:bg-rose-500/[0.08] blur-[100px] rounded-full pointer-events-none animate-pulse duration-[10000ms]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-500/[0.02] dark:bg-rose-500/[0.06] blur-[100px] rounded-full pointer-events-none animate-pulse duration-[8000ms]" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-[3px] h-10 bg-rose-600 dark:bg-rose-500 rounded-full" />
                        <div>
                             <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white leading-none">
                                Maki <span className="text-rose-600 dark:text-rose-500">Desu</span>
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 mt-1">Operations Gateway</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-gray-100 dark:border-gray-700 shadow-2xl shadow-rose-900/5 rounded-[2.5rem] p-10 overflow-hidden relative group transition-colors duration-300">
                    
                    {/* Access Badge & Status */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                             <FiShield className="size-3 text-rose-600 dark:text-rose-500" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 italic">Security Level: Managed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest font-bold">Server L-Online</span>
                        </div>
                    </div>

                    <div className="mb-8 font-black">
                        <h1 className="text-sm uppercase tracking-[0.2em] text-gray-900 dark:text-white mb-2 italic">Sign in to continue</h1>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] font-bold">
                             Restricted Access • Staff & Admin Credentials Required
                        </p>
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Email Terminal ID</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            placeholder="staff@makidesu.com"
                                            className="h-12 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 font-medium text-sm"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Access Key</Label>
                                            {canResetPassword && (
                                                <Link
                                                    href={request()}
                                                    className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                                                >
                                                    Recover Key?
                                                </Link>
                                            )}
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className="h-12 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 font-medium text-sm"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-3 ml-1">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            className="rounded-lg border-gray-300 dark:border-gray-700 text-rose-600 dark:text-rose-500 focus:ring-rose-500/20"
                                        />
                                        <Label htmlFor="remember" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer">Stay Authenticated</Label>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-gray-900 dark:bg-rose-600 text-white dark:text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-gray-200 dark:shadow-none hover:bg-rose-600 dark:hover:bg-rose-700 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                                    disabled={processing}
                                >
                                    {processing ? <Spinner className="text-white" /> : "Verify Identity"}
                                </Button>
                            </>
                        )}
                    </Form>
                    
                    {status && (
                        <div className="mt-6 text-center text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest italic">
                            {status}
                        </div>
                    )}
                </div>

                <div className="mt-10 text-center">
                    <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors inline-flex items-center justify-center gap-2 group">
                        <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        Back to system portal
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
