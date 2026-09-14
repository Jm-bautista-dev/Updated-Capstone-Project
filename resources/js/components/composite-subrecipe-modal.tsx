import axios from 'axios';
import { Layers, Plus, Trash2, ShieldCheck, DollarSign, Loader2, Sparkles } from 'lucide-react';
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

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface SubrecipeItemRow {
    id?: number;
    component_ingredient_id: number;
    component_name?: string;
    component_unit?: string;
    quantity: number | string;
    unit: string;
    unit_cost?: number;
    subtotal_cost?: number;
}

interface CompositeSubrecipeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ingredient: InventoryRow | null;
    allIngredients: InventoryRow[];
    onSuccess?: () => void;
}

export function CompositeSubrecipeModal({
    open,
    onOpenChange,
    ingredient,
    allIngredients,
    onSuccess,
}: CompositeSubrecipeModalProps) {
    const [items, setItems] = useState<SubrecipeItemRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Filter candidate component ingredients (exclude current ingredient to prevent direct self-loop)
    const availableIngredients = useMemo(() => {
        if (!ingredient) return [];
        const unique = new Map<number, InventoryRow>();
        allIngredients.forEach((item) => {
            if (item.id !== ingredient.id && !unique.has(item.id)) {
                unique.set(item.id, item);
            }
        });
        return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [allIngredients, ingredient]);

    // Fetch subrecipe when modal opens
    useEffect(() => {
        if (open && ingredient) {
            setLoading(true);
            setErrorMsg(null);
            axios
                .get(`/admin/ingredients/${ingredient.id}/subrecipe?branch_id=${ingredient.branch_id || ''}`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                })
                .then((res) => {
                    if (res.data?.items && res.data.items.length > 0) {
                        setItems(res.data.items);
                    } else {
                        // Default to 1 empty row if no sub-recipe items exist yet
                        setItems([
                            {
                                component_ingredient_id: availableIngredients[0]?.id || 0,
                                quantity: '100',
                                unit: availableIngredients[0]?.unit || 'g',
                            },
                        ]);
                    }
                })
                .catch(() => {
                    // If not found or error, initialize with empty row
                    setItems([
                        {
                            component_ingredient_id: availableIngredients[0]?.id || 0,
                            quantity: '100',
                            unit: availableIngredients[0]?.unit || 'g',
                        },
                    ]);
                })
                .finally(() => setLoading(false));
        }
    }, [open, ingredient, availableIngredients]);

    const handleAddItem = () => {
        if (availableIngredients.length === 0) return;
        const first = availableIngredients[0];
        setItems((prev) => [
            ...prev,
            {
                component_ingredient_id: first.id,
                quantity: '10',
                unit: first.unit || 'g',
            },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleComponentChange = (index: number, componentIdStr: string) => {
        const compId = Number(componentIdStr);
        const comp = availableIngredients.find((i) => i.id === compId);
        setItems((prev) =>
            prev.map((item, idx) =>
                idx === index
                    ? {
                          ...item,
                          component_ingredient_id: compId,
                          unit: comp?.unit || 'g',
                      }
                    : item
            )
        );
    };

    const handleQuantityChange = (index: number, val: string) => {
        setItems((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, quantity: val } : item))
        );
    };

    const handleUnitChange = (index: number, unit: string) => {
        setItems((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, unit } : item))
        );
    };

    // Live calculation of unit cost
    const calculatedCost = useMemo(() => {
        return items.reduce((sum, item) => {
            const comp = availableIngredients.find((i) => i.id === item.component_ingredient_id);
            if (!comp) return sum;
            const qty = Number(item.quantity || 0);
            const compUnitCost = comp.cost_per_unit || 0;
            return sum + qty * compUnitCost;
        }, 0);
    }, [items, availableIngredients]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingredient) return;

        if (items.length === 0) {
            setErrorMsg('Please specify at least one micro-ingredient component.');
            return;
        }

        for (const item of items) {
            if (!item.component_ingredient_id) {
                setErrorMsg('All rows must have a valid component ingredient selected.');
                return;
            }
            if (Number(item.quantity) <= 0) {
                setErrorMsg('Quantity for all components must be greater than zero.');
                return;
            }
        }

        setSaving(true);
        setErrorMsg(null);

        try {
            const payload = {
                items: items.map((it) => ({
                    component_ingredient_id: it.component_ingredient_id,
                    quantity: Number(it.quantity),
                    unit: it.unit,
                })),
            };

            await axios.post(`/admin/ingredients/${ingredient.id}/subrecipe`, payload, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            toast.success(`Confidential sub-recipe for ${ingredient.name} saved successfully.`);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            let message = 'Failed to save sub-recipe.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            } else if (axios.isAxiosError(err) && err.response?.data?.error) {
                message = err.response.data.error;
            } else if (axios.isAxiosError(err) && err.response?.data?.errors?.items) {
                message = Array.isArray(err.response.data.errors.items)
                    ? err.response.data.errors.items.join(', ')
                    : String(err.response.data.errors.items);
            }
            setErrorMsg(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (!ingredient) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-4xl bg-white dark:bg-[#121218] p-6 sm:p-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit'] shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#E75480] dark:text-[#FF4F81] uppercase tracking-wider">
                        <ShieldCheck className="size-4" />
                        <span>Confidential Sub-Recipe Management</span>
                    </div>
                    <DialogTitle className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Internal Recipe: {ingredient.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                        Configure internal micro-ingredients for 1 {ingredient.unit} of{' '}
                        <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{ingredient.name}</strong>.
                        This proprietary formula is hidden from cashiers.
                    </DialogDescription>
                </DialogHeader>

                {errorMsg && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                        {errorMsg}
                    </div>
                )}

                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-xs font-bold text-[#9E8B8E] dark:text-[#64748B]">
                        <Loader2 className="size-6 animate-spin text-[#E75480] dark:text-[#FF4F81]" />
                        <span>Loading confidential sub-recipe...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-5 pt-2">
                        {/* Sub-recipe Items Table / Dynamic Rows */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] flex items-center gap-1.5">
                                    <Layers className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                    <span>Micro-Ingredient Components (Per 1 {ingredient.unit})</span>
                                </span>
                                <Button
                                    type="button"
                                    onClick={handleAddItem}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#E75480] dark:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/10 gap-1.5 cursor-pointer"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Add Component</span>
                                </Button>
                            </div>

                            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                                {items.length === 0 ? (
                                    <div className="p-8 text-center rounded-2xl bg-[#FFF5F7]/40 dark:bg-[#181820]/40 border border-dashed border-[#F8C8DC] dark:border-white/10 text-xs text-[#9E8B8E] dark:text-[#64748B]">
                                        No micro-ingredients configured. Click &quot;Add Component&quot; to begin.
                                    </div>
                                ) : (
                                    items.map((item, index) => {
                                        return (
                                            <div
                                                key={index}
                                                className="p-3.5 rounded-2xl bg-[#FFFDFE] dark:bg-[#181822] border border-[#F8C8DC]/50 dark:border-white/10 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                                            >
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                                        Raw Ingredient
                                                    </label>
                                                    <select
                                                        value={item.component_ingredient_id}
                                                        onChange={(e) => handleComponentChange(index, e.target.value)}
                                                        className="w-full h-10 px-3 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#F8FAFC] text-xs font-bold"
                                                    >
                                                        {availableIngredients.map((ing) => (
                                                            <option key={ing.id} value={ing.id}>
                                                                {ing.name} ({ing.unit})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="w-28 space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                                        Quantity
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        step="0.0001"
                                                        min="0.0001"
                                                        required
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                        placeholder="Qty"
                                                        className="h-10 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono font-bold text-xs"
                                                    />
                                                </div>

                                                <div className="w-24 space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                                        Unit
                                                    </label>
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => handleUnitChange(index, e.target.value)}
                                                        className="w-full h-10 px-2 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#F8FAFC] text-xs font-bold"
                                                    >
                                                        <option value="g">g</option>
                                                        <option value="kg">kg</option>
                                                        <option value="ml">ml</option>
                                                        <option value="liters">L</option>
                                                        <option value="pcs">pcs</option>
                                                    </select>
                                                </div>

                                                <div className="pt-4 sm:pt-4 flex items-center justify-end">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="size-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 cursor-pointer"
                                                        title="Remove component"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Cost & Formula Preview Card */}
                        <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <DollarSign className="size-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                        Calculated Unit Cost
                                    </span>
                                    <h4 className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">
                                        {formatCurrency(calculatedCost)} / {ingredient.unit}
                                    </h4>
                                </div>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-[#121218]/80 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 font-mono shadow-2xs">
                                {items.length} Component{items.length !== 1 ? 's' : ''}
                            </span>
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
                                disabled={saving}
                                className="rounded-xl h-11 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Saving Formula...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-4" />
                                        <span>Save Sub-Recipe</span>
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
