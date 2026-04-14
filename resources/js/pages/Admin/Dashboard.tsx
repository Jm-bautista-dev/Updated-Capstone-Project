import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FiTrendingUp, FiDollarSign, FiShoppingBag, FiAlertTriangle,
    FiCalendar, FiLoader, FiPackage, FiMapPin, FiActivity, FiZap, FiArrowUpRight, FiArrowDownRight, FiCheckCircle, FiClock, FiDatabase
} from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

// ── Custom Glassmorphism Tooltip ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/80 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-4 ring-1 ring-black/5 min-w-[160px]">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-[0.1em] border-b border-white/10 pb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]" style={{ backgroundColor: entry.color }} />
                                <span className="text-[11px] font-bold text-foreground/80 capitalize">{entry.name}</span>
                            </div>
                            <span className="text-[11px] font-black text-foreground tabular-nums">
                                {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue') 
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

// ── Reusable Stat Card with Glow ──────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, trend, trendValue, subtitle, colorClass, loading }: any) {
    return (
        <Card className="group relative border-none shadow-sm ring-1 ring-border bg-card hover:ring-primary/40 transition-all duration-500 overflow-hidden">
             {/* Subtle Glow Effect */}
             <div className={cn("absolute -right-4 -top-4 size-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700", colorClass)} />
            
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className={cn("p-2.5 rounded-xl bg-muted/50 dark:bg-zinc-800 transition-all duration-300 group-hover:scale-110", colorClass.replace('bg-', 'text-'))}>
                        <Icon className="size-5" />
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-tighter",
                            trend === 'up' ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                        )}>
                            {trend === 'up' ? <FiArrowUpRight className="size-3" /> : <FiArrowDownRight className="size-3" />}
                            {trendValue}
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">{title}</p>
                    <div className="flex items-baseline gap-2 pt-1">
                        {loading ? <Skeleton className="h-8 w-24 rounded-lg" /> : <h3 className="text-2xl font-black tracking-tight text-foreground dark:text-white tabular-nums">{value}</h3>}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Decision Intelligence Mini Card ────────────────────────────────────────────
function IntelligenceCard({ label, value, subtext, icon: Icon, trendColor }: any) {
    return (
        <div className="bg-muted/30 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-border/40 flex items-center justify-between group hover:bg-muted/50 transition-colors cursor-default">
            <div className="flex items-center gap-3">
                <div className={cn("size-9 rounded-xl flex items-center justify-center text-white shadow-lg", trendColor)}>
                    <Icon className="size-4" />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-tighter leading-none">{label}</p>
                    <p className="text-[13px] font-black italic uppercase text-foreground dark:text-zinc-200 tracking-tighter mt-1 truncate max-w-[140px]">{value}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase leading-none">{subtext}</p>
            </div>
        </div>
    );
}

// ── Branch Stat Card ─────────────────────────────────────────────────────────
function BranchStatCard({ branch }: { branch: any }) {
    return (
        <Card className="border-none shadow-sm ring-1 ring-border bg-card/50 dark:bg-zinc-900/40 backdrop-blur-sm flex-1 min-w-[320px] group hover:ring-primary/30 transition-all duration-300">
            <CardHeader className="pb-4 border-b border-border/40 space-y-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-black italic uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">
                        <FiMapPin className="size-4" />
                        {branch.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Net Revenue</p>
                        <p className="text-xl font-black text-foreground dark:text-white leading-none tabular-nums">{formatCurrency(branch.total_revenue)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Gross Profit</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none tabular-nums">{formatCurrency(branch.total_profit)}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex-1 bg-muted/40 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-border/40">
                         <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">Traffic</p>
                         <p className="text-sm font-black text-foreground dark:text-zinc-200 tabular-nums">{branch.total_orders} <span className="text-[10px] text-muted-foreground font-bold">Orders</span></p>
                    </div>
                     <div className="flex-1 bg-muted/40 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-border/40">
                         <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">Inventory</p>
                         <p className={cn("text-sm font-black tabular-nums", branch.low_stock_count > 0 ? "text-rose-500" : "text-foreground dark:text-zinc-200")}>
                            {branch.inventory_count} <span className="text-[10px] font-bold text-muted-foreground/60">{branch.low_stock_count} Crit.</span>
                         </p>
                    </div>
                </div>

                {branch.low_stock_ingredients?.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-rose-500 mb-2">
                            <span className="flex items-center gap-1.5 opacity-80"><FiAlertTriangle className="size-3" /> Critical Stock</span>
                            <span>{branch.low_stock_count} Items</span>
                        </div>
                        <div className="space-y-1">
                            {branch.low_stock_ingredients.slice(0, 2).map((ing: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground transition-colors">
                                    <span className="truncate max-w-[150px]">{ing.name}</span>
                                    <span className="text-rose-600 dark:text-rose-400 tabular-nums font-black">{Number(ing.stock).toLocaleString()} {ing.unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ stats, branchStats, salesOverTime, salesPerProduct, salesByPaymentMethod, range }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

    // Dynamic Insight Calculations
    const bestBranch = useMemo(() => {
        if (!branchStats?.length) return null;
        return [...branchStats].sort((a, b) => b.revenue_today - a.revenue_today)[0];
    }, [branchStats]);

    const worstBranch = useMemo(() => {
        if (!branchStats?.length) return null;
        return [...branchStats].sort((a, b) => a.revenue_today - b.revenue_today)[0];
    }, [branchStats]);

    const topProduct = useMemo(() => {
        if (!salesPerProduct?.length) return null;
        return [...salesPerProduct].sort((a, b) => b.total_sold - a.total_sold)[0];
    }, [salesPerProduct]);

    const totalRevenue = useMemo(() => {
        return salesByPaymentMethod.reduce((acc: number, curr: any) => acc + Number(curr.revenue), 0);
    }, [salesByPaymentMethod]);

    useEffect(() => {
        if (!isLoading) setLastSync(new Date().toLocaleTimeString());
    }, [isLoading]);

    const handleRangeChange = (value: string) => {
        setIsLoading(true);
        router.get('/dashboard', { range: value }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const getRangeLabel = (r: number) => {
        if (r === 7) return 'Last 7 Days';
        if (r === 30) return 'Last 30 Days';
        if (r === 365) return 'Last Year';
        return `Last ${r} Days`;
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Maki Desu Ops Intelligence" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-10 bg-background dark:bg-zinc-950 min-h-[calc(100vh-64px)] overflow-x-hidden">
                
                {/* ── Header Layer ── */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-border/40 pb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <FiActivity className="size-6 animate-pulse" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter italic uppercase text-foreground dark:text-white">
                                Dashboard
                            </h1>
                        </div>
                        <p className="text-muted-foreground dark:text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
                             System Intel <span className="size-1 rounded-full bg-border" /> {getRangeLabel(range)} Overview
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Live Sync Component */}
                         <div className="bg-card/50 ring-1 ring-border px-4 py-2.5 rounded-2xl flex items-center gap-4 shadow-sm backdrop-blur-sm">
                             <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground dark:text-zinc-400">System Healthy</span>
                             </div>
                             <div className="h-4 w-px bg-border" />
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <FiClock className="size-3" />
                                <span className="text-[10px] font-bold uppercase tabular-nums">Synced: {lastSync}</span>
                             </div>
                         </div>

                        <Select disabled={isLoading} defaultValue={range.toString()} onValueChange={handleRangeChange}>
                            <SelectTrigger className="w-[200px] h-12 bg-card dark:bg-zinc-900 border-none ring-1 ring-border shadow-md rounded-2xl font-black text-xs uppercase tracking-widest italic transition-all hover:ring-primary/50 focus:ring-primary/50 cursor-pointer">
                                <FiCalendar className="size-4 text-primary mr-2" />
                                <SelectValue placeholder="Control Period" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border shadow-2xl p-2 bg-card/95 backdrop-blur-xl">
                                <SelectItem value="7" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3 mb-1">Standard 7D</SelectItem>
                                <SelectItem value="30" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3 mb-1">Monthly 30D</SelectItem>
                                <SelectItem value="365" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">Annual 365D</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* ── Zone 1: KPI Intelligence ── */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Total Capital Inflow" 
                            value={formatCurrency(stats.total_revenue)} 
                            icon={FiDollarSign} 
                            trend="up" 
                            trendValue="+12%" 
                            subtitle="Revenue Growth"
                            colorClass="bg-indigo-500"
                            loading={isLoading}
                        />
                         <StatCard 
                            title="Accumulated Margin" 
                            value={formatCurrency(stats.total_profit)} 
                            icon={FiTrendingUp} 
                            trend="up" 
                            trendValue="+8%" 
                            subtitle="Profit Yield"
                            colorClass="bg-emerald-500"
                            loading={isLoading}
                        />
                         <StatCard 
                            title="Transaction Batch" 
                            value={stats.total_orders.toLocaleString()} 
                            icon={FiShoppingBag} 
                            trend="down" 
                            trendValue="-2%" 
                            subtitle="Order Velocity"
                            colorClass="bg-violet-500"
                            loading={isLoading}
                        />
                         <StatCard 
                            title="Inventory Risk" 
                            value={stats.low_stock_items} 
                            icon={FiAlertTriangle} 
                            trend={stats.low_stock_items > 5 ? 'down' : 'up'} 
                            trendValue={stats.low_stock_items > 5 ? 'High' : 'Safe'} 
                            subtitle="Low Stock Units"
                            colorClass={stats.low_stock_items > 5 ? "bg-rose-500" : "bg-primary"}
                            loading={isLoading}
                        />
                    </div>

                    {/* ── Decision Intelligence Panel ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                        <IntelligenceCard 
                            label="Fastest Seller"
                            value={topProduct?.name || '---'}
                            subtext={`${topProduct?.total_sold || 0} Units`}
                            icon={FiZap}
                            trendColor="bg-amber-500 shadow-amber-500/20"
                        />
                        <IntelligenceCard 
                            label="Critical Stock"
                            value={`${stats.low_stock_items} Alerts`}
                            subtext="Restock Req."
                            icon={FiPackage}
                            trendColor="bg-rose-500 shadow-rose-500/20"
                        />
                        <IntelligenceCard 
                            label="Peak branch"
                            value={bestBranch?.name || '---'}
                            subtext={formatCurrency(bestBranch?.revenue_today || 0)}
                            icon={FiTrendingUp}
                            trendColor="bg-indigo-600 shadow-indigo-600/20"
                        />
                         <IntelligenceCard 
                            label="Low performance"
                            value={worstBranch?.name || '---'}
                            subtext={formatCurrency(worstBranch?.revenue_today || 0)}
                            icon={FiMapPin}
                            trendColor="bg-zinc-500 shadow-zinc-500/20"
                        />
                        <IntelligenceCard 
                            label="Data Pulse"
                            value="Synchronized"
                            subtext="Multi-branch"
                            icon={FiDatabase}
                            trendColor="bg-emerald-500 shadow-emerald-500/20"
                        />
                    </div>
                </div>

                <div className="h-px bg-border/40 w-full" />

                {/* ── Zone 2: Core Analytics ── */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Primary Area Chart (Hero) */}
                    <Card className="xl:col-span-8 border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between p-8">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                                    Growth Trajectory
                                </CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Revenue vs Profit Analysis</CardDescription>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.4)]" />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground dark:text-zinc-400">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground dark:text-zinc-400">Profit</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="h-[420px] w-full px-6 pb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesOverTime} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="currentColor" 
                                            className="text-muted-foreground dark:text-zinc-600" 
                                            fontSize={10} 
                                            fontWeight="black" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tickMargin={15}
                                        />
                                        <YAxis 
                                            stroke="currentColor" 
                                            className="text-muted-foreground dark:text-zinc-600" 
                                            fontSize={10} 
                                            fontWeight="black" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`}
                                            tickMargin={15}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '6 6' }} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            name="Revenue" 
                                            stroke="#6366f1" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorRevenue)" 
                                            animationDuration={2000}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="profit" 
                                            name="Profit" 
                                            stroke="#10b981" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorProfit)" 
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Secondary Metrics Column */}
                    <div className="xl:col-span-4 space-y-8 h-full">
                        {/* Market Demand (Bar Chart) */}
                        <Card className="border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 flex flex-col h-[calc(50%-16px)]">
                            <CardHeader className="p-6">
                                <CardTitle className="text-base font-black italic uppercase tracking-tighter">Market Demand</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Top Volume Drivers</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 flex-1">
                                <div className="h-full w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesPerProduct.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="name" 
                                                type="category" 
                                                stroke="currentColor" 
                                                className="text-muted-foreground dark:text-zinc-400" 
                                                fontSize={9} 
                                                fontWeight="black" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                width={90} 
                                                tickFormatter={(t) => t.toUpperCase()}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                                            <Bar 
                                                dataKey="total_sold" 
                                                name="Units Sold"
                                                fill="#6366f1" 
                                                radius={[0, 4, 4, 0]} 
                                                barSize={14}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Revenue Distribution (Pie Chart) */}
                        <Card className="border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 h-[calc(50%-16px)]">
                            <CardHeader className="p-6">
                                <CardTitle className="text-base font-black italic uppercase tracking-tighter">Distribution Widget</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Platform Revenue Mix</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 relative h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={salesByPaymentMethod}
                                            cx="50%" cy="50%"
                                            innerRadius={55} 
                                            outerRadius={75} 
                                            paddingAngle={8}
                                            dataKey="revenue" 
                                            nameKey="payment_method"
                                            animationDuration={1500}
                                        >
                                            {salesByPaymentMethod.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] text-center pointer-events-none">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Total</p>
                                    <p className="text-[13px] font-black tabular-nums text-foreground dark:text-white leading-none">
                                        ₱{(totalRevenue/1000).toFixed(1)}k
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ── Zone 3: Operations Layer ── */}
                <div className="space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="h-px bg-border/40 flex-1" />
                        <h2 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2 text-foreground dark:text-white shrink-0">
                            <FiMapPin className="text-primary size-5" />
                            Operations Pulse
                        </h2>
                        <div className="h-px bg-border/40 flex-1" />
                    </div>
                    
                    {/* Branch Horizontal Scroll */}
                    <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide no-scrollbar scroll-smooth">
                        {branchStats?.map((branch: any) => (
                            <BranchStatCard key={branch.id} branch={branch} />
                        ))}
                    </div>

                    {/* Pulse Board Table */}
                    <Card className="border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 overflow-hidden">
                        <CardHeader className="bg-muted/30 dark:bg-zinc-800/50 border-b border-border/40 py-6 px-8">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-3">
                                     Real-time Branch Pulse Board
                                </CardTitle>
                                <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-widest py-1 border-border bg-card">
                                    {branchStats?.length || 0} Assets Connected
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/10 dark:bg-black/20">
                                        <tr className="border-b border-border/40">
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Asset Location</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Batch Traffic</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-right pr-12">Inflow Vector</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {branchStats?.map((b: any) => (
                                            <tr key={b.id} className="hover:bg-primary/[0.03] dark:hover:bg-white/[0.01] transition-all duration-300 group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:scale-125 transition-transform" />
                                                        <span className="font-black italic uppercase text-sm tracking-tighter text-foreground group-hover:text-primary transition-colors">{b.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <span className="font-mono font-black text-xs text-foreground bg-muted/50 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl tabular-nums ring-1 ring-border/40 border border-white/5">{b.orders_today} <span className="text-[10px] text-muted-foreground/60 ml-1">TRX</span></span>
                                                </td>
                                                <td className="px-8 py-4 text-right pr-12">
                                                    <span className="font-black text-[17px] tracking-tighter italic text-primary dark:text-primary-foreground tabular-nums">{formatCurrency(b.revenue_today)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
