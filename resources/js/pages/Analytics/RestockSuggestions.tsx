import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    FiBox,
    FiShoppingCart,
    FiAlertCircle,
    FiTrendingUp,
    FiFilter,
    FiCheckCircle,
    FiArrowRight,
    FiPlusCircle,
    FiBarChart2,
    FiInfo,
    FiAlertTriangle,
    FiShield
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

type Suggestion = {
    ingredient_id: number;
    name: string;
    unit: string;
    current_stock: number;
    predicted_usage: number;
    suggested_restock: number;
    estimated_cost: number;
    status: 'Safe' | 'Warning' | 'Critical' | 'Out of Stock';
};

export default function RestockSuggestions() {
    const { suggestions, branches, tomorrow_forecast, filters, error } = usePage().props as any;
    const [branchId, setBranchId] = useState(String(filters.branch_id || ''));

    const handleFilterChange = (key: string, value: string) => {
        router.get('/analytics/restock-suggestions', { [key]: value }, {
            preserveState: true,
            replace: true,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    const stats = useMemo(() => {
        const totalToRestock = suggestions?.length || 0;
        const totalEstimatedCost = suggestions?.reduce((sum: number, s: Suggestion) => sum + s.estimated_cost, 0) || 0;
        const criticalItems = suggestions?.filter((s: Suggestion) => s.status === 'Critical' || s.status === 'Out of Stock').length || 0;

        return { totalToRestock, totalEstimatedCost, criticalItems };
    }, [suggestions]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Analytics', href: '#' }, { title: 'Restock Suggestions', href: '#' }]}>
            <Head title="Prescriptive Restock Suggestions" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background dark:bg-zinc-950">
                {/* Header Section */}
                <div className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-foreground dark:text-white">
                            <FiBox className="text-emerald-500 dark:text-emerald-400" />
                            Prescriptive Restock AI
                        </h1>
                        <p className="text-sm text-muted-foreground dark:text-zinc-500 font-medium mt-1">
                            Algorithmically generated restocking plans based on forecasted demand.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-emerald-50/50 dark:bg-emerald-500/10 rounded-xl p-1 gap-1 border border-emerald-100 dark:border-emerald-500/20">
                            <FiFilter className="text-emerald-600 dark:text-emerald-400 ml-2 size-4" />
                            <Select value={branchId} onValueChange={(val) => { setBranchId(val); handleFilterChange('branch_id', val); }}>
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

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {error && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive dark:text-red-400 rounded-2xl">
                            <FiAlertTriangle className="size-5" />
                            <AlertTitle className="font-black uppercase tracking-widest text-[10px] mb-1">Intelligence Gap</AlertTitle>
                            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                        </Alert>
                    )}

                    {!error && (
                        <>
                            {/* Info Alert */}
                            <Alert className="bg-primary/5 dark:bg-primary/20 border-primary/20 dark:border-primary/30 text-primary dark:text-primary-foreground rounded-2xl mb-2">
                                <FiInfo className="size-5 text-primary dark:text-white" />
                                <AlertTitle className="font-black uppercase tracking-widest text-[10px] mb-1">AI Context</AlertTitle>
                                <AlertDescription className="text-xs font-semibold">
                                    Predictions are optimized for tomorrow's forecasted sales of <strong>{Math.round(tomorrow_forecast)} units</strong> across all branch-specific recipes.
                                    A <strong>10% safety buffer</strong> has been applied to all suggestions.
                                </AlertDescription>
                            </Alert>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="size-11 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                                                <FiShoppingCart className="text-orange-600 dark:text-orange-500 size-5" />
                                            </div>
                                            <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-500 border-none font-black text-[9px] uppercase tracking-tighter">Action Required</Badge>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-zinc-500 tracking-widest">Ingredients to Restock</p>
                                            <h3 className="text-3xl font-black text-foreground dark:text-white">{stats.totalToRestock} <span className="text-sm font-bold text-muted-foreground">items</span></h3>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="size-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                                <FiTrendingUp className="text-emerald-600 dark:text-emerald-500 size-5" />
                                            </div>
                                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-none font-black text-[9px] uppercase tracking-tighter">Est. Investment</Badge>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-zinc-500 tracking-widest">Estimated Cost</p>
                                            <h3 className="text-3xl font-black text-foreground dark:text-white">{formatCurrency(stats.totalEstimatedCost)}</h3>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="size-11 rounded-2xl bg-destructive/10 flex items-center justify-center">
                                                <FiAlertCircle className="text-destructive dark:text-red-500 size-5" />
                                            </div>
                                            <Badge className="bg-destructive/10 text-destructive dark:text-red-500 border-none font-black text-[9px] uppercase tracking-tighter">System Health</Badge>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-zinc-500 tracking-widest">Critical Shortages</p>
                                            <h3 className="text-3xl font-black text-destructive dark:text-red-500">{stats.criticalItems} <span className="text-sm font-bold text-destructive/50">items</span></h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Suggestions Table */}
                            <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50 overflow-hidden">
                                <CardHeader className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 px-8 py-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground dark:text-white">
                                            <FiArrowRight className="text-emerald-600 dark:text-emerald-400" />
                                            Restructuring Recommendation Grid
                                        </CardTitle>
                                        <Button variant="outline" size="sm" className="h-9 rounded-xl border-border dark:border-zinc-800 font-bold text-[10px] uppercase tracking-widest bg-background dark:bg-zinc-950 dark:hover:bg-zinc-900 text-foreground dark:text-zinc-300">
                                            Export Purchase List
                                        </Button>
                                    </div>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/30 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                                            <tr>
                                                <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500">Ingredient / Metric</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500">Current Stock</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500 text-center">Predicted Consumption</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500 text-right">Suggested Restock</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500 text-right">Est. Cost</th>
                                                <th className="px-8 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground dark:text-zinc-500 text-right">Urgency</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border dark:divide-zinc-800 bg-card dark:bg-zinc-900/50">
                                            {suggestions.map((s: Suggestion, i: number) => (
                                                <motion.tr
                                                    key={s.ingredient_id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="group hover:bg-slate-50/80 transition-colors"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-xl bg-muted dark:bg-zinc-800 flex items-center justify-center font-black text-muted-foreground dark:text-zinc-500 text-xs text-foreground dark:text-zinc-300">
                                                                {s.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-foreground dark:text-white leading-tight">{s.name}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest mt-0.5">ID: #ING-00{s.ingredient_id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                       <div className="space-y-1">
                                                            <span className="font-mono font-black text-foreground dark:text-zinc-300">{s.current_stock} {s.unit}</span>
                                                            <div className="w-20 bg-muted dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all",
                                                                        s.status === 'Safe' ? "bg-emerald-500" : s.status === 'Warning' ? "bg-amber-400" : "bg-rose-500"
                                                                    )}
                                                                    style={{ width: `${Math.min(100, (s.current_stock / (s.predicted_usage || 1)) * 100)}%` }}
                                                                />
                                                            </div>
                                                       </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <Badge variant="outline" className="font-black text-[10px] border-border dark:border-zinc-800 bg-background dark:bg-zinc-900 shadow-sm text-foreground dark:text-zinc-300">
                                                            {s.predicted_usage} {s.unit}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-black text-primary dark:text-primary-foreground">
                                                       <div className="flex items-center justify-end gap-1.5">
                                                            <FiPlusCircle className="size-3" />
                                                            {s.suggested_restock} {s.unit}
                                                       </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-black text-foreground dark:text-zinc-100 tabular-nums">
                                                        {formatCurrency(s.estimated_cost)}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <Badge className={cn(
                                                            "font-black text-[9px] uppercase tracking-widest rounded-lg px-2 py-1",
                                                            s.status === 'Safe' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                                            s.status === 'Warning' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                                            "bg-destructive/10 text-destructive"
                                                        )}>
                                                            {s.status}
                                                        </Badge>
                                                    </td>
                                                </motion.tr>
                                            ))}

                                            {suggestions.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                                            <FiCheckCircle className="size-12 text-emerald-600" />
                                                            <p className="text-sm font-black uppercase tracking-widest">Inventory Fully Optimized</p>
                                                            <p className="text-xs font-bold">Current stock meets all forecasted demand benchmarks.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* Additional Intelligence Panel */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="border-none shadow-sm ring-1 ring-border dark:ring-zinc-800 bg-card dark:bg-zinc-900/50">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground dark:text-white">
                                            <FiShield className="text-primary dark:text-primary-foreground" />
                                            Risk Mitigation Protocol
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-xs text-muted-foreground dark:text-zinc-500 leading-relaxed font-medium">
                                            The system has identified <strong>{stats.criticalItems} critical shortages</strong> that may lead to order fulfillment failures tomorrow. 
                                            We recommend immediate restocking of these items to maintain a 100% service level.
                                        </p>
                                        <div className="flex gap-2">
                                            <Button className="flex-1 bg-zinc-900 dark:bg-primary hover:bg-black dark:hover:bg-primary/90 h-11 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white">
                                                Create Purchase Draft
                                            </Button>
                                            <Button variant="outline" className="flex-1 border-border dark:border-zinc-800 h-11 rounded-2xl font-black uppercase text-[10px] tracking-widest text-foreground dark:text-zinc-400">
                                                Audit Stock Logs
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none">
                                    <CardContent className="p-8 space-y-4">
                                        <FiBarChart2 className="size-10 text-emerald-300" />
                                        <h4 className="text-xl font-black tracking-tight">Prescriptive accuracy</h4>
                                        <p className="text-xs text-emerald-100/80 leading-relaxed font-medium">
                                            Suggestions are weighted against recipe-accurate consumption rates and historical linear trends. 
                                            This helps reduce ingredient waste and capital locking in stagnant inventory.
                                        </p>
                                        <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                                            <Badge className="bg-white/20 text-white border-none">Decision Support Mode</Badge>
                                            <span>Manual verification recommended</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
