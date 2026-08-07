import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Navigation, Timer } from 'lucide-react';
import React from 'react';
import type { DeliveryStatsData } from './types';

interface DeliveryStatsProps {
    stats: DeliveryStatsData;
}

export default function DeliveryStats({ stats }: DeliveryStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-['Outfit']">
            {/* Pending Deliveries */}
            <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
            >
                <div className="p-3 rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                    <Timer className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Pending Orders</p>
                    <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{stats.pending}</h3>
                    <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Awaiting kitchen prep</p>
                </div>
            </motion.div>

            {/* Active / In Transit */}
            <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
            >
                <div className="p-3 rounded-2xl bg-blue-100/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                    <Navigation className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">In Transit</p>
                    <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">{stats.active}</h3>
                    <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">On delivery route</p>
                </div>
            </motion.div>

            {/* Delivered Today */}
            <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
            >
                <div className="p-3 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Delivered Today</p>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{stats.delivered}</h3>
                    <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Successfully completed</p>
                </div>
            </motion.div>

            {/* Delayed / Attention */}
            <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
            >
                <div className="p-3 rounded-2xl bg-rose-100/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
                    <AlertCircle className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Delayed Orders</p>
                    <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">{stats.delayed}</h3>
                    <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Requires dispatcher review</p>
                </div>
            </motion.div>
        </div>
    );
}
