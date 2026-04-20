import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    FiUsers,
    FiTrendingUp,
    FiShoppingCart,
    FiAward,
    FiFilter,
    FiCalendar,
    FiArrowUpRight,
    FiBarChart2,
    FiHash
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

type PerformanceData = {
    id: number;
    name: string;
    branch_name: string;
    total_sales: string | number;
    total_transactions: number;
    avg_order_value: string | number;
};

export default function CashierPerformance() {
    const { performance: rawPerformance, branches, filters } = usePage().props as any;
    const performance: PerformanceData[] = rawPerformance || [];

    const [range, setRange] = useState(filters.range || '7');
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        router.get('/analytics/cashier-performance', newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));
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

    const chartData = useMemo(() => {
        return performance.slice(0, 5).map(p => ({
            name: p.name,
            sales: Number(p.total_sales)
        }));
    }, [performance]);

    const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

    return (
        <AppLayout breadcrumbs={[{ title: 'Analytics', href: '#' }, { title: 'Cashier Performance', href: '#' }]}>
            <Head title="Cashier Performance Analytics" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background dark:bg-zinc-950">
                {/* Header Section */}
                <div className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-foreground dark:text-white">
                            <FiTrendingUp className="text-primary dark:text-primary-foreground" />
                            Cashier Performance
                        </h1>
                        <p className="text-sm text-muted-foreground dark:text-zinc-500 font-medium mt-1">
                            Operational insights and sales leaderboard.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-muted/50 dark:bg-zinc-800/50 rounded-xl p-1 gap-1">
                            <FiCalendar className="text-muted-foreground dark:text-zinc-500 ml-2 size-4" />
                            <Select value={range} onValueChange={(val) => { setRange(val); handleFilterChange('range', val); }}>
                                <SelectTrigger className="w-40 bg-transparent border-none shadow-none focus:ring-0 text-xs font-bold uppercase tracking-tight text-foreground dark:text-zinc-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="7">Last 7 Days</SelectItem>
                                    <SelectItem value="30">Last 30 Days</SelectItem>
                                    <SelectItem value="all">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center bg-muted/50 dark:bg-zinc-800/50 rounded-xl p-1 gap-1">
                            <FiFilter className="text-muted-foreground dark:text-zinc-500 ml-2 size-4" />
                            <Select value={branchId} onValueChange={(val) => { setBranchId(val); handleFilterChange('branch_id', val); }}>
                                <SelectTrigger className="w-44 bg-transparent border-none shadow-none focus:ring-0 text-xs font-bold uppercase tracking-tight text-foreground dark:text-zinc-300">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches?.map((b: any) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="size-12 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                                        <FiTrendingUp className="text-primary dark:text-primary-foreground size-6" />
                                    </div>
                                    <Badge className="bg-primary/5 dark:bg-primary/20 text-primary dark:text-primary-foreground border-none font-bold uppercase text-[10px]">Revenue</Badge>
                                </div>
                                <div className="mt-4">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-zinc-500 tracking-widest">Total Sales</p>
                                    <h3 className="text-2xl font-black text-foreground dark:text-white">{formatCurrency(stats.totalSales)}</h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm ring-1 ring-slate-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                                        <FiShoppingCart className="text-amber-600 size-6" />
                                    </div>
                                    <Badge className="bg-amber-50 text-amber-700 border-none font-bold uppercase text-[10px]">Volume</Badge>
                                </div>
                                <div className="mt-4">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Transactions</p>
                                    <h3 className="text-2xl font-black text-slate-900">{stats.totalTx}</h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="size-12 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 flex items-center justify-center">
                                        <FiTrendingUp className="text-emerald-600 dark:text-emerald-500 size-6" />
                                    </div>
                                    <Badge className="bg-emerald-500/5 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-500 border-none font-bold uppercase text-[10px]">Efficiency</Badge>
                                </div>
                                <div className="mt-4">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-zinc-500 tracking-widest">Avg Order Value</p>
                                    <h3 className="text-2xl font-black text-foreground dark:text-white">{formatCurrency(stats.avgOrderOverall)}</h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary dark:bg-primary-foreground/10 text-white dark:text-primary-foreground shadow-xl shadow-primary/10 dark:shadow-none border-none">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="size-12 rounded-2xl bg-white/10 dark:bg-white/20 flex items-center justify-center backdrop-blur-md">
                                        <FiAward className="text-white size-6" />
                                    </div>
                                    <Badge className="bg-white/20 dark:bg-white/30 text-white dark:text-white border-none font-bold uppercase text-[10px]">Top Performer</Badge>
                                </div>
                                <div className="mt-4">
                                    <p className="text-[10px] font-black uppercase text-primary-foreground/70 tracking-widest">Highest Seller</p>
                                    <h3 className="text-2xl font-black truncate">{stats.topCashier?.name || 'N/A'}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Leaderboard Table */}
                        <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50 overflow-hidden">
                            <CardHeader className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white flex items-center gap-2">
                                    <FiUsers className="text-primary dark:text-primary-foreground" />
                                    Performance Leaderboard
                                </CardTitle>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/30 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                                        <tr>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500">Rank</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500">Cashier</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500">Branch</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500 text-right">Transactions</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500 text-right">Total Sales</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500 text-right">Avg Order</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border dark:divide-zinc-800">
                                        <AnimatePresence>
                                            {performance.map((p, index) => (
                                                <motion.tr
                                                    key={p.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="group hover:bg-muted/30 dark:hover:bg-zinc-800/30 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className={cn(
                                                            "size-7 rounded-lg flex items-center justify-center font-black text-xs",
                                                            index === 0 ? "bg-amber-100 text-amber-700" :
                                                            index === 1 ? "bg-slate-200 text-slate-700" :
                                                            index === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-500"
                                                        )}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-foreground dark:text-zinc-200">{p.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="font-black text-[9px] uppercase tracking-tighter border-border dark:border-zinc-800 bg-background dark:bg-zinc-900 shadow-sm text-foreground dark:text-zinc-400">
                                                            {p.branch_name}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-mono font-medium text-muted-foreground dark:text-zinc-500">{p.total_transactions} txns</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-black text-primary dark:text-primary-foreground transition-colors">{formatCurrency(p.total_sales)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 font-medium text-muted-foreground dark:text-zinc-500">
                                                            {formatCurrency(p.avg_order_value)}
                                                            <FiArrowUpRight className="size-3 text-emerald-500" />
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}

                                            {performance.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground dark:text-zinc-600 italic">
                                                        No performance data found for the selected filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                         {/* Top Performers Chart */}
                        <div className="space-y-8">
                            <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                <CardHeader>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white flex items-center gap-2">
                                        <FiBarChart2 className="text-primary dark:text-primary-foreground" />
                                        Sales Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[280px] w-full min-h-[280px]">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={chartData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    stroke="currentColor"
                                                    className="text-muted-foreground dark:text-zinc-500"
                                                    fontSize={10}
                                                    fontWeight="bold"
                                                    width={80}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-background dark:bg-zinc-900 p-3 shadow-2xl rounded-xl border dark:border-zinc-800 ring-1 ring-black/5 dark:ring-white/5">
                                                                    <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-zinc-500 mb-1">{payload[0].payload.name}</p>
                                                                    <p className="text-sm font-black text-primary dark:text-primary-foreground">{formatCurrency(payload[0].value)}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={24}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-muted dark:border-zinc-800">
                                        <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest">Insights</p>
                                        <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-2 leading-relaxed">
                                            Top 5 cashiers represent independent branch performance. Data reflects <strong>{range} days</strong> range.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Info / Tips */}
                            <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none space-y-4">
                                <CardContent className="p-6">
                                    <FiAward className="text-amber-400 dark:text-amber-500 size-8 mb-4" />
                                    <h4 className="text-lg font-black tracking-tight text-white">System Notice</h4>
                                    <p className="text-xs text-indigo-200/80 dark:text-zinc-300/80 leading-relaxed font-medium">
                                        Rankings are updated in real-time. Performance logic is strictly read-only and does not affect inventory or commission calculations.
                                    </p>
                                    <Button variant="outline" className="w-full mt-6 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl font-bold uppercase tracking-widest h-10 text-[10px]">
                                        Export Detailed Logs
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
