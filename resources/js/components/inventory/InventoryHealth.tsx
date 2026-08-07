import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, OctagonAlert, Activity, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

import type { InventoryRow } from '@/components/inventory/InventoryHero';
import { cn } from '@/lib/utils';

interface InventoryHealthProps {
    inventory: InventoryRow[];
    totalInventoryCount?: number;
    quickFilter: 'all' | 'low' | 'out' | 'updated' | 'restocked';
    onQuickFilterChange: (filter: 'all' | 'low' | 'out' | 'updated' | 'restocked') => void;
}

export function InventoryHealth({
    inventory,
    totalInventoryCount,
    quickFilter,
    onQuickFilterChange,
}: InventoryHealthProps) {
    const activeCount = inventory.length;
    const baseTotal = totalInventoryCount ?? activeCount;

    // Dynamic calculation based on exact live item stock levels
    const { optimalCount, lowCount, outCount, overallHealthScore } = useMemo(() => {
        if (inventory.length === 0) {
            return { optimalCount: 0, lowCount: 0, outCount: 0, overallHealthScore: 0 };
        }

        let optimal = 0;
        let low = 0;
        let out = 0;
        let scoreSum = 0;

        inventory.forEach((i) => {
            const currentStock = Number(i.stock ?? 0);
            const lowMark = Number(i.low_stock_level ?? 5);

            if (currentStock <= 0 || i.is_out_of_stock) {
                out++;
                scoreSum += 0;
            } else if (currentStock <= lowMark || i.is_low_stock) {
                low++;
                // Partial health score based on stock proximity to safety mark
                const ratio = Math.min(1, currentStock / Math.max(1, lowMark));
                scoreSum += ratio * 75; // max 75% for low stock status
            } else {
                optimal++;
                // Target stock capacity ratio (up to 2x safety mark)
                const targetCapacity = lowMark * 2;
                const ratio = Math.min(1, currentStock / Math.max(1, targetCapacity));
                scoreSum += 75 + ratio * 25; // 75% to 100%
            }
        });

        const avgScore = Math.round(scoreSum / inventory.length);
        return {
            optimalCount: optimal,
            lowCount: low,
            outCount: out,
            overallHealthScore: avgScore,
        };
    }, [inventory]);

    const optimalPct = activeCount > 0 ? Math.round((optimalCount / activeCount) * 100) : 0;
    const lowPct = activeCount > 0 ? Math.round((lowCount / activeCount) * 100) : 0;
    const outPct = activeCount > 0 ? Math.round((outCount / activeCount) * 100) : 0;

    // Dynamic Health Badge Evaluation
    const healthBadge = useMemo(() => {
        if (activeCount === 0) {
            return { label: 'No Active Items', color: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700' };
        }
        if (overallHealthScore >= 80) {
            return { label: `${overallHealthScore}% Live Health Index • Excellent`, color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50' };
        }
        if (overallHealthScore >= 60) {
            return { label: `${overallHealthScore}% Live Health Index • Moderate Risk`, color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50' };
        }
        return { label: `${overallHealthScore}% Live Health Index • Critical Action`, color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50' };
    }, [overallHealthScore, activeCount]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] p-6 sm:p-7 backdrop-blur-2xl transition-colors duration-300 space-y-6"
        >
            {/* Header Title & Health Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/50 dark:from-[#181824] dark:to-[#222232] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shadow-2xs">
                        <Activity className="size-5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                Live Stock Health Ratio
                            </h2>
                            <motion.span
                                key={overallHealthScore}
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono transition-all', healthBadge.color)}
                            >
                                {healthBadge.label}
                            </motion.span>
                        </div>
                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] mt-0.5">
                            Dynamically computed stock adequacy index based on current branch quantities vs threshold benchmarks.
                        </p>
                    </div>
                </div>

                {/* Reset / All Items Quick Button */}
                <button
                    type="button"
                    onClick={() => onQuickFilterChange('all')}
                    className={cn(
                        'px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start sm:self-center border',
                        quickFilter === 'all'
                            ? 'bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent shadow-xs'
                            : 'bg-white dark:bg-[#181820] text-[#7D6B6E] dark:text-[#94A3B8] border-[#F8C8DC]/60 dark:border-white/10 hover:border-[#E75480]/40'
                    )}
                >
                    <CheckCircle2 className="size-3.5" />
                    <span>View All ({activeCount})</span>
                </button>
            </div>

            {/* Dynamic Metric Segment Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Optimal Stock Card */}
                <button
                    type="button"
                    onClick={() => onQuickFilterChange('all')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group',
                        quickFilter === 'all'
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50 shadow-xs'
                            : 'bg-white/60 dark:bg-[#181820]/60 border-[#F8C8DC]/40 dark:border-white/10 hover:border-emerald-400/50 dark:hover:border-emerald-800'
                    )}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Optimal Stock</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <motion.span key={optimalCount} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-black font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {optimalCount}
                            </motion.span>
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">({optimalPct}%)</span>
                        </div>
                    </div>
                    <div className="size-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0" />
                </button>

                {/* Low Stock Card */}
                <button
                    type="button"
                    onClick={() => onQuickFilterChange('low')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group',
                        quickFilter === 'low'
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/50 shadow-xs'
                            : 'bg-white/60 dark:bg-[#181820]/60 border-[#F8C8DC]/40 dark:border-white/10 hover:border-amber-400/50 dark:hover:border-amber-800'
                    )}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Low Stock Mark</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <motion.span key={lowCount} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-black font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {lowCount}
                            </motion.span>
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">({lowPct}%)</span>
                        </div>
                    </div>
                    <div className="size-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] shrink-0" />
                </button>

                {/* Out of Stock Card */}
                <button
                    type="button"
                    onClick={() => onQuickFilterChange('out')}
                    className={cn(
                        'p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group',
                        quickFilter === 'out'
                            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 shadow-xs'
                            : 'bg-white/60 dark:bg-[#181820]/60 border-[#F8C8DC]/40 dark:border-white/10 hover:border-rose-400/50 dark:hover:border-rose-800'
                    )}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <OctagonAlert className="size-4 text-rose-600 dark:text-rose-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Out of Stock</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <motion.span key={outCount} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-black font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {outCount}
                            </motion.span>
                            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">({outPct}%)</span>
                        </div>
                    </div>
                    <div className="size-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] shrink-0" />
                </button>

            </div>

            {/* Segmented Animated Linear Ratio Bar */}
            <div className="space-y-2 pt-1">
                <div className="w-full h-3.5 rounded-full bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden flex p-0.5 gap-1 shadow-inner">
                    {optimalPct > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${optimalPct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full shadow-2xs"
                            title={`Optimal: ${optimalCount} (${optimalPct}%)`}
                        />
                    )}
                    {lowPct > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lowPct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-linear-to-r from-amber-500 to-amber-400 rounded-full shadow-2xs"
                            title={`Low Stock: ${lowCount} (${lowPct}%)`}
                        />
                    )}
                    {outPct > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${outPct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-linear-to-r from-rose-500 to-rose-400 rounded-full shadow-2xs"
                            title={`Out of Stock: ${outCount} (${outPct}%)`}
                        />
                    )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] font-mono px-1">
                    <span>Dynamic Safety Compliance Rating</span>
                    <span>{activeCount} of {baseTotal} Active SKUs Filtered</span>
                </div>
            </div>

        </motion.div>
    );
}
