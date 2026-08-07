import { Form, Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Shield,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

// Generate fixed random positions for floating Sakura petals
const PETAL_COUNT = 12;
const generatePetals = () => {
    return Array.from({ length: PETAL_COUNT }).map((_, i) => ({
        id: i,
        left: `${(i * 8.3 + (i * 3.7) % 7)}%`,
        size: 10 + (i % 4) * 4,
        duration: 14 + (i % 5) * 3,
        delay: (i % 4) * 2,
        initialRotate: (i * 37) % 360,
        sway: 18 + (i % 3) * 12,
        opacity: 0.3 + (i % 4) * 0.12,
    }));
};

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const petals = useMemo(() => generatePetals(), []);

    return (
        <div className="min-h-screen w-full bg-[#FFFDFE] dark:bg-[#0B0B0E] flex flex-col lg:flex-row relative overflow-hidden font-['Outfit'] antialiased text-[#3D2C2E] dark:text-[#F8FAFC] selection:bg-[#E75480]/15 selection:text-[#E75480] transition-colors duration-300">
            <Head title="Confirm Password — Security Verification" />

            {/* Ambient Background Aura Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-200 max-h-200 rounded-full bg-radial from-[#FADADD]/40 via-[#F8C8DC]/15 dark:from-[#E1062C]/20 dark:via-rose-950/10 to-transparent blur-3xl" />
                <div className="absolute -bottom-[15%] right-[20%] w-[50vw] h-[50vw] max-w-175 max-h-175 rounded-full bg-radial from-[#FFE4E1]/50 via-[#FFF0F5]/20 dark:from-[#E1062C]/15 to-transparent blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.035] dark:opacity-[0.02]"
                    style={{
                        backgroundImage: `radial-gradient(#E75480 0.75px, transparent 0.75px), radial-gradient(#E75480 0.75px, transparent 0.75px)`,
                        backgroundSize: '30px 30px',
                        backgroundPosition: '0 0, 15px 15px',
                    }}
                />
            </div>

            {/* Floating Sakura Petals Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {petals.map((petal) => (
                    <motion.div
                        key={petal.id}
                        initial={{
                            y: -40,
                            x: 0,
                            rotate: petal.initialRotate,
                            opacity: 0,
                        }}
                        animate={{
                            y: ['0vh', '110vh'],
                            x: [0, petal.sway, -petal.sway, petal.sway / 2],
                            rotate: [petal.initialRotate, petal.initialRotate + 360],
                            opacity: [0, petal.opacity, petal.opacity, 0],
                        }}
                        transition={{
                            duration: petal.duration,
                            repeat: Infinity,
                            delay: petal.delay,
                            ease: 'linear',
                        }}
                        style={{
                            position: 'absolute',
                            left: petal.left,
                            width: petal.size,
                            height: petal.size * 1.3,
                            background:
                                'linear-gradient(135deg, rgba(254,205,211,0.6) 0%, rgba(244,114,182,0.4) 100%)',
                            borderRadius: '100% 0% 100% 0% / 100% 0% 100% 0%',
                            boxShadow: '0 2px 6px rgba(231,84,128,0.15)',
                        }}
                    />
                ))}
            </div>

            {/* LEFT SIDE: LUXURY SECURITY HERO SECTION */}
            <div className="w-full lg:w-[55%] min-h-100 lg:min-h-screen relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 z-10 border-b lg:border-b-0 lg:border-r border-[#F8C8DC]/30 dark:border-white/10 bg-linear-to-br from-[#FFF9FA]/80 via-[#FFF5F7]/40 to-[#FFF9FA]/90 dark:from-[#0F0F14]/90 dark:via-[#14141E]/80 dark:to-[#181824]/70 backdrop-blur-md overflow-hidden">
                {/* Top Brand & Back navigation */}
                <div className="flex items-center justify-between z-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#E75480] dark:hover:text-[#FF4F81] transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Return to Application</span>
                    </Link>

                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono">
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Secure Area</span>
                    </div>
                </div>

                {/* Hero Center Card */}
                <div className="my-auto py-12 z-10 max-w-lg space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E75480]/10 dark:bg-[#E1062C]/15 border border-[#E75480]/20 dark:border-[#E1062C]/30 text-[#E75480] dark:text-[#FF4F81] text-xs font-black uppercase tracking-wider">
                        <Shield className="size-3.5" />
                        <span>High Security Re-Authentication</span>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Confirm Your{' '}
                            <span className="bg-linear-to-r from-[#E75480] via-[#D43F6B] to-[#F472B6] dark:from-[#FF4F81] dark:via-[#E1062C] dark:to-[#F472B6] bg-clip-text text-transparent">
                                Password
                            </span>
                        </h1>
                        <p className="text-sm sm:text-base text-[#7D6B6E] dark:text-[#94A3B8] font-medium leading-relaxed">
                            This action accesses privileged system controls. Please enter your account password to verify identity before continuing.
                        </p>
                    </div>

                    {/* Security Feature Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/50 dark:border-white/10 backdrop-blur-md flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                                <Lock className="size-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">256-Bit Encrypted</h4>
                                <p className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8]">Session Protected</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/50 dark:border-white/10 backdrop-blur-md flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="size-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">Zero Storage</h4>
                                <p className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8]">Ephemeral Token</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Brand Info */}
                <div className="z-10 flex items-center justify-between text-xs text-[#9E8B8E] dark:text-[#64748B]">
                    <p>© {new Date().getFullYear()} Maki Desu Operations</p>
                    <div className="flex items-center gap-1">
                        <Sparkles className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                        <span className="font-bold">Enterprise Access Control</span>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: CONFIRM PASSWORD FORM CARD */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 lg:p-16 z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md space-y-8 p-8 sm:p-10 rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
                >
                    <div className="text-center space-y-2">
                        <div className="mx-auto size-14 rounded-3xl bg-linear-to-br from-[#FADADD]/60 via-[#F8C8DC]/30 to-[#FFF0F5] dark:from-[#E1062C]/20 dark:via-rose-950/20 dark:to-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shadow-2xs">
                            <KeyRound className="size-7" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Password Verification
                        </h2>
                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-xs mx-auto">
                            Please re-enter your password below to confirm authorization.
                        </p>
                    </div>

                    <Form {...store.form()} resetOnSuccess={['password']}>
                        {({ processing, errors }) => (
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] ml-1"
                                    >
                                        Password
                                    </Label>

                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            autoFocus
                                            className="pl-10 pr-10 h-12 rounded-2xl bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium focus:ring-2 focus:ring-[#E75480]/20 shadow-2xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>

                                    <InputError message={errors.password} />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#E75480] hover:bg-[#D43F6B] text-white shadow-lg shadow-[#E75480]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                                    disabled={processing}
                                    data-test="confirm-password-button"
                                >
                                    {processing ? <Spinner /> : <CheckCircle2 className="size-4" />}
                                    <span>{processing ? 'Verifying...' : 'Confirm Password'}</span>
                                </Button>
                            </div>
                        )}
                    </Form>
                </motion.div>
            </div>
        </div>
    );
}
