import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, TrendingUp, CheckCircle, Clock, Store } from 'lucide-react';
import { useMemo } from 'react';

export type SaleItem = {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product: {
        name: string;
    };
};

export type Sale = {
    id: number;
    order_number: string;
    type: 'dine-in' | 'take-out' | 'delivery';
    subtotal?: number;
    discount?: number;
    discount_type?: string;
    discount_details?: {
        type_name?: string;
        percentage?: number;
        fixed_amount?: number;
        customer_name?: string;
        id_number?: string;
        notes?: string;
        [key: string]: unknown;
    } | string;
    delivery_fee?: number;
    total: number;
    paid_amount: number;
    change_amount: number;
    payment_method: string;
    status: 'pending' | 'preparing' | 'completed' | 'cancelled';
    created_at: string;
    items: SaleItem[];
    delivery?: {
        id?: number;
        delivery_fee?: number;
        status?: string;
    };
    branch_id?: number;
    cashier: {
        name: string;
    };
    branch?: {
        id?: number;
        name: string;
        address?: string;
    };
    order?: {
        id?: number;
        branch?: {
            id?: number;
            name?: string;
            address?: string;
        };
    };
};

interface SalesStats {
    pending?: number | string;
    preparing?: number | string;
    completed_today?: number | string;
    [key: string]: unknown;
}

interface SalesHeroProps {
    sales: Sale[];
    stats?: SalesStats;
    activeBranchName: string;
}

export function SalesHero({ sales, stats, activeBranchName }: SalesHeroProps) {
    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amt);

    const { totalRevenue, completedCount, pendingCount, avgOrderValue } = useMemo(() => {
        let rev = 0;
        let completed = 0;
        let pending = 0;

        sales.forEach((s) => {
            if (s.status === 'completed') {
                const fee = Number(s.delivery_fee ?? s.delivery?.delivery_fee ?? 0);
                const sub = s.subtotal !== undefined && s.subtotal !== null
                    ? Number(s.subtotal)
                    : (s.items && s.items.length > 0
                        ? s.items.reduce((acc, it) => acc + Number(it.subtotal || 0), 0)
                        : Math.max(0, Number(s.total || 0) - fee));
                rev += sub;
                completed++;
            } else if (s.status === 'pending' || s.status === 'preparing') {
                pending++;
            }
        });

        const avg = completed > 0 ? rev / completed : 0;
        return {
            totalRevenue: rev,
            completedCount: stats?.completed_today ? Number(stats.completed_today) : completed,
            pendingCount: stats?.pending ? Number(stats.pending) : pending,
            avgOrderValue: avg,
        };
    }, [sales, stats]);

    return (
        <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-white via-[#FFF5F7]/80 to-[#FADADD]/40 dark:from-[#121218] dark:via-[#161622]/90 dark:to-[#0A0A10] p-6 sm:p-8 lg:p-10 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors duration-300">
            
            {/* Background Ambient Glow */}
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-linear-to-br from-[#E75480]/20 to-transparent dark:from-[#E1062C]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-linear-to-tr from-[#F8C8DC]/30 to-transparent dark:from-[#FF4F81]/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
                
                {/* Header Title & Branch Telemetry */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs">
                                <Store className="size-3.5" />
                                {activeBranchName}
                            </span>
                            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Live Sales Stream</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                            Sales Command Center
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-[#7D6B6E] dark:text-[#94A3B8] max-w-xl">
                            Real-time POS revenue telemetry, transaction history monitoring, and multi-branch register analytics.
                        </p>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    
                    {/* Gross Revenue Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                        className="rounded-3xl bg-white/90 dark:bg-[#181820]/90 border border-white/80 dark:border-white/10 p-5 shadow-[0_10px_25px_-5px_rgba(231,84,128,0.08)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] backdrop-blur-xl group hover:border-[#E75480]/40 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Gross Revenue</span>
                            <div className="size-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#20202C] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/50 dark:border-white/10 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                                <DollarSign className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-black font-mono text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                {formatCurrency(totalRevenue)}
                            </h2>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                                <TrendingUp className="size-3.5" />
                                <span>+14.2% vs yesterday</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Completed Orders Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="rounded-3xl bg-white/90 dark:bg-[#181820]/90 border border-white/80 dark:border-white/10 p-5 shadow-[0_10px_25px_-5px_rgba(231,84,128,0.08)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] backdrop-blur-xl group hover:border-emerald-400/40 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Completed Orders</span>
                            <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                                <CheckCircle className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-black font-mono text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                {completedCount}
                            </h2>
                            <div className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-bold font-mono">
                                Verified transactions today
                            </div>
                        </div>
                    </motion.div>

                    {/* Active Queue Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="rounded-3xl bg-white/90 dark:bg-[#181820]/90 border border-white/80 dark:border-white/10 p-5 shadow-[0_10px_25px_-5px_rgba(231,84,128,0.08)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] backdrop-blur-xl group hover:border-amber-400/40 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Pending Queue</span>
                            <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                                <Clock className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-black font-mono text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                {pendingCount}
                            </h2>
                            <div className="text-xs text-amber-600 dark:text-amber-400 font-bold font-mono">
                                In kitchen preparation
                            </div>
                        </div>
                    </motion.div>

                    {/* Average Order Value Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="rounded-3xl bg-white/90 dark:bg-[#181820]/90 border border-white/80 dark:border-white/10 p-5 shadow-[0_10px_25px_-5px_rgba(231,84,128,0.08)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] backdrop-blur-xl group hover:border-purple-400/40 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Avg Order Value</span>
                            <div className="size-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                                <ShoppingBag className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-black font-mono text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                {formatCurrency(avgOrderValue)}
                            </h2>
                            <div className="text-xs text-purple-600 dark:text-purple-400 font-bold font-mono">
                                Per completed receipt
                            </div>
                        </div>
                    </motion.div>

                </div>

            </div>
        </div>
    );
}
