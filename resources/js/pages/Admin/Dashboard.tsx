import { Head, router } from '@inertiajs/react';
import { 
    DollarSign, 
    TrendingUp, 
    ShoppingBag, 
    AlertTriangle,
    Receipt
} from 'lucide-react';
import { useState } from 'react';

import { AlertsCard } from '@/components/dashboard/AlertsCard';
import { 
    TrajectoryChart, 
    ProductDemandChart, 
    PaymentMixChart 
} from '@/components/dashboard/AnalyticsCard';
import { BranchPerformanceTable } from '@/components/dashboard/BranchPerformanceTable';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { ForecastIntelCard } from '@/components/dashboard/ForecastIntelCard';
import { IngredientCostTrendCard, type IngredientCostTrendItem } from '@/components/dashboard/IngredientCostTrendCard';
import { KPICard } from '@/components/dashboard/KPICard';
import { PrescriptiveActionsCard } from '@/components/dashboard/PrescriptiveActionsCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TopProductCostsChart, type TopProductCostItem } from '@/components/dashboard/TopProductCostsChart';
import AppLayout from '@/layouts/app-layout';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface BranchStat {
    id: number | string;
    name: string;
    orders_today: number;
    revenue_today: number;
    total_profit: number;
}

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

interface ForecastIntel {
    recommended_model: string;
    confidence: string;
    accuracy_pct: number;
    explanation: string;
}

interface Suggestion {
    name: string;
    status: string;
    citation: string;
    suggested_restock: number;
    unit: string;
    depletion_date: string;
}

interface AlertItem {
    description: string;
    action: string;
    severity?: string;
}

interface ActivityItem {
    timestamp: string;
    action: string;
    user: string;
    status?: string;
}

interface BranchItem {
    id: number;
    name: string;
}

interface DashboardProps {
    stats: {
        total_revenue: number;
        total_expenses: number;
        total_profit: number;
        total_orders: number;
        low_stock_items: number;
    };
    branchStats?: BranchStat[];
    salesOverTime?: SalesOverTimeItem[];
    salesPerProduct?: SalesPerProductItem[];
    topProductCosts?: TopProductCostItem[];
    salesByPaymentMethod?: PaymentMethodItem[];
    ingredientCostTrends?: IngredientCostTrendItem[];
    range: number;
    branches?: BranchItem[];
    filters?: { branch_id?: string; range?: number };
    recentActivity?: ActivityItem[];
    forecastIntel?: ForecastIntel;
    suggestions?: Suggestion[];
    alerts?: AlertItem[];
}

export default function Dashboard({
    stats,
    branchStats,
    salesOverTime,
    salesPerProduct,
    topProductCosts = [],
    salesByPaymentMethod,
    ingredientCostTrends = [],
    range,
    branches = [],
    filters = {},
    recentActivity = [],
    forecastIntel = { recommended_model: 'SES Model', confidence: 'High', accuracy_pct: 88.5, explanation: '' },
    suggestions = [],
    alerts = []
}: DashboardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
    const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || 'all');

    const navigateDashboard = (params: Record<string, string>) => {
        setIsLoading(true);
        router.get('/dashboard', params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setIsLoading(false);
                setLastSync(new Date().toLocaleTimeString());
            }
        });
    };

    const handleRangeChange = (value: string) => {
        navigateDashboard({ range: value, branch_id: selectedBranch });
    };

    const handleBranchChange = (value: string) => {
        setSelectedBranch(value);
        navigateDashboard({ range: range.toString(), branch_id: value });
    };

    const activeBranchName = selectedBranch === 'all' 
        ? 'All Branches' 
        : (branches.find(b => String(b.id) === String(selectedBranch))?.name || 'Selected Branch');

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Executive Operations Command" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                
                {/* ── ZONE 1: LUXURY HERO SECTION ── */}
                <DashboardHero 
                    range={range}
                    isLoading={isLoading}
                    lastSync={lastSync}
                    onRangeChange={handleRangeChange}
                    branches={branches}
                    selectedBranch={selectedBranch}
                    onBranchChange={handleBranchChange}
                />

                {/* ── ZONE 2: EXECUTIVE KPI SUMMARY GRID ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <KPICard 
                        title="Aggregated Revenue"
                        value={formatCurrency(stats.total_revenue)}
                        icon={DollarSign}
                        trend="up"
                        trendValue="+14.2%"
                        comparison="Accumulated checkouts"
                        loading={isLoading}
                        sparklineData={salesOverTime?.map((s) => ({ value: s.revenue }))}
                        index={0}
                    />
                    <KPICard 
                        title="Operating Expenses"
                        value={formatCurrency(stats.total_expenses)}
                        icon={Receipt}
                        trend="down"
                        trendValue="COGS"
                        comparison="Cost of goods sold"
                        loading={isLoading}
                        sparklineData={salesOverTime?.map((s) => ({ value: Math.max(0, s.revenue - s.profit) }))}
                        index={1}
                    />
                    <KPICard 
                        title="Net Profit"
                        value={formatCurrency(stats.total_profit)}
                        icon={TrendingUp}
                        trend="up"
                        trendValue="Margin"
                        comparison="Revenue minus expenses"
                        loading={isLoading}
                        sparklineData={salesOverTime?.map((s) => ({ value: s.profit }))}
                        index={2}
                    />
                    <KPICard 
                        title="Volume Traffic"
                        value={stats.total_orders.toLocaleString()}
                        icon={ShoppingBag}
                        trend="down"
                        trendValue="-1.8%"
                        comparison="Total order checkouts"
                        loading={isLoading}
                        sparklineData={salesOverTime?.map((s) => ({ value: s.revenue * 0.1 }))}
                        index={3}
                    />
                    <KPICard 
                        title="Safety Stock Alert"
                        value={stats.low_stock_items}
                        icon={AlertTriangle}
                        trend={stats.low_stock_items > 5 ? 'down' : 'up'}
                        trendValue={stats.low_stock_items > 5 ? 'Risk' : 'Optimal'}
                        comparison="Low stock thresholds"
                        loading={isLoading}
                        badgeText={stats.low_stock_items > 0 ? `${stats.low_stock_items} Alert` : 'Clear'}
                        index={4}
                    />
                </div>

                {/* ── ZONE 3: QUICK OPERATIONS FLOATING ACTION CARDS ── */}
                <QuickActionCard />

                {/* ── ZONE 4: ASYMMETRICAL ANALYTICS & INTELLIGENCE GRID ── */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* Left 8 Columns (Main Trajectory & Branch Tables) */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Operational Revenue/Profit Trajectory */}
                        <TrajectoryChart salesOverTime={salesOverTime} />

                        {/* Top Product Costs Horizontal Bar Chart */}
                        <TopProductCostsChart 
                            topProductCosts={topProductCosts}
                            activeBranchName={activeBranchName}
                        />

                        {/* Ingredient Unit Cost Analytics Card */}
                        <IngredientCostTrendCard 
                            ingredientCostTrends={ingredientCostTrends}
                            activeBranchName={activeBranchName}
                        />

                        {/* Top Products & Payment Channel Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProductDemandChart salesPerProduct={salesPerProduct} />
                            <PaymentMixChart salesByPaymentMethod={salesByPaymentMethod} />
                        </div>

                        {/* Multi-Branch Live Performance Table */}
                        <BranchPerformanceTable branchStats={branchStats} />
                    </div>

                    {/* Right 4 Columns (Forecast Projections, Recommendations, Alerts, Logs) */}
                    <div className="xl:col-span-4 space-y-8">
                        {/* Forecast Projections Intelligence */}
                        <ForecastIntelCard forecastIntel={forecastIntel} />

                        {/* Prescriptive Inventory Actions */}
                        <PrescriptiveActionsCard suggestions={suggestions} />

                        {/* Actionable Alerts Log */}
                        <AlertsCard alerts={alerts} />

                        {/* Recent Audited Activity Timeline */}
                        <RecentActivity recentActivity={recentActivity} />
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
