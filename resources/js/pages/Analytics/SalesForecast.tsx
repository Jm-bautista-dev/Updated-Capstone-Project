import type { RequestPayload } from '@inertiajs/core';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo } from 'react';
import {
  FiTrendingUp, FiCalendar, FiFilter,
  FiInfo, FiZap, FiTarget, FiShield,
  FiAward, FiSave, FiDownload
} from 'react-icons/fi';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, ReferenceLine, ComposedChart, Line,
} from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type HistoricalDay = { date: string; actual: number };
type ForecastDay = { date: string; predicted: number; lower: number; upper: number; dow: string };

type InventorySuggestion = {
  ingredient_id: number;
  name: string;
  unit: string;
  current_stock: number;
  low_stock_level: number;
  predicted_usage: number;
  required_with_buffer: number;
  suggested_restock: number;
  estimated_cost: number;
  status: string;
  trend: string;
  volatility: string;
  days_of_stock: number;
  depletion_date: string;
  carrying_risk: string;
  overstock_warning: boolean;
  citation: string;
};

const formatCurrency = (v?: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v ?? 0);

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[8px] font-black uppercase tracking-wider text-(--ops-text-muted)">{label}</span>
    </div>
  );
}

interface ChartTooltipPayload {
  payload?: {
    date?: string;
    actual?: number;
    predicted?: number;
    lower?: number;
    upper?: number;
  };
}

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: ChartTooltipPayload[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-zinc-950 p-4 shadow-2xl rounded-xl border border-(--ops-border) text-foreground min-w-50 text-xs">
      <p className="text-[9px] font-black uppercase text-(--ops-text-muted) mb-2 border-b border-(--ops-border-subtle) pb-1.5 font-mono">{d?.date}</p>
      <div className="space-y-1.5">
        {d?.actual != null && (
          <div className="flex justify-between gap-4">
            <span className="font-bold text-(--ops-text-secondary)">Actual Sales</span>
            <span className="font-black text-foreground font-mono">{formatCurrency(d.actual)}</span>
          </div>
        )}
        {d?.predicted != null && (
          <>
            <div className="flex justify-between gap-4">
              <span className="font-bold text-primary">Forecasted Sales</span>
              <span className="font-black text-primary font-mono">{formatCurrency(d.predicted)}</span>
            </div>
            {d?.upper != null && (
              <div className="flex justify-between gap-4 opacity-60">
                <span className="text-[10px] font-bold text-(--ops-text-secondary)">95% Range</span>
                <span className="text-[10px] font-bold text-(--ops-text-secondary) tabular-nums font-mono">
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

interface TrendData {
  slope?: number;
  direction?: string;
  percentage?: number;
  label?: string;
}

interface SalesForecastPageProps {
  historical?: HistoricalDay[];
  prediction?: number;
  prediction_lower?: number;
  prediction_upper?: number;
  forecast?: ForecastDay[];
  trend?: TrendData;
  branches?: Array<{ id: number; name: string }>;
  filters?: { days?: string; branch_id?: string };
  error?: string;
  confidence?: number;
  insights?: string[];
  recommended_model?: string;
  benchmark?: { dataset_range?: string; [key: string]: unknown };
  inventorySuggestions?: InventorySuggestion[];
}

export default function SalesForecast() {
  const {
    historical: rawHistorical = [],
    prediction = 0.0,
    forecast: rawForecast = [],
    trend = {},
    branches = [],
    filters = {},
    error,
    confidence = 0.0,
    insights = [],
    recommended_model = 'Holt-Winters Seasonal',
    benchmark = {},
    inventorySuggestions = []
  } = usePage().props as unknown as SalesForecastPageProps;

  const historical: HistoricalDay[] = rawHistorical;
  const forecast: ForecastDay[] = rawForecast;

  const [days, setDays] = useState(filters?.days || '30');
  const [branchId, setBranchId] = useState(filters?.branch_id || 'all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFilterChange = (key: string, val: string) => {
    setIsLoading(true);
    const newFilters = {
      days: key === 'days' ? val : days,
      branch_id: key === 'branch_id' ? val : branchId,
    };

    router.get('/analytics/sales-forecast', newFilters, {
      preserveState: true,
      replace: true,
      onFinish: () => setIsLoading(false),
    });
  };

  const saveForecastVersion = () => {
    setIsSaving(true);
    router.post('/analytics/forecast-benchmarking/save', {
      branch_id: branchId,
      model_used: recommended_model,
      horizon_days: forecast.length,
      dataset_range: benchmark.dataset_range || 'Current Period',
      forecast_data: forecast
    } as RequestPayload, {
      onFinish: () => setIsSaving(false),
      onSuccess: () => alert('Forecast version snapshot saved successfully.')
    });
  };

  const exportReport = () => {
    window.open(`/analytics/forecast-benchmarking/export?branch_id=${branchId}`, '_blank');
  };

  const nextDayDate = useMemo(() => {
    if (forecast.length > 0) return format(parseISO(forecast[0].date), 'EEE, MMM d');
    return 'Tomorrow';
  }, [forecast]);

  const chartData = useMemo(() => {
    const base = historical.map(d => ({
      date: format(parseISO(d.date), 'MMM d'),
      actual: Number(d.actual),
      predicted: undefined as number | undefined,
      lower: undefined as number | undefined,
      upper: undefined as number | undefined,
    }));

    const future = forecast.map(d => ({
      date: format(parseISO(d.date), 'MMM d'),
      actual: undefined as number | undefined,
      predicted: Number(d.predicted),
      lower: Number(d.lower),
      upper: Number(d.upper),
    }));

    return [...base, ...future];
  }, [historical, forecast]);

  const weeklyTotal = forecast.reduce((s, f) => s + f.predicted, 0);
  const referenceDate = historical.length > 0
    ? format(parseISO(historical[historical.length - 1].date), 'MMM d')
    : null;

  return (
    <AppLayout breadcrumbs={[{ title: 'Analytics', href: '#' }, { title: 'Sales Forecast', href: '/analytics/sales-forecast' }]}>
      <Head title="Sales Forecasting Center" />

      <div className="flex flex-col h-screen overflow-hidden bg-background font-sans text-(--ops-text-secondary)">

        {/* ── Sub Navigation Tabs Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-(--ops-surface-sunken) border-b border-(--ops-border) shrink-0">
          <div className="flex items-center gap-3">
            <FiTarget className="text-primary size-6 animate-pulse" />
            <div>
              <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                Sales Forecasting Center
                {isLoading && <span className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin ml-2 inline-block align-middle" />}
              </h1>
              <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                Adaptive Modeling · Model Validation Benchmarked · Depletion Prescriptive Analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={saveForecastVersion}
              disabled={isSaving || forecast.length === 0}
              variant="outline"
              size="sm"
              className="h-9.5 rounded-[10px] bg-(--ops-surface-raised) border-(--ops-border) hover:bg-(--ops-hover) text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)"
            >
              <FiSave className="size-3.5 mr-1.5" />
              Save Version Snapshot
            </Button>
            <Button
              onClick={exportReport}
              variant="outline"
              size="sm"
              className="h-9.5 rounded-[10px] bg-(--ops-surface-raised) border-(--ops-border) hover:bg-(--ops-hover) text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)"
            >
              <FiDownload className="size-3.5 mr-1.5" />
              Export Validation Report
            </Button>
          </div>
        </div>

        {/* ── Sub Navigation Links Tabs ── */}
        <div className="flex bg-(--ops-surface-sunken) border-b border-(--ops-border-subtle) px-6 sm:px-8 py-0 shrink-0">
          <Link
            href="/analytics/sales-forecast"
            className="px-4 py-3 border-b-2 border-primary text-xs font-black uppercase tracking-wider text-primary"
          >
            Sales Forecasting
          </Link>
          <Link
            href="/analytics/forecast-benchmarking"
            className="px-4 py-3 border-b-2 border-transparent text-xs font-black uppercase tracking-wider text-(--ops-text-muted) hover:text-foreground"
          >
            Model Benchmarking
          </Link>
        </div>

        {/* ── Content Layout ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">

          {error && (
            <Alert variant="destructive" className="bg-rose-500/5 border-rose-500/15 rounded-xl text-rose-500">
              <FiInfo className="size-4 text-rose-500" />
              <AlertTitle className="font-black uppercase tracking-widest text-[9px] mb-1">Model Error</AlertTitle>
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
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
                  
                  {/* Tomorrow Prediction */}
                  <Card className="bg-primary text-white border border-primary/20 rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                    <div className="absolute top-0 right-0 size-24 bg-white/10 rounded-full blur-2xl opacity-40" />
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">{nextDayDate}</p>
                      <FiZap className="size-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tabular-nums leading-none">{formatCurrency(prediction)}</h3>
                      <p className="text-[8px] text-white/60 font-bold uppercase mt-1.5 tracking-widest">Expected Daily Revenue</p>
                    </div>
                  </Card>

                  {/* Growth Slope */}
                  <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Growth Slope</p>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-[6px] border bg-transparent",
                        (trend?.slope ?? 0) >= 0 
                          ? "text-emerald-500 border-emerald-500/10" 
                          : "text-rose-500 border-rose-500/10"
                      )}>
                        {(trend?.percentage ?? 0) > 0 ? '+' : ''}{trend?.percentage}% Overall
                      </span>
                    </div>
                    <div>
                      <h3 className={cn('text-2xl font-black tabular-nums leading-none', (trend?.slope ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                        {(trend?.slope ?? 0) >= 0 ? '+' : ''}{formatCurrency(trend?.slope)}
                        <span className="text-[10px] font-bold text-(--ops-text-faint) ml-1">/ day</span>
                      </h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest font-mono">Telemetry prediction rate</p>
                    </div>
                  </Card>

                  {/* Weekly Forecast */}
                  <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">{forecast.length}-Day Projection</p>
                      <FiTrendingUp className="size-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{formatCurrency(weeklyTotal)}</h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Projected weekly revenue sum</p>
                    </div>
                  </Card>

                  {/* Confidence Score */}
                  <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Model Confidence</p>
                      <FiShield className="size-4 text-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-end gap-2 leading-none">
                        <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{(confidence ?? 0).toFixed(1)}%</h3>
                      </div>
                      <div className="w-full h-1 bg-(--ops-chip-active-bg) rounded-full overflow-hidden mt-1.5">
                        <div 
                          className={cn('h-full', confidence >= 75 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-rose-500')} 
                          style={{ width: `${confidence ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* STICKY TOOLBAR FILTERS */}
                <div className="sticky top-0 z-30 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md pb-4 pt-1 space-y-4 border-b border-(--ops-border-subtle)">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                      
                      {/* Interval Select */}
                      <div className="flex items-center bg-(--ops-surface-sunken) border border-(--ops-border) rounded-[10px] p-0.5">
                        <FiCalendar className="text-(--ops-text-muted) ml-2.5 size-3.5" />
                        <Select value={String(days)} onValueChange={v => { setDays(v); handleFilterChange('days', v); }}>
                          <SelectTrigger className="w-36 h-8.5 bg-transparent border-none shadow-none focus:ring-0 text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-(--ops-surface-sunken) border-(--ops-border) text-foreground rounded-xl">
                            <SelectItem value="7" className="text-[10px] font-bold uppercase py-2">Last 7 Days</SelectItem>
                            <SelectItem value="14" className="text-[10px] font-bold uppercase py-2">Last 14 Days</SelectItem>
                            <SelectItem value="30" className="text-[10px] font-bold uppercase py-2">Last 30 Days</SelectItem>
                            <SelectItem value="90" className="text-[10px] font-bold uppercase py-2">Last 90 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Branch Filter */}
                      <div className="flex items-center bg-(--ops-surface-sunken) border border-(--ops-border) rounded-[10px] p-0.5">
                        <FiFilter className="text-(--ops-text-muted) ml-2.5 size-3.5" />
                        <Select value={branchId} onValueChange={v => { setBranchId(v); handleFilterChange('branch_id', v); }}>
                          <SelectTrigger className="w-44 h-8.5 bg-transparent border-none shadow-none focus:ring-0 text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)">
                            <SelectValue placeholder="All Branches" />
                          </SelectTrigger>
                          <SelectContent className="bg-(--ops-surface-sunken) border-(--ops-border) text-foreground rounded-xl">
                            <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Branches</SelectItem>
                            {branches?.map((b: { id: number; name: string }) => (
                              <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GRAPH AND 7-DAY GRID MATRIX */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  
                  {/* Composed Chart Container */}
                  <Card className="lg:col-span-2 border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden flex flex-col shadow-sm">
                    <CardHeader className="bg-(--ops-surface-sunken)/30 border-b border-(--ops-border-subtle) px-6 py-4 flex flex-row items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Forecast Visualization</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted) mt-1">
                          Calculated with best fit model: <b>{recommended_model}</b>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <LegendDot color="#52525b" label="Actual" />
                        <LegendDot color="#E1062C" label="Forecast" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-75 w-full min-h-75 min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} debounce={1}>
                          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#52525b" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#52525b" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="gradBand" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E1062C" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#E1062C" stopOpacity={0.01} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-850" />
                            <XAxis dataKey="date" stroke="currentColor" className="text-(--ops-text-muted) font-bold" fontSize={8} axisLine={false} tickLine={false} minTickGap={30} />
                            <YAxis stroke="currentColor" className="text-(--ops-text-muted) font-bold font-mono" fontSize={8} axisLine={false} tickLine={false} tickFormatter={v => `₱${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                            <Tooltip content={<ChartTooltip />} />

                            {/* Confidence Interval band */}
                            <Area type="monotone" dataKey="upper" fill="url(#gradBand)" stroke="none" fillOpacity={1} />
                            <Area type="monotone" dataKey="lower" fill="#09090b" stroke="none" fillOpacity={1} />

                            {/* Actual metrics */}
                            <Area type="monotone" dataKey="actual" stroke="#52525b" strokeWidth={2.5} fill="url(#gradActual)" fillOpacity={1} dot={false} animationDuration={1000} />

                            {/* Prediction vectors */}
                            <Line type="monotone" dataKey="predicted" stroke="#E1062C" strokeWidth={3} dot={{ r: 2.5, fill: '#E1062C', strokeWidth: 0 }} animationDuration={1000} />

                            {referenceDate && (
                              <ReferenceLine x={referenceDate} stroke="#E1062C" strokeDasharray="4 4" strokeOpacity={0.3} label={{ value: 'Today', position: 'top', fontSize: 8, fill: '#E1062C', fontWeight: 'black', textAnchor: 'middle' }} />
                            )}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 7-Day Forecast Grid */}
                  <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden flex flex-col shadow-sm">
                    <CardHeader className="bg-(--ops-surface-sunken)/30 border-b border-(--ops-border-subtle) px-6 py-4">
                      <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                        <FiCalendar className="text-primary" /> Forecast Grid List
                      </CardTitle>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto max-h-75">
                      <table className="w-full text-left border-collapse table-auto text-(--ops-text-secondary) text-xs">
                        <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border-subtle) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary) select-none">
                          <tr>
                            <th className="px-5 py-3">Date</th>
                            <th className="px-5 py-3 text-right">Expected Sales</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--ops-border-subtle)">
                          {forecast.map((f, i) => (
                            <tr key={i} className="hover:bg-(--ops-surface-sunken)/30 transition-colors duration-150 group">
                              <td className="px-5 py-3">
                                <div>
                                  <p className="font-bold text-foreground">{format(parseISO(f.date), 'EEE, MMM d')}</p>
                                  <p className="text-[9px] text-(--ops-text-muted) font-mono mt-0.5">{formatCurrency(f.lower)} – {formatCurrency(f.upper)}</p>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <span className="font-black text-primary font-mono">{formatCurrency(f.predicted)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                {/* Explainability & Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Model Citation Panel */}
                  <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] p-5 shadow-sm space-y-4">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Adaptive Model Selection</span>
                      <h3 className="text-sm font-black text-foreground uppercase mt-1 flex items-center gap-1.5">
                        <FiAward className="text-yellow-500" /> {recommended_model} (Best Fit)
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-350 leading-relaxed">
                      This forecast was generated using <b>{recommended_model}</b> because it achieved the lowest prediction error during time-series walk-forward validation backtests. Confidence level is estimated at <b>{confidence.toFixed(1)}%</b>.
                    </p>
                    <div className="pt-3 border-t border-(--ops-border-subtle) flex items-center justify-between text-[10px] font-bold uppercase">
                      <span className="text-(--ops-text-muted)">Accuracy Rate</span>
                      <span className="text-emerald-500 font-mono font-black">{confidence.toFixed(1)}%</span>
                    </div>
                  </Card>

                  {/* Smart Insights */}
                  <Card className="lg:col-span-2 border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] p-5 shadow-sm space-y-4">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Demand Analytics</span>
                      <h3 className="text-sm font-black text-foreground uppercase mt-1">Forecasting Insights</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                      {insights.map((insight: string, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-(--ops-surface-sunken)/40 border border-(--ops-border-subtle) flex items-start gap-2.5 text-xs text-zinc-300">
                          <FiInfo className="size-4.5 text-primary shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Prescriptive Inventory Recommendations */}
                <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden flex flex-col shadow-sm">
                  <div className="p-5 border-b border-(--ops-border-subtle)">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Prescriptive Analytics Integration</span>
                    <h3 className="text-sm font-black text-foreground uppercase mt-1">Prescriptive Inventory Recommendations</h3>
                    <p className="text-[9px] text-(--ops-text-muted) uppercase mt-0.5">Driven by active {recommended_model} demand projections</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto text-xs">
                      <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border-subtle) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary)">
                        <tr>
                          <th className="px-5 py-2.5">Ingredient</th>
                          <th className="px-5 py-2.5">Stock Status</th>
                          <th className="px-5 py-2.5 text-right">Depletion Est</th>
                          <th className="px-5 py-2.5 text-right">Suggested Reorder</th>
                          <th className="px-5 py-2.5 text-right">Carrying Risk</th>
                          <th className="px-5 py-2.5">Data Citation Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--ops-border-subtle)">
                        {inventorySuggestions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-zinc-500 uppercase italic">All items are optimal. No restock alerts required.</td>
                          </tr>
                        ) : (
                          inventorySuggestions.slice(0, 10).map((s: InventorySuggestion) => (
                            <tr key={s.ingredient_id} className="hover:bg-(--ops-surface-sunken)/20 transition-colors">
                              <td className="px-5 py-3 font-bold text-foreground">
                                {s.name}
                                <span className="text-[9px] text-(--ops-text-muted) font-mono font-medium ml-1">({s.unit})</span>
                              </td>
                              <td className="px-5 py-3">
                                <Badge className={cn(
                                  "text-[8px] font-black uppercase rounded-lg px-1.5 py-0 border bg-transparent",
                                  s.status === 'Critical' || s.status === 'Out of Stock' ? "text-rose-500 border-rose-500/10" : "text-amber-500 border-amber-500/10"
                                )}>
                                  {s.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-right font-mono font-bold">
                                {s.depletion_date}
                                <span className="text-[9px] text-(--ops-text-muted) font-medium font-sans ml-1">({s.days_of_stock} days)</span>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-primary font-black">
                                {s.suggested_restock} {s.unit}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <Badge className={cn(
                                  "text-[8px] font-black uppercase rounded-lg px-1.5 py-0 border bg-transparent",
                                  s.carrying_risk === 'high' ? "text-amber-500 border-amber-500/10" : "text-emerald-500 border-emerald-500/10"
                                )}>
                                  {s.carrying_risk}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-[10px] text-(--ops-text-muted) italic">{s.citation}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
