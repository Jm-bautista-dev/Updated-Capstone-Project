import { motion } from 'framer-motion';
import { CheckCircle2, Clock, EyeOff, Plus, Sparkles, Users } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

interface RiderStats {
    total: number;
    available: number;
    busy: number;
    offline: number;
}

interface RidersHeroProps {
    stats: RiderStats;
    onOpenAddModal: () => void;
}

export function RidersHero({ stats, onOpenAddModal }: RidersHeroProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-white/90 via-[#FFF9FA]/80 to-[#FFF0F5]/60 dark:from-[#0F0F14]/90 dark:via-[#14141E]/80 dark:to-[#181824]/70 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] p-6 sm:p-8 lg:p-10 backdrop-blur-2xl transition-colors duration-300 space-y-6"
        >
            {/* Ambient Background Blur Glows */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-radial from-[#FADADD]/40 via-[#F8C8DC]/15 dark:from-[#E1062C]/20 dark:via-rose-950/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -ml-20 -mb-20 size-60 rounded-full bg-radial from-[#FFE4E1]/50 dark:from-[#E1062C]/15 to-transparent blur-3xl pointer-events-none" />

            {/* Top Bar: Title, Tagline & CTA Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E75480]/10 dark:bg-[#E1062C]/15 border border-[#E75480]/20 dark:border-[#E1062C]/30 text-[#E75480] dark:text-[#FF4F81] text-xs font-bold tracking-wider uppercase">
                        <Sparkles className="size-3.5" />
                        <span>Fleet Command Hub</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight leading-tight">
                        Rider{' '}
                        <span className="bg-linear-to-r from-[#E75480] via-[#D43F6B] to-[#F472B6] dark:from-[#FF4F81] dark:via-[#E1062C] dark:to-[#F472B6] bg-clip-text text-transparent">
                            Management
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-xl">
                        Manage your delivery personnel, monitor active status, track fulfillment performance, and assign branch fleets.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                    <Button
                        onClick={onOpenAddModal}
                        className="h-12 px-6 bg-linear-to-r from-[#E75480] via-[#F472B6] to-[#E75480] dark:from-[#E1062C] dark:via-[#FF4F81] dark:to-[#E1062C] bg-size-[200%_auto] hover:bg-right text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-[0_10px_25px_-5px_rgba(231,84,128,0.35)] dark:shadow-[0_10px_25px_-5px_rgba(225,6,44,0.4)] hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0"
                    >
                        <Plus className="size-4" />
                        <span>Add Rider</span>
                    </Button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 pt-2">
                {/* Total Riders */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] shrink-0">
                        <Users className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Total Fleet</p>
                        <h3 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5">{stats.total}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Active fleet size</p>
                    </div>
                </motion.div>

                {/* Available Riders */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Available</p>
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{stats.available}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Ready for assignment</p>
                    </div>
                </motion.div>

                {/* On Delivery / Busy */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                        <Clock className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">On Delivery</p>
                        <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{stats.busy}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Fulfilling orders</p>
                    </div>
                </motion.div>

                {/* Offline Riders */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 shrink-0">
                        <EyeOff className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Offline</p>
                        <h3 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5">{stats.offline}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Off schedule</p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
