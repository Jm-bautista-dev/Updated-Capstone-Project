import React, { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBox,
  FiShoppingCart,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiFilter,
  FiCheckCircle,
  FiPlusCircle,
  FiBarChart2,
  FiInfo,
  FiAlertTriangle,
  FiShield,
  FiMinus,
  FiActivity,
  FiZap,
  FiShoppingBag,
  FiTruck,
  FiUnlock,
  FiChevronRight,
  FiChevronLeft,
  FiMinimize2,
  FiMaximize2
} from 'react-icons/fi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { MassRestockModal } from '@/components/mass-restock-modal';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
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
    badgeCls: 'bg-rose-500/5 text-rose-500 border-rose-500/10',
    rowCls: 'hover:bg-rose-950/5',
    dotCls: 'bg-rose-600',
  },
  Critical: {
    label: 'Critical',
    badgeCls: 'bg-rose-500/5 text-rose-500 border-rose-500/10',
    rowCls: 'hover:bg-rose-950/5',
    dotCls: 'bg-rose-500',
  },
  Warning: {
    label: 'Warning',
    badgeCls: 'bg-amber-500/5 text-amber-500 border-amber-500/10',
    rowCls: '',
    dotCls: 'bg-amber-500',
  },
  Safe: {
    label: 'Safe',
    badgeCls: 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10',
    rowCls: '',
    dotCls: 'bg-emerald-500',
  },
};

const trendIcon = (t: Trend) => {
  if (t === 'rising') return <FiTrendingUp className="size-3 text-emerald-500" />;
  if (t === 'declining') return <FiTrendingDown className="size-3 text-rose-500" />;
  return <FiMinus className="size-3 text-(--ops-text-muted)" />;
};

const volatilityColor = (v: Volatility) => {
  if (v === 'high') return 'text-rose-500';
  if (v === 'medium') return 'text-amber-500';
  return 'text-emerald-500';
};

// ── Main Component ─────────────────────────────────────────────────────────────
interface RestockPageProps {
  suggestions?: Suggestion[];
  branches?: Array<{ id: number; name: string }>;
  tomorrow_forecast?: number;
  forecast_lower?: number;
  forecast_upper?: number;
  demand_ratio?: number;
  forecast_insights?: string[];
  forecast_confidence?: number;
  filters?: { branch_id?: string; status?: string };
  error?: string;
  impact_suggestions?: ImpactSuggestion[];
  inventory?: unknown;
  [key: string]: unknown;
}

export default function RestockSuggestions() {
  const {
    suggestions,
    branches,
    tomorrow_forecast,
    forecast_lower,
    forecast_upper,
    demand_ratio,
    forecast_insights,
    forecast_confidence,
    filters,
    error,
    impact_suggestions,
    inventory,
  } = usePage<RestockPageProps>().props;

  const [branchId, setBranchId] = useState(String(filters?.branch_id || ''));
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setFilter] = useState<'All' | Urgency>('All');
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

  // Restock Modal State
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [prefilledItems, setPrefilledItems] = useState<Record<number, { quantity: string, unit: string }> | undefined>(undefined);

  const currentBranchName = useMemo(() =>
    branches?.find((b) => String(b.id) === branchId)?.name || 'Victoria'
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

      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background font-sans text-(--ops-text-secondary)">

        {/* ── Header Area ── */}
        <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-(--ops-surface-sunken) border-b border-(--ops-border) shrink-0">
          <div className="flex items-center gap-3">
            <FiBox className="text-primary size-6 animate-pulse" />
            <div>
              <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                Prescriptive Restock
                {isLoading && (
                  <span className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin ml-2 inline-block align-middle" />
                )}
              </h1>
              <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                Adaptive demand · Trend-aware · Volatility-weighted safety buffers
              </p>
            </div>
          </div>
        </div>

        {/* ── Content Layout ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">

          {/* Error alerts */}
          {error && (
            <Alert variant="destructive" className="bg-rose-500/5 border-rose-500/15 rounded-xl text-rose-500">
              <FiAlertTriangle className="size-4 text-rose-500" />
              <AlertTitle className="font-black uppercase tracking-widest text-[9px] mb-1">Intelligence Gap</AlertTitle>
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
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                
                {/* Demand Forecast Context Banner */}
                <div className={cn(
                  'flex flex-wrap items-start gap-4 p-4.5 rounded-xl border text-xs',
                  demandAboveAvg
                    ? 'bg-amber-500/5 border-amber-500/15 text-amber-500'
                    : demandBelowAvg
                      ? 'bg-blue-500/5 border-blue-500/15 text-blue-400'
                      : 'bg-(--ops-surface-raised) border-(--ops-border) text-(--ops-text-secondary)'
                )}>
                  <FiInfo className={cn('size-4.5 mt-0.5 shrink-0', demandAboveAvg ? 'text-amber-500' : demandBelowAvg ? 'text-blue-400' : 'text-primary')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-(--ops-text-muted) mb-1">Demand Forecast Context</p>
                    <p className="font-bold leading-relaxed">
                      Tomorrow's predicted revenue is{' '}
                      <strong className="font-black text-foreground">{fmt(tomorrow_forecast)}</strong>
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
                        'font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[6px] border bg-transparent',
                        forecast_confidence >= 75 ? 'text-emerald-500 border-emerald-500/10' :
                          forecast_confidence >= 50 ? 'text-amber-500 border-amber-500/10' :
                            'text-rose-500 border-rose-500/10'
                      )}>
                        <FiShield className="inline size-3 mr-1" />
                        {forecast_confidence}% Confidence
                      </Badge>
                    </div>
                  )}
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                  <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">To Restock</p>
                      <Badge className="bg-amber-500/5 text-amber-500 border border-amber-500/10 font-black text-[8px] uppercase px-1.5 py-0 rounded-[6px]">Action Needed</Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{stats.total} items</h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Suggestions generated</p>
                    </div>
                  </div>

                  <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500/70">Critical / OOS</p>
                      <Badge className="bg-rose-500/5 text-rose-500 border border-rose-500/10 font-black text-[8px] uppercase px-1.5 py-0 rounded-[6px]">
                        {stats.outOfStock > 0 ? `${stats.outOfStock} Depleted` : 'Critical'}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-rose-500 tabular-nums leading-none">{stats.critical} items</h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Requires attention</p>
                    </div>
                  </div>

                  <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Est. Investment</p>
                      <Badge className="bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 font-black text-[8px] uppercase px-1.5 py-0 rounded-[6px]">Calculated Cost</Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{fmt(stats.totalCost)}</h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Procurement valuation estimate</p>
                    </div>
                  </div>

                  <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Avg Confidence</p>
                      <Badge className="bg-primary/5 text-primary border border-primary/10 font-black text-[8px] uppercase px-1.5 py-0 rounded-[6px]">{stats.rising} Rising Trends</Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{stats.avgConfidence}%</h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Model reliability scale</p>
                    </div>
                  </div>
                </div>

                {/* STICKY TOOLBAR FILTERS */}
                <div className="sticky top-0 z-30 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md pb-4 pt-1 space-y-4 border-b border-(--ops-border-subtle)">
                  
                  {/* Quick Chips Row */}
                  <div className="flex flex-wrap gap-2">
                    {(['All', 'Out of Stock', 'Critical', 'Warning', 'Safe'] as const).map(f => {
                      const count = f === 'All' ? (suggestions || []).length : (suggestions || []).filter((s: Suggestion) => s.status === f).length;
                      const isActive = activeFilter === f;
                      return (
                        <button
                          key={f}
                          onClick={() => setFilter(f as any)}
                          className={cn(
                            "h-8 px-3 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center border",
                            isActive
                              ? "bg-primary border-primary text-foreground shadow-sm"
                              : "bg-(--ops-thead-bg) border-(--ops-border) text-(--ops-text-secondary) hover:text-foreground hover:bg-(--ops-chip-active-bg)"
                          )}
                        >
                          <span>{f}</span>
                          <span className="ml-1 opacity-60 font-mono">({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Advanced Toolbar Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                      
                      {/* Branch select filter */}
                      <div className="flex items-center bg-(--ops-surface-sunken) border border-(--ops-border) rounded-[10px] p-0.5">
                        <FiFilter className="text-(--ops-text-muted) ml-2.5 size-3.5" />
                        <Select value={branchId} onValueChange={v => { setBranchId(v); handleFilterChange('branch_id', v); }}>
                          <SelectTrigger className="w-52 h-8.5 bg-transparent border-none shadow-none focus:ring-0 text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent className="bg-(--ops-surface-sunken) border-(--ops-border) text-foreground rounded-xl">
                            {branches?.map((b: any) => (
                              <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Density Control */}
                    <div className="flex items-center border border-(--ops-border) rounded-[10px] p-0.5 bg-(--ops-surface-sunken) self-end">
                      <button
                        onClick={() => setDensity('compact')}
                        className={cn(
                          "p-1.5 rounded-[8px] transition-all",
                          density === 'compact' ? "bg-(--ops-chip-active-bg) text-foreground" : "text-(--ops-text-muted) hover:text-(--ops-text-secondary)"
                        )}
                        title="Compact Density"
                      >
                        <FiMinimize2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDensity('comfortable')}
                        className={cn(
                          "p-1.5 rounded-[8px] transition-all",
                          density === 'comfortable' ? "bg-(--ops-chip-active-bg) text-foreground" : "text-(--ops-text-muted) hover:text-(--ops-text-secondary)"
                        )}
                        title="Comfortable Density"
                      >
                        <FiMaximize2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ADAPTIVE SUGGESTIONS TABLE */}
                <div className="border border-(--ops-border) rounded-[14px] bg-(--ops-surface-sunken) shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto text-(--ops-text-secondary)">
                      <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary) select-none">
                        <tr>
                          <th className="px-5 py-3.5">Ingredient</th>
                          <th className="px-5 py-3.5">Stock / Coverage</th>
                          <th className="px-5 py-3.5 text-center">Predicted Usage</th>
                          <th className="px-5 py-3.5 text-center">Safety Buffer</th>
                          <th className="px-5 py-3.5 text-right">Restock Qty</th>
                          <th className="px-5 py-3.5 text-right">Est. Cost</th>
                          <th className="px-5 py-3.5 text-center">Urgency</th>
                          <th className="px-5 py-3.5 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--ops-border-subtle)">
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <FiBox className="size-10 text-(--ops-text-faint) animate-bounce" />
                                <p className="text-base font-bold italic uppercase tracking-tighter text-(--ops-text-muted)">No suggestions generated</p>
                                <p className="text-[10px] text-(--ops-text-faint) font-bold uppercase tracking-widest">Inventory levels are within optimal operating safety margins</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((s, idx) => {
                            const cfg = urgencyConfig[s.status];
                            const key = s.ingredient_id;
                            const coverageRatio = s.required_with_buffer > 0 ? Math.min(10, Math.ceil((s.current_stock / s.required_with_buffer) * 10)) : 10;

                            return (
                              <tr
                                key={key}
                                className={cn(
                                  "hover:bg-(--ops-surface-sunken)/50 transition-colors duration-150 relative",
                                  cfg.rowCls
                                )}
                              >
                                {/* Ingredient */}
                                <td className={cn(
                                  "px-5 transition-all",
                                  density === 'compact' ? "py-2" : "py-4"
                                )}>
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="size-8 rounded-lg bg-(--ops-surface-sunken) flex items-center justify-center font-black text-xs text-(--ops-text-secondary) shadow-inner">
                                        {s.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className={cn('absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-zinc-950', cfg.dotCls)} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-foreground leading-tight">{s.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[8px] font-bold text-(--ops-text-muted) uppercase">{s.days_of_data}d data</span>
                                        <span className="text-[8px] text-(--ops-text-faint)">•</span>
                                        <span className={cn('text-[8px] font-black uppercase', volatilityColor(s.volatility))}>
                                          {s.volatility} volatility
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Stock / Coverage */}
                                <td className="px-5">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-baseline gap-1">
                                      <span className="font-mono font-bold text-xs text-foreground">
                                        {s.current_stock}
                                      </span>
                                      <span className="text-[8px] text-(--ops-text-muted) font-bold uppercase">{s.unit}</span>
                                    </div>
                                    
                                    {/* Segmented stock level bar */}
                                    <div className="flex gap-0.5">
                                      {Array.from({ length: 10 }).map((_, i) => (
                                        <div
                                          key={i}
                                          className={cn(
                                            "w-1 h-1.5 rounded-[0.5px]",
                                            i < coverageRatio
                                              ? (s.status === 'Safe' ? "bg-emerald-500" : s.status === 'Warning' ? "bg-amber-500" : "bg-rose-500")
                                              : "bg-(--ops-chip-active-bg)"
                                          )}
                                        />
                                      ))}
                                    </div>

                                    <p className="text-[8px] font-bold text-(--ops-text-muted) uppercase tracking-tight">
                                      {s.days_of_stock < 1 ? '< 1 day left' : `~${s.days_of_stock}d coverage`}
                                    </p>
                                  </div>
                                </td>

                                {/* Predicted Usage */}
                                <td className="px-5 text-center">
                                  <Badge variant="outline" className="font-black text-[9px] border-(--ops-border) bg-(--ops-surface-sunken) text-(--ops-text-secondary) px-2 py-0.5 rounded-[6px]">
                                    {s.predicted_usage} {s.unit}
                                  </Badge>
                                  <p className="text-[8px] text-(--ops-text-muted) font-mono mt-1 font-bold">
                                    {s.predicted_usage_lower} – {s.predicted_usage_upper}
                                  </p>
                                </td>

                                {/* Safety Buffer */}
                                <td className="px-5 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1.5">
                                      {trendIcon(s.trend)}
                                      <span className="text-[8px] font-black text-(--ops-text-secondary) uppercase tracking-tight italic">{s.trend}</span>
                                    </div>
                                    <Badge className="bg-(--ops-surface-sunken) border border-(--ops-border) text-(--ops-text-secondary) font-black text-[8px] px-1.5 py-0 rounded-lg mt-0.5">
                                      +{s.safety_buffer_pct}% Buffer
                                    </Badge>
                                  </div>
                                </td>

                                {/* Restock Qty */}
                                <td className="px-5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <FiPlusCircle className="size-3.5 text-primary" />
                                    <span className="font-black text-primary font-mono text-xs">
                                      {s.suggested_restock} {s.unit}
                                    </span>
                                  </div>
                                </td>

                                {/* Est. Cost */}
                                <td className="px-5 text-right font-bold text-foreground font-mono text-xs">
                                  {fmt(s.estimated_cost)}
                                </td>

                                {/* Urgency status badge */}
                                <td className="px-5 text-center">
                                  <div className="flex justify-center">
                                    <Badge className={cn('font-black text-[8px] uppercase tracking-wider rounded-[6px] px-2 py-0.5 border', cfg.badgeCls)}>
                                      {cfg.label}
                                    </Badge>
                                  </div>
                                </td>

                                {/* Quick action triggering Restock */}
                                <td className="px-5 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7.5 px-2 bg-(--ops-surface-sunken) border-(--ops-border-subtle) hover:bg-(--ops-chip-active-bg) text-[8px] font-black uppercase tracking-wider text-primary rounded-[8px]"
                                    onClick={() => {
                                      setPrefilledItems({
                                        [s.ingredient_id]: {
                                          quantity: String(s.suggested_restock),
                                          unit: s.unit
                                        }
                                      });
                                      setRestockModalOpen(true);
                                    }}
                                  >
                                    Restock
                                  </Button>
                                </td>

                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* IMPACT PRIORITY CARDS GRID */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                      <FiZap className="text-amber-500 animate-pulse" /> Impact Priority
                    </h2>
                    <p className="text-[9px] font-bold text-(--ops-text-muted) uppercase tracking-tight mt-1 italic">High-impact restocking decisions to maximize menu item availability</p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    {(impact_suggestions || []).map((impact: ImpactSuggestion) => (
                      <div
                        key={impact.ingredient_id}
                        className={cn(
                          "flex-1 p-5 rounded-[14px] border bg-(--ops-surface-raised) relative overflow-hidden transition-all shadow-sm group",
                          impact.status === 'critical' ? "border-rose-500/20 bg-rose-950/5" : 
                          impact.status === 'low' ? "border-amber-500/20 bg-amber-950/5" : "border-(--ops-border)"
                        )}
                      >
                        {/* Corner Status badge */}
                        <div className={cn(
                          "absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-wider shadow-sm",
                          impact.status === 'critical' ? "bg-rose-500 text-foreground" : 
                          impact.status === 'low' ? "bg-amber-500 text-foreground" : "bg-(--ops-surface-sunken) text-(--ops-text-secondary)"
                        )}>
                          {impact.status}
                        </div>

                        <div className="flex items-start gap-3.5 mb-5">
                          <div className="size-10 rounded-xl bg-(--ops-surface-sunken) flex items-center justify-center text-sm font-black italic text-(--ops-text-muted) group-hover:text-primary transition-all duration-300 shadow-inner">
                            {impact.ingredient_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-black text-sm uppercase italic tracking-tighter text-foreground">{impact.ingredient_name}</h3>
                            <Badge variant="outline" className="text-[8px] font-black px-1.5 py-0 rounded-md border-(--ops-border) text-(--ops-text-secondary) mt-1">
                              {impact.current_stock} {impact.unit} in stock
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 mb-5">
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-(--ops-thead-bg) border border-(--ops-border-subtle)">
                            <span className="text-[9px] font-black uppercase tracking-tight text-(--ops-text-muted)">Blocking Menu Items</span>
                            <span className="text-xs font-black text-rose-500 font-mono">{impact.blocking_products_count} Products</span>
                          </div>

                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-(--ops-thead-bg) border border-(--ops-border-subtle)">
                            <span className="text-[9px] font-black uppercase tracking-tight text-(--ops-text-muted)">Servings to Unlock</span>
                            <span className="text-xs font-black text-emerald-500 font-mono">+{impact.max_servings_unlockable} servings</span>
                          </div>
                        </div>

                        <Button 
                          size="sm"
                          onClick={() => openMassRestock(impact)}
                          className="w-full rounded-[10px] h-9.5 font-black uppercase text-[9px] tracking-wider gap-2 bg-primary hover:bg-primary-hover text-foreground shadow-sm"
                        >
                          <FiShoppingBag className="size-3.5" /> 
                          Restock +{impact.display_restock_quantity}{impact.display_restock_unit}
                        </Button>
                      </div>
                    ))}
                    
                    {(impact_suggestions || []).length === 0 && (
                      <div className="w-full p-10 text-center bg-(--ops-surface-sunken) rounded-[14px] border border-dashed border-(--ops-border) opacity-60">
                        <FiCheckCircle className="size-8 text-emerald-500/40 mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-(--ops-text-muted) italic">Menu item availability is currently optimal.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM ROW: INSIGHTS & INSTRUCTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Demand Intelligence Card */}
                  <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] shadow-sm">
                    <CardHeader className="border-b border-(--ops-border) px-6 py-4">
                      <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                        <FiZap className="text-primary" /> Demand Intelligence
                      </CardTitle>
                      <CardDescription className="text-[9px] font-bold uppercase tracking-wider text-(--ops-text-muted) mt-1 italic">
                        Driving factors for this restock plan
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      {(forecast_insights ?? []).map((insight: string, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 p-3.5 rounded-lg bg-(--ops-surface-sunken)/50 border border-(--ops-border-subtle) hover:bg-(--ops-surface-sunken) transition-colors"
                        >
                          <div className="size-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                          <p className="text-[10px] font-bold text-(--ops-text-secondary) leading-relaxed italic">{insight}</p>
                        </motion.div>
                      ))}
                      {(!forecast_insights || forecast_insights.length === 0) && (
                        <p className="text-xs text-(--ops-text-muted) italic">No insights available. Record more sales data.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Model Explanation Card */}
                  <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] shadow-sm">
                    <CardHeader className="border-b border-(--ops-border) px-6 py-4">
                      <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                        <FiBarChart2 className="text-emerald-500" /> System Mechanics
                      </CardTitle>
                      <CardDescription className="text-[9px] font-bold uppercase tracking-wider text-(--ops-text-muted) mt-1 italic">
                        Calculation vectors explanation
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3.5 text-[10px] text-(--ops-text-secondary) font-bold uppercase tracking-wide leading-relaxed">
                      <div className="flex items-start gap-2.5">
                        <span className="size-5 rounded-md bg-(--ops-surface-sunken) border border-(--ops-border) flex items-center justify-center text-[9px] text-primary shrink-0">1</span>
                        <p><strong>Actual Consumption</strong>: track of ingredient usage from sale orders × recipes.</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="size-5 rounded-md bg-(--ops-surface-sunken) border border-(--ops-border) flex items-center justify-center text-[9px] text-primary shrink-0">2</span>
                        <p><strong>Trend Vector</strong>: computed 7-day velocity check to categorize slope trends.</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="size-5 rounded-md bg-(--ops-surface-sunken) border border-(--ops-border) flex items-center justify-center text-[9px] text-primary shrink-0">3</span>
                        <p><strong>Safety Buffers</strong>: weights applied dynamically based on volatility scale.</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="size-5 rounded-md bg-(--ops-surface-sunken) border border-(--ops-border) flex items-center justify-center text-[9px] text-primary shrink-0">4</span>
                        <p><strong>Forecasting Scale</strong>: alignment coefficients mapped to tomorrow's expected sales.</p>
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
