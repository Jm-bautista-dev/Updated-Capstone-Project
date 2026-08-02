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

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background font-sans">
                {/* ── Executive Header ── */}
                <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-[var(--ops-surface-sunken)] border-b border-[var(--ops-border)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FiTrendingUp className="text-primary size-6 animate-pulse" />
                        <div>
                            <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">Cashier Performance</h1>
                            <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                Operational insights and cashier sales leaderboard.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Range selector */}
                        <div className="flex items-center bg-[var(--ops-surface-sunken)] border border-[var(--ops-border)] rounded-lg p-0.5">
                            <FiCalendar className="text-[var(--ops-text-muted)] ml-2 size-3.5" />
                            <Select value={range} onValueChange={(val) => { setRange(val); handleFilterChange('range', val); }}>
                                <SelectTrigger className="w-32 bg-transparent border-none shadow-none focus:ring-0 text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--ops-surface-raised)] border-[var(--ops-border)]">
                                    <SelectItem value="today" className="text-[10px] font-bold uppercase py-2">Today</SelectItem>
                                    <SelectItem value="7" className="text-[10px] font-bold uppercase py-2">Last 7 Days</SelectItem>
                                    <SelectItem value="30" className="text-[10px] font-bold uppercase py-2">Last 30 Days</SelectItem>
                                    <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Branch selector */}
                        <div className="flex items-center bg-[var(--ops-surface-sunken)] border border-[var(--ops-border)] rounded-lg p-0.5">
                            <FiFilter className="text-[var(--ops-text-muted)] ml-2 size-3.5" />
                            <Select value={branchId} onValueChange={(val) => { setBranchId(val); handleFilterChange('branch_id', val); }}>
                                <SelectTrigger className="w-36 bg-transparent border-none shadow-none focus:ring-0 text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)] h-8">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--ops-surface-raised)] border-[var(--ops-border)]">
                                    <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Branches</SelectItem>
                                    {branches?.map((b: any) => (
                                        <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={() => window.open(`/analytics/cashier-performance/export?range=${range}&branch_id=${branchId}`, '_blank')}
                            className="h-9 px-4 gap-2 bg-primary hover:bg-primary-hover text-foreground shadow-lg shadow-primary/10 rounded-xl font-black uppercase text-[10px] tracking-wider italic shrink-0"
                        >
                            Export Logs
                        </Button>
                    </div>
                </div>

                {/* ── Content Layout ── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)]">Total Sales</p>
                                <FiTrendingUp className="size-4 text-[var(--ops-text-secondary)]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{formatCurrency(stats.totalSales)}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Revenue performance</p>
                            </div>
                        </div>

                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/70">Total Transactions</p>
                                <FiShoppingCart className="size-4 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-amber-500 tabular-nums leading-none">{stats.totalTx}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Volume throughput</p>
                            </div>
                        </div>

                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Avg Order Value</p>
                                <FiTrendingUp className="size-4 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-emerald-500 tabular-nums leading-none">{formatCurrency(stats.avgOrderOverall)}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Basket efficiency</p>
                            </div>
                        </div>

                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Top Performer</p>
                                <FiAward className="size-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-foreground truncate leading-none">{stats.topCashier?.name || 'N/A'}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Highest seller</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        {/* Leaderboard Table */}
                        <div className="lg:col-span-2 border border-[var(--ops-border)] rounded-[14px] bg-[var(--ops-surface-sunken)] shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-[var(--ops-thead-bg)] border-b border-[var(--ops-border)] p-4 flex items-center gap-2">
                                <FiUsers className="text-primary size-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">Performance Leaderboard</span>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left border-collapse table-auto text-[var(--ops-text-secondary)]">
                                    <thead className="bg-[var(--ops-thead-bg)] border-b border-[var(--ops-border)] text-[9px] font-black uppercase tracking-[0.15em] text-[var(--ops-text-secondary)] select-none">
                                        <tr>
                                            <th className="px-6 py-3 font-black">Rank</th>
                                            <th className="px-6 py-3 font-black">Cashier</th>
                                            <th className="px-6 py-3 font-black">Branch</th>
                                            <th className="px-6 py-3 font-black text-right">Transactions</th>
                                            <th className="px-6 py-3 font-black text-right">Total Sales</th>
                                            <th className="px-6 py-3 font-black text-right">Avg Order</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--ops-border-subtle)] bg-[var(--ops-surface-raised)]">
                                        <AnimatePresence mode="popLayout">
                                            {performance.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--ops-text-muted)] italic">
                                                        No performance records found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                performance.map((p, index) => (
                                                    <tr 
                                                        key={p.id}
                                                        className="group select-none hover:bg-[var(--ops-surface-sunken)]/50 transition-colors duration-150 relative border-b border-[var(--ops-border)]"
                                                    >
                                                        <td className="px-6 py-3">
                                                            <div className={cn(
                                                                "size-6 rounded-md flex items-center justify-center font-black text-[10px]",
                                                                index === 0 ? "bg-amber-100 text-amber-700" :
                                                                index === 1 ? "bg-slate-200 text-slate-700" :
                                                                index === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-500"
                                                            )}>
                                                                {index + 1}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 font-bold text-[var(--ops-text-primary)]">
                                                            {p.name}
                                                        </td>
                                                        <td className="px-6">
                                                            <Badge variant="outline" className="bg-[var(--ops-surface-sunken)] text-[9px] font-black uppercase border-none px-2">{p.branch_name}</Badge>
                                                        </td>
                                                        <td className="px-6 text-right font-mono text-xs text-[var(--ops-text-secondary)]">
                                                            {p.total_transactions} txns
                                                        </td>
                                                        <td className="px-6 text-right font-mono text-xs font-bold text-primary">
                                                            {formatCurrency(p.total_sales)}
                                                        </td>
                                                        <td className="px-6 text-right">
                                                            <div className="flex items-center justify-end gap-1 font-mono text-xs text-[var(--ops-text-secondary)]">
                                                                {formatCurrency(p.avg_order_value)}
                                                                <FiArrowUpRight className="size-3 text-emerald-500" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Performers Chart */}
                        <div className="border border-[var(--ops-border)] rounded-[14px] bg-[var(--ops-surface-raised)] shadow-sm p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--ops-border-subtle)]">
                                    <FiBarChart2 className="text-primary size-4" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">Sales Distribution</span>
                                </div>
                                <div className="h-[180px] w-full min-h-[180px]">
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={chartData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-muted/10" />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                stroke="currentColor"
                                                className="text-muted-foreground"
                                                fontSize={10}
                                                fontWeight="bold"
                                                width={80}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-[var(--ops-surface-raised)] p-3 shadow-2xl rounded-xl border border-[var(--ops-border)] ring-1 ring-black/5">
                                                                <p className="text-[10px] font-black uppercase text-[var(--ops-text-muted)] mb-1">{payload[0].payload.name}</p>
                                                                <p className="text-sm font-black text-primary">{formatCurrency(payload[0].value)}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={20}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-[var(--ops-border-subtle)]">
                                <p className="text-[10px] font-bold text-[var(--ops-text-muted)] uppercase tracking-widest">Insights</p>
                                <p className="text-[11px] text-[var(--ops-text-secondary)] mt-2 leading-relaxed">
                                    Top 5 cashiers represent independent branch performance. Data reflects <strong>{range} days</strong> range.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
