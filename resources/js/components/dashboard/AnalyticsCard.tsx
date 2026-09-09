import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';
import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface SalesOverTimeItem {
    date: string;
    revenue: number;
    cogs?: number;
    expenses?: number;
    profit: number;
    margin_pct?: number;
}

interface SalesPerProductItem {
    name: string;
    total_sold: number;
    revenue?: number;
}

interface PaymentMethodItem {
    payment_method: string;
    raw_method?: string;
    revenue: number;
    count?: number;
    percentage?: number;
}

const PIE_COLORS = ['#E75480', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

/**
 * Authoritative financial color semantic configuration for Operational Trajectory.
 * 
 * Rules:
 * - Revenue (Inflow / Positive business outcome): Emerald Green (#10b981)
 * - COGS / Ingredient Cost (Outflow / Expense): Rose Red (#f43f5e) with dashed pattern for accessibility
 * - Profit Margin % (Performance / Ratio): Sky Blue (#0ea5e9) visually positive & distinct from Revenue
 * - Net Profit (Bottom line profit): Emerald Green (#10b981)
 */
export const TRAJECTORY_SERIES_CONFIG = {
    revenue: {
        key: 'revenue',
        label: 'Operational Revenue (₱)',
        shortLabel: 'Total Revenue',
        color: '#10b981',
        gradientId: 'colorRevenue',
        strokeWidth: 3,
        strokeDasharray: undefined,
        areaOpacity: { start: 0.35, end: 0 },
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400',
        textClass: 'text-emerald-600 dark:text-emerald-400',
    },
    cogs: {
        key: 'cogs',
        label: 'COGS / Ingredient Cost (₱)',
        shortLabel: 'COGS / Ingredient Cost',
        color: '#f43f5e',
        gradientId: 'colorCogs',
        strokeWidth: 2.5,
        strokeDasharray: '4 4',
        areaOpacity: { start: 0.25, end: 0 },
        badgeClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400',
        textClass: 'text-rose-600 dark:text-rose-400',
    },
    margin: {
        key: 'margin_pct',
        label: 'Profit Margin (%)',
        shortLabel: 'Avg Margin',
        color: '#0ea5e9',
        gradientId: 'colorMargin',
        strokeWidth: 3,
        strokeDasharray: undefined,
        areaOpacity: { start: 0.3, end: 0 },
        badgeClass: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/40 text-sky-600 dark:text-sky-400',
        textClass: 'text-sky-600 dark:text-sky-400',
    },
    profit: {
        key: 'profit',
        label: 'Net Profit (₱)',
        shortLabel: 'Net Profit',
        color: '#10b981',
        textClass: 'text-emerald-600 dark:text-emerald-400',
    },
} as const;

export function TrajectoryChart({ salesOverTime = [] }: { salesOverTime?: SalesOverTimeItem[] }) {
    const totalRev = React.useMemo(() => salesOverTime.reduce((sum, item) => sum + (item.revenue || 0), 0), [salesOverTime]);
    const totalCogs = React.useMemo(() => salesOverTime.reduce((sum, item) => sum + (item.cogs || 0), 0), [salesOverTime]);
    const totalProf = React.useMemo(() => salesOverTime.reduce((sum, item) => sum + (item.profit || 0), 0), [salesOverTime]);
    const avgMargin = totalRev > 0 ? (totalProf / totalRev) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                            <TrendingUp className="size-4" />
                        </div>
                        <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                            Operational Revenue & Margin Trajectory
                        </h2>
                    </div>
                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                        Comparative gross revenue, COGS / ingredient cost, and net profit margin.
                    </p>
                </div>

                {/* Summary Badges (KPI Cards directly above chart) */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className={cn("px-3 py-1.5 rounded-xl border text-right", TRAJECTORY_SERIES_CONFIG.revenue.badgeClass)}>
                        <span className="text-[9px] font-bold uppercase tracking-wider block">Total Revenue</span>
                        <span className="text-xs font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(totalRev)}</span>
                    </div>
                    <div className={cn("px-3 py-1.5 rounded-xl border text-right", TRAJECTORY_SERIES_CONFIG.cogs.badgeClass)}>
                        <span className="text-[9px] font-bold uppercase tracking-wider block">COGS / Ingredient Cost</span>
                        <span className="text-xs font-mono font-extrabold">{formatCurrency(totalCogs)}</span>
                    </div>
                    <div className={cn("px-3 py-1.5 rounded-xl border text-right", TRAJECTORY_SERIES_CONFIG.margin.badgeClass)}>
                        <span className="text-[9px] font-bold uppercase tracking-wider block">Avg Margin</span>
                        <span className="text-xs font-mono font-extrabold">{avgMargin.toFixed(1)}%</span>
                    </div>
                </div>
            </div>

            <div className="h-80 w-full min-h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={220} initialDimension={{ width: 500, height: 280 }}>
                    <AreaChart data={salesOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={TRAJECTORY_SERIES_CONFIG.revenue.gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={TRAJECTORY_SERIES_CONFIG.revenue.color} stopOpacity={TRAJECTORY_SERIES_CONFIG.revenue.areaOpacity.start} />
                                <stop offset="95%" stopColor={TRAJECTORY_SERIES_CONFIG.revenue.color} stopOpacity={TRAJECTORY_SERIES_CONFIG.revenue.areaOpacity.end} />
                            </linearGradient>
                            <linearGradient id={TRAJECTORY_SERIES_CONFIG.cogs.gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={TRAJECTORY_SERIES_CONFIG.cogs.color} stopOpacity={TRAJECTORY_SERIES_CONFIG.cogs.areaOpacity.start} />
                                <stop offset="95%" stopColor={TRAJECTORY_SERIES_CONFIG.cogs.color} stopOpacity={TRAJECTORY_SERIES_CONFIG.cogs.areaOpacity.end} />
                            </linearGradient>
                            <linearGradient id={TRAJECTORY_SERIES_CONFIG.margin.gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={TRAJECTORY_SERIES_CONFIG.margin.color} stopOpacity={TRAJECTORY_SERIES_CONFIG.margin.areaOpacity.start} />
                                <stop offset="95%" stopColor={TRAJECTORY_SERIES_CONFIG.margin.color} stopOpacity={TRAJECTORY_SERIES_CONFIG.margin.areaOpacity.end} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ops-border, rgba(255, 255, 255, 0.06))" />
                        <XAxis dataKey="date" stroke="#9E8B8E" fontSize={11} tickLine={false} />
                        <YAxis 
                            yAxisId="left" 
                            stroke={TRAJECTORY_SERIES_CONFIG.revenue.color} 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(val) => `₱${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} 
                        />
                        <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke={TRAJECTORY_SERIES_CONFIG.margin.color} 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(val) => `${val}%`} 
                            domain={[0, 100]} 
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload as SalesOverTimeItem;
                                    const rev = data.revenue || 0;
                                    const cogs = data.cogs || 0;
                                    const prof = data.profit ?? (rev - cogs);
                                    const margin = data.margin_pct ?? (rev > 0 ? (prof / rev) * 100 : 0);
                                    return (
                                        <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#1C1C28]/95 border border-[#F8C8DC]/60 dark:border-white/10 shadow-xl backdrop-blur-md text-xs font-['Outfit'] space-y-2 min-w-48">
                                            <p className="font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] border-b border-[#F8C8DC]/40 dark:border-white/10 pb-1">{label}</p>
                                            
                                            {/* Revenue Row (Green) */}
                                            <div className={cn("flex items-center justify-between gap-3 font-semibold", TRAJECTORY_SERIES_CONFIG.revenue.textClass)}>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: TRAJECTORY_SERIES_CONFIG.revenue.color }} />
                                                    <span>Revenue:</span>
                                                </span>
                                                <span className="font-mono font-extrabold">{formatCurrency(rev)}</span>
                                            </div>
                                            
                                            {/* COGS / Ingredient Cost Row (Red) */}
                                            <div className={cn("flex items-center justify-between gap-3 font-semibold", TRAJECTORY_SERIES_CONFIG.cogs.textClass)}>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: TRAJECTORY_SERIES_CONFIG.cogs.color }} />
                                                    <span>COGS / Cost:</span>
                                                </span>
                                                <span className="font-mono font-extrabold">{formatCurrency(cogs)}</span>
                                            </div>
                                            
                                            {/* Net Profit Row (Green) */}
                                            <div className={cn("flex items-center justify-between gap-3 font-semibold", TRAJECTORY_SERIES_CONFIG.profit.textClass)}>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: TRAJECTORY_SERIES_CONFIG.profit.color }} />
                                                    <span>Net Profit:</span>
                                                </span>
                                                <span className="font-mono font-extrabold">{formatCurrency(prof)}</span>
                                            </div>
                                            
                                            {/* Margin % Row (Performance Sky) */}
                                            <div className={cn("flex items-center justify-between gap-3 font-semibold pt-1 border-t border-[#F8C8DC]/20 dark:border-white/5", TRAJECTORY_SERIES_CONFIG.margin.textClass)}>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: TRAJECTORY_SERIES_CONFIG.margin.color }} />
                                                    <span>Profit Margin:</span>
                                                </span>
                                                <span className="font-mono font-extrabold">{margin.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Synchronized Legend: Dynamically reflects series colors and stroke patterns */}
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            content={() => (
                                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-3 border-t border-[#F8C8DC]/20 dark:border-white/5 text-xs font-semibold">
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: TRAJECTORY_SERIES_CONFIG.revenue.color }} />
                                        <span className="text-[#3D2C2E] dark:text-[#E2E8F0] font-bold">{TRAJECTORY_SERIES_CONFIG.revenue.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3.5 h-1 border-b-2 border-dashed shrink-0" style={{ borderColor: TRAJECTORY_SERIES_CONFIG.cogs.color }} />
                                        <span className="text-[#3D2C2E] dark:text-[#E2E8F0] font-bold">{TRAJECTORY_SERIES_CONFIG.cogs.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: TRAJECTORY_SERIES_CONFIG.margin.color }} />
                                        <span className="text-[#3D2C2E] dark:text-[#E2E8F0] font-bold">{TRAJECTORY_SERIES_CONFIG.margin.label}</span>
                                    </div>
                                </div>
                            )}
                        />

                        <Area 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey={TRAJECTORY_SERIES_CONFIG.revenue.key} 
                            name={TRAJECTORY_SERIES_CONFIG.revenue.label} 
                            stroke={TRAJECTORY_SERIES_CONFIG.revenue.color} 
                            strokeWidth={TRAJECTORY_SERIES_CONFIG.revenue.strokeWidth} 
                            fill={`url(#${TRAJECTORY_SERIES_CONFIG.revenue.gradientId})`} 
                        />
                        <Area 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey={TRAJECTORY_SERIES_CONFIG.cogs.key} 
                            name={TRAJECTORY_SERIES_CONFIG.cogs.label} 
                            stroke={TRAJECTORY_SERIES_CONFIG.cogs.color} 
                            strokeWidth={TRAJECTORY_SERIES_CONFIG.cogs.strokeWidth} 
                            strokeDasharray={TRAJECTORY_SERIES_CONFIG.cogs.strokeDasharray} 
                            fill={`url(#${TRAJECTORY_SERIES_CONFIG.cogs.gradientId})`} 
                        />
                        <Area 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey={TRAJECTORY_SERIES_CONFIG.margin.key} 
                            name={TRAJECTORY_SERIES_CONFIG.margin.label} 
                            stroke={TRAJECTORY_SERIES_CONFIG.margin.color} 
                            strokeWidth={TRAJECTORY_SERIES_CONFIG.margin.strokeWidth} 
                            fill={`url(#${TRAJECTORY_SERIES_CONFIG.margin.gradientId})`} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

export function ProductDemandChart({ salesPerProduct }: { salesPerProduct?: SalesPerProductItem[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                    <BarChart3 className="size-4" />
                </div>
                <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                    Top Product Volume Demand
                </h2>
            </div>
            <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] mb-4">
                Highest selling items by checkout volume.
            </p>

            <div className="h-60 w-full min-h-60 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200} initialDimension={{ width: 500, height: 250 }}>
                    <BarChart data={salesPerProduct?.slice(0, 5)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ops-border, rgba(255, 255, 255, 0.06))" />
                        <XAxis dataKey="name" stroke="#9E8B8E" fontSize={10} tickLine={false} interval={0} />
                        <YAxis stroke="#9E8B8E" fontSize={10} tickLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderColor: 'rgba(248, 200, 220, 0.6)',
                                borderRadius: '14px',
                                fontSize: '11px',
                                fontWeight: 700,
                            }}
                        />
                        <Bar dataKey="total_sold" name="Units Sold" fill="#E75480" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

export function PaymentMixChart({ salesByPaymentMethod = [] }: { salesByPaymentMethod?: PaymentMethodItem[] }) {
    const totalInflow = React.useMemo(() => salesByPaymentMethod.reduce((sum, item) => sum + (item.revenue || 0), 0), [salesByPaymentMethod]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                    <PieIcon className="size-4" />
                </div>
                <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                    Payment Method Inflow
                </h2>
            </div>
            <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] mb-4">
                Revenue distribution across payment channels.
            </p>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="h-56 w-full md:w-1/2 min-h-56 min-w-0 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={180} initialDimension={{ width: 250, height: 200 }}>
                        <PieChart>
                            <Pie
                                data={salesByPaymentMethod}
                                dataKey="revenue"
                                nameKey="payment_method"
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={76}
                                paddingAngle={4}
                            >
                                {salesByPaymentMethod.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload as PaymentMethodItem;
                                        const pct = data.percentage ?? (totalInflow > 0 ? (data.revenue / totalInflow) * 100 : 0);
                                        return (
                                            <div className="p-3 rounded-2xl bg-white/95 dark:bg-[#1C1C28]/95 border border-[#F8C8DC]/60 dark:border-white/10 shadow-xl backdrop-blur-md text-xs font-['Outfit'] space-y-1">
                                                <p className="font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">{data.payment_method}</p>
                                                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.revenue)} ({pct.toFixed(1)}%)</p>
                                                {data.count !== undefined && <p className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] font-medium">{data.count} transaction(s)</p>}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">Total Inflow</span>
                        <span className="text-xs font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(totalInflow)}</span>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="w-full md:w-1/2 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {salesByPaymentMethod.map((item, index) => {
                        const pct = item.percentage ?? (totalInflow > 0 ? (item.revenue / totalInflow) * 100 : 0);
                        const color = PIE_COLORS[index % PIE_COLORS.length];

                        return (
                            <div key={index} className="flex items-center justify-between p-2 rounded-xl bg-[#FFF5F7]/60 dark:bg-white/5 border border-[#F8C8DC]/30 dark:border-white/5 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC] truncate">{item.payment_method}</span>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] block">{formatCurrency(item.revenue)}</span>
                                    <span className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] font-bold block">{pct.toFixed(1)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
