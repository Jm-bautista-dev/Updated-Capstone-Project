import { Head, usePage, router } from '@inertiajs/react';
import {
    Award,
    BarChart2,
    DollarSign,
    Search,
    ShoppingCart,
    TrendingUp,
    Users,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area
} from 'recharts';

import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceActivityTimeline } from '@/components/performance/PerformanceActivityTimeline';
import { PerformanceDrawer, type PerformanceDrawerCashier } from '@/components/performance/PerformanceDrawer';
import { PerformanceHero, type BranchOption } from '@/components/performance/PerformanceHero';
import { PerformanceSummary } from '@/components/performance/PerformanceSummary';
import { TopPerformersCard } from '@/components/performance/TopPerformersCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

export type PerformanceData = {
    id: number;
    name: string;
    branch_name: string;
    total_sales: string | number;
    total_transactions: number;
    avg_order_value: string | number;
};

type PageProps = {
    performance?: PerformanceData[];
    branches?: BranchOption[];
    filters?: {
        range?: string;
        branch_id?: string;
    };
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#121218]/90 border border-white/10 shadow-2xl rounded-2xl p-3 text-white backdrop-blur-xl font-['Outfit'] space-y-1">
                <p className="text-[10px] font-mono font-bold uppercase text-slate-400">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}</span>
                        </div>
                        <span className="font-mono">
                            ₱{Number(entry.value || 0).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function CashierPerformance() {
    const { performance: rawPerformance, branches = [], filters = {} } = usePage().props as unknown as PageProps;
    
    const performance = useMemo<PerformanceData[]>(() => rawPerformance || [], [rawPerformance]);

    const [range, setRange] = useState(filters.range || '7');
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCashier, setSelectedCashier] = useState<PerformanceDrawerCashier | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleRangeChange = (val: string) => {
        setRange(val);
        router.get('/analytics/cashier-performance', { range: val, branch_id: branchId }, { preserveState: true, replace: true });
    };

    const handleBranchChange = (val: string) => {
        setBranchId(val);
        router.get('/analytics/cashier-performance', { range, branch_id: val }, { preserveState: true, replace: true });
    };

    const handleExport = () => {
        window.open(`/analytics/cashier-performance/export?range=${range}&branch_id=${branchId}`, '_blank');
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount || 0));
    };

    const stats = useMemo(() => {
        const totalSales = performance.reduce((sum, p) => sum + Number(p.total_sales), 0);
        const totalTx = performance.reduce((sum, p) => sum + p.total_transactions, 0);
        const topCashier = performance[0] || null;

        return {
            totalSales,
            totalTx,
            topCashier,
            avgOrderOverall: totalTx > 0 ? totalSales / totalTx : 0
        };
    }, [performance]);

    const filteredPerformance = useMemo(() => {
        if (!searchQuery.trim()) return performance;
        const q = searchQuery.toLowerCase();
        return performance.filter(
            p => p.name.toLowerCase().includes(q) || (p.branch_name && p.branch_name.toLowerCase().includes(q))
        );
    }, [performance, searchQuery]);

    const chartData = useMemo(() => {
        return performance.slice(0, 5).map(p => ({
            name: p.name,
            sales: Number(p.total_sales)
        }));
    }, [performance]);

    const COLORS = ['#E75480', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];

    const handleInspectCashier = (item: PerformanceData) => {
        setSelectedCashier(item);
        setIsDrawerOpen(true);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Analytics', href: '#' }, { title: 'Cashier Performance', href: '#' }]}>
            <Head title="Performance Analytics Center" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                
                {/* ── ZONE 1: PERFORMANCE HERO BANNER ── */}
                <PerformanceHero
                    range={range}
                    branchId={branchId}
                    branches={branches}
                    onRangeChange={handleRangeChange}
                    onBranchChange={handleBranchChange}
                    onExport={handleExport}
                />

                {/* ── ZONE 2: REUSED KPI CARDS STRIP ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Total Sales Revenue"
                        value={formatCurrency(stats.totalSales)}
                        icon={DollarSign}
                        trend="neutral"
                        trendValue="Active"
                        comparison="filtered period"
                        sparklineData={[{ value: 30 }, { value: 65 }, { value: 90 }]}
                        badgeText="Gross Sales"
                        index={0}
                    />
                    <KPICard
                        title="Total Transactions"
                        value={stats.totalTx.toLocaleString()}
                        icon={ShoppingCart}
                        trend="neutral"
                        trendValue="Volume"
                        comparison="completed receipts"
                        sparklineData={[{ value: 20 }, { value: 55 }, { value: 80 }]}
                        badgeText="Volume"
                        index={1}
                    />
                    <KPICard
                        title="Overall Avg Order"
                        value={formatCurrency(stats.avgOrderOverall)}
                        icon={BarChart2}
                        trend="neutral"
                        trendValue="Average"
                        comparison="per order avg"
                        sparklineData={[{ value: 40 }, { value: 60 }, { value: 75 }]}
                        badgeText="Basket Avg"
                        index={2}
                    />
                    <KPICard
                        title="Top Representative"
                        value={stats.topCashier?.name || 'N/A'}
                        icon={Award}
                        trend="up"
                        trendValue="#1 Leader"
                        comparison="sales rank"
                        sparklineData={[{ value: 50 }, { value: 70 }, { value: 95 }]}
                        badgeText="Leader"
                        index={3}
                    />
                </div>

                {/* ── ZONE 3: BUSINESS HEALTH OVERVIEW ── */}
                <PerformanceSummary
                    totalSales={stats.totalSales}
                    totalTx={stats.totalTx}
                    avgOrderOverall={stats.avgOrderOverall}
                    cashierCount={performance.length}
                />

                {/* ── ZONE 4: TOP PERFORMERS SHOWCASE CARDS ── */}
                <TopPerformersCard
                    topCashier={stats.topCashier}
                    topBranchName={branches[0]?.name || 'Main Store'}
                />

                {/* ── ZONE 5: RECHARTS ANALYTICS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                    <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        Top 5 Cashiers Gross Sales
                                    </h3>
                                </div>
                                <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Ranked by overall sales volume
                                </p>
                            </div>
                        </div>

                        <div className="h-64 w-full min-h-64 min-w-0 pt-2">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200} initialDimension={{ width: 400, height: 200 }}>
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v}`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase">
                                    No sales data available for period
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    Sales Velocity Pace
                                </h3>
                            </div>
                            <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                Target benchmark vs actual trajectory
                            </p>
                        </div>

                        <div className="h-48 w-full min-h-48 min-w-0 pt-2">
                            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={150} initialDimension={{ width: 300, height: 180 }}>
                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSalesVel" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#E75480" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#E75480" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="sales" stroke="#E75480" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesVel)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── ZONE 6: LEADERBOARD GLASS TABLE ── */}
                <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 p-6 sm:p-7 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-2xs">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    Staff Performance Leaderboard
                                </h3>
                                <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Detailed breakdown of transaction volume, sales, and average order size
                                </p>
                            </div>
                        </div>

                        {/* Search Toolbar */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3.5 top-3 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                            <Input
                                type="text"
                                placeholder="Search cashier or branch..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 pl-10 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]"
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 backdrop-blur-md font-black uppercase text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                    <th className="py-3.5 px-5">Rank</th>
                                    <th className="py-3.5 px-5">Cashier</th>
                                    <th className="py-3.5 px-5">Branch</th>
                                    <th className="py-3.5 px-5 text-right">Transactions</th>
                                    <th className="py-3.5 px-5 text-right">Avg Order Size</th>
                                    <th className="py-3.5 px-5 text-right">Total Sales</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                                {filteredPerformance.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => handleInspectCashier(item)}
                                        className="hover:bg-[#FFF5F7]/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <td className="py-3.5 px-5 font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {idx === 0 && <span className="text-amber-500 font-black">🥇 #1</span>}
                                            {idx === 1 && <span className="text-slate-400 font-black">🥈 #2</span>}
                                            {idx === 2 && <span className="text-amber-700 font-black">🥉 #3</span>}
                                            {idx > 2 && `#${idx + 1}`}
                                        </td>
                                        <td className="py-3.5 px-5 font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {item.name}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <Badge className="bg-[#FFF5F7] dark:bg-[#181824] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 font-extrabold text-[10px]">
                                                {item.branch_name || 'Assigned Branch'}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 px-5 text-right font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {item.total_transactions}
                                        </td>
                                        <td className="py-3.5 px-5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(item.avg_order_value)}
                                        </td>
                                        <td className="py-3.5 px-5 text-right font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {formatCurrency(item.total_sales)}
                                        </td>
                                    </tr>
                                ))}
                                {filteredPerformance.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase tracking-wider">
                                            No performance records match search criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── ZONE 7: RECENT PERFORMANCE ACTIVITY TIMELINE ── */}
                <PerformanceActivityTimeline />

            </div>

            {/* Inspection Side Drawer */}
            <PerformanceDrawer
                cashier={selectedCashier}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
        </AppLayout>
    );
}
