import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
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
    FiCalendar, FiLoader, FiPackage, FiMapPin, FiActivity, FiZap, FiArrowUpRight, FiArrowDownRight, FiCheckCircle
} from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

// ── Custom Tooltip for Recharts ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 ring-1 ring-black/5">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-widest">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-bold text-foreground capitalize">{entry.name}</span>
                            </div>
                            <span className="text-xs font-black text-foreground">
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

// ── Reusable Stat Card ───────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, trend, trendValue, subtitle, colorClass, loading }: any) {
    return (
        <Card className="border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 hover:shadow-md transition-all duration-300 group overflow-hidden relative">
             <div className={cn("absolute top-0 right-0 size-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20", colorClass)} />
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2.5 rounded-xl bg-muted/50 dark:bg-zinc-800 transition-colors group-hover:bg-primary/10", colorClass.replace('bg-', 'text-'))}>
                        <Icon className="size-5" />
                    </div>
                    {trend && (
                        <Badge variant="outline" className={cn(
                            "rounded-lg px-2 py-0.5 border-none font-black text-[10px] uppercase transition-colors",
                            trend === 'up' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        )}>
                            {trend === 'up' ? <FiArrowUpRight className="mr-1 inline" /> : <FiArrowDownRight className="mr-1 inline" />}
                            {trendValue}
                        </Badge>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
                    <div className="flex items-baseline gap-2">
                        {loading ? <Skeleton className="h-8 w-24 rounded-lg" /> : <h3 className="text-2xl font-black tracking-tighter text-foreground dark:text-white tabular-nums">{value}</h3>}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/60">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Branch Stat Card ─────────────────────────────────────────────────────────
function BranchStatCard({ branch }: { branch: any }) {
    return (
        <Card className="border-none shadow-sm ring-1 ring-border bg-card/50 dark:bg-zinc-900/40 backdrop-blur-sm flex-1 min-w-[300px]">
            <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-black italic uppercase tracking-tighter">
                        <FiMapPin className="text-primary size-4" />
                        {branch.name}
                    </CardTitle>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-black text-[9px] uppercase tracking-widest">Live</Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Net Revenue</p>
                        <p className="text-lg font-black text-foreground dark:text-white leading-none">{formatCurrency(branch.total_revenue)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Gross Profit</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{formatCurrency(branch.total_profit)}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 bg-muted/30 dark:bg-zinc-800/50 p-3 rounded-xl border border-border/40">
                         <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Orders</p>
                         <p className="text-sm font-black text-foreground dark:text-zinc-200">{branch.total_orders}</p>
                    </div>
                     <div className="flex-1 bg-muted/30 dark:bg-zinc-800/50 p-3 rounded-xl border border-border/40">
                         <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Stock</p>
                         <p className={cn("text-sm font-black", branch.low_stock_count > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground dark:text-zinc-200")}>
                            {branch.inventory_count} <span className="text-[9px] font-bold text-muted-foreground/60">{branch.low_stock_count} low</span>
                         </p>
                    </div>
                </div>

                {branch.low_stock_ingredients?.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                        <p className="text-[9px] font-black uppercase text-rose-500 dark:text-rose-400 tracking-widest flex items-center gap-1.5 bg-rose-500/5 p-1.5 rounded-lg border border-rose-500/10">
                            <FiAlertTriangle className="size-3" /> Critical Stock
                        </p>
                        {branch.low_stock_ingredients.slice(0, 2).map((ing: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-[11px] font-bold text-muted-foreground px-1">
                                <span>{ing.name}</span>
                                <span className="text-rose-600 dark:text-rose-400">{Number(ing.stock).toLocaleString()} {ing.unit} left</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ stats, branchStats, salesOverTime, salesPerProduct, salesByPaymentMethod, range }: any) {
    const [isLoading, setIsLoading] = useState(false);

    // Dynamic Insight Calculations
    const bestBranch = useMemo(() => {
        if (!branchStats?.length) return null;
        return [...branchStats].sort((a, b) => b.revenue_today - a.revenue_today)[0];
    }, [branchStats]);

    const topProduct = useMemo(() => {
        if (!salesPerProduct?.length) return null;
        return [...salesPerProduct].sort((a, b) => b.total_sold - a.total_sold)[0];
    }, [salesPerProduct]);

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
            <Head title="Admin Operations Dashboard" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-background dark:bg-zinc-950 min-h-[calc(100vh-64px)] overflow-x-hidden">
                
                {/* ── Layer A: KPI Intelligence Header ── */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter italic uppercase text-foreground dark:text-white flex items-center gap-3">
                                <FiActivity className="text-primary size-6 animate-pulse" />
                                Operations Hub
                            </h1>
                            <p className="text-muted-foreground dark:text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Cross-Branch Intelligence & Real-time Analytics</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {isLoading && (
                                <div className="flex items-center gap-2 text-primary dark:text-primary-foreground font-black text-[10px] px-3 py-1.5 bg-primary/5 rounded-full ring-1 ring-primary/10">
                                    <FiLoader className="size-3 animate-spin" /> SYNCING
                                </div>
                            )}
                            <Select disabled={isLoading} defaultValue={range.toString()} onValueChange={handleRangeChange}>
                                <SelectTrigger className="w-[200px] h-11 bg-card dark:bg-zinc-900/50 border-none ring-1 ring-border shadow-sm rounded-xl font-black text-xs uppercase tracking-widest italic flex items-center gap-2 pr-4 transition-all hover:ring-primary/40">
                                    <FiCalendar className="size-4 text-primary" />
                                    <SelectValue placeholder="Period" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border shadow-2xl p-1 bg-card">
                                    <SelectItem value="7" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">Last 7 Days</SelectItem>
                                    <SelectItem value="30" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">Last 30 Days</SelectItem>
                                    <SelectItem value="365" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">Last 12 Months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Net Revenue" 
                            value={formatCurrency(stats.total_revenue)} 
                            icon={FiDollarSign} 
                            trend="up" 
                            trendValue="+12.5%" 
                            subtitle={getRangeLabel(range)}
                            colorClass="bg-indigo-500"
                            loading={isLoading}
                        />
                         <StatCard 
                            title="Gross Profit" 
                            value={formatCurrency(stats.total_profit)} 
                            icon={FiTrendingUp} 
                            trend="up" 
                            trendValue="+8.2%" 
                            subtitle={getRangeLabel(range)}
                            colorClass="bg-emerald-500"
                            loading={isLoading}
                        />
                         <StatCard 
                            title="Transaction Vol." 
                            value={stats.total_orders.toLocaleString()} 
                            icon={FiShoppingBag} 
                            trend="down" 
                            trendValue="-2.1%" 
                            subtitle={getRangeLabel(range)}
                            colorClass="bg-violet-500"
                            loading={isLoading}
                        />
                         <StatCard 
                            title="Stock Alerts" 
                            value={stats.low_stock_items} 
                            icon={FiAlertTriangle} 
                            trend={stats.low_stock_items > 5 ? 'down' : 'up'} 
                            trendValue={stats.low_stock_items > 5 ? 'Critical' : 'Stable'} 
                            subtitle="Across all branches"
                            colorClass={stats.low_stock_items > 5 ? "bg-rose-500" : "bg-amber-500"}
                            loading={isLoading}
                        />
                    </div>
                </div>

                {/* ── Layer B: Insight Summary Strip ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-1 bg-primary/5 dark:bg-primary/20 p-4 rounded-2xl flex items-center justify-between group cursor-help ring-1 ring-primary/10">
                        <div className="flex items-center gap-3">
                             <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                                <FiMapPin className="size-4" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase text-primary/70 tracking-tighter leading-none">Best performing</p>
                                <p className="text-[13px] font-black italic uppercase text-primary tracking-tighter mt-0.5 truncate max-w-[120px]">{bestBranch?.name || '---'}</p>
                             </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[11px] font-black text-primary tracking-tighter">{formatCurrency(bestBranch?.revenue_today || 0)}</p>
                             <p className="text-[9px] font-bold text-primary/50 uppercase leading-none mt-0.5">Today Rev.</p>
                        </div>
                    </div>

                    <div className="md:col-span-1 bg-emerald-500/5 dark:bg-emerald-500/20 p-4 rounded-2xl flex items-center justify-between group cursor-help ring-1 ring-emerald-500/10">
                        <div className="flex items-center gap-3">
                             <div className="size-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                <FiCheckCircle className="size-4" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase text-emerald-600/70 dark:text-emerald-400/70 tracking-tighter leading-none">Best Seller</p>
                                <p className="text-[13px] font-black italic uppercase text-emerald-700 dark:text-emerald-400 tracking-tighter mt-0.5 truncate max-w-[120px]">{topProduct?.name || '---'}</p>
                             </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">{topProduct?.total_sold || 0} units</p>
                             <p className="text-[9px] font-bold text-emerald-600/50 dark:text-emerald-400/50 uppercase leading-none mt-0.5">Period Sales</p>
                        </div>
                    </div>

                    <div className="md:col-span-1 bg-amber-500/5 dark:bg-amber-500/20 p-4 rounded-2xl flex items-center justify-between group cursor-help ring-1 ring-amber-500/10">
                        <div className="flex items-center gap-3">
                             <div className="size-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                <FiZap className="size-4" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase text-amber-600/70 dark:text-amber-400/70 tracking-tighter leading-none">System Status</p>
                                <p className="text-[13px] font-black italic uppercase text-amber-700 dark:text-amber-400 tracking-tighter mt-0.5">Healthy</p>
                             </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 tracking-tighter">100%</p>
                             <p className="text-[9px] font-bold text-amber-600/50 dark:text-amber-400/50 uppercase leading-none mt-0.5">Uptime</p>
                        </div>
                    </div>

                    <div className="md:col-span-1 bg-zinc-500/5 dark:bg-zinc-500/20 p-4 rounded-2xl flex items-center justify-between group cursor-help ring-1 ring-zinc-500/10">
                        <div className="flex items-center gap-3">
                             <div className="size-9 rounded-xl bg-zinc-500 flex items-center justify-center text-white shadow-lg shadow-zinc-500/30">
                                <FiArrowUpRight className="size-4" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter leading-none">Growth Velocity</p>
                                <p className="text-[13px] font-black italic uppercase text-foreground dark:text-zinc-200 tracking-tighter mt-0.5">+4.2 pts</p>
                             </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[11px] font-black text-foreground dark:text-white tracking-tighter">Optimal</p>
                             <p className="text-[9px] font-bold text-muted-foreground/50 uppercase leading-none mt-0.5">Performance</p>
                        </div>
                    </div>
                </div>

                {/* ── Layer C: Primary Analytics Section ── */}
                <Card className="border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-8 pt-8 px-8">
                        <div>
                            <CardTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                                <FiTrendingUp className="text-primary size-5" />
                                Growth Analysis
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Daily Revenue and Profit trajectory</CardDescription>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground dark:text-zinc-400">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground dark:text-zinc-400">Profit</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[400px] w-full px-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesOverTime} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="currentColor" 
                                        className="text-muted-foreground dark:text-zinc-600" 
                                        fontSize={10} 
                                        fontWeight="bold" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickMargin={12}
                                    />
                                    <YAxis 
                                        stroke="currentColor" 
                                        className="text-muted-foreground dark:text-zinc-600" 
                                        fontSize={10} 
                                        fontWeight="bold" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`}
                                        tickMargin={12}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        name="Revenue" 
                                        stroke="#6366f1" 
                                        strokeWidth={4} 
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                        animationDuration={1500}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="profit" 
                                        name="Profit" 
                                        stroke="#10b981" 
                                        strokeWidth={4} 
                                        fillOpacity={1} 
                                        fill="url(#colorProfit)" 
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Layer D: Secondary Analytics Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50">
                        <CardHeader className="px-8 pt-8">
                            <CardTitle className="text-lg font-black italic uppercase tracking-tighter">Market Demand</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Top 10 High-Velocity Products</CardDescription>
                        </CardHeader>
                        <CardContent className="px-6 pb-8">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesPerProduct} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
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
                                            width={80} 
                                            tickFormatter={(t) => t.toUpperCase()}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                                        <Bar 
                                            dataKey="total_sold" 
                                            name="Sold Units"
                                            fill="#6366f1" 
                                            radius={[0, 8, 8, 0]} 
                                            barSize={18}
                                            animationDuration={1000}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50">
                        <CardHeader className="px-8 pt-8">
                            <CardTitle className="text-lg font-black italic uppercase tracking-tighter">Payment Ecosystem</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue distribution per platform</CardDescription>
                        </CardHeader>
                        <CardContent className="px-6 pb-8">
                            <div className="h-[350px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={salesByPaymentMethod}
                                            cx="50%" cy="50%"
                                            innerRadius={80} 
                                            outerRadius={110} 
                                            paddingAngle={8}
                                            dataKey="revenue" 
                                            nameKey="payment_method"
                                            animationBegin={200}
                                            animationDuration={1500}
                                        >
                                            {salesByPaymentMethod.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            align="center" 
                                            iconType="circle"
                                            formatter={(value) => <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total</p>
                                    <p className="text-xl font-black italic tracking-tighter text-foreground dark:text-white">Revenue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Layer E: Operational Section ── */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <h2 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2 text-foreground dark:text-white">
                            <FiMapPin className="text-primary size-5" />
                            Localized Intelligence
                        </h2>
                    </div>
                    
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
                        {branchStats?.map((branch: any) => (
                            <BranchStatCard key={branch.id} branch={branch} />
                        ))}
                    </div>

                    <Card className="border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 overflow-hidden">
                        <CardHeader className="bg-muted/30 dark:bg-zinc-800/50 border-b border-border/40 py-6 px-8">
                            <div className="flex items-center justify-between text-foreground">
                                <CardTitle className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2">
                                     Real-time Branch Pulse
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/20 dark:bg-zinc-900/50">
                                        <tr className="border-b border-border/40">
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Workforce Hub</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Batch Vol.</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right pr-12">Capital Inflow</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {branchStats?.map((b: any) => (
                                            <tr key={b.id} className="hover:bg-primary/[0.04] dark:hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                                        <span className="font-black italic uppercase text-sm tracking-tighter text-foreground group-hover:text-primary transition-colors underline decoration-border/40 underline-offset-4 decoration-dashed">{b.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="font-mono font-black text-sm text-foreground dark:text-zinc-400 bg-muted/50 dark:bg-zinc-800 px-2 py-1 rounded-lg tabular-nums">{b.orders_today}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right pr-12">
                                                    <span className="font-black text-lg tracking-tighter italic text-primary dark:text-primary-foreground tabular-nums">{formatCurrency(b.revenue_today)}</span>
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
