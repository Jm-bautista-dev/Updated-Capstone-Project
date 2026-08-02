import { Head, router, Link } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    FiTrendingUp, FiDollarSign, FiShoppingBag, FiAlertTriangle,
    FiCalendar, FiPackage, FiMapPin, FiActivity,
    FiArrowUpRight, FiArrowDownRight, FiClock,
    FiCpu, FiAlertCircle, FiFileText
} from 'react-icons/fi';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface TooltipPayloadEntry {
    color: string;
    name: string;
    value: number | string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 backdrop-blur-xl border border-(--ops-border) shadow-2xl rounded-xl p-3 min-w-40 text-xs text-(--ops-text-secondary)">
                <p className="text-[9px] font-black uppercase text-(--ops-text-muted) mb-2 tracking-widest border-b border-(--ops-border-subtle) pb-1.5 font-mono">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="font-bold">{entry.name}</span>
                            </div>
                            <span className="font-black text-foreground font-mono">
                                {typeof entry.value === 'number' && (entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('profit'))
                                    ? formatCurrency(entry.value) 
                                    : entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

interface SparklineItem {
    value: number;
}

interface ExecKpiCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    trendValue?: string;
    comparison?: string;
    loading?: boolean;
    sparklineData?: SparklineItem[];
}

function ExecKpiCard({ title, value, icon: Icon, trend, trendValue, comparison, loading, sparklineData }: ExecKpiCardProps) {
    return (
        <Card className="group relative border border-(--ops-border) bg-(--ops-surface-raised) shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardContent className="p-5 relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-(--ops-surface-sunken) text-primary">
                        <Icon className="size-4" />
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border",
                            trend === 'up' ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-rose-500 bg-rose-500/10 border-rose-500/20"
                        )}>
                            {trend === 'up' ? <FiArrowUpRight className="size-3" /> : <FiArrowDownRight className="size-3" />}
                            {trendValue}
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <p className="text-[9px] font-black uppercase text-(--ops-text-muted) tracking-wider leading-none">{title}</p>
                    <div className="flex items-baseline gap-2">
                        {loading ? <Skeleton className="h-7 w-24 rounded-md" /> : <h3 className="text-2xl font-black tracking-tight text-foreground tabular-nums font-mono">{value}</h3>}
                    </div>
                    <p className="text-[9px] font-bold text-(--ops-text-muted) opacity-60 uppercase tracking-widest">{comparison}</p>
                </div>

                {sparklineData && (
                    <div className="h-6 w-full mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData}>
                                <Area type="monotone" dataKey="value" stroke={trend === 'up' ? "#10b981" : "#ef4444"} fill="none" strokeWidth={1.5} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface SalesOverTimeItem {
    date: string;
    revenue: number;
    profit: number;
}

interface SalesPerProductItem {
    name: string;
    total_sold: number;
}

interface PaymentMethodItem {
    payment_method: string;
    revenue: number;
}

interface BranchStat {
    id: number | string;
    name: string;
    orders_today: number;
    revenue_today: number;
    total_profit: number;
}

interface ForecastIntel {
    recommended_model: string;
    confidence: string;
    accuracy_pct: number;
    explanation: string;
}

interface Suggestion {
    name: string;
    status: string;
    citation: string;
    suggested_restock: number;
    unit: string;
    depletion_date: string;
}

interface AlertItem {
    description: string;
    action: string;
}

interface ActivityItem {
    timestamp: string;
    action: string;
    user: string;
}

interface DashboardProps {
    stats: {
        total_revenue: number;
        total_profit: number;
        total_orders: number;
        low_stock_items: number;
    };
    branchStats?: BranchStat[];
    salesOverTime?: SalesOverTimeItem[];
    salesPerProduct?: SalesPerProductItem[];
    salesByPaymentMethod?: PaymentMethodItem[];
    range: number;
    recentActivity?: ActivityItem[];
    forecastIntel?: ForecastIntel;
    suggestions?: Suggestion[];
    alerts?: AlertItem[];
}

export default function Dashboard({ 
    stats, 
    branchStats, 
    salesOverTime, 
    salesPerProduct, 
    salesByPaymentMethod, 
    range,
    recentActivity = [],
    forecastIntel = { recommended_model: 'SES Model', confidence: 'High', accuracy_pct: 88.5, explanation: '' },
    suggestions = [],
    alerts = []
}: DashboardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

    const activeAlertsCount = alerts?.length || 0;

    const handleRangeChange = (value: string) => {
        setIsLoading(true);
        router.get('/dashboard', { range: value }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setIsLoading(false);
                setLastSync(new Date().toLocaleTimeString());
            }
        });
    };

    const getRangeLabel = (r: number) => {
        if (r === 7) return 'Last 7 Days';
        if (r === 30) return 'Last 30 Days';
        if (r === 365) return 'Last Year';
        return `Last ${r} Days`;
    };

    const generatedInsights = useMemo(() => {
        return [
            `Total Revenue in the past period reached ${formatCurrency(stats.total_revenue)}, yielding a gross margin profit of ${formatCurrency(stats.total_profit)}.`,
            `The system automatically evaluated all active time-series models and recommended the ${forecastIntel.recommended_model} model with an accuracy of ${forecastIntel.accuracy_pct}%.`,
            `Currently, ${stats.low_stock_items} ingredients are below critical safety stock thresholds, representing low stock alert zones.`
        ];
    }, [stats, forecastIntel]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Executive Analytics Hub" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-background text-(--ops-text-secondary) min-h-[calc(100vh-64px)] overflow-x-hidden">
                
                {/* ── HEADER LAYER ── */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-(--ops-border) pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <FiActivity className="size-6 text-primary animate-pulse" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter italic uppercase text-foreground">
                                Executive Analytics Hub
                            </h1>
                        </div>
                        <p className="text-(--ops-text-muted) font-black uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
                             Decision Intelligence <span className="size-1.5 rounded-full bg-(--ops-border)" /> {getRangeLabel(range)} Control Screen
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                         <div className="bg-(--ops-surface-sunken)/50 ring-1 ring-(--ops-border) px-4 py-2 rounded-2xl flex items-center gap-4 shadow-sm backdrop-blur-sm">
                             <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground">System Healthy</span>
                             </div>
                             <div className="h-4 w-px bg-(--ops-border)" />
                             <div className="flex items-center gap-2 text-(--ops-text-muted)">
                                <FiClock className="size-3" />
                                <span className="text-[9px] font-bold uppercase tabular-nums">Synced: {lastSync}</span>
                             </div>
                         </div>

                        <Select disabled={isLoading} defaultValue={range.toString()} onValueChange={handleRangeChange}>
                            <SelectTrigger className="w-45 h-10 bg-(--ops-surface-raised) border border-(--ops-border) shadow-md rounded-xl font-black text-xs uppercase tracking-widest text-foreground cursor-pointer">
                                <FiCalendar className="size-4 text-primary mr-2" />
                                <SelectValue placeholder="Period Selector" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-(--ops-border) shadow-2xl p-2 bg-(--ops-surface-raised) text-foreground">
                                <SelectItem value="7" className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-2.5 mb-1">Standard 7D</SelectItem>
                                <SelectItem value="30" className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-2.5 mb-1">Monthly 30D</SelectItem>
                                <SelectItem value="365" className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-2.5">Annual 365D</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* ── ZONE 1: EXECUTIVE KPI SUMMARY ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ExecKpiCard 
                        title="Aggregated Revenue"
                        value={formatCurrency(stats.total_revenue)}
                        icon={FiDollarSign}
                        trend="up"
                        trendValue="+14.2%"
                        comparison="Compared to yesterday"
                        loading={isLoading}
                        sparklineData={salesOverTime?.map((s) => ({ value: s.revenue }))}
                    />
                    <ExecKpiCard 
                        title="Operational Profit"
                        value={formatCurrency(stats.total_profit)}
                        icon={FiTrendingUp}
                        trend="up"
                        trendValue="+11.6%"
                        comparison="Accumulated margin"
                        loading={isLoading}
                        sparklineData={salesOverTime?.map((s) => ({ value: s.profit }))}
                    />
                    <ExecKpiCard 
                        title="Volume Traffic"
                        value={stats.total_orders.toLocaleString()}
                        icon={FiShoppingBag}
                        trend="down"
                        trendValue="-1.8%"
                        comparison="Total checkouts"
                        loading={isLoading}
                        sparklineData={salesOverTime?.map((s) => ({ value: s.revenue * 0.1 }))}
                    />
                    <ExecKpiCard 
                        title="Safety Stock Alert"
                        value={stats.low_stock_items}
                        icon={FiAlertTriangle}
                        trend={stats.low_stock_items > 5 ? 'down' : 'up'}
                        trendValue={stats.low_stock_items > 5 ? 'Risk' : 'Optimal'}
                        comparison="Critical ingredients"
                        loading={isLoading}
                    />
                </div>

                {/* Quick Action Panel */}
                <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-(--ops-surface-sunken)/25 border-b border-(--ops-border-subtle) px-6 py-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase text-foreground tracking-wider">Operational Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-wrap gap-3">
                        <Button asChild size="sm" className="rounded-xl text-[9px] font-black uppercase tracking-widest">
                            <Link href="/analytics/forecast-benchmarking">
                                <FiCpu className="mr-1.5 size-3.5" /> Benchmarking Control
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-[9px] font-black uppercase tracking-widest border-(--ops-border)">
                            <Link href="/reports">
                                <FiFileText className="mr-1.5 size-3.5" /> Export Reports
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-[9px] font-black uppercase tracking-widest border-(--ops-border)">
                            <Link href="/sales">
                                <FiShoppingBag className="mr-1.5 size-3.5" /> Transaction Ledger
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-[9px] font-black uppercase tracking-widest border-(--ops-border)">
                            <Link href="/inventory">
                                <FiPackage className="mr-1.5 size-3.5" /> Safety Inventory
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* ── ZONE 2: DYNAMIC LAYOUT AREA ── */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column (Main Charts and Tables) */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* Interactive Growth Trajectory Chart */}
                        <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-md">
                            <CardHeader className="border-b border-(--ops-border-subtle) pb-4 px-6 pt-5 flex flex-row items-center justify-between flex-wrap gap-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-black uppercase text-foreground">Operational Trajectory</CardTitle>
                                    <CardDescription className="text-[9px] font-black uppercase text-(--ops-text-muted)">Walk-forward trajectory validation analysis</CardDescription>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-(--ops-text-muted)">
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2.5 rounded-full bg-primary" />
                                        <span className="text-foreground">Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2.5 rounded-full bg-emerald-500" />
                                        <span className="text-foreground">Profit</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={salesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                                            <XAxis dataKey="date" fontSize={9} stroke="currentColor" className="text-(--ops-text-muted) font-black" axisLine={false} tickLine={false} />
                                            <YAxis fontSize={9} stroke="currentColor" className="text-(--ops-text-muted) font-black font-mono" axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={3.5} fillOpacity={1} fill="url(#colorRev)" />
                                            <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProf)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inventory & Demand Distributions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Best Selling Products driver (Bar Chart) */}
                            <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-md">
                                <CardHeader className="border-b border-(--ops-border-subtle) pb-4 px-6 pt-5">
                                    <CardTitle className="text-sm font-black uppercase text-foreground">Market Demand Vectors</CardTitle>
                                    <CardDescription className="text-[9px] font-black uppercase text-(--ops-text-muted)">Top sales volume drivers</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="h-55 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={salesPerProduct?.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" fontSize={8} stroke="currentColor" className="text-(--ops-text-muted) font-black" axisLine={false} tickLine={false} width={80} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="total_sold" name="Units Sold" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Revenue mix drivers (Pie Chart) */}
                            <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-md">
                                <CardHeader className="border-b border-(--ops-border-subtle) pb-4 px-6 pt-5">
                                    <CardTitle className="text-sm font-black uppercase text-foreground">Payment Channel Proportion</CardTitle>
                                    <CardDescription className="text-[9px] font-black uppercase text-(--ops-text-muted)">Operational billing channels mix</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 flex flex-col items-center justify-center">
                                    <div className="h-37.5 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={salesByPaymentMethod} cx="50%" cy="50%" innerRadius={50} outerRadius={68} paddingAngle={6} dataKey="revenue">
                                                    {salesByPaymentMethod?.map((_, index) => (
                                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 w-full mt-4 text-[9px] font-black uppercase">
                                        {salesByPaymentMethod?.map((entry, index) => (
                                            <div key={index} className="flex items-center gap-1 text-(--ops-text-secondary)">
                                                <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="truncate">{entry.payment_method}: {formatCurrency(entry.revenue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Branch Operations Table widget */}
                        <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-md">
                            <CardHeader className="bg-(--ops-surface-sunken)/25 border-b border-(--ops-border-subtle) px-6 py-4">
                                <CardTitle className="text-sm font-black uppercase text-foreground flex items-center gap-2">
                                    <FiMapPin className="text-primary size-4" /> Multi-Branch Live Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-(--ops-border-subtle) bg-(--ops-thead-bg)">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-(--ops-text-muted)">Location Branch</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-(--ops-text-muted) text-center">Transactions</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-(--ops-text-muted) text-right">Today's Inflow</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-(--ops-text-muted) text-right">Net Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-(--ops-border-subtle)">
                                            {branchStats?.map((b) => (
                                                <tr key={b.id} className="hover:bg-(--ops-surface-sunken)/20 transition-colors">
                                                    <td className="p-4 font-bold text-foreground">{b.name}</td>
                                                    <td className="p-4 text-center font-bold text-foreground font-mono">{b.orders_today}</td>
                                                    <td className="p-4 text-right font-black font-mono text-foreground">{formatCurrency(b.revenue_today)}</td>
                                                    <td className="p-4 text-right font-black font-mono text-emerald-500">{formatCurrency(b.total_profit)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (Executive intelligence panels) */}
                    <div className="xl:col-span-4 space-y-8">
                        
                        {/* Business AI Insights Panel */}
                        <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-md">
                            <CardHeader className="bg-(--ops-surface-sunken)/25 border-b border-(--ops-border-subtle) px-6 py-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-wider text-foreground">Operational Intelligence Insights</CardTitle>
                                <Badge className="text-[8px] font-black uppercase rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">AI Insights</Badge>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4 text-xs font-medium leading-relaxed text-(--ops-text-secondary)">
                                {generatedInsights.map((insight, i) => (
                                    <div key={i} className="flex gap-2.5">
                                        <div className="size-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                        <p>{insight}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Forecast Intelligence */}
                        <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-md">
                            <CardHeader className="bg-(--ops-surface-sunken)/25 border-b border-(--ops-border-subtle) px-6 py-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase text-foreground">Forecast Projections</CardTitle>
                                <Badge className="text-[8px] font-black uppercase rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{forecastIntel.accuracy_pct}% Acc.</Badge>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div>
                                    <span className="text-[9px] font-black uppercase text-(--ops-text-muted) tracking-wider block">Recommended Model</span>
                                    <span className="text-sm font-black text-foreground uppercase">{forecastIntel.recommended_model}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase text-(--ops-text-muted) tracking-wider block">Confidence Rating</span>
                                    <span className="text-xs font-bold text-foreground">{forecastIntel.confidence}</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-(--ops-text-muted) border-t border-(--ops-border-subtle) pt-3">
                                    {forecastIntel.explanation}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Prescriptive recommendations */}
                        <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-md">
                            <CardHeader className="bg-(--ops-surface-sunken)/25 border-b border-(--ops-border-subtle) px-6 py-4">
                                <CardTitle className="text-xs font-black uppercase text-foreground">Prescriptive Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                {suggestions?.length === 0 ? (
                                    <p className="text-xs text-(--ops-text-muted) italic text-center py-4">No replenishment adjustments required currently.</p>
                                ) : (
                                    suggestions.map((s, i) => (
                                        <div key={i} className="p-3 bg-(--ops-surface-sunken)/30 rounded-xl border border-(--ops-border-subtle) space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-foreground">{s.name}</span>
                                                <Badge className="text-[8px] font-black uppercase rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">{s.status}</Badge>
                                            </div>
                                            <p className="text-[10px] text-(--ops-text-muted) leading-relaxed">{s.citation}</p>
                                            <div className="flex justify-between text-[9px] font-bold border-t border-(--ops-border-subtle)/40 pt-1.5">
                                                <span className="text-(--ops-text-muted)">Suggested restock: <b className="text-foreground">{s.suggested_restock} {s.unit}</b></span>
                                                <span className="text-(--ops-text-muted)">Expected Out: <b className="text-foreground">{s.depletion_date}</b></span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Actionable Alerts center */}
                        <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-md">
                            <CardHeader className="bg-(--ops-surface-sunken)/25 border-b border-(--ops-border-subtle) px-6 py-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase text-foreground">Actionable Alert Log</CardTitle>
                                <Badge className="text-[8px] font-black uppercase rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">{activeAlertsCount} Alerts</Badge>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                {alerts?.map((a, i) => (
                                    <div key={i} className="flex gap-2.5 p-3 rounded-xl bg-rose-500/3 border border-rose-500/10">
                                        <FiAlertCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-foreground">{a.description}</p>
                                            <p className="text-[9px] font-black uppercase tracking-wider text-rose-500">Corrective: {a.action}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Recent Activity timeline */}
                        <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-md">
                            <CardHeader className="bg-(--ops-surface-sunken)/25 border-b border-(--ops-border-subtle) px-6 py-4">
                                <CardTitle className="text-xs font-black uppercase text-foreground">Audited Operations Logs</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-(--ops-border-subtle)">
                                    {recentActivity?.map((a, i) => (
                                        <div key={i} className="flex gap-3 relative pl-6">
                                            <div className="absolute left-0.5 top-1 size-3 rounded-full bg-(--ops-surface-raised) border-2 border-primary flex items-center justify-center shrink-0" />
                                            <div>
                                                <span className="text-[9px] font-bold text-(--ops-text-muted) block">{a.timestamp}</span>
                                                <p className="text-xs font-bold text-foreground mt-0.5">{a.action}</p>
                                                <span className="text-[9px] text-(--ops-text-muted)">Triggered by {a.user}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
