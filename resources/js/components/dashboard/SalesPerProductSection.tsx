import { motion } from 'framer-motion';
import { 
    BarChart3, 
    Building2, 
    Search, 
    Package, 
    ChevronDown, 
    ChevronUp, 
    Sparkles, 
    Layers, 
    Loader2 
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

import { PesoSign } from '@/components/ui/peso-sign';

export interface ProductSalesItem {
    rank?: number;
    product_id?: number;
    name: string;
    total_sold: number;
    revenue: number;
    orders_count?: number;
    percentage?: number;
}

export interface SalesPerProductMeta {
    products: ProductSalesItem[];
    total_revenue: number;
    total_units: number;
    products_count: number;
    selected_branch_id?: number | string | null;
}

interface BranchItem {
    id: number;
    name: string;
}

interface SalesPerProductSectionProps {
    initialProducts?: ProductSalesItem[];
    initialMeta?: SalesPerProductMeta;
    branches?: BranchItem[];
    currentRange?: string | number;
    selectedBranchId?: string;
    onBranchChange?: (branchId: string) => void;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-PH').format(num ?? 0);

// Helper to format clean branch tab labels
function getCleanBranchLabel(name: string): string {
    return name.replace(/^Maki\s*Desu\s*/i, '').trim();
}

export function SalesPerProductSection({
    initialProducts = [],
    initialMeta,
    branches = [],
    currentRange = 'today',
    selectedBranchId = 'all',
    onBranchChange,
}: SalesPerProductSectionProps) {
    const [activeBranch, setActiveBranch] = useState<string>(selectedBranchId || 'all');
    const [products, setProducts] = useState<ProductSalesItem[]>(initialProducts);
    const [totalRevenue, setTotalRevenue] = useState<number>(initialMeta?.total_revenue ?? 0);
    const [totalUnits, setTotalUnits] = useState<number>(initialMeta?.total_units ?? 0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showAll, setShowAll] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Sync when props change from dashboard navigation
    useEffect(() => {
        if (selectedBranchId !== undefined && selectedBranchId !== activeBranch) {
            setActiveBranch(selectedBranchId);
        }
    }, [selectedBranchId, activeBranch]);

    useEffect(() => {
        setProducts(initialProducts);
        if (initialMeta) {
            setTotalRevenue(initialMeta.total_revenue ?? 0);
            setTotalUnits(initialMeta.total_units ?? 0);
        } else {
            const rev = initialProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);
            const units = initialProducts.reduce((sum, p) => sum + (p.total_sold || 0), 0);
            setTotalRevenue(rev);
            setTotalUnits(units);
        }
    }, [initialProducts, initialMeta, currentRange]);

    // Handle local branch switching with AJAX fetch
    const handleSelectBranch = async (branchValue: string) => {
        if (branchValue === activeBranch && !isLoading) return;
        setActiveBranch(branchValue);

        if (onBranchChange) {
            onBranchChange(branchValue);
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                range: String(currentRange),
                branch_id: branchValue,
            });
            const response = await fetch(`/analytics/sales-per-product?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
                setTotalRevenue(data.total_revenue ?? 0);
                setTotalUnits(data.total_units ?? 0);
            }
        } catch (error) {
            console.error('Failed to fetch sales per product for branch:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Branch tab options: All Branches + individual branches (Victoria, Sta. Cruz)
    const branchOptions = useMemo(() => {
        const list = [{ id: 'all', label: 'All Branches' }];
        if (branches && branches.length > 0) {
            branches.forEach((b) => {
                list.push({
                    id: String(b.id),
                    label: getCleanBranchLabel(b.name),
                });
            });
        } else {
            list.push({ id: '1', label: 'Victoria' });
            list.push({ id: '2', label: 'Sta. Cruz' });
        }
        return list;
    }, [branches]);

    // Filter products by search query
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const q = searchQuery.toLowerCase();
        return products.filter((p) => p.name.toLowerCase().includes(q));
    }, [products, searchQuery]);

    // Display list (top 10 or all)
    const displayedProducts = useMemo(() => {
        if (showAll || searchQuery.trim().length > 0) {
            return filteredProducts;
        }
        return filteredProducts.slice(0, 10);
    }, [filteredProducts, showAll, searchQuery]);

    // Chart dataset (top 10 for readability, or up to 15 if expanded)
    const chartData = useMemo(() => {
        const count = showAll ? Math.min(displayedProducts.length, 15) : 10;
        return displayedProducts.slice(0, count);
    }, [displayedProducts, showAll]);

    const activeBranchLabel = useMemo(() => {
        return branchOptions.find((b) => b.id === activeBranch)?.label || 'All Branches';
    }, [branchOptions, activeBranch]);

    const topProduct = products[0] || null;

    // Readable label for the current date range
    const rangeLabel = useMemo(() => {
        switch (String(currentRange)) {
            case 'today':
            case '1':
                return 'Today';
            case '30':
                return 'Last 30 Days';
            case '365':
            case 'annual':
                return 'Annual';
            default:
                return 'Last 7 Days';
        }
    }, [currentRange]);

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            id="sales-per-product-section"
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 relative overflow-hidden"
        >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-linear-to-br from-[#E75480]/10 via-[#FF4F81]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* ── SECTION HEADER & BRANCH SELECTOR ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2.5 rounded-2xl bg-linear-to-tr from-[#E75480]/15 to-[#FF4F81]/15 text-[#E75480] dark:text-[#FF4F81] border border-[#E75480]/20 shadow-sm">
                            <BarChart3 className="size-5" />
                        </div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight uppercase">
                                SALES PER PRODUCT
                            </h2>
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FFF0F5] dark:bg-[#20151C] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-[#E75480]/30 shadow-xs">
                                {rangeLabel}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] max-w-xl">
                        Product-level sales contribution and revenue distribution filtered by branch. Compare product revenue across Victoria and Sta. Cruz.
                    </p>
                </div>

                {/* Branch Filter Tabs */}
                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center p-1.5 rounded-2xl bg-[#FFF5F7] dark:bg-[#181824] border border-[#F8C8DC]/60 dark:border-white/10 shadow-inner">
                        <div className="px-2.5 py-1 text-[11px] font-bold text-[#9E8B8E] dark:text-[#64748B] items-center gap-1.5 hidden sm:flex">
                            <Building2 className="size-3.5 text-[#E75480]" />
                            <span>Branch:</span>
                        </div>
                        {branchOptions.map((b) => {
                            const isActive = activeBranch === b.id;
                            return (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => handleSelectBranch(b.id)}
                                    disabled={isLoading}
                                    className={`relative px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center gap-1.5 ${
                                        isActive
                                            ? 'bg-linear-to-r from-[#E75480] to-[#FF4F81] text-white shadow-[0_4px_14px_rgba(231,84,128,0.35)]'
                                            : 'text-[#5D4A4D] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] hover:bg-white/60 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <span>{b.label}</span>
                                    {isActive && isLoading && (
                                        <Loader2 className="size-3 animate-spin text-white" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── KPI STRIP FOR SELECTED BRANCH & PERIOD ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-[#FFF8FA] dark:bg-[#181824]/60 border border-[#F8C8DC]/40 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block mb-1">
                        Total Period Revenue
                    </span>
                    <div className="flex items-baseline gap-1 text-lg sm:text-xl font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        <PesoSign className="size-4 text-[#E75480]" />
                        <span>{formatNumber(totalRevenue)}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#7D6B6E] dark:text-[#94A3B8]">
                        Across {activeBranchLabel}
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF8FA] dark:bg-[#181824]/60 border border-[#F8C8DC]/40 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block mb-1">
                        Total Units Sold
                    </span>
                    <div className="flex items-baseline gap-1 text-lg sm:text-xl font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        <Package className="size-4 text-[#E75480]" />
                        <span>{formatNumber(totalUnits)}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#7D6B6E] dark:text-[#94A3B8]">
                        Finished items fulfilled
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF8FA] dark:bg-[#181824]/60 border border-[#F8C8DC]/40 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block mb-1">
                        Unique Products Sold
                    </span>
                    <div className="flex items-baseline gap-1 text-lg sm:text-xl font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        <Layers className="size-4 text-[#E75480]" />
                        <span>{products.length}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#7D6B6E] dark:text-[#94A3B8]">
                        Active catalog contributors
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF8FA] dark:bg-[#181824]/60 border border-[#F8C8DC]/40 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block mb-1">
                        Leading Contributor
                    </span>
                    <div className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC] truncate">
                        {topProduct ? topProduct.name : '—'}
                    </div>
                    <span className="text-[10px] font-semibold text-[#E75480] dark:text-[#FF4F81]">
                        {topProduct ? `${topProduct.percentage}% of sales (${formatCurrency(topProduct.revenue)})` : 'No sales recorded'}
                    </span>
                </div>
            </div>

            {/* ── MAIN CONTENT: EMPTY STATE OR HORIZONTAL BAR CHART & TABLE ── */}
            {products.length === 0 ? (
                <div className="h-72 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-[#FFFDFE] dark:bg-[#181820] border border-dashed border-[#F8C8DC]/60 dark:border-white/10">
                    <div className="p-4 rounded-2xl bg-[#FADADD]/30 dark:bg-[#E1062C]/10 text-[#E75480] dark:text-[#FF4F81] mb-3">
                        <Sparkles className="size-8" />
                    </div>
                    <h3 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] mb-1">
                        No Product Sales Recorded
                    </h3>
                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] max-w-md">
                        There are no completed sales transactions recorded for <span className="font-bold text-[#E75480]">{activeBranchLabel}</span> during the selected period ({rangeLabel}).
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT (7 COLS): HORIZONTAL BAR CHART */}
                    <div className="xl:col-span-7 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                            <div>
                                <h3 className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    Product Revenue Comparison (Horizontal Ranking)
                                </h3>
                                <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Comparing top revenue-generating menu items ({activeBranchLabel})
                                </p>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-[#E75480] dark:text-[#FF4F81]">
                                Top {chartData.length} Shown
                            </span>
                        </div>

                        {/* Responsive Horizontal Bar Chart Container */}
                        <div 
                            className="w-full relative min-w-0" 
                            style={{ height: Math.max(280, chartData.length * 44) }}
                        >
                            {isLoading && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-[#121218]/60 backdrop-blur-xs flex items-center justify-center z-20 rounded-2xl">
                                    <Loader2 className="size-6 animate-spin text-[#E75480]" />
                                </div>
                            )}

                            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={260}>
                                <BarChart
                                    layout="vertical"
                                    data={chartData}
                                    margin={{ top: 5, right: 35, left: 15, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#E75480" stopOpacity={0.85} />
                                            <stop offset="100%" stopColor="#FF4F81" stopOpacity={1} />
                                        </linearGradient>
                                        <linearGradient id="salesRevenueTopGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#FB7185" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#E11D48" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--ops-border, rgba(255, 255, 255, 0.06))" />
                                    <XAxis
                                        type="number"
                                        stroke="#9E8B8E"
                                        fontSize={10}
                                        tickLine={false}
                                        tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#5D4A4D"
                                        width={140}
                                        fontSize={11}
                                        tickLine={false}
                                        tick={({ x, y, payload }) => {
                                            const val = payload.value || '';
                                            const formatted = val.length > 18 ? `${val.substring(0, 17)}…` : val;
                                            return (
                                                <text
                                                    x={x}
                                                    y={y}
                                                    dy={3}
                                                    textAnchor="end"
                                                    className="text-[11px] font-bold fill-[#3D2C2E] dark:fill-[#CBD5E1]"
                                                >
                                                    {formatted}
                                                </text>
                                            );
                                        }}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const item = payload[0].payload as ProductSalesItem;
                                                return (
                                                    <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#1C1C28]/95 border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xl backdrop-blur-md text-xs font-['Outfit'] space-y-2 min-w-56">
                                                        <div className="border-b border-[#F8C8DC]/40 dark:border-white/10 pb-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="px-2 py-0.5 rounded-full bg-[#FFF0F5] dark:bg-[#2A1520] text-[#E75480] dark:text-[#FF4F81] text-[10px] font-mono font-black">
                                                                    Rank #{item.rank || 1}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-[#9E8B8E]">
                                                                    {item.percentage}% Share
                                                                </span>
                                                            </div>
                                                            <p className="font-black text-[#3D2C2E] dark:text-[#F8FAFC] text-sm leading-snug mt-1">
                                                                {item.name}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1.5 pt-0.5">
                                                            <div className="flex items-center justify-between text-[#E75480] dark:text-[#FF4F81] font-semibold">
                                                                <span>Total Revenue:</span>
                                                                <span className="font-mono font-black">{formatCurrency(item.revenue)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[#5D4A4D] dark:text-[#CBD5E1]">
                                                                <span>Units Sold:</span>
                                                                <span className="font-mono font-bold">{formatNumber(item.total_sold)} units</span>
                                                            </div>
                                                            {item.orders_count !== undefined && (
                                                                <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8] text-[11px]">
                                                                    <span>Orders Count:</span>
                                                                    <span className="font-mono">{formatNumber(item.orders_count)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        name="Total Revenue"
                                        radius={[0, 8, 8, 0]}
                                        fill="url(#salesRevenueGradient)"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${entry.product_id || index}`}
                                                fill={index === 0 ? 'url(#salesRevenueTopGradient)' : 'url(#salesRevenueGradient)'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* RIGHT (5 COLS): COMPACT TABLE & BREAKDOWN */}
                    <div className="xl:col-span-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                            <div>
                                <h3 className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    Product Sales Summary Table
                                </h3>
                                <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Quantity sold, revenue, and contribution %
                                </p>
                            </div>

                            {/* Search bar toggle or count */}
                            <div className="text-[11px] font-mono text-[#7D6B6E] dark:text-[#94A3B8]">
                                {displayedProducts.length} of {products.length} Items
                            </div>
                        </div>

                        {/* Search Input for Quick Inspection */}
                        <div className="relative">
                            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8B8E] dark:text-[#64748B]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search product name..."
                                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-[#FFF5F7] dark:bg-[#181824] border border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] placeholder:text-[#9E8B8E] focus:outline-hidden focus:ring-2 focus:ring-[#E75480]/30 transition-all"
                            />
                        </div>

                        {/* Compact Table */}
                        <div className="overflow-x-auto max-h-95 overflow-y-auto rounded-2xl border border-[#F8C8DC]/40 dark:border-white/10 scrollbar-thin">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-[#FFF5F7] dark:bg-[#1C1C28] text-[10px] font-extrabold uppercase text-[#9E8B8E] dark:text-[#64748B] tracking-wider border-b border-[#F8C8DC]/40 dark:border-white/10 z-10">
                                    <tr>
                                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                                        <th className="py-2.5 px-3">Product</th>
                                        <th className="py-2.5 px-3 text-right">Sold</th>
                                        <th className="py-2.5 px-3 text-right">Revenue</th>
                                        <th className="py-2.5 px-3 text-right w-20">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F8C8DC]/20 dark:divide-white/5 font-medium">
                                    {displayedProducts.map((p, idx) => {
                                        const rank = p.rank || idx + 1;
                                        return (
                                            <tr
                                                key={p.product_id || p.name}
                                                className="hover:bg-[#FFF8FA] dark:hover:bg-white/5 transition-colors"
                                            >
                                                <td className="py-2 px-3 text-center">
                                                    <span
                                                        className={`inline-flex items-center justify-center size-5 rounded-full text-[10px] font-mono font-bold ${
                                                            rank === 1
                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                                : rank === 2
                                                                ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                : rank === 3
                                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                                                : 'text-[#9E8B8E] dark:text-[#64748B]'
                                                        }`}
                                                    >
                                                        {rank}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 font-bold text-[#3D2C2E] dark:text-[#F8FAFC] max-w-37.5 truncate" title={p.name}>
                                                    {p.name}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-[#5D4A4D] dark:text-[#CBD5E1]">
                                                    {formatNumber(p.total_sold)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-[#E75480] dark:text-[#FF4F81]">
                                                    {formatCurrency(p.revenue)}
                                                </td>
                                                <td className="py-2 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <div className="w-10 h-1.5 rounded-full bg-[#F8C8DC]/40 dark:bg-white/10 overflow-hidden hidden sm:block">
                                                            <div
                                                                className="h-full rounded-full bg-linear-to-r from-[#E75480] to-[#FF4F81]"
                                                                style={{ width: `${Math.min(100, (p.percentage || 0))}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-mono font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                                            {p.percentage}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Toggle "Show All / Show Top 10" */}
                        {products.length > 10 && !searchQuery && (
                            <div className="pt-2 text-center">
                                <button
                                    type="button"
                                    onClick={() => setShowAll(!showAll)}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#FFF5F7] dark:bg-[#181824] hover:bg-[#FADADD]/50 dark:hover:bg-white/10 text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 shadow-xs transition-all cursor-pointer"
                                >
                                    {showAll ? (
                                        <>
                                            <ChevronUp className="size-3.5" />
                                            <span>Show Top 10 Only</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="size-3.5" />
                                            <span>View All {products.length} Products</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </motion.section>
    );
}
