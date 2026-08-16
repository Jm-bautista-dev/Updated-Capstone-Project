import { motion } from 'framer-motion';
import { PackageCheck, Scale, Search, SlidersHorizontal } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

export interface IngredientCostTrendItem {
    id: number;
    name: string;
    unit: string;
    base_unit: string;
    cost_per_unit: number;
    cost_per_base_unit: number;
    stock: number;
}

interface IngredientCostTrendCardProps {
    ingredientCostTrends?: IngredientCostTrendItem[];
    activeBranchName?: string;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

export function IngredientCostTrendCard({
    ingredientCostTrends = [],
    activeBranchName = 'All Branches',
}: IngredientCostTrendCardProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredIngredients = useMemo(() => {
        if (!searchQuery) return ingredientCostTrends;
        return ingredientCostTrends.filter(i =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [ingredientCostTrends, searchQuery]);

    const activeIngredient = useMemo(() => {
        if (!ingredientCostTrends.length) return null;
        if (selectedId) {
            const found = ingredientCostTrends.find(i => i.id === selectedId);
            if (found) return found;
        }
        return ingredientCostTrends[0];
    }, [ingredientCostTrends, selectedId]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                            <Scale className="size-4" />
                        </div>
                        <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                            Ingredient Unit Cost Analytics
                        </h2>
                    </div>
                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                        Authoritative ingredient unit cost and inventory level monitoring ({activeBranchName}).
                    </p>
                </div>

                {/* Ingredient Selector Dropdown */}
                {ingredientCostTrends.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={activeIngredient?.id ?? ''}
                                onChange={(e) => setSelectedId(Number(e.target.value))}
                                className="h-10 pl-3 pr-8 rounded-2xl bg-white dark:bg-[#1C1C28] border border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC] shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer appearance-none"
                            >
                                {ingredientCostTrends.map((ing) => (
                                    <option key={ing.id} value={ing.id}>
                                        {ing.name} ({ing.unit})
                                    </option>
                                ))}
                            </select>
                            <SlidersHorizontal className="size-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>

            {activeIngredient ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Active Ingredient Unit Cost Card */}
                    <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                Current Unit Cost
                            </span>
                            <Badge variant="outline" className="text-[9px] font-bold border-amber-500/30 text-amber-700 dark:text-amber-300">
                                Per {activeIngredient.unit}
                            </Badge>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black font-mono text-amber-900 dark:text-amber-200">
                                {formatCurrency(activeIngredient.cost_per_unit)}
                            </h3>
                            <p className="text-[11px] text-amber-700/80 dark:text-amber-400 font-medium mt-0.5">
                                Base: {formatCurrency(activeIngredient.cost_per_base_unit)} / {activeIngredient.base_unit}
                            </p>
                        </div>
                        <div className="pt-2 border-t border-amber-500/15 flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
                            <span>Ingredient:</span>
                            <span className="font-bold">{activeIngredient.name}</span>
                        </div>
                    </div>

                    {/* Stock Level Card */}
                    <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                Available Stock
                            </span>
                            <PackageCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200">
                                {activeIngredient.stock} <span className="text-sm font-sans font-bold">{activeIngredient.unit}</span>
                            </h3>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-medium mt-0.5">
                                {activeBranchName} current balance
                            </p>
                        </div>
                        <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                            <span>Stock Status:</span>
                            <span className="font-bold">{activeIngredient.stock > 0 ? 'In Stock' : 'Low Stock'}</span>
                        </div>
                    </div>

                    {/* Ingredient Quick Selector Grid */}
                    <div className="p-4 rounded-3xl bg-white/60 dark:bg-[#1C1C28]/60 border border-[#F8C8DC]/40 dark:border-white/10 space-y-2">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <Search className="size-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search ingredient..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-xs bg-transparent border-none outline-none font-medium placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filteredIngredients.map((ing) => {
                                const isSelected = ing.id === activeIngredient.id;
                                return (
                                    <button
                                        key={ing.id}
                                        onClick={() => setSelectedId(ing.id)}
                                        className={`w-full text-left p-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                            isSelected
                                                ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/30'
                                                : 'hover:bg-muted/40 text-foreground'
                                        }`}
                                    >
                                        <span className="truncate max-w-27.5">{ing.name}</span>
                                        <span className="font-mono text-[11px] shrink-0">
                                            {formatCurrency(ing.cost_per_unit)}/{ing.unit}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-32 flex items-center justify-center text-xs text-muted-foreground italic">
                    No ingredient cost data found for {activeBranchName}.
                </div>
            )}
        </motion.div>
    );
}
