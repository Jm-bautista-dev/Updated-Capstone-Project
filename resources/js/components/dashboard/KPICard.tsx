import React, { isValidElement } from 'react';
import { Link } from '@inertiajs/react';
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
    href?: string;
    onClick?: () => void;
    interactive?: boolean;
    'aria-label'?: string;
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
    href,
    onClick,
    interactive,
    'aria-label': ariaLabel,
}: KPICardProps) {
    const isUp = trend === 'up';
    const isDown = trend === 'down';
    const isInteractive = (interactive ?? Boolean(href || onClick)) && !disableHover;

    const cardContent = (
        <>
            {/* Top Accent Light Bar */}
            <div className={cn(
                "absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-[#E75480]/30 dark:via-[#E1062C]/40 to-transparent transition-all duration-500",
                isInteractive && "group-hover:via-[#E75480] dark:group-hover:via-[#E1062C]"
            )} />

            <div className="min-w-0">
                {/* Header Row: Icon & Trend/Status Badges */}
                <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                    <div className={cn(
                        "size-10 sm:size-11 rounded-2xl bg-[#FADADD]/35 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] transition-colors duration-300 shadow-xs flex items-center justify-center shrink-0",
                        isInteractive && "group-hover:bg-[#E75480] dark:group-hover:bg-[#E1062C] group-hover:text-white"
                    )}>
                        {renderCardIcon(icon, "size-5")}
                    </div>

                    {(trendValue || badgeText) && (
                        <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0 max-w-[70%]">
                            {trendValue && (
                                <div
                                    className={cn(
                                        'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs shrink-0',
                                        isUp
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50'
                                            : isDown
                                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50'
                                            : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/60 dark:border-zinc-800/50'
                                    )}
                                >
                                    {isUp ? <ArrowUpRight className="size-3.5 shrink-0" /> : isDown ? <ArrowDownRight className="size-3.5 shrink-0" /> : null}
                                    <span className="truncate max-w-24 sm:max-w-28">{trendValue}</span>
                                </div>
                            )}

                            {badgeText && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E75480] dark:text-[#FF4F81] bg-[#E75480]/10 dark:bg-[#E1062C]/15 px-2.5 py-1 rounded-full border border-[#E75480]/20 dark:border-[#E1062C]/30 shrink-0 truncate max-w-28 sm:max-w-32" title={badgeText}>
                                    {badgeText}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* KPI Title & Metric */}
                <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] truncate" title={title}>
                        {title}
                    </p>

                    {loading ? (
                        <Skeleton className="h-9 w-32 rounded-xl dark:bg-white/10" />
                    ) : (
                        <h3 className="text-xl sm:text-2xl 2xl:text-3xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight font-mono truncate" title={String(value)}>
                            {value}
                        </h3>
                    )}

                    {comparison && (
                        <p className="text-xs font-medium text-[#9E8B8E] dark:text-[#64748B] truncate" title={comparison}>
                            {comparison}
                        </p>
                    )}
                </div>
            </div>

            {/* Sparkline Chart */}
            {sparklineData && sparklineData.length > 0 && (
                <div className={cn(
                    "h-10 w-full min-h-10 min-w-0 mt-3 sm:mt-4 transition-opacity",
                    isInteractive ? "opacity-75 group-hover:opacity-100" : "opacity-85"
                )}>
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
        </>
    );

    const baseClasses = cn(
        "relative rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between overflow-hidden select-none min-w-0",
        isInteractive ? (
            "group cursor-pointer hover:border-[#E75480]/40 dark:hover:border-[#E1062C]/50 hover:shadow-[0_20px_40px_-10px_rgba(231,84,128,0.15)] dark:hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E75480] dark:focus-visible:ring-[#FF4F81] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121218] transition-all duration-300"
        ) : (
            "cursor-default transition-colors duration-300"
        ),
        className
    );

    if (href) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
            >
                <Link
                    href={href}
                    aria-label={ariaLabel || `${title}: ${value}`}
                    className={cn(baseClasses, "h-full block")}
                >
                    {cardContent}
                </Link>
            </motion.div>
        );
    }

    if (onClick) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
            >
                <button
                    type="button"
                    onClick={onClick}
                    aria-label={ariaLabel || `${title}: ${value}`}
                    className={cn(baseClasses, "h-full w-full text-left")}
                >
                    {cardContent}
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={baseClasses}
        >
            {cardContent}
        </motion.div>
    );
}
