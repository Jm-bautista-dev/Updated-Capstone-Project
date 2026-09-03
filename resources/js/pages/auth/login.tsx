import { Form, Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    ShieldCheck, 
    Sparkles,
    CheckCircle2,
    Globe,
    ArrowLeft
} from 'lucide-react';
import { useState, useMemo } from 'react';

import AppLogo from '@/components/app-logo';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

// Generate fixed random positions for floating Sakura petals to avoid SSR re-render mismatches
const PETAL_COUNT = 16;
const generatePetals = () => {
    return Array.from({ length: PETAL_COUNT }).map((_, i) => ({
        id: i,
        left: `${(i * 6.25 + (i * 3.7) % 7)}%`,
        size: 10 + (i % 4) * 4, // 10px to 22px
        duration: 12 + (i % 6) * 3, // 12s to 27s
        delay: (i % 5) * 1.8,
        initialRotate: (i * 37) % 360,
        sway: 20 + (i % 3) * 15,
        opacity: 0.35 + (i % 4) * 0.15,
    }));
};

export default function Login({ status, canResetPassword }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const petals = useMemo(() => generatePetals(), []);

    return (
        <div className="min-h-screen w-full bg-[#FFFDFE] flex flex-col lg:flex-row relative overflow-hidden font-['Outfit'] antialiased selection:bg-[#E75480]/15 selection:text-[#E75480]">
            <Head title="Welcome Back — Maki Desu" />

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

            {/* ========================================================= */}
            {/* LEFT SIDE: 60% ANIMATED LUXURY VISUAL HERO SECTION         */}
            {/* ========================================================= */}
            <div className="w-full lg:w-[60%] min-h-105 lg:min-h-screen relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 z-10 border-b lg:border-b-0 lg:border-r border-[#F8C8DC]/30 bg-linear-to-br from-[#FFF9FA]/80 via-[#FFF5F7]/40 to-[#FFF9FA]/90 backdrop-blur-md overflow-hidden">
                
                {/* Floating Sakura Petals Animation */}
                {!prefersReducedMotion && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                        {petals.map((petal) => (
                            <motion.div
                                key={petal.id}
                                initial={{
                                    y: -40,
                                    x: 0,
                                    rotate: petal.initialRotate,
                                    opacity: 0
                                }}
                                animate={{
                                    y: ['0vh', '110vh'],
                                    x: [0, petal.sway, -petal.sway, petal.sway / 2],
                                    rotate: [petal.initialRotate, petal.initialRotate + 360],
                                    opacity: [0, petal.opacity, petal.opacity, 0]
                                }}
                                transition={{
                                    duration: petal.duration,
                                    repeat: Infinity,
                                    delay: petal.delay,
                                    ease: "linear"
                                }}
                                style={{
                                    position: 'absolute',
                                    left: petal.left,
                                    width: petal.size,
                                    height: petal.size,
                                }}
                            >
                                {/* SVG Sakura Petal Shape */}
                                <svg viewBox="0 0 30 30" fill="none" className="w-full h-full text-[#E75480]/30 drop-shadow-sm">
                                    <path 
                                        d="M15 0C15 0 20 8 20 15C20 22 15 30 15 30C15 30 10 22 10 15C10 8 15 0 15 0Z" 
                                        fill="currentColor"
                                        transform="rotate(25 15 15)"
                                    />
                                </svg>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Top Header & Brand Pill */}
                <motion.div 
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between z-10 relative"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-white/80 border border-[#F8C8DC]/40 shadow-sm backdrop-blur-xl">
                            <AppLogo />
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-[#F8C8DC]/40 shadow-sm backdrop-blur-md">
                        <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E75480] opacity-75" />
                            <span className="relative inline-flex rounded-full size-2 bg-[#E75480]" />
                        </span>
                        <span className="text-[11px] font-semibold text-[#5D4A4D]/80 tracking-wide uppercase">
                            Operational System • 99.9%
                        </span>
                    </div>
                </motion.div>

                {/* Center Minimalist Art & Typography */}
                <div className="my-auto py-12 lg:py-0 relative z-10 max-w-xl">
                    
                    {/* Subtle Kanji Watermark */}
                    <div className="absolute -top-16 -left-8 text-[140px] font-serif select-none pointer-events-none text-[#E75480]/[0.035] leading-none tracking-tighter">
                        調和
                    </div>

                    {/* Animated Mount Fuji & Sun Minimalist Art */}
                    <motion.div 
                        initial={false}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-8 relative w-48 h-24"
                    >
                        {/* Sun Circle */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 size-16 rounded-full bg-linear-to-b from-[#E75480]/20 to-[#FADADD]/10 backdrop-blur-sm border border-[#E75480]/15" />
                        
                        {/* Fuji Lineart SVG */}
                        <svg viewBox="0 0 200 100" fill="none" className="absolute bottom-0 w-full h-auto text-[#E75480]/40">
                            {/* Snow Cap Silhouette */}
                            <path d="M100 20 L125 55 L75 55 Z" fill="#FFFFFF" opacity="0.9" />
                            <path d="M100 20 L120 50 L108 45 L100 52 L92 45 L80 50 Z" fill="#FADADD" opacity="0.6" />
                            {/* Mountain Outline */}
                            <path d="M20 90 L85 40 L100 20 L115 40 L180 90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 90 H195" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                            <circle cx="100" cy="20" r="2" fill="currentColor" />
                        </svg>
                    </motion.div>

                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E75480]/10 border border-[#E75480]/20 text-[#E75480] text-xs font-semibold tracking-wider uppercase mb-4">
                            <Sparkles className="size-3.5" />
                            <span>Precision & Harmony</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#3D2C2E] tracking-tight leading-[1.15] mb-4">
                            Elevate your enterprise <br className="hidden sm:inline" />
                            <span className="bg-linear-to-r from-[#E75480] via-[#D43F6B] to-[#F472B6] bg-clip-text text-transparent">
                                with quiet luxury.
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg text-[#7D6B6E] font-normal leading-relaxed max-w-md">
                            Seamless operational intelligence engineered for modern high-performance Japanese gastronomy management.
                        </p>
                    </motion.div>

                    {/* Floating Glass Feature Cards */}
                    <motion.div 
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="grid grid-cols-2 gap-4 mt-8 max-w-md"
                    >
                        <div className="p-4 rounded-2xl bg-white/60 border border-white/80 shadow-[0_10px_25px_-5px_rgba(231,84,128,0.06)] backdrop-blur-xl hover:bg-white/80 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="p-2 rounded-xl bg-[#FADADD]/40 text-[#E75480] group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="size-4" />
                                </div>
                                <span className="text-xs font-bold text-[#3D2C2E] uppercase tracking-wider">Security</span>
                            </div>
                            <p className="text-xs text-[#7D6B6E] font-medium">Enterprise encryption & RBAC controls.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/60 border border-white/80 shadow-[0_10px_25px_-5px_rgba(231,84,128,0.06)] backdrop-blur-xl hover:bg-white/80 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="p-2 rounded-xl bg-[#FADADD]/40 text-[#E75480] group-hover:scale-110 transition-transform">
                                    <Globe className="size-4" />
                                </div>
                                <span className="text-xs font-bold text-[#3D2C2E] uppercase tracking-wider">Live Sync</span>
                            </div>
                            <p className="text-xs text-[#7D6B6E] font-medium">Real-time multi-terminal state management.</p>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Footer Quote */}
                <motion.div 
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="z-10 relative flex items-center justify-between text-xs text-[#9E8B8E] border-t border-[#F8C8DC]/30 pt-6"
                >
                    <span>© {new Date().getFullYear()} Maki Desu Inc. All rights reserved.</span>
                    <span className="font-serif italic text-[#E75480]/60">美しさと機能性</span>
                </motion.div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT SIDE: 40% FORM SECTION WITH MODERN FLOATING GLASS CARD */}
            {/* ========================================================= */}
            <div className="w-full lg:w-[40%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 z-10 relative my-auto min-h-137.5">
                
                <motion.div 
                    initial={false}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md"
                >
                    {/* Main Floating Glass Card */}
                    <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_25px_60px_-15px_rgba(231,84,128,0.12)] rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden transition-all duration-300">
                        
                        {/* Decorative Top Accent Light */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-transparent via-[#E75480] to-transparent opacity-60" />

                        {/* Title Header */}
                        <div className="mb-8 text-center sm:text-left">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3D2C2E] tracking-tight">
                                Welcome Back
                            </h2>
                            <p className="text-sm text-[#7D6B6E] mt-1.5 font-medium">
                                Sign in to continue your journey.
                            </p>
                        </div>

                        {/* Preserved Inertia Form */}
                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-5">
                                        
                                        {/* Email Input */}
                                        <div className="space-y-2">
                                            <Label 
                                                htmlFor="email" 
                                                className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] ml-1 flex items-center justify-between"
                                            >
                                                <span>Email Address</span>
                                            </Label>

                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A08E91] group-focus-within:text-[#E75480] transition-colors">
                                                    <Mail className="size-4" />
                                                </div>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    autoComplete="email"
                                                    placeholder="identity@makidesu.com"
                                                    className="h-13 pl-11 pr-4 bg-white/70 border-[#F8C8DC]/60 text-[#3D2C2E] rounded-2xl focus:ring-4 focus:ring-[#E75480]/15 focus:border-[#E75480] transition-all duration-200 placeholder:text-[#C5B8BA] font-medium text-sm shadow-xs hover:border-[#E75480]/40"
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        {/* Password Input */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <Label 
                                                    htmlFor="password" 
                                                    className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D]"
                                                >
                                                    Password
                                                </Label>
                                                {canResetPassword && (
                                                    <Link
                                                        href={request()}
                                                        className="text-xs font-semibold text-[#E75480] hover:text-[#D43F6B] hover:underline transition-all"
                                                    >
                                                        Forgot password?
                                                    </Link>
                                                )}
                                            </div>

                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A08E91] group-focus-within:text-[#E75480] transition-colors">
                                                    <Lock className="size-4" />
                                                </div>
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    required
                                                    autoComplete="current-password"
                                                    placeholder="••••••••••••"
                                                    className="h-13 pl-11 pr-11 bg-white/70 border-[#F8C8DC]/60 text-[#3D2C2E] rounded-2xl focus:ring-4 focus:ring-[#E75480]/15 focus:border-[#E75480] transition-all duration-200 placeholder:text-[#C5B8BA] font-medium text-sm shadow-xs hover:border-[#E75480]/40"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#A08E91] hover:text-[#E75480] transition-colors cursor-pointer"
                                                    tabIndex={-1}
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password} />
                                        </div>

                                        {/* Remember Me Checkbox */}
                                        <div className="flex items-center space-x-3 pt-1 pl-1">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                className="rounded-lg border-[#F8C8DC] text-[#E75480] data-[state=checked]:bg-[#E75480] data-[state=checked]:border-[#E75480] focus:ring-2 focus:ring-[#E75480]/30 size-4.5 transition-all cursor-pointer"
                                            />
                                            <Label 
                                                htmlFor="remember" 
                                                className="text-xs font-semibold text-[#5D4A4D] cursor-pointer select-none"
                                            >
                                                Keep me signed in on this device
                                            </Label>
                                        </div>
                                    </div>

                                    {/* Apple-Inspired Premium CTA Button */}
                                    <div className="pt-2">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full h-13 bg-linear-to-r from-[#E75480] via-[#F472B6] to-[#E75480] bg-size-[200%_auto] hover:bg-right text-white rounded-2xl font-bold text-sm tracking-wide shadow-[0_12px_30px_-8px_rgba(231,84,128,0.35)] hover:shadow-[0_16px_35px_-6px_rgba(231,84,128,0.45)] hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                                        >
                                            {processing ? (
                                                <Spinner className="text-white size-5" />
                                            ) : (
                                                <>
                                                    <span>Sign In</span>
                                                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-200" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>

                        {/* Status Message Alert */}
                        {status && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center gap-2.5 text-xs font-semibold text-emerald-800"
                            >
                                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                <span>{status}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Back Link */}
                    <div className="mt-8 text-center">
                        <Link 
                            href="/" 
                            className="inline-flex items-center gap-2 text-xs font-semibold text-[#7D6B6E] hover:text-[#E75480] transition-colors py-1 px-3 rounded-full hover:bg-white/50"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Return to public website</span>
                        </Link>
                    </div>

                </motion.div>
            </div>
        </div>
    );
}
