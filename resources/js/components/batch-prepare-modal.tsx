import axios from 'axios';
import { ChefHat, AlertCircle, CheckCircle2, Loader2, Sparkles, Package } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import type { InventoryRow } from '@/components/inventory/InventoryHero';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Branch = { id: number; name: string };

interface SubrecipeItemRow {
    id?: number;
    component_ingredient_id: number;
    component_name: string;
    component_unit: string;
    quantity: number;
    unit: string;
    unit_cost?: number;
}

interface BatchPrepareModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ingredient: InventoryRow | null;
    branches: Branch[];
    currentBranchId?: number | string;
    allIngredients: InventoryRow[];
    onSuccess?: () => void;
}

export function BatchPrepareModal({
    open,
    onOpenChange,
    ingredient,
    branches,
    currentBranchId,
    allIngredients,
    onSuccess,
}: BatchPrepareModalProps) {
    const [batchQty, setBatchQty] = useState('10');
    const [selectedBranchId, setSelectedBranchId] = useState<number>(
        Number(currentBranchId || branches[0]?.id || 1)
    );
    const [subrecipe, setSubrecipe] = useState<SubrecipeItemRow[]>([]);
    const [loadingSubrecipe, setLoadingSubrecipe] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Sync selected branch when modal opens or props change
    useEffect(() => {
        if (ingredient?.branch_id) {
            setSelectedBranchId(ingredient.branch_id);
        } else if (currentBranchId && currentBranchId !== 'all') {
            setSelectedBranchId(Number(currentBranchId));
        } else if (branches.length > 0) {
            setSelectedBranchId(branches[0].id);
        }
    }, [ingredient, currentBranchId, branches, open]);

    // Load subrecipe for the composite ingredient
    useEffect(() => {
        if (open && ingredient) {
            setLoadingSubrecipe(true);
            setErrorMsg(null);
            axios
                .get(`/admin/ingredients/${ingredient.id}/subrecipe?branch_id=${selectedBranchId}`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                })
                .then((res) => {
                    if (res.data?.items) {
                        setSubrecipe(res.data.items);
                    }
                })
                .catch(() => {
                    setSubrecipe([]);
                })
                .finally(() => setLoadingSubrecipe(false));
        }
    }, [open, ingredient, selectedBranchId]);

    // Calculate requirements and check available stock in selected branch
    const materialChecks = useMemo(() => {
        const qtyNum = Number(batchQty || 0);
        if (qtyNum <= 0) return [];

        return subrecipe.map((item) => {
            const neededForBatch = item.quantity * qtyNum;
            // Find inventory stock for this component in selected branch
            const stockRow = allIngredients.find(
                (r) => r.id === item.component_ingredient_id && r.branch_id === selectedBranchId
            );
            const availableStock = stockRow ? stockRow.stock : 0;
            const hasEnough = availableStock >= neededForBatch;

            return {
                name: item.component_name || `Ingredient #${item.component_ingredient_id}`,
                unit: item.unit,
                needed: neededForBatch,
                available: availableStock,
                hasEnough,
            };
        });
    }, [subrecipe, batchQty, allIngredients, selectedBranchId]);

    const allSufficient = useMemo(() => {
        if (materialChecks.length === 0) return false;
        return materialChecks.every((m) => m.hasEnough);
    }, [materialChecks]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingredient) return;

        const qtyNum = Number(batchQty);
        if (qtyNum <= 0) {
            setErrorMsg('Batch quantity must be greater than zero.');
            return;
        }

        if (subrecipe.length === 0) {
            setErrorMsg('This composite ingredient has no internal micro-ingredients configured.');
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);

        try {
            await axios.post(
                `/admin/ingredients/${ingredient.id}/prepare`,
                {
                    batch_quantity: qtyNum,
                    branch_id: selectedBranchId,
                },
                { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
            );

            toast.success(
                `Batch prepared! +${qtyNum} ${ingredient.unit} of ${ingredient.name} added to stock.`
            );
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            let message = 'Batch preparation failed.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            } else if (axios.isAxiosError(err) && err.response?.data?.error) {
                message = err.response.data.error;
            } else if (axios.isAxiosError(err) && err.response?.data?.errors?.batch_quantity) {
                message = Array.isArray(err.response.data.errors.batch_quantity)
                    ? err.response.data.errors.batch_quantity.join(', ')
                    : String(err.response.data.errors.batch_quantity);
            }
            setErrorMsg(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!ingredient) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-4xl bg-white dark:bg-[#121218] p-6 sm:p-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit'] shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#E75480] dark:text-[#FF4F81] uppercase tracking-wider">
                        <ChefHat className="size-4" />
                        <span>Production &amp; Batch Preparation</span>
                    </div>
                    <DialogTitle className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Prepare {ingredient.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                        Deducts confidential micro-ingredients from raw inventory and increases{' '}
                        <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{ingredient.name}</strong> stock in one atomic transaction.
                    </DialogDescription>
                </DialogHeader>

                {errorMsg && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                        {errorMsg}
                    </div>
                )}

                {loadingSubrecipe ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-xs font-bold text-[#9E8B8E] dark:text-[#64748B]">
                        <Loader2 className="size-6 animate-spin text-[#E75480] dark:text-[#FF4F81]" />
                        <span>Loading formula specifications...</span>
                    </div>
                ) : subrecipe.length === 0 ? (
                    <div className="p-8 text-center space-y-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                        <AlertCircle className="size-8 mx-auto text-amber-500" />
                        <h4 className="text-sm font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Sub-Recipe Not Configured
                        </h4>
                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                            Please configure the internal micro-ingredients formula before preparing a batch.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                        {/* Target Branch and Quantity Controls */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">
                                    Target Branch
                                </label>
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                                    className="w-full h-12 px-3 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-sm font-bold"
                                >
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8]">
                                        Batch Yield
                                    </label>
                                    <span className="text-[10px] font-mono font-bold text-[#E75480] dark:text-[#FF4F81] uppercase">
                                        [{ingredient.unit}]
                                    </span>
                                </div>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        min="0.0001"
                                        required
                                        value={batchQty}
                                        onChange={(e) => setBatchQty(e.target.value)}
                                        placeholder="Quantity"
                                        className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono font-bold text-sm pr-14"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#9E8B8E] dark:text-[#64748B] pointer-events-none">
                                        {ingredient.unit}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Raw Materials Required Breakdown */}
                        <div className="space-y-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] flex items-center gap-1.5">
                                <Package className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                <span>Required Raw Material Deductions</span>
                            </span>

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {materialChecks.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            'p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-colors',
                                            item.hasEnough
                                                ? 'bg-white dark:bg-[#181822] border-[#F8C8DC]/40 dark:border-white/10'
                                                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50'
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            {item.hasEnough ? (
                                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                            ) : (
                                                <AlertCircle className="size-4 text-rose-500 shrink-0" />
                                            )}
                                            <div>
                                                <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC] block">
                                                    {item.name}
                                                </span>
                                                <span className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                                    In Stock: {item.available} {item.unit}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span
                                                className={cn(
                                                    'font-mono font-bold block',
                                                    item.hasEnough
                                                        ? 'text-[#3D2C2E] dark:text-[#F8FAFC]'
                                                        : 'text-rose-600 dark:text-rose-400'
                                                )}
                                            >
                                                -{item.needed} {item.unit}
                                            </span>
                                            {!item.hasEnough && (
                                                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-tight">
                                                    Short by {(item.needed - item.available).toFixed(2)} {item.unit}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-3 border-t border-[#F8C8DC]/40 dark:border-white/10 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || !allSufficient}
                                className={cn(
                                    'rounded-xl h-11 text-white text-xs font-bold gap-2 cursor-pointer shadow-xs',
                                    allSufficient
                                        ? 'bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525]'
                                        : 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
                                )}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Preparing Batch...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-4" />
                                        <span>Complete Batch Preparation</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
