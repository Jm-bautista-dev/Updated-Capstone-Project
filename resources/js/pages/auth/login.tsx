import { Form, Head, Link } from '@inertiajs/react';
import { SakuraLoader } from '@/components/sakura-loader';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { FiShield, FiArrowLeft, FiArrowRight } from 'react-icons/fi';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({
    status,
    canResetPassword,
}: Props) {
    useEffect(() => {
        // Removed heavy canvas animation for performance optimization
    }, []);

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-[#fffcfd] flex items-center justify-center p-6 font-['Outfit'] antialiased transition-colors duration-300">
            <SakuraLoader />
            <Head title="Operations Gateway | Verify Identity" />
            
            {/* Canvas removed for performance */}

            {/* Torii Gate Silhouette Backdrop - Static for performance */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 text-primary opacity-10">
                <svg 
                    width="600" height="450" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M20 40H220M40 60H200M70 60V160M170 60V160M10 20C40 30 200 30 230 20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    <path d="M70 80H170" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-12">
                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                            Maki <span className="text-primary">Desu</span>
                        </h2>
                        <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/30 mt-1">Authorized Gateway</p>
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-3xl border border-white/50 shadow-[0_32px_64px_-12px_rgba(231,84,128,0.15)] rounded-[3rem] p-10 relative overflow-hidden transition-all duration-500">
                    
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-primary/10 shadow-sm">
                             <FiShield className="size-3 text-primary" />
                             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 italic">Terminal Secured</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                        </div>
                    </div>

                    <div className="mb-10 text-center">
                        <h1 className="text-xs uppercase tracking-[0.4em] font-black text-gray-400 mb-2">Sign in to threshold</h1>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="space-y-8"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 ml-4">Terminal Identifier</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            placeholder="identity@makidesu.com"
                                            className="h-14 border-transparent bg-white/60 text-gray-900 rounded-3xl focus:ring-primary/20 focus:border-primary/20 transition-all placeholder:text-gray-300 font-medium text-sm px-6 shadow-sm ring-1 ring-primary/5"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-4">
                                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Access Sigil</Label>
                                            {canResetPassword && (
                                                <Link
                                                    href={request()}
                                                    className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                                                >
                                                    Forgotten?
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
                                            className="h-14 border-transparent bg-white/60 text-gray-900 rounded-3xl focus:ring-primary/20 focus:border-primary/20 transition-all placeholder:text-gray-300 font-medium text-sm px-6 shadow-sm ring-1 ring-primary/5"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-3 px-4">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            className="rounded-full border-primary/20 text-primary focus:ring-primary/20 size-4"
                                        />
                                        <Label htmlFor="remember" className="text-[10px] font-black text-primary/40 uppercase tracking-widest cursor-pointer">Persist authentication</Label>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl shadow-primary/20 hover:bg-gray-900 hover:-translate-y-1 transition-all duration-500 flex items-center justify-center gap-2 group"
                                    disabled={processing}
                                >
                                    {processing ? <Spinner className="text-white" /> : (
                                        <>
                                            Verify Identity
                                            <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </Form>
                    
                    {status && (
                        <div className="mt-8 text-center text-[10px] font-black text-emerald-600 uppercase tracking-widest italic animate-pulse">
                            {status}
                        </div>
                    )}
                </div>

                <div className="mt-12 text-center">
                    <Link href="/" className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/30 hover:text-primary transition-colors inline-flex items-center justify-center gap-3 group">
                        <FiArrowLeft className="group-hover:-translate-x-2 transition-transform" />
                        Back to portal
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
