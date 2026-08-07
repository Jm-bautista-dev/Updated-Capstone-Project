import { motion } from 'framer-motion';
import { TrendingUp, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';

const SALES_TREND_DATA = [
    { date: 'Mon', revenue: 45000, target: 40000, orders: 120 },
    { date: 'Tue', revenue: 52000, target: 42000, orders: 154 },
    { date: 'Wed', revenue: 48000, target: 45000, orders: 110 },
    { date: 'Thu', revenue: 61000, target: 48000, orders: 165 },
    { date: 'Fri', revenue: 55000, target: 50000, orders: 140 },
    { date: 'Sat', revenue: 67000, target: 55000, orders: 180 },
    { date: 'Sun', revenue: 73380, target: 60000, orders: 204 },
];

const CATEGORY_SHARE = [
    { name: 'Ramen & Noodles', value: 45, color: '#E75480' },
    { name: 'Sushi & Rolls', value: 25, color: '#10b981' },
    { name: 'Beverages & Tea', value: 20, color: '#f59e0b' },
    { name: 'Appetizers & Sides', value: 10, color: '#3b82f6' },
];

const HOURLY_PEAK_DATA = [
    { hour: '10 AM', orders: 24 },
    { hour: '12 PM', orders: 68 },
    { hour: '2 PM', orders: 42 },
    { hour: '4 PM', orders: 31 },
    { hour: '6 PM', orders: 85 },
    { hour: '8 PM', orders: 92 },
    { hour: '10 PM', orders: 38 },
];

export function ReportsAnalytics() {
    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amt);

    return (
        <div className="space-y-6 font-['Outfit']">
            
            {/* ROW 1: Area Chart (Revenue Trend) & Donut Chart (Category Distribution) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Trend Area Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="lg:col-span-2 rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    Weekly Revenue Telemetry
                                </h3>
                            </div>
                            <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                Realized revenue trajectory vs baseline projections
                            </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono font-bold">
                            <span className="flex items-center gap-1 text-[#E75480] dark:text-[#FF4F81]">
                                <span className="size-2.5 rounded-full bg-[#E75480] dark:bg-[#FF4F81]" />
                                Actual Sales
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                                <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                Target Benchmark
                            </span>
                        </div>
                    </div>

                    <div className="h-72 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={SALES_TREND_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E75480" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#E75480" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v / 1000}k`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(18, 18, 24, 0.9)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontFamily: 'Outfit',
                                    }}
                                    formatter={(value: number | string | Array<number | string> | undefined) => [formatCurrency(Number(value || 0)), 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#E75480" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Category Revenue Share Donut Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-4 flex flex-col justify-between"
                >
                    <div>
                        <div className="flex items-center gap-2">
                            <PieIcon className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                            <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                Category Breakdown
                            </h3>
                        </div>
                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Share of gross revenue by product category
                        </p>
                    </div>

                    <div className="h-52 w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={CATEGORY_SHARE}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {CATEGORY_SHARE.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(18, 18, 24, 0.9)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#fff',
                                        fontSize: '12px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">100%</span>
                            <span className="text-[10px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Share</span>
                        </div>
                    </div>

                    {/* Category Legend List */}
                    <div className="space-y-1.5 pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10 text-xs font-bold">
                        {CATEGORY_SHARE.map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="size-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                    <span className="text-[#3D2C2E] dark:text-[#F8FAFC]">{cat.name}</span>
                                </div>
                                <span className="font-mono text-[#7D6B6E] dark:text-[#94A3B8]">{cat.value}%</span>
                            </div>
                        ))}
                    </div>

                </motion.div>

            </div>

            {/* ROW 2: Bar Chart (Hourly Order Density) */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart2 className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                            <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                Peak Operational Hours
                            </h3>
                        </div>
                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Hourly volume distribution for store staffing optimization
                        </p>
                    </div>
                </div>

                <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={HOURLY_PEAK_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(18, 18, 24, 0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    fontSize: '12px',
                                }}
                            />
                            <Bar dataKey="orders" fill="#E75480" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

        </div>
    );
}
