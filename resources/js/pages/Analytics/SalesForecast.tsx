import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    FiTrendingUp, FiTrendingDown, FiCalendar, FiFilter,
    FiInfo, FiZap, FiTarget, FiShield, FiAlertTriangle,
    FiArrowUp, FiArrowDown, FiMinus,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Area, ReferenceLine, ComposedChart, Line,
} from 'recharts';
import { format, parseISO } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────
type HistoricalDay = { date: string; total: number; moving_avg: number };
type ForecastDay   = { date: string; predicted: number; lower: number; upper: number; dow: string };

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatCurrency = (v?: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v ?? 0);

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
        <div className="bg-background dark:bg-zinc-900 p-4 shadow-2xl rounded-2xl border dark:border-zinc-800 ring-1 ring-black/5 dark:ring-white/5 min-w-[200px]">
            <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-zinc-500 mb-3 border-b dark:border-zinc-800 pb-2">{d?.date}</p>
            <div className="space-y-2">
                {d?.actual != null && (
                    <div className="flex justify-between gap-4">
                        <span className="text-[11px] font-bold text-muted-foreground">Actual</span>
                        <span className="text-[11px] font-black text-foreground dark:text-white">{formatCurrency(d.actual)}</span>
                    </div>
                )}
                {d?.moving_avg != null && (
                    <div className="flex justify-between gap-4">
                        <span className="text-[11px] font-bold text-amber-500">Moving Avg</span>
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">{formatCurrency(d.moving_avg)}</span>
                    </div>
                )}
                {d?.predicted != null && (
                    <>
                        <div className="flex justify-between gap-4">
                            <span className="text-[11px] font-bold text-primary">Forecast</span>
                            <span className="text-[11px] font-black text-primary">{formatCurrency(d.predicted)}</span>
                        </div>
                        {d?.upper != null && (
                            <div className="flex justify-between gap-4 opacity-60">
                                <span className="text-[10px] font-bold text-muted-foreground">Range</span>
                                <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                    {formatCurrency(d.lower)} – {formatCurrency(d.upper)}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ── Confidence Badge ────────────────────────────────────────────────────────────
function ConfidenceBadge({ score }: { score: number }) {
    const level = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
    const config = {
        high:   { label: 'High Confidence',   cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: FiShield },
        medium: { label: 'Medium Confidence', cls: 'bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20',  icon: FiMinus },
        low:    { label: 'Low Confidence',    cls: 'bg-rose-500/10   text-rose-600   dark:text-rose-400   border-rose-500/20',   icon: FiAlertTriangle },
    }[level];
    const Icon = config.icon;
    return (
        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider', config.cls)}>
            <Icon className="size-3.5" />
            <span>{score.toFixed(1)}% — {config.label}</span>
        </div>
    );
}

// ── DOW Seasonality Heat Strip ─────────────────────────────────────────────────
function SeasonalityStrip({ pattern }: { pattern: Record<number, number> }) {
    if (!pattern) return null;
    const values = Object.values(pattern);
    const max = Math.max(...values);
    const min = Math.min(...values);
    return (
        <div className="flex gap-1">
            {DOW_LABELS.map((day, i) => {
                const val  = pattern[i] ?? 1;
                const pct  = max > min ? ((val - min) / (max - min)) : 0.5;
                const heat = pct >= 0.75 ? 'bg-emerald-500' : pct >= 0.4 ? 'bg-amber-500' : 'bg-rose-500';
                return (
                    <div key={day} className="flex flex-col items-center gap-1">
                        <div title={`${(val * 100).toFixed(0)}% vs avg`}
                            className={cn('w-8 rounded-md transition-all', heat)}
                            style={{ height: `${20 + pct * 28}px`, opacity: 0.6 + pct * 0.4 }}
                        />
                        <span className="text-[9px] font-black text-muted-foreground uppercase">{day}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SalesForecast() {
    const {
        historical: rawHistorical,
        prediction,
        prediction_lower,
        prediction_upper,
        forecast: rawForecast,
        trend,
        branches,
        filters,
        error,
        confidence,
        insights,
        seasonal_pattern,
    } = usePage().props as any;

    const historical: HistoricalDay[] = rawHistorical || [];
    const forecast:   ForecastDay[]   = rawForecast   || [];

    const [days, setDays]         = useState(filters?.days || '30');
    const [branchId, setBranchId] = useState(filters?.branch_id || 'all');
    const [isLoading, setIsLoading] = useState(false);

    const handleFilterChange = (key: string, value: string) => {
        setIsLoading(true);
        router.get('/analytics/sales-forecast', { ...filters, [key]: value }, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsLoading(false),
        });
    };

    const nextDayDate = useMemo(() => {
        if (forecast.length > 0) return format(parseISO(forecast[0].date), 'EEE, MMM d');
        return 'Tomorrow';
    }, [forecast]);

    // Build unified chart data ─────────────────────────────────────────────────
    const chartData = useMemo(() => {
        const base = historical.map(d => ({
            date:       format(parseISO(d.date), 'MMM d'),
            actual:     Number(d.total),
            moving_avg: Number(d.moving_avg),
            predicted:  undefined as number | undefined,
            lower:      undefined as number | undefined,
            upper:      undefined as number | undefined,
        }));

        const future = forecast.map(d => ({
            date:       format(parseISO(d.date), 'MMM d'),
            actual:     undefined as number | undefined,
            moving_avg: undefined as number | undefined,
            predicted:  Number(d.predicted),
            lower:      Number(d.lower),
            upper:      Number(d.upper),
        }));

        return [...base, ...future];
    }, [historical, forecast]);

    const weeklyTotal   = forecast.reduce((s, f) => s + f.predicted, 0);
    const referenceDate = historical.length > 0
        ? format(parseISO(historical[historical.length - 1].date), 'MMM d')
        : null;

    return (
        <AppLayout breadcrumbs={[{ title: 'Analytics', href: '#' }, { title: 'Sales Forecast', href: '#' }]}>
            <Head title="AI Sales Forecasting" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background dark:bg-zinc-950">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-foreground dark:text-white">
                            <FiTarget className="text-primary" />
                            AI Sales Forecasting
                            {isLoading && <span className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin ml-1" />}
                        </h1>
                        <p className="text-sm text-muted-foreground dark:text-zinc-500 font-medium mt-1">
                            Hybrid model · Trend + Seasonality + Moving Average · Outlier-filtered
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center bg-muted/50 dark:bg-zinc-800/50 rounded-xl p-1 gap-1">
                            <FiCalendar className="text-muted-foreground ml-2 size-4" />
                            <Select value={String(days)} onValueChange={v => { setDays(v); handleFilterChange('days', v); }}>
                                <SelectTrigger className="w-32 bg-transparent border-none shadow-none focus:ring-0 text-xs font-bold uppercase text-foreground dark:text-zinc-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Last 7 Days</SelectItem>
                                    <SelectItem value="14">Last 14 Days</SelectItem>
                                    <SelectItem value="30">Last 30 Days</SelectItem>
                                    <SelectItem value="90">Last 90 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center bg-muted/50 dark:bg-zinc-800/50 rounded-xl p-1 gap-1">
                            <FiFilter className="text-muted-foreground ml-2 size-4" />
                            <Select value={branchId} onValueChange={v => { setBranchId(v); handleFilterChange('branch_id', v); }}>
                                <SelectTrigger className="w-44 bg-transparent border-none shadow-none focus:ring-0 text-xs font-bold uppercase text-foreground dark:text-zinc-300">
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

                {/* ── Body ───────────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-2xl">
                            <FiInfo className="size-5" />
                            <AlertTitle className="font-black uppercase tracking-widest text-[10px] mb-1">Model Error</AlertTitle>
                            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                        </Alert>
                    )}

                    {!error && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${days}-${branchId}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >

                                {/* ── Row 1: KPI Cards ─────────────────────────── */}
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">

                                    {/* Tomorrow Prediction */}
                                    <Card className="bg-primary text-white shadow-xl shadow-primary/20 border-none relative overflow-hidden">
                                        <div className="absolute -right-8 -top-8 size-32 bg-white/10 rounded-full blur-2xl" />
                                        <CardHeader className="pb-2">
                                            <Badge className="bg-white/20 text-white border-none font-black uppercase text-[9px] w-fit mb-1">
                                                {nextDayDate}
                                            </Badge>
                                            <CardDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest">
                                                Expected Revenue
                                            </CardDescription>
                                            <CardTitle className="text-3xl font-black tabular-nums">
                                                {formatCurrency(prediction)}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0 space-y-2">
                                            {prediction_lower != null && (
                                                <p className="text-[10px] font-bold text-primary-foreground/60 tabular-nums">
                                                    Range: {formatCurrency(prediction_lower)} – {formatCurrency(prediction_upper)}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <div className={cn('size-5 rounded-md flex items-center justify-center', trend?.type === 'upward' ? 'bg-emerald-400/20' : 'bg-red-400/20')}>
                                                    {trend?.type === 'upward'
                                                        ? <FiArrowUp className="size-3 text-emerald-300" />
                                                        : <FiArrowDown className="size-3 text-red-300" />}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/70">
                                                    {trend?.type} Trend
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Growth Slope */}
                                    <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                        <CardContent className="p-6">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Growth Slope</p>
                                            <h3 className={cn('text-2xl font-black', trend?.slope >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive dark:text-red-400')}>
                                                {trend?.slope >= 0 ? '+' : ''}{formatCurrency(trend?.slope)}
                                                <span className="text-xs font-bold text-muted-foreground ml-1 whitespace-nowrap">/ day</span>
                                            </h3>
                                            <div className="mt-4">
                                                <Badge variant="outline" className={cn('border-none font-black text-[10px] uppercase', trend?.percentage >= 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400')}>
                                                    {trend?.percentage > 0 ? '+' : ''}{trend?.percentage}% overall
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Weekly Forecast */}
                                    <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                        <CardContent className="p-6">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">7-Day Projection</p>
                                            <h3 className="text-2xl font-black text-foreground dark:text-white tabular-nums">
                                                {formatCurrency(weeklyTotal)}
                                            </h3>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-3">Projected Weekly Revenue</p>
                                        </CardContent>
                                    </Card>

                                    {/* Confidence Score */}
                                    <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                        <CardContent className="p-6">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Model Confidence</p>
                                            <div className="relative h-2 bg-muted dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                                                <motion.div
                                                    className={cn('h-full rounded-full', confidence >= 75 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${confidence ?? 0}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                />
                                            </div>
                                            <p className="text-2xl font-black text-foreground dark:text-white tabular-nums">{(confidence ?? 0).toFixed(1)}%</p>
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                                {confidence >= 75 ? 'High reliability' : confidence >= 50 ? 'Moderate reliability' : 'Low — more data needed'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* ── Row 2: Chart + Table ─────────────────────── */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

                                    {/* Main Chart */}
                                    <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                        <CardHeader className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 px-6 py-4">
                                            <div className="flex items-center justify-between flex-wrap gap-3">
                                                <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white">
                                                    Hybrid Forecast Visualization
                                                </CardTitle>
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    <LegendDot color="#94a3b8" label="Actual" />
                                                    <LegendDot color="#f59e0b" label="Moving Avg" />
                                                    <LegendDot color="#6366f1" label="Forecast" />
                                                    <LegendDot color="#6366f130" label="Confidence Band" />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="h-[380px] w-full min-h-[380px]">
                                                <ResponsiveContainer width="100%" height={380}>
                                                    <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.15} />
                                                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}    />
                                                            </linearGradient>
                                                            <linearGradient id="gradBand" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.04} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                                                        <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground dark:text-zinc-600" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} minTickGap={30} />
                                                        <YAxis stroke="currentColor" className="text-muted-foreground dark:text-zinc-600" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tickFormatter={v => `₱${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                                                        <Tooltip content={<ChartTooltip />} />

                                                        {/* Confidence Band */}
                                                        <Area type="monotone" dataKey="upper"   fill="url(#gradBand)" stroke="none"    fillOpacity={1} />
                                                        <Area type="monotone" dataKey="lower"   fill="#ffffff"        stroke="none"    fillOpacity={1} />

                                                        {/* Actual History */}
                                                        <Area type="monotone" dataKey="actual"     stroke="#94a3b8" strokeWidth={2} fill="url(#gradActual)" fillOpacity={1} dot={false} animationDuration={1000} />

                                                        {/* Moving Average overlay */}
                                                        <Line type="monotone" dataKey="moving_avg" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" animationDuration={1200} />

                                                        {/* Forecast line */}
                                                        <Line type="monotone" dataKey="predicted"  stroke="#6366f1" strokeWidth={3} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} animationDuration={1500} />

                                                        {/* Today separator */}
                                                        {referenceDate && (
                                                            <ReferenceLine x={referenceDate} stroke="#6366f1" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: 'Today', position: 'top', fontSize: 9, fill: '#6366f1' }} />
                                                        )}
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* 7-Day Table */}
                                    <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50 overflow-hidden">
                                        <CardHeader className="bg-muted/30 dark:bg-zinc-900 border-b dark:border-zinc-800">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white flex items-center gap-2">
                                                <FiCalendar className="text-primary" />
                                                7-Day Forecast Grid
                                            </CardTitle>
                                        </CardHeader>
                                        <div className="overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800">
                                                    <tr>
                                                        <th className="px-5 py-3 font-black uppercase tracking-widest text-[9px] text-muted-foreground dark:text-zinc-500">Date</th>
                                                        <th className="px-5 py-3 font-black uppercase tracking-widest text-[9px] text-muted-foreground dark:text-zinc-500 text-right">Forecast</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border dark:divide-zinc-800">
                                                    {forecast.map((f, i) => (
                                                        <tr key={i} className="hover:bg-muted/30 dark:hover:bg-zinc-800/30 transition-colors group">
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-1.5 rounded-full bg-primary group-hover:scale-125 transition-transform" />
                                                                    <div>
                                                                        <p className="font-bold text-foreground dark:text-zinc-200 text-xs">{format(parseISO(f.date), 'EEE, MMM d')}</p>
                                                                        <p className="text-[10px] text-muted-foreground tabular-nums">{formatCurrency(f.lower)} – {formatCurrency(f.upper)}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 text-right">
                                                                <span className="font-black text-primary tabular-nums text-xs">{formatCurrency(f.predicted)}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="p-5 bg-primary/5 dark:bg-primary/10 border-t dark:border-zinc-800">
                                                <div className="flex items-start gap-2">
                                                    <FiZap className="text-primary mt-0.5 size-3.5 shrink-0" />
                                                    <p className="text-[10px] text-primary font-bold leading-relaxed opacity-80">
                                                        Hybrid model: 40% trend · 30% seasonality · 30% moving avg.
                                                        Bands represent ±1.5σ confidence interval.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* ── Row 3: Insights + Seasonality ────────────── */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

                                    {/* Smart Insights */}
                                    <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                        <CardHeader className="border-b dark:border-zinc-800 pb-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white flex items-center gap-2">
                                                <FiZap className="text-primary" />
                                                Smart Insights
                                            </CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                                                Why the model predicted this
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-5 space-y-3">
                                            {confidence != null && <ConfidenceBadge score={confidence} />}
                                            <div className="space-y-2 mt-2">
                                                {(insights ?? []).map((insight: string, i: number) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 dark:bg-zinc-800/40 border border-border/40"
                                                    >
                                                        <p className="text-[11px] font-semibold text-foreground dark:text-zinc-300 leading-relaxed">{insight}</p>
                                                    </motion.div>
                                                ))}
                                                {(!insights || insights.length === 0) && (
                                                    <p className="text-xs text-muted-foreground italic">No insights generated. Record more sales data.</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Day-of-Week Seasonality */}
                                    <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                        <CardHeader className="border-b dark:border-zinc-800 pb-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white flex items-center gap-2">
                                                <FiCalendar className="text-primary" />
                                                Day-of-Week Pattern
                                            </CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                                                Detected sales seasonality by weekday
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <SeasonalityStrip pattern={seasonal_pattern} />
                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t dark:border-zinc-800">
                                                <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-muted-foreground">High</span></div>
                                                <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-amber-500"  /><span className="text-[10px] font-bold text-muted-foreground">Avg</span></div>
                                                <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-rose-500"   /><span className="text-[10px] font-bold text-muted-foreground">Low</span></div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                {seasonal_pattern && DOW_LABELS.map((day, i) => {
                                                    const v = (seasonal_pattern[i] ?? 1);
                                                    const pct = Math.round(v * 100);
                                                    return (
                                                        <div key={day} className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black uppercase w-8 text-muted-foreground">{day}</span>
                                                            <div className="flex-1 h-1.5 bg-muted dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                <div className={cn('h-full rounded-full', v >= 1.15 ? 'bg-emerald-500' : v >= 0.85 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${Math.min(100, pct)}%` }} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-muted-foreground tabular-nums w-10 text-right">{pct}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

// ── Tiny helper ────────────────────────────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] font-bold uppercase text-muted-foreground dark:text-zinc-500">{label}</span>
        </div>
    );
}
