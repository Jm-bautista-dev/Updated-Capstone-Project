import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import React from 'react';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

export interface BranchStat {
    id: number | string;
    name: string;
    orders_today: number;
    total_orders?: number;
    revenue_today: number;
    total_revenue?: number;
    total_expenses?: number;
    total_profit: number;
    profit_margin?: number;
}

interface BranchPerformanceTableProps {
    branchStats?: BranchStat[];
}

export function BranchPerformanceTable({ branchStats = [] }: BranchPerformanceTableProps) {
    const combinedTotals = React.useMemo(() => {
        if (!branchStats || branchStats.length === 0) return null;
        const totalOrders = branchStats.reduce((sum, b) => sum + (b.total_orders ?? b.orders_today ?? 0), 0);
        const totalRev = branchStats.reduce((sum, b) => sum + (b.total_revenue ?? b.revenue_today ?? 0), 0);
        const totalExp = branchStats.reduce((sum, b) => sum + (b.total_expenses ?? 0), 0);
        const totalProf = branchStats.reduce((sum, b) => sum + (b.total_profit ?? 0), 0);
        const margin = totalRev > 0 ? (totalProf / totalRev) * 100 : 0;
        return {
            totalOrders,
            totalRev,
            totalExp,
            totalProf,
            margin,
        };
    }, [branchStats]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transition-colors duration-300 overflow-hidden"
        >
            <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                    <MapPin className="size-4" />
                </div>
                <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                    Multi-Branch Live Performance
                </h2>
            </div>
            <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] mb-6">
                Real-time operational inflow, operating expenses, and profit margins calculated independently per location.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-[#F8C8DC]/40 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                            <th className="pb-3 px-3">Location Branch</th>
                            <th className="pb-3 px-3 text-center">Orders</th>
                            <th className="pb-3 px-3 text-right">Operational Revenue</th>
                            <th className="pb-3 px-3 text-right">Operating Costs</th>
                            <th className="pb-3 px-3 text-right">Net Profit</th>
                            <th className="pb-3 px-3 text-right">Profit Margin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8C8DC]/20 dark:divide-white/5">
                        {branchStats.map((branch) => {
                            const rev = branch.total_revenue ?? branch.revenue_today ?? 0;
                            const exp = branch.total_expenses ?? 0;
                            const prof = branch.total_profit ?? 0;
                            const margin = branch.profit_margin ?? (rev > 0 ? (prof / rev) * 100 : 0);
                            const orders = branch.total_orders ?? branch.orders_today ?? 0;

                            return (
                                <tr key={branch.id} className="hover:bg-[#FADADD]/15 dark:hover:bg-white/5 transition-colors group">
                                    <td className="py-3.5 px-3 font-bold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                        {branch.name}
                                    </td>
                                    <td className="py-3.5 px-3 text-center font-mono font-bold text-[#5D4A4D] dark:text-[#E2E8F0]">
                                        {orders}
                                    </td>
                                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        {formatCurrency(rev)}
                                    </td>
                                    <td className="py-3.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                        {formatCurrency(exp)}
                                    </td>
                                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(prof)}
                                    </td>
                                    <td className="py-3.5 px-3 text-right font-mono font-extrabold">
                                        <span className={`px-2 py-0.5 rounded-lg border text-[11px] ${
                                            margin >= 20 
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' 
                                                : margin > 0 
                                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' 
                                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                                        }`}>
                                            {margin.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    {combinedTotals && branchStats.length > 1 && (
                        <tfoot>
                            <tr className="border-t-2 border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/80 dark:bg-white/5 font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                <td className="py-3 px-3">Combined All Branches</td>
                                <td className="py-3 px-3 text-center font-mono">{combinedTotals.totalOrders}</td>
                                <td className="py-3 px-3 text-right font-mono">{formatCurrency(combinedTotals.totalRev)}</td>
                                <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400">{formatCurrency(combinedTotals.totalExp)}</td>
                                <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(combinedTotals.totalProf)}</td>
                                <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{combinedTotals.margin.toFixed(1)}%</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </motion.div>
    );
}
