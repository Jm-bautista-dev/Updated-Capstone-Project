import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
  FiBox, FiShoppingCart, FiAlertCircle, FiTrendingUp, FiTrendingDown,
  FiFilter, FiCheckCircle, FiPlusCircle, FiBarChart2, FiInfo,
  FiAlertTriangle, FiShield, FiMinus, FiActivity, FiZap, FiShoppingBag, FiTruck, FiTrendingUp as FiUp, FiUnlock, FiChevronRight, FiChevronLeft
} from 'react-icons/fi';
import { MassRestockModal } from '@/components/mass-restock-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────
type Urgency = 'Out of Stock' | 'Critical' | 'Warning' | 'Safe';
type Trend = 'rising' | 'stable' | 'declining';
type Volatility = 'high' | 'medium' | 'low';

type Suggestion = {
  ingredient_id: number;
  name: string;
  unit: string;
  current_stock: number;
  low_stock_level: number;
  predicted_usage: number;
  required_with_buffer: number;
  suggested_restock: number;
  estimated_cost: number;
  status: Urgency;
  trend: Trend;
  volatility: Volatility;
  safety_buffer_pct: number;
  confidence: number;
  days_of_stock: number;
  days_of_data: number;
  predicted_usage_lower: number;
  predicted_usage_upper: number;
};

type ImpactSuggestion = {
  ingredient_id: number;
  ingredient_name: string;
  current_stock: number;
  unit: string;
  status: 'normal' | 'low' | 'critical';
  blocking_products_count: number;
  blocking_products: { id: number; name: string; missing: number; unit: string }[];
  suggested_restock_quantity: number;
  display_restock_quantity: number;
  display_restock_unit: string;
  priority_score: number;
  max_servings_unlockable: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v?: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v ?? 0);

const urgencyConfig: Record<Urgency, { label: string; badgeCls: string; rowCls: string; dotCls: string }> = {
  'Out of Stock': {
    label: 'Out of Stock',
    badgeCls: 'bg-rose-600 text-white',
    rowCls: 'bg-rose-50/40 ',
    dotCls: 'bg-rose-600 animate-ping',
  },
  Critical: {
    label: 'Critical',
    badgeCls: 'bg-destructive/10 text-destructive ',
    rowCls: 'bg-red-50/30 ',
    dotCls: 'bg-rose-500',
  },
  Warning: {
    label: 'Warning',
    badgeCls: 'bg-amber-500/10 text-amber-600 ',
    rowCls: '',
    dotCls: 'bg-amber-500',
  },
  Safe: {
    label: 'Safe',
    badgeCls: 'bg-emerald-500/10 text-emerald-600 ',
    rowCls: '',
    dotCls: 'bg-emerald-500',
  },
};

const trendIcon = (t: Trend) => {
  if (t === 'rising') return <FiTrendingUp className="size-3 text-emerald-500" />;
  if (t === 'declining') return <FiTrendingDown className="size-3 text-rose-500" />;
  return <FiMinus className="size-3 text-muted-foreground" />;
};

const volatilityColor = (v: Volatility) => {
  if (v === 'high') return 'text-rose-500';
  if (v === 'medium') return 'text-amber-500';
  return 'text-emerald-500';
};

// ── Stock Coverage Bar ─────────────────────────────────────────────────────────
function CoverageBar({ current, required, status }: { current: number; required: number; status: Urgency }) {
  const pct = required > 0 ? Math.min(100, (current / required) * 100) : 100;
  const barCls = status === 'Safe' ? 'bg-emerald-500'
    : status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
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
    impact_suggestions,
    inventory,
  } = usePage().props as any;

  const [branchId, setBranchId] = useState(String(filters?.branch_id || ''));
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setFilter] = useState<'All' | Urgency>('All');

  // Restock Modal State
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [prefilledItems, setPrefilledItems] = useState<Record<number, { quantity: string, unit: string }> | undefined>(undefined);

  const currentBranchName = useMemo(() => 
    branches?.find((b: any) => String(b.id) === branchId)?.name || 'Branch'
  , [branches, branchId]);

  const openMassRestock = (impact?: ImpactSuggestion) => {
    if (impact) {
      setPrefilledItems({
        [impact.ingredient_id]: {
          quantity: String(impact.suggested_restock_quantity),
          unit: impact.unit
        }
      });
    } else {
      setPrefilledItems(undefined);
    }
    setRestockModalOpen(true);
  };

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
      total: s.length,
      totalCost: s.reduce((sum, x) => sum + x.estimated_cost, 0),
      critical: s.filter(x => x.status === 'Critical' || x.status === 'Out of Stock').length,
      outOfStock: s.filter(x => x.status === 'Out of Stock').length,
      rising: s.filter(x => x.trend === 'rising').length,
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
      <Head title="Prescriptive Restock" />

      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="bg-background border-b px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-foreground">
              <FiBox className="text-emerald-500" />
              Prescriptive Restock
              {isLoading && (
                <span className="size-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin ml-1" />
              )}
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Adaptive demand · Trend-aware · Volatility-weighted safety buffers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-emerald-50/50 rounded-xl p-1 gap-1 border border-emerald-100">
              <FiFilter className="text-emerald-600 ml-2 size-4" />
              <Select value={branchId} onValueChange={v => { setBranchId(v); handleFilterChange('branch_id', v); }}>
                <SelectTrigger className="w-56 bg-transparent border-none shadow-none focus:ring-0 text-xs font-bold uppercase tracking-tight text-emerald-900">
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
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-12">

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
                className="space-y-12"
              >

                {/* ── Forecast Context Banner ───────────────── */}
                <div className={cn(
                  'flex flex-wrap items-start gap-4 p-5 rounded-2xl border',
                  demandAboveAvg
                    ? 'bg-amber-50/60 border-amber-200 '
                    : demandBelowAvg
                      ? 'bg-sky-50/60 border-sky-200 '
                      : 'bg-primary/5 border-primary/20'
                )}>
                  <FiInfo className={cn('size-5 mt-0.5 shrink-0', demandAboveAvg ? 'text-amber-600' : demandBelowAvg ? 'text-sky-600' : 'text-primary')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Demand Forecast Context</p>
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
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
                        forecast_confidence >= 75 ? 'bg-emerald-500/10 text-emerald-700 ' :
                          forecast_confidence >= 50 ? 'bg-amber-500/10 text-amber-700 ' :
                            'bg-rose-500/10 text-rose-700 '
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
                    icon={<FiShoppingCart className="text-orange-600 size-5" />}
                    iconBg="bg-orange-500/10"
                    label="To Restock"
                    value={`${stats.total} items`}
                    badge="Action Required"
                    badgeCls="bg-orange-500/10 text-orange-700"
                  />
                  <KpiCard
                    icon={<FiAlertCircle className="text-rose-600 size-5" />}
                    iconBg="bg-rose-500/10"
                    label="Critical / OOS"
                    value={<span className="text-rose-600">{stats.critical} items</span>}
                    badge={stats.outOfStock > 0 ? `${stats.outOfStock} out of stock` : 'Monitor closely'}
                    badgeCls="bg-rose-500/10 text-rose-700"
                  />
                  <KpiCard
                    icon={<FiTrendingUp className="text-emerald-600 size-5" />}
                    iconBg="bg-emerald-500/10"
                    label="Est. Investment"
                    value={fmt(stats.totalCost)}
                    badge="Estimated Cost"
                    badgeCls="bg-emerald-500/10 text-emerald-700"
                  />
                  <KpiCard
                    icon={<FiActivity className="text-primary size-5" />}
                    iconBg="bg-primary/10"
                    label="Avg Model Confidence"
                    value={`${stats.avgConfidence}%`}
                    badge={`${stats.rising} rising trends`}
                    badgeCls="bg-primary/10 text-primary"
                  />
                </div>

                {/* ── Urgency Filter Tabs (MAIN TABLE BLOCK) ──────────────────── */}
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                        {(['All', 'Out of Stock', 'Critical', 'Warning', 'Safe'] as const).map(f => (
                            <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={cn(
                                'px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border',
                                activeFilter === f
                                ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20'
                                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                            )}
                            >
                            {f} {f === 'All' ? `(${(suggestions || []).length})` :
                                `(${(suggestions || []).filter((s: Suggestion) => s.status === f).length})`}
                            </button>
                        ))}
                    </div>

                    {/* ── Main Table (Adaptive Restock Recommendations) ────────────────────────────── */}
                    <Card className="border-none shadow-sm ring-1 ring-border bg-card overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="bg-background border-b px-8 py-6">
                        <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                            <FiZap className="text-emerald-600" />
                            Adaptive Restock Recommendations
                        </CardTitle>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                            {stats.highVolatility > 0 && (
                            <Badge className="bg-rose-500/10 text-rose-600 font-black text-[9px]">
                                ⚠ {stats.highVolatility} volatile items
                            </Badge>
                            )}
                        </div>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto px-4 pb-4">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead className="bg-muted/30">
                            <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground first:rounded-l-2xl">Ingredient</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Stock / Coverage</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Predicted Usage</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Safety Buffer</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Restock Qty</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Est. Cost</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right last:rounded-r-2xl">Urgency</th>
                            </tr>
                        </thead>
                        <tbody>
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
                                    className={cn('group transition-all hover:translate-x-1 duration-300', cfg.rowCls)}
                                >
                                    {/* Ingredient */}
                                    <td className="px-6 py-4 rounded-l-2xl border-y border-l">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                        <div className="size-10 rounded-xl bg-muted flex items-center justify-center font-black text-xs text-foreground shadow-inner">
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={cn('absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background', cfg.dotCls)} />
                                        </div>
                                        <div>
                                        <p className="font-black text-sm text-foreground leading-tight group-hover:text-primary transition-colors">{s.name}</p>
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
                                    <td className="px-4 py-4 border-y">
                                    <div className="space-y-1.5">
                                        <div className="flex items-baseline gap-1">
                                        <span className="font-mono font-black text-sm text-foreground">
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
                                    <td className="px-4 py-4 text-center border-y">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="font-black text-[10px] border-border bg-background px-2 py-0.5">
                                        {s.predicted_usage} {s.unit}
                                        </Badge>
                                        <p className="text-[9px] text-muted-foreground tabular-nums font-bold">
                                        {s.predicted_usage_lower} – {s.predicted_usage_upper}
                                        </p>
                                    </div>
                                    </td>

                                    {/* Safety Buffer */}
                                    <td className="px-4 py-4 text-center border-y">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-1">
                                        {trendIcon(s.trend)}
                                        <span className="text-[10px] font-black text-foreground capitalize italic tracking-tight">{s.trend}</span>
                                        </div>
                                        <Badge className="bg-muted text-muted-foreground border-none font-black text-[9px] px-1.5 py-0">
                                        +{s.safety_buffer_pct}% buffer
                                        </Badge>
                                    </div>
                                    </td>

                                    {/* Restock Qty */}
                                    <td className="px-4 py-4 text-right border-y">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <FiPlusCircle className="size-3.5 text-primary animate-pulse" />
                                        <span className="font-black text-primary tabular-nums text-sm">
                                        {s.suggested_restock} {s.unit}
                                        </span>
                                    </div>
                                    </td>

                                    {/* Est. Cost */}
                                    <td className="px-4 py-4 text-right font-black text-foreground tabular-nums text-sm border-y">
                                    {fmt(s.estimated_cost)}
                                    </td>

                                    {/* Urgency */}
                                    <td className="px-6 py-4 text-right rounded-r-2xl border-y border-r">
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge className={cn('font-black text-[9px] uppercase tracking-widest rounded-lg px-2.5 py-1 shadow-sm', cfg.badgeCls)}>
                                        {cfg.label}
                                        </Badge>
                                        <span className="text-[9px] text-muted-foreground font-bold">{s.confidence}% conf.</span>
                                    </div>
                                    </td>
                                </motion.tr>
                                );
                            })}
                            </AnimatePresence>
                        </tbody>
                        </table>
                    </div>
                    </Card>
                </div>

                {/* ── Impact Priority (HORIZONTAL SCROLL - MOVED BELOW TABLE) ────────── */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                        <FiZap className="text-amber-500 animate-pulse" /> Impact Priority
                      </h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-1 italic">High-impact restocking decisions to maximize availability</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="size-8 rounded-lg" onClick={() => {
                                document.getElementById('priority-scroll')?.scrollBy({ left: -300, behavior: 'smooth' });
                            }}>
                                <FiChevronLeft className="size-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="size-8 rounded-lg" onClick={() => {
                                document.getElementById('priority-scroll')?.scrollBy({ left: 300, behavior: 'smooth' });
                            }}>
                                <FiChevronRight className="size-4" />
                            </Button>
                        </div>
                        <Button 
                        onClick={() => openMassRestock()}
                        className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
                        >
                        <FiTruck className="size-4" /> Mass Restock
                        </Button>
                    </div>
                  </div>

                  <div 
                    id="priority-scroll"
                    className="flex gap-5 overflow-x-auto pb-4 no-scrollbar snap-x scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {(impact_suggestions || []).map((impact: ImpactSuggestion) => (
                      <motion.div
                        key={impact.ingredient_id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "flex-none w-[340px] snap-start group p-6 rounded-[2rem] border bg-card relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]",
                          impact.status === 'critical' ? "border-rose-500/30 ring-1 ring-rose-500/10 bg-rose-500/[0.01]" : 
                          impact.status === 'low' ? "border-amber-500/30 bg-amber-500/[0.01]" : "border-border"
                        )}
                      >
                        {/* Status Indicator */}
                        <div className={cn(
                          "absolute top-0 right-0 px-5 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                          impact.status === 'critical' ? "bg-rose-500 text-white" : 
                          impact.status === 'low' ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {impact.status}
                        </div>

                        <div className="flex items-start gap-5 mb-6">
                          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center text-2xl font-black italic text-muted-foreground/30 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                            {impact.ingredient_name.charAt(0)}
                          </div>
                          <div className="min-w-0 pt-1">
                            <h3 className="font-black text-lg truncate uppercase italic tracking-tighter leading-none mb-1">{impact.ingredient_name}</h3>
                            <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[9px] font-black px-1.5 py-0 rounded-md border-muted-foreground/20 text-muted-foreground">
                                    {impact.current_stock} {impact.unit}
                                </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-dashed border-border/60 transition-colors group-hover:border-rose-500/20">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                  "size-7 rounded-xl flex items-center justify-center font-black text-xs shadow-sm",
                                  impact.blocking_products_count > 0 ? "bg-rose-500/10 text-rose-600" : "bg-muted text-muted-foreground"
                              )}>
                                {impact.blocking_products_count}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground group-hover:text-rose-600 transition-colors">Blocking Products</span>
                            </div>
                            <FiAlertTriangle className={cn("size-4", impact.blocking_products_count > 0 ? "text-rose-500 animate-bounce" : "text-muted-foreground/30")} />
                          </div>

                          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/5 border border-dashed border-emerald-500/20 transition-colors group-hover:border-emerald-500/40">
                            <div className="flex items-center gap-3">
                              <div className="size-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm">
                                <FiUnlock className="size-4" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-tight text-emerald-600">Unlocks Servings</span>
                            </div>
                            <span className="text-sm font-black text-emerald-700 italic">+{impact.max_servings_unlockable}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm"
                            onClick={() => openMassRestock(impact)}
                            className="flex-1 rounded-2xl h-11 font-black uppercase text-[10px] tracking-widest gap-2 bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                          >
                            <FiShoppingBag className="size-4" /> 
                            Restock +{impact.display_restock_quantity}{impact.display_restock_unit}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {(impact_suggestions || []).length === 0 && (
                        <div className="w-full p-12 text-center bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border opacity-60">
                            <FiCheckCircle className="size-10 text-emerald-500/40 mx-auto mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Product availability is currently optimal.</p>
                        </div>
                    )}
                  </div>
                </div>

                {/* ── Bottom Row: Insights + Model Info ──────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* Forecast Insights passed through */}
                  <Card className="border-none shadow-sm ring-1 ring-border bg-card rounded-[2.5rem]">
                    <CardHeader className="border-b px-8 py-6">
                      <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                        <FiZap className="text-primary" /> Demand Intelligence
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 italic">
                        Driving factors for this restock plan
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-6 space-y-3">
                      {(forecast_insights ?? []).map((insight: string, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                        >
                          <div className="size-2 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                          <p className="text-[11px] font-bold text-foreground leading-relaxed italic">{insight}</p>
                        </motion.div>
                      ))}
                      {(!forecast_insights || forecast_insights.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">No insights available. Record more sales data.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Model transparency card */}
                  <Card className="bg-gradient-to-br from-emerald-800 via-teal-900 to-primary text-white border-none rounded-[2.5rem] shadow-2xl shadow-emerald-900/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 size-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <CardContent className="p-10 space-y-6 relative z-10">
                      <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                        <FiBarChart2 className="size-8 text-emerald-300" />
                      </div>
                      <h4 className="text-2xl font-black tracking-tighter italic uppercase">How This Works</h4>
                      <div className="space-y-4 text-[11px] text-emerald-100/80 font-bold uppercase tracking-wide leading-relaxed">
                        <div className="flex items-center gap-3">
                            <span className="size-5 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">1</span>
                            <p><strong>Actual consumption</strong> tracked from sale_items × ingredient recipes</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="size-5 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">2</span>
                            <p><strong>Trend detection</strong>: recent 7-day avg vs older history (rising/stable/declining)</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="size-5 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">3</span>
                            <p><strong>Adaptive buffer</strong>: 10–35% depending on volatility + trend direction</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="size-5 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">4</span>
                            <p><strong>Demand scaling</strong>: adjusted to tomorrow's revenue forecast vs historical average</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="size-5 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">5</span>
                            <p><strong>Urgency</strong>: based on days-of-coverage, not simple % thresholds</p>
                        </div>
                      </div>
                      <div className="pt-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest italic">
                        <Badge className="bg-white text-emerald-900 border-none px-3 py-1 rounded-full shadow-lg">Prescriptive Mode</Badge>
                        <span className="text-emerald-200/60">Manual verification recommended</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <MassRestockModal 
        open={restockModalOpen}
        onOpenChange={setRestockModalOpen}
        branchName={currentBranchName}
        branchId={Number(branchId)}
        inventory={inventory || []}
        initialQuantities={prefilledItems}
      />
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
    <Card className="border-none shadow-sm ring-1 ring-border bg-card rounded-3xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('size-12 rounded-2xl flex items-center justify-center shadow-inner', iconBg)}>
            {icon}
          </div>
          <Badge className={cn('font-black text-[9px] uppercase tracking-tighter border-none px-2 py-0.5 rounded-lg', badgeCls)}>
            {badge}
          </Badge>
        </div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 italic">{label}</p>
        <div className="text-2xl font-black text-foreground tracking-tighter italic">{value}</div>
      </CardContent>
    </Card>
  );
}
