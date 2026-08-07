import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

export interface BranchStat {
    id: number | string;
    name: string;
    orders_today: number;
    revenue_today: number;
    total_profit: number;
}

interface BranchPerformanceTableProps {
    branchStats?: BranchStat[];
}

export function BranchPerformanceTable({ branchStats }: BranchPerformanceTableProps) {
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
                Real-time operational inflow and checkout traffic across active locations.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-[#F8C8DC]/40 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                            <th className="pb-3 px-3">Location Branch</th>
                            <th className="pb-3 px-3 text-center">Transactions</th>
                            <th className="pb-3 px-3 text-right">Today's Inflow</th>
                            <th className="pb-3 px-3 text-right">Net Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8C8DC]/20 dark:divide-white/5">
                        {branchStats?.map((branch) => (
                            <tr key={branch.id} className="hover:bg-[#FADADD]/15 dark:hover:bg-white/5 transition-colors group">
                                <td className="py-3.5 px-3 font-bold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors">
                                    {branch.name}
                                </td>
                                <td className="py-3.5 px-3 text-center font-mono font-bold text-[#5D4A4D] dark:text-[#E2E8F0]">
                                    {branch.orders_today}
                                </td>
                                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {formatCurrency(branch.revenue_today)}
                                </td>
                                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(branch.total_profit)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
