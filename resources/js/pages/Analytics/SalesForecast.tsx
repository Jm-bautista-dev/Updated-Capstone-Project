import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    FiTrendingUp,
    FiTrendingDown,
    FiCalendar,
    FiFilter,
    FiInfo,
    FiCpu,
    FiActivity,
    FiZap
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

type HistoricalDay = {
    date: string;
    daily_total: number;
};

export default function SalesForecast() {
    const { historical: rawHistorical, prediction, trend, branches, filters, error } = usePage().props as any;
    const historical: HistoricalDay[] = rawHistorical || [];

    const [days, setDays] = useState(filters.days || '7');
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        router.get('/analytics/sales-forecast', newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    const nextDayDate = useMemo(() => {
        const lastDate = historical.length > 0 ? new Date(historical[historical.length - 1].date) : new Date();
        const next = new Date(lastDate);
        next.setDate(next.getDate() + 1);
        return format(next, 'MMM d, yyyy');
    }, [historical]);

    // Prepare chart data including the prediction point
    const chartData = useMemo(() => {
       const base = historical.map(d => ({
           date: format(new Date(d.date), 'MMM d'),
           actual: Number(d.daily_total),
           predicted: null
       }));

       if (base.length > 0 && prediction) {
           base.push({
               date: 'Next Day',
               actual: null,
               predicted: Number(prediction)
           } as any);
       }
       return base;
    }, [historical, prediction]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Analytics', href: '#' }, { title: 'Sales Forecast', href: '#' }]}>
            <Head title="Predictive Sales Forecast" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50/30">
                {/* Header Section */}
                <div className="bg-white border-b px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <FiCpu className="text-violet-600" />
                            Predictive Sales Forecast
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Moving average forecasting using historical transaction data.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                            <FiCalendar className="text-slate-400 ml-2 size-4" />
                            <Select value={String(days)} onValueChange={(val) => { setDays(val); handleFilterChange('days', val); }}>
                                <SelectTrigger className="w-32 bg-transparent border-none shadow-none focus:ring-0 text-xs font-bold uppercase tracking-tight">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Last 7 Days</SelectItem>
                                    <SelectItem value="14">Last 14 Days</SelectItem>
                                    <SelectItem value="30">Last 30 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                            <FiFilter className="text-slate-400 ml-2 size-4" />
                            <Select value={branchId} onValueChange={(val) => { setBranchId(val); handleFilterChange('branch_id', val); }}>
                                <SelectTrigger className="w-44 bg-transparent border-none shadow-none focus:ring-0 text-xs font-bold uppercase tracking-tight">
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
                    {error && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 rounded-2xl">
                            <FiInfo className="size-5" />
                            <AlertTitle className="font-black uppercase tracking-widest text-[10px] mb-1">Insufficient Data</AlertTitle>
                            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                        </Alert>
                    )}

                    {!error && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Prediction Result Card */}
                                <Card className="bg-violet-600 text-white shadow-2xl shadow-violet-100 border-none relative overflow-hidden">
                                    <div className="absolute -right-8 -top-8 size-40 bg-white/10 rounded-full blur-3xl" />
                                    <CardHeader className="relative z-10 pb-2">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-white/20 text-white border-none font-black uppercase text-[10px]">Statistical Prediction</Badge>
                                            <FiZap className="text-amber-300 size-5 animate-pulse" />
                                        </div>
                                        <CardTitle className="text-3xl font-black mt-4 leading-tight">
                                           Tomorrow's Forecast
                                        </CardTitle>
                                        <CardDescription className="text-violet-100 font-bold text-xs uppercase tracking-widest">
                                            {nextDayDate}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative z-10 pt-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-violet-200 tracking-widest">Estimated Revenue</p>
                                            <h2 className="text-5xl font-black tracking-tighter tabular-nums drop-shadow-md">
                                                {formatCurrency(prediction)}
                                            </h2>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "size-10 rounded-xl flex items-center justify-center backdrop-blur-md",
                                                    trend?.type === 'upward' ? "bg-emerald-400/20" : "bg-red-400/20"
                                                )}>
                                                    {trend?.type === 'upward' ? <FiTrendingUp className="text-emerald-300 size-5" /> : <FiTrendingDown className="text-red-300 size-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-violet-200 tracking-widest">Market Trend</p>
                                                    <p className="text-xs font-black uppercase">{trend?.type} ({trend?.percentage}%)</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[10px] h-8 rounded-lg px-4 border border-white/10">
                                                View Variance
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Insights Card */}
                                <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                            <FiActivity className="text-violet-600" />
                                            AI-Driven Insights
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Stability Score</p>
                                              <p className="text-sm font-bold text-slate-700">Moderate Confidence</p>
                                              <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">Based on {historical.length} days of consistent historical records.</p>
                                           </div>
                                           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Revenue Performance</p>
                                              <p className="text-sm font-bold text-slate-700">
                                                 {trend?.type === 'upward' ? 'Growing Demand' : 'Contracting Demand'}
                                              </p>
                                              <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">Historical velocity suggests a {trend?.type} momentum.</p>
                                           </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-2xl border border-violet-100">
                                           <FiInfo className="text-violet-600 mt-1 size-5 flex-shrink-0" />
                                           <div>
                                              <p className="text-xs font-black uppercase text-violet-800 tracking-tight">System Recommendation</p>
                                              <p className="text-xs text-violet-700/80 font-medium leading-relaxed mt-1">
                                                 Expected demand tomorrow is approximately {formatCurrency(prediction)}. 
                                                 We recommend ensuring stock availability for high-volume items to capture this projected revenue.
                                              </p>
                                           </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Main Visualization */}
                            <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="border-b bg-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm font-black uppercase tracking-widest">Revenue Forecast Chart</CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase">Actual Sales Path vs Projected Point</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="size-2 rounded-full bg-slate-400" />
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Actual</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="size-2 rounded-full bg-violet-600" />
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Predicted</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#94a3b8"
                                                    fontSize={10}
                                                    fontWeight="bold"
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    stroke="#94a3b8"
                                                    fontSize={10}
                                                    fontWeight="bold"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(value) => `₱${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                                                />
                                                <Tooltip
                                                   content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-100 ring-1 ring-black/5">
                                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{data.date}</p>
                                                                    <div className="space-y-1.5">
                                                                        {payload[0].value && (
                                                                            <p className="text-sm font-black text-slate-700">
                                                                                Actual: {formatCurrency(Number(payload[0].value))}
                                                                            </p>
                                                                        )}
                                                                        {payload[1] && payload[1].value && (
                                                                            <p className="text-sm font-black text-violet-600">
                                                                                Predicted: {formatCurrency(Number(payload[1].value))}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="actual"
                                                    stroke="#94a3b8"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorActual)"
                                                    animationDuration={1500}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="predicted"
                                                    stroke="#7c3aed"
                                                    strokeWidth={3}
                                                    strokeDasharray="5 5"
                                                    fillOpacity={1}
                                                    fill="url(#colorPredicted)"
                                                />
                                                <ReferenceLine x="Next Day" stroke="#7c3aed" strokeOpacity={0.2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                                        <div className="flex items-center gap-4">
                                           <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 uppercase">MA</div>
                                           <div>
                                              <p className="text-[10px] font-black uppercase text-slate-400">Model Type</p>
                                              <p className="text-xs font-bold">Simple Moving Average</p>
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                           <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 uppercase">WIN</div>
                                           <div>
                                              <p className="text-[10px] font-black uppercase text-slate-400">Window Period</p>
                                              <p className="text-xs font-bold">{days} Days historical</p>
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                           <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 uppercase">VAR</div>
                                           <div>
                                              <p className="text-[10px] font-black uppercase text-slate-400">Prediction Variance</p>
                                              <p className="text-xs font-bold">Standard moving weighted average</p>
                                           </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
