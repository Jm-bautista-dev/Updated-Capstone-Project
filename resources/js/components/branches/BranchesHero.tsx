import { motion } from 'framer-motion';
import { Building2, Plus, Search, Sparkles } from 'lucide-react';
import React from 'react';
import { Input } from '@/components/ui/input';

interface BranchesHeroProps {
    totalBranches: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: 'grid' | 'table';
    onViewModeChange: (mode: 'grid' | 'table') => void;
    onAddBranch?: () => void;
}

export function BranchesHero({
    totalBranches,
    searchQuery,
    onSearchChange,
    viewMode,
    onViewModeChange,
    onAddBranch,
}: BranchesHeroProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-white/90 via-[#FFF9FA]/80 to-[#FFF0F5]/60 dark:from-[#0F0F14]/90 dark:via-[#14141E]/80 dark:to-[#181824]/70 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] p-6 sm:p-8 lg:p-10 backdrop-blur-2xl transition-colors duration-300 space-y-6 font-['Outfit']"
        >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-radial from-[#FADADD]/40 via-[#F8C8DC]/15 dark:from-[#E1062C]/20 dark:via-rose-950/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -ml-20 -mb-20 size-60 rounded-full bg-radial from-[#FFE4E1]/50 dark:from-[#E1062C]/15 to-transparent blur-3xl pointer-events-none" />

            {/* Top Row Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E75480]/10 dark:bg-[#E1062C]/15 border border-[#E75480]/20 dark:border-[#E1062C]/30 text-[#E75480] dark:text-[#FF4F81] text-xs font-bold tracking-wider uppercase">
                            <Sparkles className="size-3.5" />
                            <span>Branch Operations Center</span>
                        </div>
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
                            GPS Geofencing Active
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight leading-tight">
                        Branch{' '}
                        <span className="bg-linear-to-r from-[#E75480] via-[#D43F6B] to-[#F472B6] dark:from-[#FF4F81] dark:via-[#E1062C] dark:to-[#F472B6] bg-clip-text text-transparent">
                            Registry
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-xl">
                        Verify and update physical mapping, delivery radii, base fees, and operational hubs for your store network.
                    </p>
                </div>

                {/* Right Stat Pills */}
                <div className="flex items-center gap-3 flex-wrap self-start lg:self-center">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs backdrop-blur-xl">
                        <Building2 className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                            {totalBranches} Registered Hubs
                        </span>
                    </div>

                    <div className="flex items-center bg-white/70 dark:bg-[#181820]/70 rounded-2xl p-1 border border-[#F8C8DC]/60 dark:border-white/10 backdrop-blur-xl shadow-2xs">
                        <button
                            type="button"
                            onClick={() => onViewModeChange('grid')}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                viewMode === 'grid'
                                    ? 'bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs border border-[#F8C8DC]/40 dark:border-white/10'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                            }`}
                        >
                            Grid Cards
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange('table')}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                viewMode === 'table'
                                    ? 'bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs border border-[#F8C8DC]/40 dark:border-white/10'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                            }`}
                        >
                            Table View
                        </button>
                    </div>

                    {onAddBranch && (
                        <button
                            type="button"
                            onClick={onAddBranch}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-linear-to-r from-[#E75480] to-[#D43B66] text-white shadow-md shadow-[#E75480]/20 hover:from-[#D43B66] hover:to-[#C02E58] text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
                        >
                            <Plus className="size-4" />
                            <span>Add Hub</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Row Search Bar */}
            <div className="relative z-10 pt-2">
                <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search branches by hub name or address..."
                        className="pl-10 h-11 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium placeholder:text-[#9E8B8E] dark:placeholder:text-[#64748B] focus:ring-2 focus:ring-[#E75480]/20 shadow-2xs"
                    />
                </div>
            </div>
        </motion.div>
    );
}
