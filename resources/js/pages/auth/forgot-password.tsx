import { Form, Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <div className="min-h-screen w-full bg-[#FFFDFE] flex flex-col justify-center items-center p-6 relative overflow-hidden font-['Outfit'] antialiased selection:bg-[#E75480]/15 selection:text-[#E75480]">
            <Head title="Account Recovery — Maki Desu" />

            {/* Ambient Background Aura Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Warm Sakura Top Light */}
                <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-200 max-h-200 rounded-full bg-radial from-[#FADADD]/40 via-[#F8C8DC]/15 to-transparent blur-3xl" />
                {/* Soft Rose Bottom Glow */}
                <div className="absolute -bottom-[15%] right-[20%] w-[50vw] h-[50vw] max-w-175 max-h-175 rounded-full bg-radial from-[#FFE4E1]/50 via-[#FFF0F5]/20 to-transparent blur-3xl" />
                {/* Discreet Seigaiha / Subtle Grid Pattern overlay */}
                <div 
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: `radial-gradient(#E75480 0.75px, transparent 0.75px), radial-gradient(#E75480 0.75px, #FFFDFE 0.75px)`,
                        backgroundSize: '30px 30px',
                        backgroundPosition: '0 0, 15px 15px'
                    }}
                />
            </div>

            <motion.div 
                initial={false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative z-10 my-auto"
            >
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 rounded-2xl bg-white/80 border border-[#F8C8DC]/40 shadow-sm backdrop-blur-xl mb-3">
                        <AppLogo />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E75480]/10 border border-[#E75480]/20 text-[#E75480] text-xs font-bold tracking-wider uppercase">
                        <Sparkles className="size-3.5" />
                        <span>Account Recovery Gateway</span>
                    </div>
                </div>

                {/* Floating Glass Card */}
                <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_25px_60px_-15px_rgba(231,84,128,0.12)] rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden transition-all duration-300">
                    
                    {/* Top Decorative Accent Light */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-transparent via-[#E75480] to-transparent opacity-60" />

                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3D2C2E] tracking-tight">
                            Reset Password
                        </h1>
                        <p className="text-xs sm:text-sm text-[#7D6B6E] mt-1.5 font-medium leading-relaxed">
                            Enter your verified terminal email address to receive secure password recovery instructions.
                        </p>
                    </div>

                    <Form {...email.form()} className="space-y-6">
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label 
                                            htmlFor="email" 
                                            className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] ml-1 flex items-center justify-between"
                                        >
                                            <span>Staff Email Address</span>
                                        </Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A08E91] group-focus-within:text-[#E75480] transition-colors">
                                                <Mail className="size-4" />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                autoComplete="email"
                                                autoFocus
                                                required
                                                placeholder="identity@makidesu.com"
                                                className="h-13 pl-11 pr-4 bg-white/70 border-[#F8C8DC]/60 text-[#3D2C2E] rounded-2xl focus:ring-4 focus:ring-[#E75480]/15 focus:border-[#E75480] transition-all duration-200 placeholder:text-[#C5B8BA] font-medium text-sm shadow-xs hover:border-[#E75480]/40"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-13 bg-linear-to-r from-[#E75480] via-[#F472B6] to-[#E75480] bg-size-[200%_auto] hover:bg-right text-white rounded-2xl font-bold text-sm tracking-wide shadow-[0_12px_30px_-8px_rgba(231,84,128,0.35)] hover:shadow-[0_16px_35px_-6px_rgba(231,84,128,0.45)] hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Spinner className="text-white size-5" />
                                    ) : (
                                        <>
                                            <span>Send Recovery Link</span>
                                            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-200" />
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </Form>
                    
                    {status && (
                        <div className="mt-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
                            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}
                </div>

                {/* Back to Login Link */}
                <div className="mt-8 text-center">
                    <Link 
                        href={login()} 
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#7D6B6E] hover:text-[#E75480] transition-colors py-1 px-3 rounded-full hover:bg-white/50"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Return to login gateway</span>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
