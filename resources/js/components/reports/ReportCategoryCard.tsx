import { motion } from 'framer-motion';
import {
    BarChart3,
    Layers,
    DollarSign,
    Zap,
    TrendingUp,
    Users,
    Truck,
    Brain,
    ArrowUpRight
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ReportCategory {
    id: string;
    title: string;
    description: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeText: string;
}

interface ReportCategoryCardProps {
    onSelectCategory: (categoryId: string) => void;
    activeCategory: string;
}

export function ReportCategoryCard({ onSelectCategory, activeCategory }: ReportCategoryCardProps) {
    const categories: ReportCategory[] = [
        {
            id: 'sales',
            title: 'Sales & Revenue Telemetry',
            description: 'POS transactions, daily order volume, product sales breakdown, and payment channel distribution.',
            count: 14,
            icon: BarChart3,
            accentColor: 'text-[#E75480] dark:text-[#FF4F81] bg-[#FFF5F7] dark:bg-[#1C1C28] border-[#F8C8DC]/60 dark:border-white/10',
            badgeText: 'Live Stream',
        },
        {
            id: 'inventory',
            title: 'Inventory & Stock Valuation',
            description: 'Ingredient depletion rates, stock valuation, reorder threshold alerts, and wastage logging.',
            count: 9,
            icon: Layers,
            accentColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
            badgeText: 'Asset Intel',
        },
        {
            id: 'financial',
            title: 'Financial & Profitability',
            description: 'Gross profit margins, operating expense tracking, cost per base unit, and branch net valuation.',
            count: 7,
            icon: DollarSign,
            accentColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50',
            badgeText: 'Audit Ready',
        },
        {
            id: 'forecast',
            title: 'AI Predictive Forecasting',
            description: 'Algorithm-driven demand forecasting, restock suggestions, and peak-hour sales modeling.',
            count: 5,
            icon: Zap,
            accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
            badgeText: 'AI Calibrated',
        },
        {
            id: 'descriptive',
            title: 'Descriptive Analytics',
            description: 'Historical performance benchmarks, seasonal trends, and store-by-store comparative metrics.',
            count: 8,
            icon: TrendingUp,
            accentColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50',
            badgeText: 'Historical',
        },
        {
            id: 'prescriptive',
            title: 'Prescriptive Recommendations',
            description: 'Automated operational actions, ingredient buffer reorder advice, and margin optimization prompts.',
            count: 6,
            icon: Brain,
            accentColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50',
            badgeText: 'Smart Actions',
        },
        {
            id: 'suppliers',
            title: 'Supplier Telemetry',
            description: 'Vendor fulfillment speeds, receipt OCR restock logs, unit cost history, and procurement schedules.',
            count: 4,
            icon: Truck,
            accentColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/50',
            badgeText: 'Procurement',
        },
        {
            id: 'customers',
            title: 'Customer Retention & Loyalty',
            description: 'Order frequency analytics, average cart spend per customer, and order type preferences.',
            count: 5,
            icon: Users,
            accentColor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50',
            badgeText: 'Demographics',
        },
    ];

    return (
        <div className="space-y-4 font-['Outfit']">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Intelligence Report Categories
                    </h2>
                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                        Select a specialized telemetry workspace to analyze detailed business metrics
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {categories.map((cat, index) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;

                    return (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: index * 0.03 }}
                            onClick={() => onSelectCategory(cat.id)}
                            className={cn(
                                'rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer group hover:-translate-y-1 hover:border-[#E75480]/40',
                                isActive && 'ring-2 ring-[#E75480] dark:ring-[#FF4F81] bg-[#FFF5F7]/90 dark:bg-[#181824]/90'
                            )}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className={cn('size-11 rounded-2xl flex items-center justify-center border shadow-2xs group-hover:scale-110 transition-transform', cat.accentColor)}>
                                        <Icon className="size-5.5" />
                                    </div>
                                    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase border', cat.accentColor)}>
                                        {cat.badgeText}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors">
                                        {cat.title}
                                    </h3>
                                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                                        {cat.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-between text-xs font-bold">
                                <span className="text-[#7D6B6E] dark:text-[#94A3B8] font-mono">
                                    {cat.count} Available Reports
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-xs font-bold text-[#E75480] dark:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/10 gap-1 cursor-pointer"
                                >
                                    <span>Explore</span>
                                    <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
