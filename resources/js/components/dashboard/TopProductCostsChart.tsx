import { motion } from 'framer-motion';
import { Layers, Sparkles } from 'lucide-react';
import React from 'react';
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

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

export interface TopProductCostItem {
    id: number;
    name: string;
    sku?: string;
    cost: number;
    selling_price?: number;
    has_recipe?: boolean;
}

interface TopProductCostsChartProps {
    topProductCosts?: TopProductCostItem[];
    activeBranchName?: string;
}

const BAR_COLORS = [
    '#E75480',
    '#F472B6',
    '#FB7185',
    '#E11D48',
    '#DB2777',
    '#BE185D',
    '#9D174D',
    '#831843',
];

export function TopProductCostsChart({
    topProductCosts = [],
    activeBranchName = 'All Branches',
}: TopProductCostsChartProps) {
    const data = React.useMemo(() => {
        return (topProductCosts || []).slice(0, 8);
    }, [topProductCosts]);

    const maxCost = React.useMemo(() => {
        if (!data.length) return 0;
        return Math.max(...data.map(d => d.cost));
    }, [data]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                            <Layers className="size-4" />
                        </div>
                        <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                            Top Product Costs by Branch
                        </h2>
                    </div>
                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                        Highest production / ingredient cost per single serving ({activeBranchName}).
                    </p>
                </div>

                {data.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-xl bg-[#FFF5F7] dark:bg-[#181824] border border-[#F8C8DC]/60 dark:border-white/10 text-right">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Highest Unit Cost</span>
                            <span className="text-xs font-mono font-extrabold text-[#E75480] dark:text-[#FF4F81]">
                                {formatCurrency(maxCost)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {data.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[#FFFDFE] dark:bg-[#181820] border border-dashed border-[#F8C8DC]/60 dark:border-white/10">
                    <Sparkles className="size-8 text-[#E75480]/40 dark:text-[#FF4F81]/40 mb-2" />
                    <p className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">No Product Cost Data Available</p>
                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] max-w-sm mt-1">
                        Ingredient costs and recipe specifications will populate this ranking automatically.
                    </p>
                </div>
            ) : (
                <div className="h-72 w-full min-h-72 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200} initialDimension={{ width: 500, height: 280 }}>
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient id="barCostGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#E75480" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#FF4F81" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--ops-border, rgba(255, 255, 255, 0.06))" />
                            <XAxis
                                type="number"
                                stroke="#9E8B8E"
                                fontSize={10}
                                tickLine={false}
                                tickFormatter={(val) => `₱${val}`}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#5D4A4D"
                                width={110}
                                fontSize={11}
                                tickLine={false}
                                tick={({ x, y, payload }) => (
                                    <text
                                        x={x}
                                        y={y}
                                        dy={3}
                                        textAnchor="end"
                                        fill="currentColor"
                                        className="text-[11px] font-bold fill-[#3D2C2E] dark:fill-[#CBD5E1]"
                                    >
                                        {payload.value.length > 15 ? `${payload.value.substring(0, 14)}…` : payload.value}
                                    </text>
                                )}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const item = payload[0].payload as TopProductCostItem;
                                        const sellPrice = item.selling_price ?? 0;
                                        const profit = sellPrice > 0 ? sellPrice - item.cost : 0;
                                        const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;

                                        return (
                                            <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#1C1C28]/95 border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xl backdrop-blur-md text-xs font-['Outfit'] space-y-2 min-w-52">
                                                <div className="border-b border-[#F8C8DC]/40 dark:border-white/10 pb-1.5">
                                                    <p className="font-black text-[#3D2C2E] dark:text-[#F8FAFC] text-sm leading-snug">{item.name}</p>
                                                    {item.sku && <p className="text-[10px] font-mono text-[#9E8B8E] dark:text-[#64748B]">SKU: {item.sku}</p>}
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[#E75480] dark:text-[#FF4F81] font-semibold">
                                                        <span>Cost per Serving:</span>
                                                        <span className="font-mono font-black">{formatCurrency(item.cost)}</span>
                                                    </div>

                                                    {sellPrice > 0 && (
                                                        <>
                                                            <div className="flex items-center justify-between text-[#5D4A4D] dark:text-[#94A3B8] font-medium">
                                                                <span>Selling Price:</span>
                                                                <span className="font-mono font-bold">{formatCurrency(sellPrice)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-[#F8C8DC]/20 dark:border-white/5">
                                                                <span>Est. Unit Margin:</span>
                                                                <span className="font-mono font-bold">+{margin.toFixed(1)}%</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="cost"
                                name="Cost per Serving (PHP)"
                                fill="url(#barCostGradient)"
                                radius={[0, 10, 10, 0]}
                                barSize={20}
                            >
                                {data.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
}
