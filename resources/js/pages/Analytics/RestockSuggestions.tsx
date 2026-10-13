import { Head, usePage, router, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo } from 'react';
import {
  FiBox,
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
  FiZap,
  FiShoppingBag,
  FiMinimize2,
  FiMaximize2,
  FiChevronDown,
  FiChevronUp,
  FiStar,
  FiShare2,
  FiCalendar,
  FiSearch,
  FiLayers,
  FiArrowRight,
  FiCheck,
} from 'react-icons/fi';
import { MassRestockModal } from '@/components/mass-restock-modal';
import { ProductIngredientRestockModal } from '@/components/products/ProductIngredientRestockModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

// -- Types ----------------------------------------------------------------------
type Urgency = 'Out of Stock' | 'Critical' | 'Warning' | 'Safe';
type Trend = 'rising' | 'stable' | 'declining';
type Volatility = 'high' | 'medium' | 'low';

type Suggestion = {
  ingredient_id: number;
  name: string;
  unit: string;
  current_stock: number;
  incoming_stock?: number;
  reserved_stock?: number;
  inventory_position?: number;
  low_stock_level: number;
  predicted_usage: number;
  safety_stock?: number;
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
  reason?: string;
  citation?: string;
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

type RecipeIngredientDetail = {
  ingredient_id: number;
  name: string;
  category?: string | null;
  recipe_quantity: number;
  recipe_unit: string;
  base_quantity_per_portion: number;
  base_unit: string;
  usable_stock: number;
  ineligible_stock: number;
  portions_supported: number;
  suggested_restock: number;
  projected_stock: number;
  projected_portions_supported: number;
  is_shared: boolean;
  shared_with_products_count: number;
  shared_product_names: string[];
  status: string;
  days_of_stock?: number;
  is_bottleneck?: boolean;
};

type ProductSuggestion = {
  id: number;
  name: string;
  sku?: string | null;
  category_name?: string;
  image_url?: string | null;
  has_recipe: boolean;
  recipe_status: 'configured' | 'missing';
  restock_urgency: 'critical' | 'warning' | 'safe' | 'recipe_missing';
  demand_priority: 'high' | 'medium' | 'low' | 'none';
  is_bestseller: boolean;
  historical_units_sold: number;
  daily_sales_velocity: number;
  sales_trend: 'rising' | 'declining' | 'stable';
  forecasted_demand: number;
  current_producible_portions: number | null;
  projected_producible_portions: number | null;
  portions_gain: number;
  bottleneck_ingredients: string[];
  bottleneck_details: Array<{
    ingredient_id: number;
    name: string;
    unit: string;
    usable_stock: number;
    required_per_portion: number;
    portions_supported: number;
  }>;
  requires_restock: boolean;
  recipe_ingredients: RecipeIngredientDetail[];
  suggested_restock_quantities: Record<number, number>;
  explanation: string;
};

type ProductCentricData = {
  horizon_days: number;
  products: ProductSuggestion[];
  summary: {
    total_products: number;
    products_needing_restock: number;
    critical_products: number;
    warning_products: number;
    safe_products: number;
    missing_recipes_count: number;
    bestsellers_at_risk: number;
    total_portions_gain: number;
    shared_ingredients_count: number;
  };
  shared_ingredients: Array<{
    ingredient_id: number;
    name: string;
    unit: string;
    products_count: number;
    products: Array<{ id: number; name: string }>;
    suggested_restock: number;
    status: string;
    current_stock: number;
  }>;
};

// -- Helpers --------------------------------------------------------------------
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

// -- Main Component -------------------------------------------------------------
interface RestockPageProps {
  suggestions?: Suggestion[];
  product_suggestions?: ProductCentricData;
  branches?: Array<{ id: number; name: string }>;
  horizon_days?: number;
  tomorrow_forecast?: number;
  forecast_lower?: number;
  forecast_upper?: number;
  demand_ratio?: number;
  forecast_insights?: string[];
  forecast_confidence?: number;
  filters?: { branch_id?: string | number; horizon_days?: string | number; status?: string };
  error?: string;
  impact_suggestions?: ImpactSuggestion[];
  inventory?: unknown[];
  auth?: { user?: { id: number; name: string; role?: string } };
  [key: string]: unknown;
}

export default function RestockSuggestions() {
  const {
    suggestions,
    product_suggestions,
    branches,
    horizon_days = 7,
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
    auth,
  } = usePage<RestockPageProps>().props;

  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.role === 'super_admin';

  // Primary State
  const [viewMode, setViewMode] = useState<'products' | 'ingredients'>('products');
  const [branchId, setBranchId] = useState(String(filters?.branch_id || ''));
  const [horizon, setHorizon] = useState<number>(Number(filters?.horizon_days || horizon_days || 7));
  const [isLoading, setIsLoading] = useState(false);
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

  // Product Recommendation Filters
  const [productUrgencyFilter, setProductUrgencyFilter] = useState<'All' | 'critical' | 'warning' | 'safe' | 'recipe_missing'>('All');
  const [productDemandFilter, setProductDemandFilter] = useState<'All' | 'high' | 'medium' | 'low'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});

  // Ingredient-level filter
  const [activeIngredientFilter, setIngredientFilter] = useState<'All' | Urgency>('All');

  // Product Restock Modal State
  const [productRestockModalOpen, setProductRestockModalOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<ProductSuggestion | null>(null);

  // Mass Restock Modal State (Ingredient table)
  const [massRestockModalOpen, setMassRestockModalOpen] = useState(false);
  const [massPrefilledItems, setMassPrefilledItems] = useState<Record<number, { quantity: string; unit: string }> | undefined>(undefined);

  const currentBranchName = useMemo(() =>
    branches?.find((b) => String(b.id) === branchId)?.name || 'Victoria'
  , [branches, branchId]);

  const toggleProductExpand = (id: number) => {
    setExpandedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openProductRestock = (prod: ProductSuggestion) => {
    setSelectedProductForRestock(prod);
    setProductRestockModalOpen(true);
  };

  const openMassRestock = (impact?: ImpactSuggestion) => {
    if (impact) {
      setMassPrefilledItems({
        [impact.ingredient_id]: {
          quantity: String(impact.suggested_restock_quantity),
          unit: impact.unit,
        },
      });
    } else {
      setMassPrefilledItems(undefined);
    }
    setMassRestockModalOpen(true);
  };

  const handleFilterChange = (params: Record<string, string | number>) => {
    setIsLoading(true);
    router.get('/analytics/restock-suggestions', {
      branch_id: branchId,
      horizon_days: horizon,
      ...params,
    }, {
      preserveState: true,
      replace: true,
      onFinish: () => setIsLoading(false),
    });
  };

  // Unique categories from product suggestions
  const productCategories = useMemo(() => {
    const list = product_suggestions?.products || [];
    const set = new Set<string>();
    list.forEach((p) => {
      if (p.category_name) set.add(p.category_name);
    });
    return Array.from(set).sort();
  }, [product_suggestions]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const list = product_suggestions?.products || [];
    return list.filter((p) => {
      // Urgency filter
      if (productUrgencyFilter !== 'All' && p.restock_urgency !== productUrgencyFilter) {
        return false;
      }
      // Demand filter
      if (productDemandFilter !== 'All' && p.demand_priority !== productDemandFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'All' && p.category_name !== categoryFilter) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku?.toLowerCase().includes(query) ?? false;
        const matchesIngredients = p.recipe_ingredients.some((i) => i.name.toLowerCase().includes(query));
        if (!matchesName && !matchesSku && !matchesIngredients) {
          return false;
        }
      }
      return true;
    });
  }, [product_suggestions, productUrgencyFilter, productDemandFilter, categoryFilter, searchQuery]);

  // Derived stats for Ingredient Breakdown
  const ingredientStats = useMemo(() => {
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

  const filteredIngredients: Suggestion[] = useMemo(() => {
    const s: Suggestion[] = suggestions || [];
    return activeIngredientFilter === 'All' ? s : s.filter(x => x.status === activeIngredientFilter);
  }, [suggestions, activeIngredientFilter]);

  const demandAboveAvg = (demand_ratio ?? 1) > 1.1;
  const demandBelowAvg = (demand_ratio ?? 1) < 0.9;
  const pSummary = product_suggestions?.summary;

  return (
    <AppLayout breadcrumbs={[{ title: 'Analytics', href: '#' }, { title: 'Prescriptive Restock', href: '#' }]}>
      <Head title="Prescriptive Restock & Product Decisions" />

      <div className="flex flex-col h-screen overflow-hidden bg-background font-sans text-(--ops-text-secondary)">

        {/* -- Header Area -- */}
        <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-(--ops-surface-sunken) border-b border-(--ops-border) shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <FiBox className="size-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none flex items-center gap-2">
                Prescriptive Restock Decisions
                {isLoading && (
                  <span className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block align-middle" />
                )}
              </h1>
              <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                Product-centric demand planning – Recipe portion bottlenecks – Consolidated branch inventory
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-(--ops-surface-raised) border border-(--ops-border) p-1 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('products')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                viewMode === 'products'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-(--ops-text-muted) hover:text-foreground"
              )}
            >
              <FiLayers className="size-3.5" />
              <span>Menu Products</span>
              {pSummary && (
                <span className="text-[10px] font-mono opacity-80">({pSummary.total_products})</span>
              )}
            </button>
            <button
              onClick={() => setViewMode('ingredients')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                viewMode === 'ingredients'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-(--ops-text-muted) hover:text-foreground"
              )}
            >
              <FiBox className="size-3.5" />
              <span>Ingredient Inventory</span>
              <span className="text-[10px] font-mono opacity-80">({suggestions?.length ?? 0})</span>
            </button>
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
            className="px-4 py-3 border-b-2 border-transparent text-xs font-black uppercase tracking-wider text-(--ops-text-muted) hover:text-foreground whitespace-nowrap"
          >
            Model Benchmarking
          </Link>
          <Link
            href="/analytics/restock-suggestions"
            className="px-4 py-3 border-b-2 border-primary text-xs font-black uppercase tracking-wider text-primary whitespace-nowrap"
          >
            Restock Suggestions
          </Link>
        </div>

        {/* -- Content Layout -- */}
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
                key={`${branchId}_${horizon}_${viewMode}`}
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
                    <p className="text-[9px] font-black uppercase tracking-widest text-(--ops-text-muted) mb-1">
                      Forecast & Replenishment Intelligence Horizon ({horizon} Days)
                    </p>
                    <p className="font-bold leading-relaxed">
                      Projected daily sales pace for <strong className="font-black text-foreground">{currentBranchName}</strong> is{' '}
                      <strong className="font-black text-foreground">{fmt(tomorrow_forecast)}</strong>{' '}
                      (expected range: {fmt(forecast_lower)} – {fmt(forecast_upper)}).{' '}
                      {demandAboveAvg
                        ? `Trend shows +${Math.round(((demand_ratio ?? 1) - 1) * 100)}% demand lift – safety buffers and recipe projections dynamically expanded.`
                        : demandBelowAvg
                          ? `Trend shows -${Math.round((1 - (demand_ratio ?? 1)) * 100)}% lower velocity – conservative batch replenishment applied.`
                          : 'Demand patterns remain steady with standard historical baseline.'}
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
                  <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Products Needing Restock</p>
                      <Badge className="bg-amber-500/5 text-amber-500 border border-amber-500/10 font-black text-[8px] uppercase px-1.5 py-0 rounded-[6px]">
                        Action Needed
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">
                        {pSummary?.products_needing_restock ?? 0} Products
                      </h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">
                        Out of {pSummary?.total_products ?? 0} analyzed items
                      </p>
                    </div>
                  </div>

                  <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500/70">Bestsellers At Risk</p>
                      <Badge className="bg-rose-500/5 text-rose-500 border border-rose-500/10 font-black text-[8px] uppercase px-1.5 py-0 rounded-[6px]">
                        {pSummary?.bestsellers_at_risk ? `${pSummary.bestsellers_at_risk} Critical` : 'Protected'}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-rose-500 tabular-nums leading-none">
                        {pSummary?.bestsellers_at_risk ?? 0} Items
                      </h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">
                        High-demand recipes with bottlenecks
                      </p>
                    </div>
                  </div>

                  <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Feasible Portion Uplift</p>
                      <Badge className="bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 font-black text-[8px] uppercase px-1.5 py-0 rounded-[6px]">
                        Capacity Gain
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-emerald-500 tabular-nums leading-none">
                        +{pSummary?.total_portions_gain ?? 0} Portions
                      </h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">
                        Potential production after restock
                      </p>
                    </div>
                  </div>

                  <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Consolidated Procurement</p>
                      <Badge className="bg-primary/5 text-primary border border-primary/10 font-black text-[8px] uppercase px-1.5 py-0 rounded-[6px]">
                        Branch Cost
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">
                        {fmt(ingredientStats.totalCost)}
                      </h3>
                      <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">
                        {pSummary?.shared_ingredients_count ?? 0} shared ingredients consolidated
                      </p>
                    </div>
                  </div>
                </div>

                {/* STICKY TOOLBAR FILTERS */}
                <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md pb-4 pt-1 space-y-4 border-b border-(--ops-border-subtle)">
                  
                  {/* Top Control Bar: Branch & Horizon Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                      
                      {/* Branch select filter */}
                      <div className="flex items-center bg-(--ops-surface-sunken) border border-(--ops-border) rounded-[10px] p-0.5">
                        <FiFilter className="text-(--ops-text-muted) ml-2.5 size-3.5" />
                        <Select
                          value={branchId}
                          onValueChange={(v) => {
                            setBranchId(v);
                            handleFilterChange({ branch_id: v });
                          }}
                        >
                          <SelectTrigger className="w-48 h-8.5 bg-transparent border-none shadow-none focus:ring-0 text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent className="bg-(--ops-surface-sunken) border-(--ops-border) text-foreground rounded-xl">
                            {branches?.map((b: { id: number; name: string }) => (
                              <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase py-2">
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Forecast Horizon selector */}
                      <div className="flex items-center bg-(--ops-surface-sunken) border border-(--ops-border) rounded-[10px] p-0.5">
                        <FiCalendar className="text-(--ops-text-muted) ml-2.5 size-3.5" />
                        <Select
                          value={String(horizon)}
                          onValueChange={(v) => {
                            setHorizon(Number(v));
                            handleFilterChange({ horizon_days: v });
                          }}
                        >
                          <SelectTrigger className="w-36 h-8.5 bg-transparent border-none shadow-none focus:ring-0 text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)">
                            <SelectValue placeholder="Horizon" />
                          </SelectTrigger>
                          <SelectContent className="bg-(--ops-surface-sunken) border-(--ops-border) text-foreground rounded-xl">
                            <SelectItem value="3" className="text-[10px] font-bold uppercase py-1.5">3 Days Horizon</SelectItem>
                            <SelectItem value="7" className="text-[10px] font-bold uppercase py-1.5">7 Days (Default)</SelectItem>
                            <SelectItem value="14" className="text-[10px] font-bold uppercase py-1.5">14 Days Horizon</SelectItem>
                            <SelectItem value="30" className="text-[10px] font-bold uppercase py-1.5">30 Days Horizon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Search box */}
                      <div className="relative min-w-44 max-w-xs flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-(--ops-text-muted)" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={viewMode === 'products' ? "Filter products or ingredients..." : "Filter raw materials..."}
                          className="h-8.5 pl-8.5 text-[10px] font-bold rounded-[10px] bg-(--ops-surface-sunken) border-(--ops-border)"
                        />
                      </div>

                      {/* Category select (for products mode) */}
                      {viewMode === 'products' && productCategories.length > 0 && (
                        <div className="flex items-center bg-(--ops-surface-sunken) border border-(--ops-border) rounded-[10px] p-0.5">
                          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-36 h-8.5 bg-transparent border-none shadow-none focus:ring-0 text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary)">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-(--ops-surface-sunken) border-(--ops-border) text-foreground rounded-xl">
                              <SelectItem value="All" className="text-[10px] font-bold uppercase py-1.5">All Categories</SelectItem>
                              {productCategories.map((c) => (
                                <SelectItem key={c} value={c} className="text-[10px] font-bold uppercase py-1.5">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* View Controls & Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {viewMode === 'ingredients' && (
                        <Button
                          size="sm"
                          onClick={() => openMassRestock()}
                          className="h-8.5 px-3 rounded-[10px] font-black uppercase text-[10px] tracking-wider gap-1.5 bg-primary text-primary-foreground shadow-sm"
                        >
                          <FiPlusCircle className="size-3.5" />
                          <span>Mass Restock Order</span>
                        </Button>
                      )}

                      {/* Density Control */}
                      <div className="flex items-center border border-(--ops-border) rounded-[10px] p-0.5 bg-(--ops-surface-sunken)">
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

                  {/* Filter Chips Row */}
                  {viewMode === 'products' ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-(--ops-border-subtle)">
                      <div className="flex flex-wrap gap-2">
                        {([
                          { key: 'All', label: 'All Products', count: product_suggestions?.products?.length ?? 0 },
                          { key: 'critical', label: 'Action Required', count: pSummary?.critical_products ?? 0 },
                          { key: 'warning', label: 'Low Coverage', count: pSummary?.warning_products ?? 0 },
                          { key: 'safe', label: 'Sufficient Coverage', count: pSummary?.safe_products ?? 0 },
                          { key: 'recipe_missing', label: 'Missing Recipe', count: pSummary?.missing_recipes_count ?? 0 },
                        ] as const).map(({ key, label, count }) => {
                          const isActive = productUrgencyFilter === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setProductUrgencyFilter(key)}
                              className={cn(
                                "h-7.5 px-3 rounded-[9px] text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center border",
                                isActive
                                  ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                  : "bg-(--ops-thead-bg) border-(--ops-border) text-(--ops-text-secondary) hover:text-foreground hover:bg-(--ops-chip-active-bg)"
                              )}
                            >
                              <span>{label}</span>
                              <span className="ml-1 opacity-70 font-mono">({count})</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Demand Priority Quick Filter */}
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-(--ops-text-muted)">
                        <span>Demand:</span>
                        {(['All', 'high', 'medium', 'low'] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => setProductDemandFilter(d)}
                            className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all",
                              productDemandFilter === d
                                ? "bg-foreground text-background"
                                : "text-(--ops-text-muted) hover:text-foreground"
                            )}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Ingredient status filter chips */
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-(--ops-border-subtle)">
                      {(['All', 'Out of Stock', 'Critical', 'Warning', 'Safe'] as const).map(f => {
                        const count = f === 'All'
                          ? (suggestions || []).length
                          : (suggestions || []).filter((s: Suggestion) => s.status === f).length;
                        const isActive = activeIngredientFilter === f;
                        return (
                          <button
                            key={f}
                            onClick={() => setIngredientFilter(f)}
                            className={cn(
                              "h-7.5 px-3 rounded-[9px] text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center border",
                              isActive
                                ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                : "bg-(--ops-thead-bg) border-(--ops-border) text-(--ops-text-secondary) hover:text-foreground hover:bg-(--ops-chip-active-bg)"
                            )}
                          >
                            <span>{f}</span>
                            <span className="ml-1 opacity-70 font-mono">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ════════════════════════════════════════════════════════════════ */}
                {/* VIEW 1: PRODUCT RECOMMENDATIONS (PRIMARY VIEW)                  */}
                {/* ════════════════════════════════════════════════════════════════ */}
                {viewMode === 'products' && (
                  <div className="space-y-4">
                    {filteredProducts.length === 0 ? (
                      <div className="p-12 text-center bg-(--ops-surface-sunken) rounded-2xl border border-dashed border-(--ops-border)">
                        <FiCheckCircle className="size-10 text-emerald-500/50 mx-auto mb-3" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                          No Products Match Active Filters
                        </h3>
                        <p className="text-xs text-(--ops-text-muted) mt-1 max-w-md mx-auto">
                          All menu products currently meet or exceed demand criteria for the selected branch and horizon.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredProducts.map((product) => {
                          const isExpanded = !!expandedProducts[product.id];
                          const hasRestockNeed = product.requires_restock;
                          const currentCap = product.current_producible_portions ?? 0;
                          const projCap = product.projected_producible_portions ?? 0;
                          const demandVal = product.forecasted_demand;
                          const coveragePct = demandVal > 0 ? Math.min(150, Math.round((currentCap / demandVal) * 100)) : 100;
                          const projCoveragePct = demandVal > 0 ? Math.min(150, Math.round((projCap / demandVal) * 100)) : 100;

                          return (
                            <div
                              key={product.id}
                              className={cn(
                                "rounded-2xl border bg-(--ops-surface-raised) transition-all duration-200 shadow-xs overflow-hidden",
                                product.restock_urgency === 'critical'
                                  ? "border-rose-500/30 dark:border-rose-900/40"
                                  : product.restock_urgency === 'warning'
                                    ? "border-amber-500/30 dark:border-amber-900/40"
                                    : product.restock_urgency === 'safe'
                                      ? "border-emerald-500/20 dark:border-emerald-950/30"
                                      : "border-(--ops-border)"
                              )}
                            >
                              {/* Product Card Top Bar */}
                              <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                                
                                {/* Product Identity & Badges */}
                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="size-14 sm:size-16 rounded-xl object-cover border border-(--ops-border) shadow-xs shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="size-14 sm:size-16 rounded-xl bg-(--ops-surface-sunken) border border-(--ops-border) flex items-center justify-center text-lg font-black text-primary/70 shrink-0 uppercase italic">
                                      {product.name.slice(0, 2)}
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground truncate">
                                        {product.name}
                                      </h3>

                                      {/* Demand Badges */}
                                      {product.is_bestseller && (
                                        <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                                          <FiStar className="size-2.5 fill-current" />
                                          <span>Proven Bestseller</span>
                                        </Badge>
                                      )}

                                      {product.demand_priority === 'high' && !product.is_bestseller && (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                                          High Demand
                                        </Badge>
                                      )}

                                      {/* Urgency Badge */}
                                      {product.restock_urgency === 'critical' && (
                                        <Badge className="bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                                          Action Required
                                        </Badge>
                                      )}
                                      {product.restock_urgency === 'warning' && (
                                        <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/25 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                                          Low Coverage
                                        </Badge>
                                      )}
                                      {product.restock_urgency === 'safe' && (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                                          Well Stocked
                                        </Badge>
                                      )}
                                      {product.restock_urgency === 'recipe_missing' && (
                                        <Badge variant="outline" className="border-dashed text-[9px] font-bold uppercase text-(--ops-text-muted)">
                                          No Recipe
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-(--ops-text-muted)">
                                      <span className="font-semibold">{product.category_name}</span>
                                      {product.sku && (
                                        <>
                                          <span>•</span>
                                          <span className="font-mono text-[10px]">{product.sku}</span>
                                        </>
                                      )}
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-[11px] font-bold">
                                        Sales Trend: {trendIcon(product.sales_trend)}
                                        <span className="capitalize">{product.sales_trend}</span>
                                      </span>
                                    </div>

                                    {/* Primary Bottleneck Notice */}
                                    {product.has_recipe && product.bottleneck_ingredients.length > 0 && (
                                      <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 flex items-center gap-1">
                                          <FiAlertTriangle className="size-3" /> Limiting Ingredient:
                                        </span>
                                        <span className="font-extrabold text-foreground">
                                          {product.bottleneck_ingredients.join(', ')}
                                        </span>
                                        <span className="text-[10px] text-(--ops-text-muted)">
                                          (caps production at {product.current_producible_portions} portions)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Portion Feasibility & Uplift Metrics */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-(--ops-surface-sunken) p-3.5 rounded-xl border border-(--ops-border-subtle) shrink-0">
                                  <div className="text-center px-2">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-(--ops-text-muted)">30d Sales</p>
                                    <p className="text-sm font-black font-mono text-foreground mt-0.5">
                                      {product.historical_units_sold} <span className="text-[9px] font-normal text-(--ops-text-muted)">units</span>
                                    </p>
                                    <p className="text-[8px] text-(--ops-text-muted) font-semibold">{product.daily_sales_velocity}/day</p>
                                  </div>

                                  <div className="text-center px-2 border-l border-(--ops-border-subtle)">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-(--ops-text-muted)">{horizon}d Forecast</p>
                                    <p className="text-sm font-black font-mono text-foreground mt-0.5">
                                      {product.forecasted_demand} <span className="text-[9px] font-normal text-(--ops-text-muted)">portions</span>
                                    </p>
                                    <p className="text-[8px] text-(--ops-text-muted) font-semibold">Projected</p>
                                  </div>

                                  <div className="text-center px-2 border-l border-(--ops-border-subtle)">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-(--ops-text-muted)">Current Feasible</p>
                                    <p className={cn(
                                      "text-sm font-black font-mono mt-0.5",
                                      currentCap === 0 ? "text-rose-500" :
                                      currentCap < product.forecasted_demand ? "text-amber-500" : "text-emerald-500"
                                    )}>
                                      {product.has_recipe ? `${currentCap} portions` : 'N/A'}
                                    </p>
                                    <p className="text-[8px] text-(--ops-text-muted) font-semibold">
                                      {product.has_recipe ? `${coveragePct}% coverage` : 'Config needed'}
                                    </p>
                                  </div>

                                  <div className="text-center px-2 border-l border-(--ops-border-subtle)">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">After Restock</p>
                                    <p className="text-sm font-black font-mono text-emerald-500 mt-0.5">
                                      {product.has_recipe ? `${projCap} portions` : 'N/A'}
                                    </p>
                                    <p className="text-[8px] text-emerald-500/80 font-bold">
                                      {product.portions_gain > 0 ? `+${product.portions_gain} gain` : 'Sufficient'}
                                    </p>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                                  {product.has_recipe ? (
                                    <Button
                                      onClick={() => openProductRestock(product)}
                                      className={cn(
                                        "h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-wider gap-1.5 shadow-sm whitespace-nowrap",
                                        hasRestockNeed
                                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                          : "bg-(--ops-surface-sunken) hover:bg-(--ops-surface-sunken)/80 text-foreground border border-(--ops-border)"
                                      )}
                                    >
                                      <FiShoppingBag className="size-3.5" />
                                      <span>Review Restock</span>
                                    </Button>
                                  ) : (
                                    <Button
                                      asChild
                                      variant="outline"
                                      className="h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-wider gap-1.5 border-dashed"
                                    >
                                      <Link href="/products">
                                        <span>Define Recipe</span>
                                      </Link>
                                    </Button>
                                  )}

                                  {product.has_recipe && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => toggleProductExpand(product.id)}
                                      className="h-8 px-2.5 rounded-lg text-[10px] font-bold text-(--ops-text-muted) hover:text-foreground gap-1"
                                    >
                                      <span>{isExpanded ? 'Hide Recipe' : `Recipe (${product.recipe_ingredients.length})`}</span>
                                      {isExpanded ? <FiChevronUp className="size-3" /> : <FiChevronDown className="size-3" />}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Capacity Bar Visualizer */}
                              {product.has_recipe && (
                                <div className="px-5 sm:px-6 pb-4">
                                  <div className="flex items-center justify-between text-[10px] font-bold mb-1 text-(--ops-text-muted)">
                                    <span>Portion Capacity vs {horizon}-Day Projected Demand</span>
                                    <span className="font-mono">
                                      Currently {currentCap} of {product.forecasted_demand} portions ({coveragePct}%)
                                      {product.portions_gain > 0 && ` → Restock enables ${projCap} portions (${projCoveragePct}%)`}
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-(--ops-surface-sunken) rounded-full overflow-hidden flex border border-(--ops-border-subtle)">
                                    <div
                                      style={{ width: `${Math.min(100, coveragePct)}%` }}
                                      className={cn(
                                        "h-full transition-all duration-300",
                                        currentCap === 0 ? "bg-rose-500" :
                                        coveragePct < 50 ? "bg-rose-500" :
                                        coveragePct < 100 ? "bg-amber-500" : "bg-emerald-500"
                                      )}
                                    />
                                    {product.portions_gain > 0 && (
                                      <div
                                        style={{ width: `${Math.min(100 - Math.min(100, coveragePct), Math.max(0, projCoveragePct - coveragePct))}%` }}
                                        className="h-full bg-emerald-500/40 border-l border-emerald-500"
                                        title={`+${product.portions_gain} unlockable portions`}
                                      />
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Explanatory Rationale Box */}
                              <div className="px-5 sm:px-6 pb-4">
                                <div className="p-3 rounded-xl bg-(--ops-surface-sunken)/70 border border-(--ops-border-subtle) text-xs flex items-start gap-2.5">
                                  <FiZap className="size-4 text-primary shrink-0 mt-0.5" />
                                  <p className="text-[11px] leading-relaxed font-semibold text-(--ops-text-secondary)">
                                    {product.explanation}
                                  </p>
                                </div>
                              </div>

                              {/* Expandable Recipe Ingredients Table */}
                              {isExpanded && product.has_recipe && (
                                <div className="border-t border-(--ops-border) bg-(--ops-surface-sunken)/50 p-5 sm:p-6 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                                      <FiLayers className="size-3.5 text-primary" />
                                      <span>Configured Recipe Breakdown ({product.recipe_ingredients.length} Ingredients)</span>
                                    </h4>
                                    <p className="text-[10px] text-(--ops-text-muted) italic">
                                      * Usable stock reflects eligible FEFO/FIFO batches. Expired/restricted stock is strictly excluded.
                                    </p>
                                  </div>

                                  <div className="border border-(--ops-border) rounded-xl overflow-hidden bg-(--ops-surface-raised)">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border) text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted)">
                                        <tr>
                                          <th className="px-4 py-2.5">Ingredient Material</th>
                                          <th className="px-4 py-2.5">Per Serving</th>
                                          <th className="px-4 py-2.5">Eligible Branch Stock</th>
                                          <th className="px-4 py-2.5">Portions Supported</th>
                                          <th className="px-4 py-2.5">Branch Suggested Restock</th>
                                          <th className="px-4 py-2.5">Projected Capacity</th>
                                          <th className="px-4 py-2.5 text-right">Batch Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-(--ops-border-subtle) font-medium">
                                        {product.recipe_ingredients.map((ing) => (
                                          <tr
                                            key={ing.ingredient_id}
                                            className={cn(
                                              "hover:bg-(--ops-surface-sunken)/40 transition-colors",
                                              ing.is_bottleneck && "bg-rose-500/5 font-semibold"
                                            )}
                                          >
                                            <td className="px-4 py-2.5">
                                              <div className="flex items-center gap-2">
                                                <span className="font-bold text-foreground">{ing.name}</span>
                                                {ing.is_bottleneck && (
                                                  <Badge className="bg-rose-500/15 text-rose-500 border-none font-black text-[8px] uppercase px-1 py-0">
                                                    Bottleneck
                                                  </Badge>
                                                )}
                                                {ing.is_shared && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-[8px] px-1.5 py-0 border-blue-500/30 text-blue-500 bg-blue-500/5 cursor-help"
                                                    title={`Shared across ${ing.shared_with_products_count} products: ${ing.shared_product_names.join(', ')}. Consolidated at branch level.`}
                                                  >
                                                    <FiShare2 className="size-2 mr-0.5 inline" />
                                                    Shared ({ing.shared_with_products_count})
                                                  </Badge>
                                                )}
                                              </div>
                                              {ing.is_shared && ing.shared_product_names.length > 0 && (
                                                <p className="text-[9px] text-(--ops-text-muted) truncate max-w-xs mt-0.5">
                                                  Pooled with {ing.shared_product_names.join(', ')}
                                                </p>
                                              )}
                                            </td>

                                            <td className="px-4 py-2.5 font-mono text-foreground">
                                              {ing.recipe_quantity} {ing.recipe_unit}
                                            </td>

                                            <td className="px-4 py-2.5 font-mono">
                                              <span className={cn(
                                                "font-bold",
                                                ing.usable_stock <= 0 ? "text-rose-500" : "text-foreground"
                                              )}>
                                                {ing.usable_stock} {ing.base_unit}
                                              </span>
                                              {ing.ineligible_stock > 0 && (
                                                <span className="text-[9px] text-rose-500 block">
                                                  ({ing.ineligible_stock} {ing.base_unit} expired/quarantined)
                                                </span>
                                              )}
                                            </td>

                                            <td className="px-4 py-2.5 font-mono">
                                              <span className={cn(
                                                "font-bold px-1.5 py-0.5 rounded",
                                                ing.is_bottleneck ? "bg-rose-500/15 text-rose-500" : "text-foreground"
                                              )}>
                                                {ing.portions_supported} portions
                                              </span>
                                            </td>

                                            <td className="px-4 py-2.5 font-mono">
                                              {ing.suggested_restock > 0 ? (
                                                <span className="text-emerald-500 font-bold">
                                                  +{ing.suggested_restock} {ing.base_unit}
                                                  {ing.is_shared && (
                                                    <span className="text-[8px] text-(--ops-text-muted) block font-sans">
                                                      (Total branch pool need)
                                                    </span>
                                                  )}
                                                </span>
                                              ) : (
                                                <span className="text-(--ops-text-muted)">0 {ing.base_unit} (Sufficient)</span>
                                              )}
                                            </td>

                                            <td className="px-4 py-2.5 font-mono text-emerald-500 font-bold">
                                              {ing.projected_portions_supported} portions
                                            </td>

                                            <td className="px-4 py-2.5 text-right">
                                              <Badge className={cn(
                                                "text-[8px] font-black uppercase px-1.5 py-0",
                                                ing.status === 'Out of Stock' ? "bg-rose-500 text-white" :
                                                ing.status === 'Critical' ? "bg-rose-500/15 text-rose-500 border border-rose-500/20" :
                                                ing.status === 'Warning' ? "bg-amber-500/15 text-amber-500 border border-amber-500/20" :
                                                "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
                                              )}>
                                                {ing.status}
                                              </Badge>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════════ */}
                {/* VIEW 2: INGREDIENT INVENTORY BREAKDOWN (SECONDARY VIEW)         */}
                {/* ════════════════════════════════════════════════════════════════ */}
                {viewMode === 'ingredients' && (
                  <div className="space-y-6">
                    {/* ADAPTIVE INGREDIENT TABLE */}
                    <div className="border border-(--ops-border) rounded-[14px] bg-(--ops-surface-sunken) shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-auto text-(--ops-text-secondary)">
                          <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary) select-none">
                            <tr>
                              <th className="px-5 py-3.5">Ingredient</th>
                              <th className="px-5 py-3.5">Eligible Stock / Coverage</th>
                              <th className="px-5 py-3.5">Forecast Usage</th>
                              <th className="px-5 py-3.5">Buffer & Target</th>
                              <th className="px-5 py-3.5">Prescribed Restock</th>
                              <th className="px-5 py-3.5">Est. Cost</th>
                              <th className="px-5 py-3.5">Status</th>
                              <th className="px-5 py-3.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-(--ops-border)">
                            {filteredIngredients.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-12 text-center text-(--ops-text-muted)">
                                  <FiCheckCircle className="size-8 mx-auto mb-2 text-emerald-500/50" />
                                  <p className="text-xs font-bold uppercase tracking-wider">No Ingredients Found</p>
                                </td>
                              </tr>
                            ) : (
                              filteredIngredients.map((item) => {
                                const cfg = urgencyConfig[item.status] || urgencyConfig['Safe'];
                                return (
                                  <tr key={item.ingredient_id} className={cn("hover:bg-(--ops-surface-raised) transition-colors", cfg.rowCls)}>
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-center gap-2">
                                        <span className={cn("size-2 rounded-full shrink-0", cfg.dotCls)} />
                                        <div>
                                          <p className="font-extrabold text-foreground text-xs">{item.name}</p>
                                          <p className="text-[10px] text-(--ops-text-muted) font-mono">ID #{item.ingredient_id}</p>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="px-5 py-3.5 font-mono text-xs">
                                      <span className="font-bold text-foreground">{item.current_stock} {item.unit}</span>
                                      <span className="text-[10px] text-(--ops-text-muted) block">
                                        {item.days_of_stock >= 365 ? '365+ days' : `${item.days_of_stock} days coverage`}
                                      </span>
                                    </td>

                                    <td className="px-5 py-3.5 font-mono text-xs">
                                      <span className="text-foreground">{item.predicted_usage} {item.unit}</span>
                                      <span className="text-[10px] text-(--ops-text-muted) flex items-center gap-1">
                                        Trend: {trendIcon(item.trend)}
                                        <span className="capitalize">{item.trend}</span>
                                      </span>
                                    </td>

                                    <td className="px-5 py-3.5 font-mono text-xs">
                                      <span className="text-foreground">+{item.safety_stock} {item.unit}</span>
                                      <span className="text-[10px] text-(--ops-text-muted) block">
                                        Target: {item.required_with_buffer} {item.unit}
                                      </span>
                                    </td>

                                    <td className="px-5 py-3.5 font-mono text-xs">
                                      <span className={cn(
                                        "font-black px-2 py-0.5 rounded-md",
                                        item.suggested_restock > 0 ? "bg-amber-500/10 text-amber-500" : "text-(--ops-text-muted)"
                                      )}>
                                        {item.suggested_restock > 0 ? `+${item.suggested_restock} ${item.unit}` : '0 units'}
                                      </span>
                                    </td>

                                    <td className="px-5 py-3.5 font-mono text-xs text-foreground font-bold">
                                      {fmt(item.estimated_cost)}
                                    </td>

                                    <td className="px-5 py-3.5">
                                      <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-[6px] border", cfg.badgeCls)}>
                                        {item.status}
                                      </Badge>
                                    </td>

                                    <td className="px-5 py-3.5 text-right">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setMassPrefilledItems({
                                            [item.ingredient_id]: {
                                              quantity: String(item.suggested_restock),
                                              unit: item.unit,
                                            },
                                          });
                                          setMassRestockModalOpen(true);
                                        }}
                                        className="h-7.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
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
                        <p className="text-[9px] font-bold text-(--ops-text-muted) uppercase tracking-tight mt-1 italic">
                          High-impact restocking decisions to maximize menu item availability
                        </p>
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
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTTOM ROW: INSIGHTS & INSTRUCTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">

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
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3.5 rounded-lg bg-(--ops-surface-sunken)/50 border border-(--ops-border-subtle) hover:bg-(--ops-surface-sunken) transition-colors"
                        >
                          <div className="size-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                          <p className="text-[10px] font-bold text-(--ops-text-secondary) leading-relaxed italic">{insight}</p>
                        </div>
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
                        <FiBarChart2 className="text-emerald-500" /> Prescriptive Mechanics
                      </CardTitle>
                      <CardDescription className="text-[9px] font-bold uppercase tracking-wider text-(--ops-text-muted) mt-1 italic">
                        Recipe-driven prescriptive engine logic
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3.5 text-[10px] text-(--ops-text-secondary) font-bold uppercase tracking-wide leading-relaxed">
                      <div className="flex items-start gap-2.5">
                        <span className="size-5 rounded-md bg-(--ops-surface-sunken) border border-(--ops-border) flex items-center justify-center text-[9px] text-primary shrink-0">1</span>
                        <p><strong>Recipe Portion Feasibility</strong>: computes producible portions as minimum floor(eligible_stock / recipe_qty) across mandatory ingredients.</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="size-5 rounded-md bg-(--ops-surface-sunken) border border-(--ops-border) flex items-center justify-center text-[9px] text-primary shrink-0">2</span>
                        <p><strong>Limiting Bottleneck Detection</strong>: isolates specific ingredients constraining portion preparation before restock.</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="size-5 rounded-md bg-(--ops-surface-sunken) border border-(--ops-border) flex items-center justify-center text-[9px] text-primary shrink-0">3</span>
                        <p><strong>Consolidated Shared Inventory</strong>: shared raw materials (e.g. rice, seaweed) are pooled at branch level to prevent duplicate restock counts.</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="size-5 rounded-md bg-(--ops-surface-sunken) border border-(--ops-border) flex items-center justify-center text-[9px] text-primary shrink-0">4</span>
                        <p><strong>Batch & FEFO Exclusion</strong>: expired, quarantined, recalled, or damaged batches are excluded from eligible usable stock.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Product-Specific Ingredient Restock Modal */}
      <ProductIngredientRestockModal
        open={productRestockModalOpen}
        onOpenChange={setProductRestockModalOpen}
        product={selectedProductForRestock ? {
          id: selectedProductForRestock.id,
          name: selectedProductForRestock.name,
          sku: selectedProductForRestock.sku || undefined,
          image_url: selectedProductForRestock.image_url || undefined,
        } : null}
        branches={branches || []}
        currentBranchId={branchId}
        isAdmin={isAdmin}
        initialSuggestedQuantities={selectedProductForRestock?.suggested_restock_quantities}
      />

      {/* Mass Restock Modal (For Ingredient breakdown table) */}
      <MassRestockModal 
        open={massRestockModalOpen}
        onOpenChange={setMassRestockModalOpen}
        branchName={currentBranchName}
        branchId={Number(branchId)}
        inventory={(inventory as unknown as React.ComponentProps<typeof MassRestockModal>['inventory']) || []}
        initialQuantities={massPrefilledItems}
      />
    </AppLayout>
  );
}
