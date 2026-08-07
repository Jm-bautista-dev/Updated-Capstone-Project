import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Database, Shield, Sparkles, User } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface SalesDataHeroProps {
    stats: {
        total_sales_records: number;
        last_import_date: string | null;
        last_imported_by: string | null;
        duplicate_records_detected: number;
        data_integrity_status: string;
    };
}

export function SalesDataHero({ stats }: SalesDataHeroProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-white/90 via-[#FFF9FA]/80 to-[#FFF0F5]/60 dark:from-[#0F0F14]/90 dark:via-[#14141E]/80 dark:to-[#181824]/70 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] p-6 sm:p-8 lg:p-10 backdrop-blur-2xl transition-colors duration-300 space-y-6"
        >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-radial from-[#FADADD]/40 via-[#F8C8DC]/15 dark:from-[#E1062C]/20 dark:via-rose-950/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -ml-20 -mb-20 size-60 rounded-full bg-radial from-[#FFE4E1]/50 dark:from-[#E1062C]/15 to-transparent blur-3xl pointer-events-none" />

            {/* Top Bar: Title & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E75480]/10 dark:bg-[#E1062C]/15 border border-[#E75480]/20 dark:border-[#E1062C]/30 text-[#E75480] dark:text-[#FF4F81] text-xs font-bold tracking-wider uppercase">
                        <Sparkles className="size-3.5" />
                        <span>Data Operations Center</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight leading-tight">
                        Sales Data{' '}
                        <span className="bg-linear-to-r from-[#E75480] via-[#D43F6B] to-[#F472B6] dark:from-[#FF4F81] dark:via-[#E1062C] dark:to-[#F472B6] bg-clip-text text-transparent">
                            Management
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-2xl">
                        Import, validate, and maintain high-integrity sales datasets for analytical forecasting and business intelligence.
                    </p>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10 pt-2">
                {/* Total Sales Records */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] shrink-0">
                        <Database className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Total Sales</p>
                        <h3 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5 truncate">
                            {stats.total_sales_records.toLocaleString()}
                        </h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Active DB rows</p>
                    </div>
                </motion.div>

                {/* Last Import Date */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-blue-100/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                        <Calendar className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Last Import</p>
                        <h3 className="text-sm font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5 truncate">
                            {stats.last_import_date ? format(new Date(stats.last_import_date), 'MMM dd, HH:mm') : 'Never'}
                        </h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Telemetry sync</p>
                    </div>
                </motion.div>

                {/* Last Imported By */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-purple-100/60 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                        <User className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Operator</p>
                        <h3 className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC] mt-0.5 truncate">
                            {stats.last_imported_by || 'None'}
                        </h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Admin operator</p>
                    </div>
                </motion.div>

                {/* Duplicates Detected */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                        <AlertTriangle className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Duplicates</p>
                        <h3
                            className={cn(
                                'text-2xl font-black font-mono mt-0.5 truncate',
                                stats.duplicate_records_detected > 0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-[#3D2C2E] dark:text-[#F8FAFC]'
                            )}
                        >
                            {stats.duplicate_records_detected}
                        </h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Detected duplicates</p>
                    </div>
                </motion.div>

                {/* Data Integrity */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Shield className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Data Integrity</p>
                        <span
                            className={cn(
                                'inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                                stats.data_integrity_status === 'Optimal'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            )}
                        >
                            {stats.data_integrity_status}
                        </span>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] mt-1">Validation score</p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
