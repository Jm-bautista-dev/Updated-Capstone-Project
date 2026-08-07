import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface DashboardHeroProps {
    range: number;
    isLoading: boolean;
    lastSync: string;
    onRangeChange: (value: string) => void;
}

export function DashboardHero({
    range,
    isLoading,
    lastSync,
    onRangeChange,
}: DashboardHeroProps) {
    const formattedDate = useMemo(() => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-white/90 via-[#FFF9FA]/80 to-[#FFF0F5]/60 dark:from-[#0F0F14]/90 dark:via-[#14141E]/80 dark:to-[#181824]/70 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] p-6 sm:p-8 lg:p-10 backdrop-blur-2xl transition-colors duration-300"
        >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-radial from-[#FADADD]/40 via-[#F8C8DC]/15 dark:from-[#E1062C]/20 dark:via-rose-950/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -ml-20 -mb-20 size-60 rounded-full bg-radial from-[#FFE4E1]/50 dark:from-[#E1062C]/15 to-transparent blur-3xl pointer-events-none" />

            {/* Top Bar: Date & System Status */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3 text-xs font-semibold text-[#7D6B6E] dark:text-[#94A3B8]">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-[#F8C8DC]/40 dark:border-white/10 shadow-xs backdrop-blur-md">
                        <Calendar className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                        <span>{formattedDate}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-[#F8C8DC]/40 dark:border-white/10 shadow-xs backdrop-blur-md">
                        <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                        </span>
                        <span className="text-[11px] font-bold text-[#3D2C2E] dark:text-[#F8FAFC] uppercase tracking-wider">
                            System Healthy
                        </span>
                        <span className="text-[10px] text-[#A08E91] dark:text-[#64748B] font-mono border-l border-[#F8C8DC]/40 dark:border-white/10 pl-2 ml-1">
                            {lastSync}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Header & Subtitle */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E75480]/10 dark:bg-[#E1062C]/15 border border-[#E75480]/20 dark:border-[#E1062C]/30 text-[#E75480] dark:text-[#FF4F81] text-xs font-bold tracking-wider uppercase">
                        <Sparkles className="size-3.5" />
                        <span>Decision Intelligence</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight leading-tight">
                        Executive Analytics{' '}
                        <span className="bg-linear-to-r from-[#E75480] via-[#D43F6B] to-[#F472B6] dark:from-[#FF4F81] dark:via-[#E1062C] dark:to-[#F472B6] bg-clip-text text-transparent">
                            Command Hub
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-xl">
                        Manage your enterprise operations, demand projections, and live multi-branch metrics with confidence.
                    </p>
                </div>

                {/* Period Selector */}
                <div className="flex items-center gap-3">
                    <Select disabled={isLoading} defaultValue={range.toString()} onValueChange={onRangeChange}>
                        <SelectTrigger className="w-48 h-12 bg-white/90 dark:bg-[#181820]/90 border border-[#F8C8DC]/60 dark:border-white/10 shadow-xs rounded-2xl font-bold text-xs uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer hover:border-[#E75480]/40 dark:hover:border-[#E1062C]/50 transition-all">
                            <div className="flex items-center gap-2">
                                <Calendar className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                <SelectValue placeholder="Select Period" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                            <SelectItem value="7" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2.5 cursor-pointer dark:focus:bg-white/10">
                                Standard 7 Days
                            </SelectItem>
                            <SelectItem value="30" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2.5 cursor-pointer dark:focus:bg-white/10">
                                Monthly 30 Days
                            </SelectItem>
                            <SelectItem value="365" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2.5 cursor-pointer dark:focus:bg-white/10">
                                Annual 365 Days
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </motion.div>
    );
}
