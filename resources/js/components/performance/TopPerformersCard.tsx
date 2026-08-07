import { ArrowUpRight, Building2, Crown, Trophy, UserCheck } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TopPerformerProps {
    topCashier?: {
        name: string;
        branch_name: string;
        total_sales: string | number;
        total_transactions: number;
        avg_order_value: string | number;
    } | null;
    topBranchName?: string;
}

export function TopPerformersCard({ topCashier, topBranchName = 'Main Store' }: TopPerformerProps) {
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount || 0));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-['Outfit']">
            {/* Top Cashier Card */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-[#FFF5F7]/80 to-[#FADADD]/30 dark:from-[#121218] dark:via-[#161622]/90 dark:to-[#0A0A10] border border-white/90 dark:border-white/10 p-6 shadow-[0_12px_32px_-10px_rgba(231,84,128,0.1)] dark:shadow-[0_12px_32px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Crown className="size-5 text-amber-500 animate-bounce" />
                        <h3 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            #1 Top Sales Representative
                        </h3>
                    </div>
                    <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 font-black text-[10px] uppercase tracking-wider">
                        Rank Gold 🥇
                    </Badge>
                </div>

                {topCashier ? (
                    <div className="flex items-center gap-4 pt-1">
                        <div className="size-14 rounded-2xl bg-linear-to-tr from-[#E75480] to-[#FF4F81] p-0.5 shadow-md">
                            <div className="size-full rounded-[14px] bg-white dark:bg-[#121218] flex items-center justify-center text-xl font-black text-[#E75480] dark:text-[#FF4F81]">
                                {topCashier.name.charAt(0)}
                            </div>
                        </div>
                        <div className="space-y-1 flex-1">
                            <h4 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {topCashier.name}
                            </h4>
                            <p className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] flex items-center gap-1.5">
                                <Building2 className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                <span>{topCashier.branch_name || 'Assigned Branch'}</span>
                            </p>
                            <div className="flex items-center gap-3 pt-1 text-xs font-mono font-bold">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(topCashier.total_sales)}
                                </span>
                                <span className="text-[#7D6B6E] dark:text-[#94A3B8]">
                                    ({topCashier.total_transactions} orders)
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] py-4">No cashier performance record found for period.</p>
                )}
            </div>

            {/* Top Branch Card */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-[#FFF5F7]/80 to-[#FADADD]/30 dark:from-[#121218] dark:via-[#161622]/90 dark:to-[#0A0A10] border border-white/90 dark:border-white/10 p-6 shadow-[0_12px_32px_-10px_rgba(231,84,128,0.1)] dark:shadow-[0_12px_32px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="size-5 text-indigo-500" />
                        <h3 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            #1 Top Performing Branch
                        </h3>
                    </div>
                    <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 font-black text-[10px] uppercase tracking-wider">
                        Branch Leader 🏆
                    </Badge>
                </div>

                <div className="flex items-center gap-4 pt-1">
                    <div className="size-14 rounded-2xl bg-linear-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-md">
                        <div className="size-full rounded-[14px] bg-white dark:bg-[#121218] flex items-center justify-center text-xl font-black text-indigo-500">
                            <Building2 className="size-7" />
                        </div>
                    </div>
                    <div className="space-y-1 flex-1">
                        <h4 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            {topBranchName}
                        </h4>
                        <p className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] flex items-center gap-1.5">
                            <UserCheck className="size-3.5 text-indigo-500" />
                            <span>Highest operational volume & throughput</span>
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            <span>Exceeds Target Benchmark</span>
                            <ArrowUpRight className="size-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
