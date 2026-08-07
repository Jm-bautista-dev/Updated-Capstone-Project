import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, ShieldAlert, Clock, ArrowUpRight } from 'lucide-react';
import React from 'react';

import type { Sale } from '@/components/sales/SalesHero';
import { cn } from '@/lib/utils';

interface SalesTimelineProps {
    sales: Sale[];
    onSelectSale: (sale: Sale) => void;
}

export function SalesTimeline({ sales, onSelectSale }: SalesTimelineProps) {
    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amt);

    const safeFormatTime = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            return format(parseISO(dateStr), 'hh:mm a');
        } catch {
            return dateStr;
        }
    };

    const recentSales = sales.slice(0, 8);

    if (recentSales.length === 0) return null;

    return (
        <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-5 font-['Outfit']">
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-2xs">
                        <Activity className="size-5 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                            Live Activity Stream
                        </h2>
                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Real-time order execution feed across active registers
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeline Stream Feed */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-linear-to-b before:from-[#E75480] before:via-[#F8C8DC] before:to-transparent dark:before:from-[#E1062C] dark:before:via-white/10">
                {recentSales.map((sale, index) => {
                    const isVoided = sale.status === 'cancelled';

                    return (
                        <motion.div
                            key={sale.id}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.04 }}
                            onClick={() => onSelectSale(sale)}
                            className="relative flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-white/60 dark:bg-[#181820]/60 border border-[#F8C8DC]/40 dark:border-white/10 hover:border-[#E75480]/40 transition-all cursor-pointer group shadow-2xs"
                        >
                            {/* Dot Pin */}
                            <div className="absolute -left-7.75 top-1/2 -translate-y-1/2 size-4 rounded-full bg-white dark:bg-[#121218] border-2 border-[#E75480] dark:border-[#FF4F81] flex items-center justify-center shadow-xs">
                                <div className="size-1.5 rounded-full bg-[#E75480] dark:bg-[#FF4F81]" />
                            </div>

                            {/* Info */}
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    'size-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs',
                                    isVoided
                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                                )}>
                                    {isVoided ? <ShieldAlert className="size-4" /> : <CheckCircle className="size-4" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-extrabold text-xs text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            #{sale.order_number}
                                        </span>
                                        <span className="text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                            by {sale.cashier?.name || 'Cashier'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#7D6B6E] dark:text-[#94A3B8] mt-0.5">
                                        <Clock className="size-3" />
                                        <span>{safeFormatTime(sale.created_at)}</span>
                                        <span>•</span>
                                        <span className="capitalize">{sale.type || 'In-Store'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total Amount & Trigger */}
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    'font-mono font-extrabold text-sm',
                                    isVoided ? 'line-through text-rose-500' : 'text-[#3D2C2E] dark:text-[#F8FAFC]'
                                )}>
                                    {formatCurrency(Number(sale.total || 0))}
                                </span>
                                <ArrowUpRight className="size-4 text-[#7D6B6E] dark:text-[#94A3B8] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors" />
                            </div>

                        </motion.div>
                    );
                })}
            </div>

        </div>
    );
}
