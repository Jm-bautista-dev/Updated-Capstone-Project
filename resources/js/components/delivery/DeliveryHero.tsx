import { motion } from 'framer-motion';
import { Layers, Sparkles } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeliveryHeroProps {
    currentStatusFilter: string;
    onStatusFilterChange: (status: string) => void;
    groupByStatus: boolean;
    onToggleGroupByStatus: () => void;
}

export function DeliveryHero({
    currentStatusFilter,
    onStatusFilterChange,
    groupByStatus,
    onToggleGroupByStatus,
}: DeliveryHeroProps) {
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

            {/* Top Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E75480]/10 dark:bg-[#E1062C]/15 border border-[#E75480]/20 dark:border-[#E1062C]/30 text-[#E75480] dark:text-[#FF4F81] text-xs font-bold tracking-wider uppercase">
                            <Sparkles className="size-3.5" />
                            <span>Delivery Operations Center</span>
                        </div>
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
                            GPS Live Tracking
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight leading-tight">
                        Delivery{' '}
                        <span className="bg-linear-to-r from-[#E75480] via-[#D43F6B] to-[#F472B6] dark:from-[#FF4F81] dark:via-[#E1062C] dark:to-[#F472B6] bg-clip-text text-transparent">
                            Management
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-xl">
                        Track active orders, assign riders, monitor fulfillment statuses, and manage logistics operations in real time.
                    </p>
                </div>

                {/* Status Tab Pills & Group Toggle */}
                <div className="flex items-center gap-3 flex-wrap self-start lg:self-center">
                    <div className="flex items-center bg-white/70 dark:bg-[#181820]/70 rounded-2xl p-1 border border-[#F8C8DC]/60 dark:border-white/10 backdrop-blur-xl shadow-2xs">
                        {[
                            { id: 'all', label: 'All Orders' },
                            { id: 'pending', label: 'Pending' },
                            { id: 'preparing', label: 'Preparing' },
                            { id: 'in_transit', label: 'In Transit' },
                            { id: 'delivered', label: 'Delivered' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onStatusFilterChange(tab.id)}
                                className={cn(
                                    'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer select-none',
                                    (currentStatusFilter || 'all') === tab.id
                                        ? 'bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs border border-[#F8C8DC]/40 dark:border-white/10'
                                        : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onToggleGroupByStatus}
                        className="h-11 px-4 rounded-2xl gap-2 font-bold text-xs uppercase tracking-wider border-[#F8C8DC]/60 dark:border-white/10 bg-white/70 dark:bg-[#181820]/70 text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-white dark:hover:bg-[#181820] cursor-pointer shadow-2xs"
                    >
                        <Layers className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                        <span>{groupByStatus ? 'Grouped View' : 'Flat View'}</span>
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
