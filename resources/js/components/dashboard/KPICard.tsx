import React, { isValidElement } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Receipt,
    TrendingUp,
    ShoppingBag,
    AlertTriangle,
    BarChart2,
    BarChart3,
    Award,
    Zap,
    Cpu,
    PackageCheck,
    ShoppingCart,
    ClipboardList,
    Building2,
    Activity,
    Clock,
    Calendar,
    Sparkles,
    Package,
    Tag,
    Percent,
    CreditCard,
    CheckCircle,
    Boxes,
    FileText,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface SparklineItem {
    value: number;
}

const DYNAMIC_ICON_MAP: Record<string, LucideIcon> = {
    dollarsign: DollarSign,
    dollar: DollarSign,
    revenue: DollarSign,
    sales: DollarSign,
    gross: DollarSign,
    price: DollarSign,
    receipt: Receipt,
    expenses: Receipt,
    cogs: Receipt,
    cost: Receipt,
    trendingup: TrendingUp,
    profit: TrendingUp,
    margin: TrendingUp,
    growth: TrendingUp,
    shoppingbag: ShoppingBag,
    orders: ShoppingBag,
    volume: ShoppingBag,
    traffic: ShoppingBag,
    fulfillment: ShoppingBag,
    alerttriangle: AlertTriangle,
    alert: AlertTriangle,
    stock: AlertTriangle,
    lowstock: AlertTriangle,
    warning: AlertTriangle,
    danger: AlertTriangle,
    barchart2: BarChart2,
    barchart: BarChart2,
    barchart3: BarChart3,
    analytics: BarChart3,
    chart: BarChart3,
    award: Award,
    leader: Award,
    top: Award,
    representative: Award,
    cashier: Award,
    zap: Zap,
    flash: Zap,
    live: Zap,
    cpu: Cpu,
    model: Cpu,
    ai: Cpu,
    intel: Cpu,
    forecast: Cpu,
    packagecheck: PackageCheck,
    replenishment: PackageCheck,
    restock: PackageCheck,
    shoppingcart: ShoppingCart,
    cart: ShoppingCart,
    transactions: ShoppingCart,
    clipboardlist: ClipboardList,
    inventory: ClipboardList,
    audit: ClipboardList,
    building2: Building2,
    branch: Building2,
    store: Building2,
    activity: Activity,
    telemetry: Activity,
    clock: Clock,
    time: Clock,
    calendar: Calendar,
    date: Calendar,
    sparkles: Sparkles,
    package: Package,
    product: Package,
    boxes: Boxes,
    tag: Tag,
    discount: Tag,
    percent: Percent,
    creditcard: CreditCard,
    checkcircle: CheckCircle,
    filetext: FileText,
    report: FileText,
    users: Users,
};

export type CardIconType =
    | LucideIcon
    | React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
    | React.ReactElement
    | string
    | null
    | undefined;

export interface KPICardProps {
    title: string;
    value: string | number;
    icon?: CardIconType;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    comparison?: string;
    loading?: boolean;
    sparklineData?: SparklineItem[];
    badgeText?: string;
    index?: number;
    className?: string;
    disableHover?: boolean;
}

export function renderCardIcon(icon: CardIconType, className: string = 'size-5'): React.ReactNode {
    if (!icon) {
        return <Activity className={className} aria-hidden="true" />;
    }

    if (isValidElement(icon)) {
        return icon;
    }

    if (typeof icon === 'string') {
        const cleanKey = icon.toLowerCase().replace(/[^a-z0-9]/g, '');
        const ResolvedIcon = DYNAMIC_ICON_MAP[cleanKey] || Activity;
        return <ResolvedIcon className={className} aria-hidden="true" />;
    }

    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon)) {
        const Component = icon as React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
        return <Component className={className} aria-hidden="true" />;
    }

    return <Activity className={className} aria-hidden="true" />;
}

export function KPICard({
    title,
    value,
    icon,
    trend,
    trendValue,
    comparison,
    loading,
    sparklineData,
    badgeText,
    index = 0,
    className,
    disableHover = false,
}: KPICardProps) {
    const isUp = trend === 'up';
    const isDown = trend === 'down';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "relative rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] hover:border-[#E75480]/30 dark:hover:border-white/20 p-6 backdrop-blur-xl transition-colors duration-300 flex flex-col justify-between overflow-hidden select-none",
                !disableHover && "group",
                className
            )}
        >
            {/* Top Accent Light Bar */}
            <div className={cn(
                "absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-[#E75480]/30 dark:via-[#E1062C]/40 to-transparent transition-all duration-500",
                !disableHover && "group-hover:via-[#E75480] dark:group-hover:via-[#E1062C]"
            )} />

            <div>
                {/* Header Row: Icon & Trend Badge */}
                <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                        "size-11 rounded-2xl bg-[#FADADD]/35 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] transition-colors duration-300 shadow-xs flex items-center justify-center shrink-0",
                        !disableHover && "group-hover:bg-[#E75480] dark:group-hover:bg-[#E1062C] group-hover:text-white"
                    )}>
                        {renderCardIcon(icon, "size-5")}
                    </div>

                    {trendValue && (
                        <div
                            className={cn(
                                'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs',
                                isUp
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50'
                                    : isDown
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50'
                                    : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/60 dark:border-zinc-800/50'
                            )}
                        >
                            {isUp ? <ArrowUpRight className="size-3.5" /> : isDown ? <ArrowDownRight className="size-3.5" /> : null}
                            <span>{trendValue}</span>
                        </div>
                    )}

                    {badgeText && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#E75480] dark:text-[#FF4F81] bg-[#E75480]/10 dark:bg-[#E1062C]/15 px-2.5 py-1 rounded-full border border-[#E75480]/20 dark:border-[#E1062C]/30">
                            {badgeText}
                        </span>
                    )}
                </div>

                {/* KPI Title & Metric */}
                <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">{title}</p>

                    {loading ? (
                        <Skeleton className="h-9 w-32 rounded-xl dark:bg-white/10" />
                    ) : (
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight font-mono">
                            {value}
                        </h3>
                    )}

                    {comparison && (
                        <p className="text-xs font-medium text-[#9E8B8E] dark:text-[#64748B]">{comparison}</p>
                    )}
                </div>
            </div>

            {/* Sparkline Chart */}
            {sparklineData && sparklineData.length > 0 && (
                <div className="h-10 w-full min-h-10 min-w-0 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={40} initialDimension={{ width: 120, height: 40 }}>
                        <AreaChart data={sparklineData}>
                            <defs>
                                <linearGradient id={`kpi-grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isUp ? '#10b981' : '#E75480'} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={isUp ? '#10b981' : '#E75480'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isUp ? '#10b981' : '#E75480'}
                                strokeWidth={2}
                                fill={`url(#kpi-grad-${title.replace(/\s+/g, '')})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
}
