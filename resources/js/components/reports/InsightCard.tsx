import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function InsightCard() {
    const insights = [
        {
            id: 1,
            title: 'Revenue Surge Detected',
            type: 'positive',
            category: 'Sales Acceleration',
            description: 'Weekend Tonkotsu Ramen promotions generated +24.8% higher order volume than predicted baseline.',
            metric: '+₱42,300',
            icon: TrendingUp,
            color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
        },
        {
            id: 2,
            title: 'Reorder Buffer Alert',
            type: 'warning',
            category: 'Inventory Optimization',
            description: 'Nori Sheets and Matcha Powder are burning through safety stock 3 days faster than historical average.',
            metric: '2 SKUs Low',
            icon: AlertCircle,
            color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
        },
        {
            id: 3,
            title: 'AI Forecast Calibration',
            type: 'info',
            category: 'Predictive Intelligence',
            description: 'Demand model accuracy increased to 99.4% confidence score based on multi-branch sales telemetry.',
            metric: '99.4% Score',
            icon: ShieldCheck,
            color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50',
        },
    ];

    return (
        <div className="space-y-4 font-['Outfit']">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-2xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/50 dark:from-[#181824] dark:to-[#222232] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shadow-2xs">
                        <Sparkles className="size-4.5 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            AI Executive Recommendations
                        </h2>
                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Automated operational insights generated from continuous telemetry
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {insights.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: index * 0.05 }}
                            className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:border-[#E75480]/40 group"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                        {item.category}
                                    </span>
                                    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border', item.color)}>
                                        {item.metric}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <div className={cn('size-9 rounded-2xl flex items-center justify-center shrink-0 border', item.color)}>
                                        <Icon className="size-4.5" />
                                    </div>
                                    <h3 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        {item.title}
                                    </h3>
                                </div>

                                <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] leading-relaxed">
                                    {item.description}
                                </p>
                            </div>

                            <div className="pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs font-bold text-[#E75480] dark:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/10 gap-1.5 cursor-pointer p-0"
                                >
                                    <span>Take Action</span>
                                    <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
