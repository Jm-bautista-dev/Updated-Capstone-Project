import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface SalesOverTimeItem {
    date: string;
    revenue: number;
    profit: number;
}

interface SalesPerProductItem {
    name: string;
    total_sold: number;
    revenue?: number;
}

interface PaymentMethodItem {
    payment_method: string;
    revenue: number;
    count?: number;
}

const PIE_COLORS = ['#E75480', '#F472B6', '#F8C8DC', '#FB7185', '#E11D48'];

export function TrajectoryChart({ salesOverTime }: { salesOverTime?: SalesOverTimeItem[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                            <TrendingUp className="size-4" />
                        </div>
                        <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                            Operational Revenue & Margin Trajectory
                        </h2>
                    </div>
                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                        Comparative historical gross revenue against net profit performance.
                    </p>
                </div>
            </div>

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={salesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E75480" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#E75480" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ops-border, rgba(255, 255, 255, 0.06))" />
                        <XAxis dataKey="date" stroke="#9E8B8E" fontSize={11} tickLine={false} />
                        <YAxis stroke="#9E8B8E" fontSize={11} tickLine={false} tickFormatter={(val) => `₱${val}`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderColor: 'rgba(248, 200, 220, 0.6)',
                                borderRadius: '16px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                fontSize: '12px',
                                fontWeight: 700,
                            }}
                            formatter={(val: number | undefined) => [formatCurrency(val ?? 0), '']}
                        />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#E75480" strokeWidth={3} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={3} fill="url(#colorProfit)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

export function ProductDemandChart({ salesPerProduct }: { salesPerProduct?: SalesPerProductItem[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                    <BarChart3 className="size-4" />
                </div>
                <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                    Top Product Volume Demand
                </h2>
            </div>
            <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] mb-4">
                Highest selling items by checkout volume.
            </p>

            <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={salesPerProduct?.slice(0, 5)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ops-border, rgba(255, 255, 255, 0.06))" />
                        <XAxis dataKey="name" stroke="#9E8B8E" fontSize={10} tickLine={false} interval={0} />
                        <YAxis stroke="#9E8B8E" fontSize={10} tickLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderColor: 'rgba(248, 200, 220, 0.6)',
                                borderRadius: '14px',
                                fontSize: '11px',
                                fontWeight: 700,
                            }}
                        />
                        <Bar dataKey="total_sold" name="Units Sold" fill="#E75480" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

export function PaymentMixChart({ salesByPaymentMethod }: { salesByPaymentMethod?: PaymentMethodItem[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                    <PieIcon className="size-4" />
                </div>
                <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                    Payment Method Inflow
                </h2>
            </div>
            <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] mb-4">
                Revenue distribution across payment channels.
            </p>

            <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                        <Pie
                            data={salesByPaymentMethod}
                            dataKey="revenue"
                            nameKey="payment_method"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                        >
                            {salesByPaymentMethod?.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderColor: 'rgba(248, 200, 220, 0.6)',
                                borderRadius: '14px',
                                fontSize: '11px',
                                fontWeight: 700,
                            }}
                            formatter={(val: number | undefined) => [formatCurrency(val ?? 0), 'Revenue']}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
