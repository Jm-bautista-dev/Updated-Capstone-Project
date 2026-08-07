import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import React from 'react';
import type { Rider } from './types';

interface RiderFleetSectionProps {
    riders: Rider[];
}

export function RiderFleetSection({ riders }: RiderFleetSectionProps) {
    if (riders.length === 0) return null;

    return (
        <div className="space-y-4 font-['Outfit']">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Available Fleet Personnel
                    </h3>
                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                        Riders currently ready for order dispatch assignments
                    </p>
                </div>
                <span className="text-xs font-bold font-mono text-[#E75480] dark:text-[#FF4F81] px-3 py-1 rounded-full bg-[#FADADD]/30 dark:bg-white/5">
                    {riders.length} Available
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {riders.slice(0, 4).map((rider) => (
                    <motion.div
                        key={rider.id}
                        whileHover={{ y: -3 }}
                        className="p-4 rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 flex items-center gap-3.5"
                    >
                        <div className="size-11 rounded-2xl bg-linear-to-br from-[#FADADD]/60 via-[#F8C8DC]/30 to-[#FFF0F5] dark:from-[#E1062C]/20 dark:via-rose-950/20 dark:to-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] font-black text-sm shrink-0">
                            {rider.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC] truncate">
                                {rider.name}
                            </h4>
                            <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] font-medium flex items-center gap-1 mt-0.5 truncate">
                                <Building2 className="size-3 shrink-0" />
                                <span className="truncate">{rider.branch_name || 'HQ Branch'}</span>
                            </p>
                        </div>

                        <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
