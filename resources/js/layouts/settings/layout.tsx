import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { KeyRound, Palette, ShieldCheck, User, Sparkles, CheckCircle2 } from 'lucide-react';
import React, { type PropsWithChildren } from 'react';
import { Badge } from '@/components/ui/badge';
import { useCurrentUrl } from '@/hooks/use-current-url';
import AppLayout from '@/layouts/app-layout';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile Details',
        href: edit(),
        icon: User,
    },
    {
        title: 'Password Security',
        href: editPassword(),
        icon: KeyRound,
    },
    {
        title: 'Two-Factor Auth',
        href: show(),
        icon: ShieldCheck,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl } = useCurrentUrl();
    const { auth } = usePage().props;
    const user = auth?.user || { name: 'User', email: 'user@example.com' };

    const initials = user.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Settings', href: '/settings/profile' }]}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto font-['Outfit'] transition-colors duration-300">
                {/* Profile Header Hero Card */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-white/90 via-[#FFF9FA]/80 to-[#FFF0F5]/60 dark:from-[#0F0F14]/90 dark:via-[#14141E]/80 dark:to-[#181824]/70 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] p-6 sm:p-8 lg:p-10 backdrop-blur-2xl transition-colors duration-300"
                >
                    {/* Ambient Glows */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-radial from-[#FADADD]/40 via-[#F8C8DC]/15 dark:from-[#E1062C]/20 dark:via-rose-950/10 to-transparent blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 -ml-20 -mb-20 size-60 rounded-full bg-radial from-[#FFE4E1]/50 dark:from-[#E1062C]/15 to-transparent blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="size-20 sm:size-24 rounded-3xl bg-linear-to-br from-[#FADADD] via-[#F8C8DC] to-[#E75480] dark:from-[#E1062C] dark:via-rose-900 dark:to-[#181824] p-1 shadow-lg shadow-[#E75480]/20 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shrink-0">
                                    <div className="size-full rounded-[22px] bg-white/20 dark:bg-black/20 flex items-center justify-center backdrop-blur-xs">
                                        {initials}
                                    </div>
                                </div>
                                <span className="absolute bottom-0 right-0 size-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#121218]" />
                            </div>

                            {/* User Info */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E75480]/10 dark:bg-[#E1062C]/15 border border-[#E75480]/20 dark:border-[#E1062C]/30 text-[#E75480] dark:text-[#FF4F81] text-[10px] font-black uppercase tracking-wider">
                                        <Sparkles className="size-3" />
                                        Account & Preferences Center
                                    </span>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 className="size-3" /> Active Session
                                    </Badge>
                                </div>

                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                    {user.name}
                                </h1>

                                <p className="text-xs sm:text-sm font-medium text-[#7D6B6E] dark:text-[#94A3B8] font-mono">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Settings Segmented Navigation Bar & Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* Left Navigation */}
                    <aside className="lg:col-span-1">
                        <nav
                            className="flex flex-col gap-1.5 p-2 rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                            aria-label="Settings navigation"
                        >
                            {sidebarNavItems.map((item, index) => {
                                const active = isCurrentUrl(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={`${toUrl(item.href)}-${index}`}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none',
                                            active
                                                ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-md shadow-[#E75480]/20 dark:shadow-[#E1062C]/30'
                                                : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:bg-[#FFF5F7] dark:hover:bg-[#181824] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                                        )}
                                    >
                                        {Icon && <Icon className="size-4 shrink-0" />}
                                        <span>{item.title}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Right Main Content */}
                    <main className="lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="p-6 sm:p-8 rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-8"
                        >
                            {children}
                        </motion.div>
                    </main>
                </div>
            </div>
        </AppLayout>
    );
}
