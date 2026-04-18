import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    FiBox, FiShoppingCart, FiAlertCircle, FiTrendingUp, FiTrendingDown,
    FiFilter, FiCheckCircle, FiPlusCircle, FiBarChart2, FiInfo,
    FiAlertTriangle, FiShield, FiMinus, FiActivity, FiZap,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────
type Urgency = 'Out of Stock' | 'Critical' | 'Warning' | 'Safe';
type Trend   = 'rising' | 'stable' | 'declining';
type Volatility = 'high' | 'medium' | 'low';

type Suggestion = {
    ingredient_id:        number;
    name:                 string;
    unit:                 string;
    current_stock:        number;
    low_stock_level:      number;
    predicted_usage:      number;
    required_with_buffer: number;
    suggested_restock:    number;
    estimated_cost:       number;
    status:               Urgency;
    trend:                Trend;
    volatility:           Volatility;
    safety_buffer_pct:    number;
    confidence:           number;
    days_of_stock:        number;
    days_of_data:         number;
    predicted_usage_lower: number;
    predicted_usage_upper: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v?: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v ?? 0);

const urgencyConfig: Record<Urgency, { label: string; badgeCls: string; rowCls: string; dotCls: string }> = {
    'Out of Stock': {
        label:    'Out of Stock',
        badgeCls: 'bg-rose-600 text-white',
        rowCls:   'bg-rose-50/40 dark:bg-rose-950/20',
        dotCls:   'bg-rose-600 animate-ping',
    },
    Critical: {
        label:    'Critical',
        badgeCls: 'bg-destructive/10 text-destructive dark:text-red-400',
        rowCls:   'bg-red-50/30 dark:bg-red-950/10',
        dotCls:   'bg-rose-500',
    },
    Warning: {
        label:    'Warning',
        badgeCls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        rowCls:   '',
        dotCls:   'bg-amber-500',
    },
    Safe: {
        label:    'Safe',
        badgeCls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        rowCls:   '',
        dotCls:   'bg-emerald-500',
    },
};

const trendIcon = (t: Trend) => {
    if (t === 'rising')   return <FiTrendingUp   className="size-3 text-emerald-500" />;
    if (t === 'declining') return <FiTrendingDown className="size-3 text-rose-500" />;
    return <FiMinus className="size-3 text-muted-foreground" />;
};

const volatilityColor = (v: Volatility) => {
    if (v === 'high')   return 'text-rose-500';
    if (v === 'medium') return 'text-amber-500';
    return 'text-emerald-500';
};

// ── Stock Coverage Bar ─────────────────────────────────────────────────────────
function CoverageBar({ current, required, status }: { current: number; required: number; status: Urgency }) {
    const pct = required > 0 ? Math.min(100, (current / required) * 100) : 100;
    const barCls = status === 'Safe' ? 'bg-emerald-500'
        : status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500';
    return (
        <div className="w-24 h-1.5 bg-muted dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
                className={cn('h-full rounded-full', barCls)}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            />
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RestockSuggestions() {
    const {
        suggestions,
        branches,
        tomorrow_forecast,
        forecast_lower,
        forecast_upper,
        demand_ratio,
        forecast_insights,
        forecast_trend,
        forecast_confidence,
        filters,
        error,
    } = usePage().props as any;

    const [branchId, setBranchId]   = useState(String(filters?.branch_id || ''));
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setFilter] = useState<'All' | Urgency>('All');

    const handleFilterChange = (key: string, value: string) => {
        setIsLoading(true);
        router.get('/analytics/restock-suggestions', { [key]: value }, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsLoading(false),
        });
    };

    // ── Derived stats ──────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const s: Suggestion[] = suggestions || [];
        return {
            total:         s.length,
            totalCost:     s.reduce((sum, x) => sum + x.estimated_cost, 0),
            critical:      s.filter(x => x.status === 'Critical' || x.status === 'Out of Stock').length,
            outOfStock:    s.filter(x => x.status === 'Out of Stock').length,
            rising:        s.filter(x => x.trend === 'rising').length,
            highVolatility: s.filter(x => x.volatility === 'high').length,
            avgConfidence: s.length
                ? Math.round(s.reduce((sum, x) => sum + x.confidence, 0) / s.length)
                : 0,
        };
    }, [suggestions]);

    const filtered: Suggestion[] = useMemo(() => {
        const s: Suggestion[] = suggestions || [];
        return activeFilter === 'All' ? s : s.filter(x => x.status === activeFilter);
    }, [suggestions, activeFilter]);

    const demandAboveAvg = (demand_ratio ?? 1) > 1.1;
    const demandBelowAvg = (demand_ratio ?? 1) < 0.9;

    return (
        <AppLayout breadcrumbs={[{ title: 'Analytics', href: '#' }, { title: 'Restock Suggestions', href: '#' }]}>
            <Head title="Prescriptive Restock AI" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background dark:bg-zinc-950">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-foreground dark:text-white">
                            <FiBox className="text-emerald-500" />
                            Prescriptive Restock AI
                            {isLoading && (
                                <span className="size-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin ml-1" />
                            )}
                        </h1>
                        <p className="text-sm text-muted-foreground dark:text-zinc-500 font-medium mt-1">
                            Adaptive demand · Trend-aware · Volatility-weighted safety buffers
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-emerald-50/50 dark:bg-emerald-500/10 rounded-xl p-1 gap-1 border border-emerald-100 dark:border-emerald-500/20">
                            <FiFilter className="text-emerald-600 dark:text-emerald-400 ml-2 size-4" />
                            <Select value={branchId} onValueChange={v => { setBranchId(v); handleFilterChange('branch_id', v); }}>
                                <SelectTrigger className="w-56 bg-transparent border-none shadow-none focus:ring-0 text-xs font-bold uppercase tracking-tight text-emerald-900 dark:text-emerald-200">
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches?.map((b: any) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* ── Body ───────────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-2xl">
                            <FiAlertTriangle className="size-5" />
                            <AlertTitle className="font-black uppercase tracking-widest text-[10px] mb-1">Intelligence Gap</AlertTitle>
                            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                        </Alert>
                    )}

                    {!error && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={branchId}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >

                                {/* ── Forecast Context Banner ───────────────── */}
                                <div className={cn(
                                    'flex flex-wrap items-start gap-4 p-5 rounded-2xl border',
                                    demandAboveAvg
                                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                                        : demandBelowAvg
                                        ? 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/40'
                                        : 'bg-primary/5 dark:bg-primary/10 border-primary/20'
                                )}>
                                    <FiInfo className={cn('size-5 mt-0.5 shrink-0', demandAboveAvg ? 'text-amber-600' : demandBelowAvg ? 'text-sky-600' : 'text-primary')} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Demand Forecast Context</p>
                                        <p className="text-sm font-semibold text-foreground dark:text-zinc-200 leading-relaxed">
                                            Tomorrow's predicted revenue is{' '}
                                            <strong className="font-black">{fmt(tomorrow_forecast)}</strong>
                                            {' '}(range: {fmt(forecast_lower)} – {fmt(forecast_upper)}).{' '}
                                            {demandAboveAvg
                                                ? `Demand is ${Math.round((demand_ratio - 1) * 100)}% above average — buffers have been increased automatically.`
                                                : demandBelowAvg
                                                ? `Demand is ${Math.round((1 - demand_ratio) * 100)}% below average — conservative restocking applied.`
                                                : 'Demand is in line with the historical average.'}
                                        </p>
                                    </div>
                                    {forecast_confidence != null && (
                                        <div className="shrink-0">
                                            <Badge className={cn(
                                                'font-black text-[10px] uppercase px-3 py-1',
                                                forecast_confidence >= 75 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                                                forecast_confidence >= 50 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                                                'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                            )}>
                                                <FiShield className="inline size-3 mr-1" />
                                                {forecast_confidence}% forecast confidence
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* ── KPI Summary Cards ────────────────────── */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <KpiCard
                                        icon={<FiShoppingCart className="text-orange-600 dark:text-orange-400 size-5" />}
                                        iconBg="bg-orange-500/10"
                                        label="To Restock"
                                        value={`${stats.total} items`}
                                        badge="Action Required"
                                        badgeCls="bg-orange-500/10 text-orange-700 dark:text-orange-400"
                                    />
                                    <KpiCard
                                        icon={<FiAlertCircle className="text-rose-600 dark:text-rose-400 size-5" />}
                                        iconBg="bg-rose-500/10"
                                        label="Critical / OOS"
                                        value={<span className="text-rose-600 dark:text-rose-400">{stats.critical} items</span>}
                                        badge={stats.outOfStock > 0 ? `${stats.outOfStock} out of stock` : 'Monitor closely'}
                                        badgeCls="bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                    />
                                    <KpiCard
                                        icon={<FiTrendingUp className="text-emerald-600 dark:text-emerald-400 size-5" />}
                                        iconBg="bg-emerald-500/10"
                                        label="Est. Investment"
                                        value={fmt(stats.totalCost)}
                                        badge="Estimated Cost"
                                        badgeCls="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    />
                                    <KpiCard
                                        icon={<FiActivity className="text-primary dark:text-primary-foreground size-5" />}
                                        iconBg="bg-primary/10"
                                        label="Avg Model Confidence"
                                        value={`${stats.avgConfidence}%`}
                                        badge={`${stats.rising} rising trends`}
                                        badgeCls="bg-primary/10 text-primary dark:text-primary-foreground"
                                    />
                                </div>

                                {/* ── Urgency Filter Tabs ──────────────────── */}
                                <div className="flex flex-wrap gap-2">
                                    {(['All', 'Out of Stock', 'Critical', 'Warning', 'Safe'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f as any)}
                                            className={cn(
                                                'px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border',
                                                activeFilter === f
                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                            )}
                                        >
                                            {f} {f === 'All' ? `(${(suggestions || []).length})` :
                                                `(${(suggestions || []).filter((s: Suggestion) => s.status === f).length})`}
                                        </button>
                                    ))}
                                </div>

                                {/* ── Main Table ────────────────────────────── */}
                                <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50 overflow-hidden">
                                    <CardHeader className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground dark:text-white">
                                                <FiZap className="text-emerald-600 dark:text-emerald-400" />
                                                Adaptive Restock Recommendations
                                            </CardTitle>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                                {stats.highVolatility > 0 && (
                                                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[9px]">
                                                        ⚠ {stats.highVolatility} volatile items
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-muted/30 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                                                <tr>
                                                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Ingredient</th>
                                                    <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Stock / Coverage</th>
                                                    <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Predicted Usage</th>
                                                    <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Safety Buffer</th>
                                                    <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Restock Qty</th>
                                                    <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Est. Cost</th>
                                                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Urgency</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border dark:divide-zinc-800">
                                                <AnimatePresence>
                                                    {filtered.map((s, i) => {
                                                        const cfg = urgencyConfig[s.status];
                                                        return (
                                                            <motion.tr
                                                                key={s.ingredient_id}
                                                                initial={{ opacity: 0, x: -8 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0 }}
                                                                transition={{ delay: i * 0.04 }}
                                                                className={cn('group transition-colors hover:bg-muted/20 dark:hover:bg-zinc-800/40', cfg.rowCls)}
                                                            >
                                                                {/* Ingredient */}
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="relative">
                                                                            <div className="size-9 rounded-xl bg-muted dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-foreground dark:text-zinc-300">
                                                                                {s.name.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div className={cn('absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background', cfg.dotCls)} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-black text-sm text-foreground dark:text-white leading-tight">{s.name}</p>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{s.days_of_data}d data</span>
                                                                                <span className="text-[9px] text-muted-foreground">·</span>
                                                                                <span className={cn('text-[9px] font-black uppercase', volatilityColor(s.volatility))}>
                                                                                    {s.volatility} volatility
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Stock / Coverage */}
                                                                <td className="px-4 py-4">
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="font-mono font-black text-sm text-foreground dark:text-zinc-200">
                                                                                {s.current_stock}
                                                                            </span>
                                                                            <span className="text-[10px] text-muted-foreground font-bold">{s.unit}</span>
                                                                        </div>
                                                                        <CoverageBar
                                                                            current={s.current_stock}
                                                                            required={s.required_with_buffer}
                                                                            status={s.status}
                                                                        />
                                                                        <p className="text-[9px] font-bold text-muted-foreground">
                                                                            {s.days_of_stock < 1
                                                                                ? '< 1 day left'
                                                                                : `~${s.days_of_stock}d coverage`}
                                                                        </p>
                                                                    </div>
                                                                </td>

                                                                {/* Predicted Usage */}
                                                                <td className="px-4 py-4 text-center">
                                                                    <div className="space-y-1">
                                                                        <Badge variant="outline" className="font-black text-[10px] border-border dark:border-zinc-700 bg-background dark:bg-zinc-900">
                                                                            {s.predicted_usage} {s.unit}
                                                                        </Badge>
                                                                        <p className="text-[9px] text-muted-foreground tabular-nums">
                                                                            {s.predicted_usage_lower} – {s.predicted_usage_upper}
                                                                        </p>
                                                                    </div>
                                                                </td>

                                                                {/* Safety Buffer */}
                                                                <td className="px-4 py-4 text-center">
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className="flex items-center gap-1">
                                                                            {trendIcon(s.trend)}
                                                                            <span className="text-[10px] font-black text-foreground dark:text-zinc-300 capitalize">{s.trend}</span>
                                                                        </div>
                                                                        <Badge className="bg-muted dark:bg-zinc-800 text-muted-foreground border-none font-black text-[9px]">
                                                                            +{s.safety_buffer_pct}% buffer
                                                                        </Badge>
                                                                    </div>
                                                                </td>

                                                                {/* Restock Qty */}
                                                                <td className="px-4 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <FiPlusCircle className="size-3 text-primary" />
                                                                        <span className="font-black text-primary dark:text-primary-foreground tabular-nums">
                                                                            {s.suggested_restock} {s.unit}
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                {/* Est. Cost */}
                                                                <td className="px-4 py-4 text-right font-black text-foreground dark:text-zinc-100 tabular-nums text-sm">
                                                                    {fmt(s.estimated_cost)}
                                                                </td>

                                                                {/* Urgency */}
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <Badge className={cn('font-black text-[9px] uppercase tracking-widest rounded-lg px-2 py-1', cfg.badgeCls)}>
                                                                            {cfg.label}
                                                                        </Badge>
                                                                        <span className="text-[9px] text-muted-foreground font-bold">{s.confidence}% conf.</span>
                                                                    </div>
                                                                </td>
                                                            </motion.tr>
                                                        );
                                                    })}
                                                </AnimatePresence>

                                                {filtered.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="px-8 py-20 text-center">
                                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                                <FiCheckCircle className="size-12 text-emerald-600" />
                                                                <p className="text-sm font-black uppercase tracking-widest">
                                                                    {activeFilter === 'All' ? 'Inventory Fully Optimized' : `No ${activeFilter} Items`}
                                                                </p>
                                                                <p className="text-xs font-bold">Current stock meets all forecasted demand benchmarks.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* ── Bottom Row: Insights + Model Info ──────── */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    {/* Forecast Insights passed through */}
                                    <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                        <CardHeader className="border-b dark:border-zinc-800 pb-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground dark:text-white">
                                                <FiZap className="text-primary" /> Demand Intelligence
                                            </CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                                                Driving factors for this restock plan
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-5 space-y-2">
                                            {(forecast_insights ?? []).map((insight: string, i: number) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -6 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 dark:bg-zinc-800/40 border border-border/40"
                                                >
                                                    <p className="text-[11px] font-semibold text-foreground dark:text-zinc-300 leading-relaxed">{insight}</p>
                                                </motion.div>
                                            ))}
                                            {(!forecast_insights || forecast_insights.length === 0) && (
                                                <p className="text-xs text-muted-foreground italic">No insights available. Record more sales data.</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Model transparency card */}
                                    <Card className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white border-none">
                                        <CardContent className="p-7 space-y-4">
                                            <FiBarChart2 className="size-9 text-emerald-300" />
                                            <h4 className="text-lg font-black tracking-tight">How This Works</h4>
                                            <div className="space-y-2 text-xs text-emerald-100/90 font-medium leading-relaxed">
                                                <p>📊 <strong>Actual consumption</strong> tracked from sale_items × ingredient recipes</p>
                                                <p>📈 <strong>Trend detection</strong>: recent 7-day avg vs older history (rising/stable/declining)</p>
                                                <p>⚡ <strong>Adaptive buffer</strong>: 10–35% depending on volatility + trend direction</p>
                                                <p>🎯 <strong>Demand scaling</strong>: adjusted to tomorrow's revenue forecast vs historical average</p>
                                                <p>🔒 <strong>Urgency</strong>: based on days-of-coverage, not simple % thresholds</p>
                                            </div>
                                            <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                                                <Badge className="bg-white/20 text-white border-none">Prescriptive Mode</Badge>
                                                <span className="text-emerald-200">Manual verification recommended</span>
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

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({ icon, iconBg, label, value, badge, badgeCls }: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: React.ReactNode;
    badge: string;
    badgeCls: string;
}) {
    return (
        <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className={cn('size-10 rounded-xl flex items-center justify-center', iconBg)}>
                        {icon}
                    </div>
                    <Badge className={cn('font-black text-[9px] uppercase tracking-tighter border-none', badgeCls)}>
                        {badge}
                    </Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
                <div className="text-xl font-black text-foreground dark:text-white tabular-nums">{value}</div>
            </CardContent>
        </Card>
    );
}
