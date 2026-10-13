import { Head, usePage, router, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import React, { useState, useMemo } from 'react';
import {
  FiCpu, FiInfo, FiAlertTriangle, FiDownload, FiCheckCircle,
  FiRefreshCw, FiAward, FiStar, FiPlay, FiSliders, FiLayers,
  FiCheck, FiClock, FiActivity, FiDatabase
} from 'react-icons/fi';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type BenchmarkRow = {
  rank: number;
  model: string;
  mae: number;
  rmse: number;
  mape: number;
  smape: number;
  wape: number;
  accuracy: number;
  score: number;
};

type HistoryRow = {
  id: number;
  created_at: string;
  dataset_range: string;
  recommended_model: string;
  experiment_number?: number;
  mae: number;
  rmse: number;
  mape: number;
  wape?: number;
  processing_time: number;
  user?: {
    name: string;
  };
};

type ModelHistoryRow = {
  id: number;
  model_name: string;
  version: number;
  is_active: boolean;
  status: string;
  dataset_range?: string;
  training_points?: number;
  trained_at?: string;
  selection_metric?: string;
  trained_by?: {
    name: string;
  };
  fitted_parameters?: Record<string, any>;
  hyperparameters?: Record<string, any>;
};

type SavedForecastRow = {
  id: number;
  created_at: string;
  dataset_range: string;
  model_used: string;
  horizon_days: number;
  mae: number;
  rmse: number;
  mape: number;
  user?: {
    name: string;
  };
};

export interface ValidationMetadata {
  status: 'PRODUCTION_READY' | 'NEEDS_IMPROVEMENT' | 'INSUFFICIENT_DATA' | 'NOT_VALIDATED' | 'VALIDATION_ERROR';
  status_label: string;
  production_ready: boolean;
  reason: string;
  historical_days: number;
  min_history_days: number;
  validation_days: number;
  best_mape: number;
  best_wape: number;
  max_mape_threshold: number;
  max_wape_threshold: number;
  validation_completed: boolean;
  accuracy_definition?: string;
}

interface ActiveModelData {
  id: number;
  model_name: string;
  version: number;
  status: string;
  is_active: boolean;
  selection_metric: string;
  evaluation_metrics?: {
    mae?: number;
    rmse?: number;
    mape?: number;
    smape?: number;
    wape?: number;
    accuracy?: number;
  };
  fitted_parameters?: Record<string, any>;
  hyperparameters?: Record<string, any>;
  dataset_range?: string;
  training_points?: number;
  trained_at?: string;
  trained_by_name?: string;
}

interface BenchmarkData {
  lifecycle_status?: 'NOT_BENCHMARKED' | 'BENCHMARK_RUNNING' | 'MODEL_SELECTED' | 'MODEL_READY' | 'RETRAINING';
  is_benchmarked?: boolean;
  is_locked?: boolean;
  message?: string;
  active_model?: ActiveModelData | null;
  rankings?: BenchmarkRow[];
  val_dates?: string[];
  val_actuals?: number[];
  val_predictions?: Record<string, number[]>;
  best_model?: string;
  recommended_model?: string;
  selection_metric?: string;
  experiment_number?: number;
  best_metrics?: {
    mae?: number;
    rmse?: number;
    mape?: number;
    smape?: number;
    wape?: number;
    accuracy?: number;
    score?: number;
  };
  dataset_range?: string;
  error?: string;
  total_transactions?: number;
  processing_time?: number;
  quality?: {
    score?: number;
    label?: string;
    status?: string;
    missing_days?: number;
    outliers?: number;
    completeness?: number;
    total_days?: number;
  };
  validation?: ValidationMetadata;
}

interface BenchmarkPageProps {
  benchmark?: BenchmarkData;
  history?: HistoryRow[];
  modelsHistory?: ModelHistoryRow[];
  savedForecasts?: SavedForecastRow[];
  branches?: Array<{ id: number; name: string }>;
  filters?: { branch_id?: string };
}

export default function ForecastBenchmarking() {
  const {
    benchmark,
    history = [],
    modelsHistory = [],
    savedForecasts = [],
    branches = [],
    filters = {}
  } = usePage().props as unknown as BenchmarkPageProps;

  const [branchId, setBranchId] = useState(filters?.branch_id || 'all');
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [showExperimentDialog, setShowExperimentDialog] = useState(false);

  // Model toggles for interactive chart validation comparisons
  const [visibleModels, setVisibleModels] = useState<Record<string, boolean>>({
    'Actual': true,
    'Moving Average': true,
    'Weighted Moving Average': false,
    'Simple Exponential Smoothing': false,
    'Holt Linear Trend': true,
    'Holt-Winters Seasonal': true,
    'Linear Regression': false
  });

  const handleFilterChange = (value: string) => {
    setBranchId(value);
    router.get('/analytics/forecast-benchmarking', { branch_id: value }, {
      preserveState: true,
      replace: true
    });
  };

  // 1. Initial Benchmark (One-Time Selection)
  const handleRunInitialBenchmark = () => {
    setIsActionInProgress(true);
    router.post('/analytics/forecast-benchmarking/run', { branch_id: branchId }, {
      onFinish: () => setIsActionInProgress(false)
    });
  };

  // 2. Routine Retraining (Active Model only, without re-benchmarking competing candidates)
  const handleRetrainActiveModel = () => {
    setIsActionInProgress(true);
    router.post('/analytics/forecast-benchmarking/retrain', { branch_id: branchId }, {
      onFinish: () => setIsActionInProgress(false)
    });
  };

  // 3. Manual Re-Benchmark Experiment (Authorized Exception)
  const handleStartNewExperiment = () => {
    setShowExperimentDialog(false);
    setIsActionInProgress(true);
    router.post('/analytics/forecast-benchmarking/experiment', { branch_id: branchId }, {
      onFinish: () => setIsActionInProgress(false)
    });
  };

  const exportReport = () => {
    window.open(`/analytics/forecast-benchmarking/export?branch_id=${branchId}`, '_blank');
  };

  const toggleModelVisibility = (modelName: string) => {
    setVisibleModels(prev => ({
      ...prev,
      [modelName]: !prev[modelName]
    }));
  };

  // Build chart validation dates
  const validationChartData = useMemo(() => {
    if (!benchmark?.val_dates) return [];
    return benchmark.val_dates.map((date: string, idx: number) => {
      const row: Record<string, number | string> = {
        date: format(parseISO(date), 'MMM dd'),
        Actual: benchmark.val_actuals?.[idx] ?? 0
      };

      if (benchmark.val_predictions) {
        Object.entries(benchmark.val_predictions).forEach(([name, preds]: [string, number[]]) => {
          row[name] = preds[idx];
        });
      }
      return row;
    });
  }, [benchmark]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);

  const modelColors: Record<string, string> = {
    'Actual': '#52525b',
    'Moving Average': '#ef4444',
    'Weighted Moving Average': '#f97316',
    'Simple Exponential Smoothing': '#eab308',
    'Holt Linear Trend': '#3b82f6',
    'Holt-Winters Seasonal': '#E1062C',
    'Linear Regression': '#a855f7'
  };

  const isBenchmarked = benchmark?.is_benchmarked === true;
  const lifecycleStatus = benchmark?.lifecycle_status || (isBenchmarked ? 'MODEL_READY' : 'NOT_BENCHMARKED');
  const activeModel = benchmark?.active_model;

  return (
    <AppLayout breadcrumbs={[{ title: 'Analytics', href: '#' }, { title: 'Forecast Benchmarking', href: '/analytics/forecast-benchmarking' }]}>
      <Head title="Forecast Benchmarking & Model Registry" />

      <div className="flex flex-col h-screen overflow-hidden bg-background font-sans text-(--ops-text-secondary)">

        {/* ── Sub Navigation Tabs Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-(--ops-surface-sunken) border-b border-(--ops-border) shrink-0">
          <div className="flex items-center gap-3">
            <FiCpu className="text-primary size-6 animate-pulse" />
            <div>
              <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                Forecast Benchmarking & Model Registry
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  One-Time Selection Architecture
                </span>

                {/* Dynamic Lifecycle Status Badge */}
                {lifecycleStatus === 'NOT_BENCHMARKED' && (
                  <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider rounded-md">
                    Not Benchmarked
                  </Badge>
                )}
                {lifecycleStatus === 'BENCHMARK_RUNNING' && (
                  <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                    <FiRefreshCw className="size-2.5 animate-spin" /> Benchmarking In Progress
                  </Badge>
                )}
                {lifecycleStatus === 'MODEL_SELECTED' && (
                  <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black uppercase tracking-wider rounded-md">
                    Model Selected
                  </Badge>
                )}
                {lifecycleStatus === 'RETRAINING' && (
                  <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                    <FiRefreshCw className="size-2.5 animate-spin" /> Retraining Active Model
                  </Badge>
                )}
                {lifecycleStatus === 'MODEL_READY' && (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                    <FiCheck className="size-2.5" /> Single Model Deployed & Ready
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={branchId} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-44 h-9.5 bg-(--ops-surface-raised) border-(--ops-border) rounded-[10px] text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="bg-(--ops-surface-raised) border-(--ops-border) text-foreground rounded-xl">
                <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Branches</SelectItem>
                {branches.map((b: { id: number; name: string }) => (
                  <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action 1: Initial Benchmark button if not benchmarked */}
            {!isBenchmarked && (
              <Button
                onClick={handleRunInitialBenchmark}
                disabled={isActionInProgress || benchmark?.is_locked}
                className="h-9.5 px-3.5 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/10"
              >
                <FiPlay className={cn("size-3.5", isActionInProgress ? "animate-spin" : "")} />
                Run Initial Benchmark
              </Button>
            )}

            {/* Action 2: Routine Retraining button if model is deployed */}
            {isBenchmarked && (
              <>
                <Button
                  onClick={handleRetrainActiveModel}
                  disabled={isActionInProgress || benchmark?.is_locked}
                  variant="outline"
                  size="sm"
                  title="Refit the selected model family with updated historical sales data without re-benchmarking competing candidates."
                  className="h-9.5 rounded-[10px] bg-(--ops-surface-raised) border-(--ops-border) hover:bg-(--ops-hover) text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)"
                >
                  <FiRefreshCw className={cn("size-3.5 mr-1.5", isActionInProgress ? "animate-spin" : "")} />
                  Retrain Model
                </Button>

                {/* Action 3: Explicit Manual Re-benchmarking Experiment */}
                <Button
                  onClick={() => setShowExperimentDialog(true)}
                  disabled={isActionInProgress || benchmark?.is_locked}
                  variant="outline"
                  size="sm"
                  title="Administrative Action: Start a new model-selection experiment comparing all 6 candidate models."
                  className="h-9.5 rounded-[10px] bg-(--ops-surface-raised) border-primary/30 hover:bg-primary/5 text-[10px] font-black uppercase tracking-wider text-primary"
                >
                  <FiSliders className="size-3.5 mr-1.5" />
                  New Benchmark Experiment
                </Button>

                <Button
                  onClick={exportReport}
                  className="h-9.5 px-3.5 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/10"
                >
                  <FiDownload className="size-3.5" />
                  Export Report
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── Sub Navigation Links Tabs ── */}
        <div className="flex bg-(--ops-surface-sunken) border-b border-(--ops-border-subtle) px-6 sm:px-8 py-0 shrink-0 overflow-x-auto">
          <Link
            href="/analytics/sales-forecast"
            className="px-4 py-3 border-b-2 border-transparent text-xs font-black uppercase tracking-wider text-(--ops-text-muted) hover:text-foreground whitespace-nowrap"
          >
            Sales Forecasting
          </Link>
          <Link
            href="/analytics/forecast-benchmarking"
            className="px-4 py-3 border-b-2 border-primary text-xs font-black uppercase tracking-wider text-primary whitespace-nowrap"
          >
            Model Benchmarking & Registry
          </Link>
          <Link
            href="/analytics/restock-suggestions"
            className="px-4 py-3 border-b-2 border-transparent text-xs font-black uppercase tracking-wider text-(--ops-text-muted) hover:text-foreground whitespace-nowrap"
          >
            Restock Suggestions
          </Link>
        </div>

        {/* ── Scrollable Dashboard Grid ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">

          {benchmark?.error && (
            <Alert variant="destructive" className="bg-rose-500/5 border-rose-500/15 rounded-xl text-rose-500">
              <FiInfo className="size-4" />
              <AlertTitle className="font-black uppercase tracking-widest text-[9px] mb-1">Execution Notice</AlertTitle>
              <AlertDescription className="text-xs font-semibold">{benchmark.error}</AlertDescription>
            </Alert>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE 1: NOT YET BENCHMARKED ONBOARDING HERO CARD
             ───────────────────────────────────────────────────────────── */}
          {!isBenchmarked && (
            <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] p-8 text-center max-w-3xl mx-auto shadow-sm space-y-6">
              <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                <FiCpu className="size-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest rounded-md px-2.5 py-1">
                  Stage 1 — Initial Model Selection Required
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                  One-Time Forecasting Model Benchmarking
                </h2>
                <p className="text-xs text-(--ops-text-muted) max-w-xl mx-auto leading-relaxed">
                  To ensure maximum performance and academic defensibility, candidate forecasting algorithms are evaluated once during initial setup. The best-performing model on out-of-sample sales data will be deployed to the registry and used for all subsequent forecasting.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto">
                <div className="p-3.5 rounded-xl bg-(--ops-surface-sunken) border border-(--ops-border) space-y-1">
                  <span className="text-[8px] font-black uppercase text-primary tracking-wider">Candidate Pool</span>
                  <p className="text-xs font-bold text-foreground">6 Time-Series Models</p>
                  <p className="text-[9px] text-(--ops-text-muted)">MA, WMA, SES, Holt, Holt-Winters, LR</p>
                </div>
                <div className="p-3.5 rounded-xl bg-(--ops-surface-sunken) border border-(--ops-border) space-y-1">
                  <span className="text-[8px] font-black uppercase text-primary tracking-wider">Selection Rule</span>
                  <p className="text-xs font-bold text-foreground">Lowest WAPE</p>
                  <p className="text-[9px] text-(--ops-text-muted)">Out-of-sample walk-forward split</p>
                </div>
                <div className="p-3.5 rounded-xl bg-(--ops-surface-sunken) border border-(--ops-border) space-y-1">
                  <span className="text-[8px] font-black uppercase text-primary tracking-wider">Production Lifecycle</span>
                  <p className="text-xs font-bold text-foreground">Single-Model Deployment</p>
                  <p className="text-[9px] text-(--ops-text-muted)">Routine retraining without re-benchmarking</p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleRunInitialBenchmark}
                  disabled={isActionInProgress || benchmark?.is_locked}
                  className="h-11 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 mx-auto"
                >
                  <FiPlay className={cn("size-4", isActionInProgress ? "animate-spin" : "")} />
                  {isActionInProgress ? 'Evaluating Candidates...' : 'Run Initial Benchmark & Deploy Winner'}
                </Button>
                <p className="text-[9px] text-(--ops-text-muted) font-semibold mt-2.5">
                  Safe operation: historical orders, products, and inventory records remain unchanged.
                </p>
              </div>
            </Card>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE 2/3/4/5: BENCHMARKED & DEPLOYED VIEW
             ───────────────────────────────────────────────────────────── */}
          {isBenchmarked && (
            <>
              {/* Active Model Deployed Hero Banner */}
              {activeModel && (
                <div className="p-6 rounded-[14px] bg-linear-to-r from-primary/10 via-(--ops-surface-raised) to-(--ops-surface-raised) border border-primary/20 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-primary/15 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-widest rounded-md px-2 py-0.5">
                        Active Production Model
                      </Badge>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase rounded-md px-2 py-0.5">
                        v{activeModel.version}
                      </Badge>
                      <span className="text-[10px] text-(--ops-text-muted) font-mono">
                        Experiment #{benchmark?.experiment_number ?? 1}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                        <FiAward className="text-yellow-500 size-6" /> {activeModel.model_name}
                      </h2>
                      <p className="text-xs text-(--ops-text-muted) mt-1">
                        Selected via out-of-sample walk-forward validation (Metric: <b>{activeModel.selection_metric}</b>). Deployed to serve all sales forecasting and prescriptive restock operations.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-(--ops-surface-sunken) border border-(--ops-border) space-y-0.5 min-w-32">
                      <span className="text-[8px] font-black uppercase text-(--ops-text-muted) font-sans tracking-wider block">Training Data</span>
                      <span className="font-bold text-foreground">{activeModel.training_points} Days</span>
                      <span className="text-[8px] text-(--ops-text-muted) block truncate max-w-36">{activeModel.dataset_range}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-(--ops-surface-sunken) border border-(--ops-border) space-y-0.5 min-w-32">
                      <span className="text-[8px] font-black uppercase text-(--ops-text-muted) font-sans tracking-wider block">Last Retrained</span>
                      <span className="font-bold text-foreground">
                        {activeModel.trained_at ? format(parseISO(activeModel.trained_at), 'MMM dd, HH:mm') : 'N/A'}
                      </span>
                      <span className="text-[8px] text-(--ops-text-muted) block">By: {activeModel.trained_by_name || 'System'}</span>
                    </div>

                    <Button
                      onClick={handleRetrainActiveModel}
                      disabled={isActionInProgress || benchmark?.is_locked}
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                    >
                      <FiRefreshCw className={cn("size-3.5", isActionInProgress ? "animate-spin" : "")} />
                      Retrain Model
                    </Button>
                  </div>
                </div>
              )}

              {/* KPI Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-stretch">
                <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-22.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Selected Model</p>
                  <div>
                    <h3 className="text-sm font-black text-primary mt-1 truncate uppercase flex items-center gap-1">
                      <FiAward className="size-4 shrink-0 text-yellow-500" /> {benchmark?.best_model}
                    </h3>
                    <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Active Production Fit</p>
                  </div>
                </Card>

                <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-22.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Accuracy (100 - WAPE)</p>
                    <span className="text-[9px] text-(--ops-text-muted)" title="Accuracy is defined as 100% - WAPE on out-of-sample validation period.">ⓘ</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-500 mt-1 font-mono">{benchmark?.best_metrics?.accuracy}%</h3>
                    <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest truncate">
                      WAPE: {benchmark?.best_metrics?.wape}%
                    </p>
                  </div>
                </Card>

                <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-22.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Mean Absolute Error</p>
                  <div>
                    <h3 className="text-2xl font-black text-foreground mt-1 font-mono">{formatCurrency(benchmark?.best_metrics?.mae || 0)}</h3>
                    <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Out-of-sample MAE</p>
                  </div>
                </Card>

                <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-22.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Root Mean Sq Error</p>
                  <div>
                    <h3 className="text-2xl font-black text-foreground mt-1 font-mono">{formatCurrency(benchmark?.best_metrics?.rmse || 0)}</h3>
                    <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Out-of-sample RMSE</p>
                  </div>
                </Card>

                <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-22.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Average MAPE</p>
                  <div>
                    <h3 className="text-2xl font-black text-foreground mt-1 font-mono">{benchmark?.best_metrics?.mape}%</h3>
                    <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Mean Abs Pct Error</p>
                  </div>
                </Card>

                <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-22.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Validation Status</p>
                  <div>
                    {(() => {
                      const val = benchmark?.validation;
                      const status = val?.status || 'NOT_VALIDATED';
                      const label = val?.status_label || 'Not Validated';

                      let badgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                      if (status === 'PRODUCTION_READY') {
                        badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                      } else if (status === 'NEEDS_IMPROVEMENT') {
                        badgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                      } else if (status === 'INSUFFICIENT_DATA') {
                        badgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                      }

                      return (
                        <>
                          <Badge className={cn("text-[8px] font-black uppercase tracking-wider rounded-md mt-1 px-2 py-0.5 border", badgeClass)}>
                            {label}
                          </Badge>
                          <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest truncate" title={val?.reason || 'Validation status'}>
                            {val?.production_ready ? 'Gating Criteria Passed' : 'Gating Criteria Notice'}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </Card>
              </div>

              {/* Validation Gate Audit Banner if Not Ready */}
              {benchmark?.validation && !benchmark.validation.production_ready && (
                <div className="p-4 rounded-[14px] bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                    <FiAlertTriangle className="size-3.5" />
                    <span>Model Validation Gating Notice: {benchmark.validation.status_label}</span>
                  </div>
                  <p className="text-xs text-foreground/80">
                    {benchmark.validation.reason}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1 text-[10px] font-mono text-(--ops-text-muted)">
                    <span>History Coverage: <b>{benchmark.validation.historical_days} days</b> (Required: ≥ {benchmark.validation.min_history_days}d)</span>
                    <span>Best WAPE: <b>{benchmark.validation.best_wape}%</b> (Threshold: ≤ {benchmark.validation.max_wape_threshold}%)</span>
                    <span>Best MAPE: <b>{benchmark.validation.best_mape}%</b> (Threshold: ≤ {benchmark.validation.max_mape_threshold}%)</span>
                  </div>
                </div>
              )}

              {/* Benchmark Summary and Candidate Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Benchmark Summary Detail */}
                <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] p-5 space-y-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Evidence & Audit</span>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight mt-1.5">Benchmark Experiment Summary</h3>
                    <p className="text-[9px] text-(--ops-text-muted) uppercase font-bold tracking-wider">Recorded walk-forward validation</p>
                  </div>

                  <div className="divide-y divide-(--ops-border-subtle) text-xs font-semibold space-y-2">
                    {[
                      { l: 'Dataset Range', v: benchmark?.dataset_range || 'N/A' },
                      { l: 'Historical Window', v: `${benchmark?.validation?.historical_days ?? 0} days (Min: ${benchmark?.validation?.min_history_days ?? 90}d)` },
                      { l: 'Experiment Number', v: `#${benchmark?.experiment_number ?? 1}` },
                      { l: 'Models Evaluated', v: `${benchmark?.rankings?.length || 6} Active Candidates` },
                      { l: 'Winning Algorithm', v: benchmark?.best_model || 'N/A', highlight: true },
                      { l: 'Selection Metric', v: 'Lowest Out-of-Sample WAPE' },
                      { l: 'Model Accuracy', v: (benchmark?.best_metrics?.accuracy ?? 0) + '%', success: (benchmark?.best_metrics?.accuracy ?? 0) >= 80 },
                      {
                        l: 'Validation Decision',
                        v: benchmark?.validation?.status_label || 'Pending',
                        success: benchmark?.validation?.production_ready === true
                      },
                      { l: 'Execution Runtime', v: `${benchmark?.processing_time ?? 0}s` }
                    ].map((row, idx) => (
                      <div key={idx} className="pt-2 flex justify-between gap-4">
                        <span className="text-(--ops-text-muted)">{row.l}</span>
                        <span className={cn(
                          "font-mono font-bold text-right",
                          row.highlight ? "text-primary font-black" : "",
                          row.success ? "text-emerald-500 font-black" : "text-foreground"
                        )}>{row.v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-[9px] text-(--ops-text-muted) font-semibold italic border-t border-(--ops-border-subtle)">
                    Note: Subsequent operations reuse the active model without re-evaluating competing candidates.
                  </div>
                </Card>

                {/* Candidate Leaderboard Table */}
                <Card className="lg:col-span-2 border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden flex flex-col shadow-sm">
                  <div className="p-5 border-b border-(--ops-border-subtle) flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Candidate Evaluation</span>
                      <h3 className="text-sm font-black text-foreground uppercase mt-1">Model Selection Matrix (Ranked by WAPE)</h3>
                    </div>
                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-black uppercase tracking-wider rounded-md">
                      Deterministic Selection Rule
                    </Badge>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto text-xs">
                      <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border-subtle) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary)">
                        <tr>
                          <th className="px-5 py-2.5 text-center">Rank</th>
                          <th className="px-5 py-2.5">Candidate Algorithm</th>
                          <th className="px-5 py-2.5 text-right">WAPE</th>
                          <th className="px-5 py-2.5 text-right">MAE</th>
                          <th className="px-5 py-2.5 text-right">RMSE</th>
                          <th className="px-5 py-2.5 text-right">MAPE</th>
                          <th className="px-5 py-2.5 text-right">sMAPE</th>
                          <th className="px-5 py-2.5 text-right">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--ops-border-subtle)">
                        {benchmark?.rankings?.map((r: BenchmarkRow) => (
                          <tr
                            key={r.rank}
                            className={cn(
                              "hover:bg-(--ops-surface-sunken)/20 transition-colors",
                              r.rank === 1 ? "bg-primary/5 font-semibold" : ""
                            )}
                          >
                            <td className="px-5 py-3 text-center">
                              {r.rank === 1 ? (
                                <span className="inline-flex items-center justify-center size-5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-black text-[10px]">
                                  ★1
                                </span>
                              ) : (
                                <span className="text-(--ops-text-muted) font-mono">{r.rank}</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <span className={cn(
                                r.rank === 1 ? "text-primary font-black" : "text-foreground"
                              )}>
                                {r.model}
                              </span>
                              {r.rank === 1 && (
                                <span className="ml-2 text-[8px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-bold">
                                  Winner & Active
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-primary">{r.wape}%</td>
                            <td className="px-5 py-3 text-right font-mono">{formatCurrency(r.mae)}</td>
                            <td className="px-5 py-3 text-right font-mono">{formatCurrency(r.rmse)}</td>
                            <td className="px-5 py-3 text-right font-mono">{r.mape}%</td>
                            <td className="px-5 py-3 text-right font-mono text-(--ops-text-muted)">{r.smape}%</td>
                            <td className="px-5 py-3 text-right font-mono font-black text-emerald-500">{r.accuracy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Validation Period Interactive Comparison Chart */}
              {validationChartData.length > 0 && (
                <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-(--ops-border-subtle) pb-4">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Holdout Validation Chart</span>
                      <h3 className="text-sm font-black text-foreground uppercase mt-1">
                        Out-of-Sample Test Set: Actual Sales vs Candidate Projections
                      </h3>
                      <p className="text-[9px] text-(--ops-text-muted) font-semibold">
                        Toggle series to inspect individual model fit against actual ground-truth sales during walk-forward validation.
                      </p>
                    </div>

                    {/* Series toggle pills */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {Object.keys(visibleModels).map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleModelVisibility(name)}
                          className={cn(
                            "px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all flex items-center gap-1 border",
                            visibleModels[name]
                              ? "bg-(--ops-surface-sunken) text-foreground border-(--ops-border) shadow-xs"
                              : "opacity-40 text-(--ops-text-muted) border-transparent hover:opacity-75"
                          )}
                        >
                          <span
                            className="size-2 rounded-full inline-block"
                            style={{ backgroundColor: modelColors[name] || '#888' }}
                          />
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={validationChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} />
                        <YAxis stroke="#888" fontSize={10} tickLine={false} tickFormatter={v => `₱${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            fontFamily: 'monospace'
                          }}
                          formatter={(v: any) => [formatCurrency(Number(v)), '']}
                        />
                        {Object.entries(visibleModels).map(([name, isVisible]) => {
                          if (!isVisible) return null;
                          return (
                            <Line
                              key={name}
                              type="monotone"
                              dataKey={name}
                              stroke={modelColors[name] || '#888'}
                              strokeWidth={name === 'Actual' ? 2.5 : (name === benchmark?.best_model ? 2.5 : 1.5)}
                              strokeDasharray={name === 'Actual' ? undefined : (name === benchmark?.best_model ? undefined : '4 4')}
                              dot={name === 'Actual'}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Historical Model Versions Registry & Experiment History */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Model Version Registry */}
                <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden flex flex-col shadow-sm">
                  <div className="p-5 border-b border-(--ops-border-subtle) flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Durable Registry</span>
                      <h3 className="text-sm font-black text-foreground uppercase mt-1">Deployed Model Version History</h3>
                    </div>
                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-black uppercase tracking-wider rounded-md">
                      Audit Trail
                    </Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-80">
                    <table className="w-full text-left border-collapse table-auto text-xs">
                      <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border-subtle) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary)">
                        <tr>
                          <th className="px-5 py-2.5">Version</th>
                          <th className="px-5 py-2.5">Model Family</th>
                          <th className="px-5 py-2.5">Status</th>
                          <th className="px-5 py-2.5">Trained At</th>
                          <th className="px-5 py-2.5">Trained By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--ops-border-subtle) font-mono text-[11px] text-(--ops-text-secondary)">
                        {modelsHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-zinc-500 font-sans uppercase italic">
                              No model versions registered yet.
                            </td>
                          </tr>
                        ) : (
                          modelsHistory.map((m: ModelHistoryRow) => (
                            <tr key={m.id} className="hover:bg-(--ops-surface-sunken)/20 transition-colors">
                              <td className="px-5 py-3 font-bold text-foreground">v{m.version}</td>
                              <td className="px-5 py-3 font-sans text-foreground font-bold">{m.model_name}</td>
                              <td className="px-5 py-3">
                                {m.is_active ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[7px] font-black uppercase">
                                    Active
                                  </Badge>
                                ) : (
                                  <span className="text-[9px] text-(--ops-text-muted) uppercase">Archived</span>
                                )}
                              </td>
                              <td className="px-5 py-3 font-sans">
                                {m.trained_at ? format(parseISO(m.trained_at), 'MMM dd, HH:mm') : 'N/A'}
                              </td>
                              <td className="px-5 py-3 font-sans text-(--ops-text-muted)">
                                {m.trained_by?.name || 'System'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Benchmark Experiments Run History */}
                <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden flex flex-col shadow-sm">
                  <div className="p-5 border-b border-(--ops-border-subtle) flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Experiment Archive</span>
                      <h3 className="text-sm font-black text-foreground uppercase mt-1">Benchmark Experiment History</h3>
                    </div>
                    <Badge className="bg-(--ops-surface-sunken) text-(--ops-text-secondary) border border-(--ops-border) text-[8px] font-black uppercase tracking-wider rounded-md">
                      Reproducibility
                    </Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-80">
                    <table className="w-full text-left border-collapse table-auto text-xs">
                      <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border-subtle) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary)">
                        <tr>
                          <th className="px-5 py-2.5">Exp #</th>
                          <th className="px-5 py-2.5">Date</th>
                          <th className="px-5 py-2.5">Selected Model</th>
                          <th className="px-5 py-2.5 text-right">WAPE</th>
                          <th className="px-5 py-2.5 text-right">Speed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--ops-border-subtle) font-mono text-[11px] text-(--ops-text-secondary)">
                        {history.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-zinc-500 font-sans uppercase italic">
                              No prior benchmark experiments.
                            </td>
                          </tr>
                        ) : (
                          history.map((h: HistoryRow) => (
                            <tr key={h.id} className="hover:bg-(--ops-surface-sunken)/20 transition-colors">
                              <td className="px-5 py-3 font-bold text-foreground">#{h.experiment_number ?? 1}</td>
                              <td className="px-5 py-3 font-sans text-foreground">
                                {format(parseISO(h.created_at), 'MMM dd, yyyy HH:mm')}
                              </td>
                              <td className="px-5 py-3 text-primary font-bold">{h.recommended_model}</td>
                              <td className="px-5 py-3 text-right text-emerald-500 font-bold">
                                {h.wape !== undefined ? `${h.wape}%` : `${h.mape}%`}
                              </td>
                              <td className="px-5 py-3 text-right text-(--ops-text-muted)">{h.processing_time}s</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* Footer Methodology Notice */}
          <div className="py-2 text-center text-[9px] font-black uppercase text-(--ops-text-faint) tracking-widest border-t border-(--ops-border-subtle)">
            One-Time Benchmarking Methodology • Academic Reproducibility Guaranteed • Single Production Model Active
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CONFIRMATION DIALOG: START NEW BENCHMARK EXPERIMENT
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={showExperimentDialog} onOpenChange={setShowExperimentDialog}>
        <DialogContent className="max-w-md bg-(--ops-surface-raised) border-(--ops-border) text-foreground">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <FiSliders className="size-5" />
              <DialogTitle className="text-sm font-black uppercase tracking-tight">
                Start New Benchmark Experiment?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-(--ops-text-muted) leading-relaxed">
              This will create <b>Experiment #{((benchmark?.experiment_number ?? 1) + 1)}</b> and re-evaluate all 6 candidate forecasting models on the latest sales dataset.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-(--ops-surface-sunken) border border-(--ops-border) space-y-2 text-xs">
            <div className="flex items-start gap-2 text-amber-500">
              <FiAlertTriangle className="size-4 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                <b>Audit Protection:</b> Existing benchmark records and model versions will remain preserved in the registry. The current active model (<b>{benchmark?.best_model}</b>) will remain in production until the new experiment completes and its winning model is trained.
              </p>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowExperimentDialog(false)}
              className="text-xs font-bold uppercase rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleStartNewExperiment}
              disabled={isActionInProgress}
              className="text-xs font-bold uppercase rounded-xl bg-primary hover:bg-primary-hover text-white shadow-sm"
            >
              {isActionInProgress ? 'Running...' : 'Confirm & Run Experiment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
