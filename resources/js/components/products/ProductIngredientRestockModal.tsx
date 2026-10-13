import { router } from '@inertiajs/core';
import {
    PackagePlus,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ArrowRight,
    Search,
    Store,
    RefreshCw,
    X,
    Check,
    Sparkles,
    ShieldAlert,
    Info,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getCompatibleUnits,
    convertToBaseQuantity,
    convertFromBaseQuantity,
} from '@/lib/unit-converter';
import { cn } from '@/lib/utils';

interface RestockIngredient {
    id: number;
    name: string;
    unit: string;
    recipe_quantity: number;
    recipe_unit: string;
    current_stock: number;
    current_stock_base: number;
    requires_expiration_tracking: boolean;
    default_expiry_days: number | null;
    cost_per_base_unit: number | null;
    compatible_units: string[];
    is_composite: boolean;
}

interface Branch {
    id: number;
    name: string;
    code?: string;
}

interface RestockProduct {
    id: number;
    name: string;
    sku?: string | null;
    category?: { id: number; name: string } | null;
    category_name?: string;
    image_url?: string | null;
    status?: string;
    stock?: number;
    unit?: string;
    ingredients?: Array<{
        id: number;
        name: string;
        unit: string;
        pivot?: {
            quantity_required: string | number;
            unit?: string;
        };
    }>;
}

interface ProductIngredientRestockModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: RestockProduct | null;
    branches: Branch[];
    currentBranchId?: number | string | null;
    isAdmin: boolean;
    onEditRecipe?: (product: RestockProduct) => void;
    initialSuggestedQuantities?: Record<number, number | string>;
}

interface IngredientRowState {
    ingredient_id: number;
    included: boolean;
    quantity: string;
    unit: string;
    lot_number: string;
    batch_code: string;
    expiration_date: string;
    expiration_type: 'use_by' | 'best_before' | 'none';
    supplier_id: string;
    supplier_name: string;
    purchase_price: string;
    notes: string;
}

export function ProductIngredientRestockModal({
    open,
    onOpenChange,
    product,
    branches,
    currentBranchId,
    isAdmin,
    onEditRecipe,
    initialSuggestedQuantities,
}: ProductIngredientRestockModalProps) {
    const [selectedBranchId, setSelectedBranchId] = useState<number>(() => {
        if (currentBranchId && currentBranchId !== 'all') {
            return Number(currentBranchId);
        }
        return branches[0]?.id ? Number(branches[0].id) : 1;
    });

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [idempotencyToken, setIdempotencyToken] = useState<string>('');

    const [ingredients, setIngredients] = useState<RestockIngredient[]>([]);
    const [rows, setRows] = useState<Record<number, IngredientRowState>>({});
    const [successData, setSuccessData] = useState<{
        message: string;
        ingredients_received: number;
        branch_name: string;
        receipts: Array<{
            ingredient_id: number;
            ingredient_name: string;
            quantity: number;
            unit: string;
            new_stock: number;
            stock_unit: string;
            reference: string;
            batch_code?: string;
        }>;
    } | null>(null);

    // Sync selected branch if external currentBranchId changes
    useEffect(() => {
        if (currentBranchId && currentBranchId !== 'all') {
            setSelectedBranchId(Number(currentBranchId));
        } else if (branches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(Number(branches[0].id));
        }
    }, [currentBranchId, branches, selectedBranchId]);

    // Fetch fresh authoritative ingredients whenever modal opens or branch changes
    useEffect(() => {
        if (!open || !product?.id) {
            return;
        }

        setStep('form');
        setErrorMessage(null);
        setValidationErrors({});
        setSuccessData(null);
        setIdempotencyToken(`restock_${product.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

        let isMounted = true;
        setLoading(true);

        const targetBranch = selectedBranchId || (branches[0]?.id ? Number(branches[0].id) : 1);

        fetch(`/products/${product.id}/restock-ingredients?branch_id=${targetBranch}`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || 'Failed to load product recipe ingredients.');
                }
                return res.json();
            })
            .then((data) => {
                if (!isMounted) return;
                setIngredients(data.ingredients || []);

                // Initialize row state
                const initialRows: Record<number, IngredientRowState> = {};
                (data.ingredients || []).forEach((ing: RestockIngredient) => {
                    const defaultExpDate = ing.default_expiry_days
                        ? new Date(Date.now() + ing.default_expiry_days * 86400000).toISOString().slice(0, 10)
                        : '';

                    const suggestedQty = initialSuggestedQuantities?.[ing.id];
                    const prefilledQuantity = suggestedQty != null && Number(suggestedQty) > 0
                        ? String(suggestedQty)
                        : '';

                    initialRows[ing.id] = {
                        ingredient_id: ing.id,
                        included: true,
                        quantity: prefilledQuantity,
                        unit: ing.unit || 'g',
                        lot_number: '',
                        batch_code: '',
                        expiration_date: defaultExpDate,
                        expiration_type: ing.requires_expiration_tracking ? 'use_by' : 'none',
                        supplier_id: '',
                        supplier_name: '',
                        purchase_price: '',
                        notes: '',
                    };
                });
                setRows(initialRows);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error(err);
                setErrorMessage(err.message || 'Error loading product recipe.');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [open, product?.id, selectedBranchId, branches, initialSuggestedQuantities]);

    // Filtered ingredients
    const filteredIngredients = useMemo(() => {
        if (!searchQuery.trim()) return ingredients;
        const q = searchQuery.toLowerCase();
        return ingredients.filter((ing) => ing.name.toLowerCase().includes(q));
    }, [ingredients, searchQuery]);

    // Active branch object
    const currentBranch = useMemo(() => {
        return branches.find((b) => Number(b.id) === Number(selectedBranchId)) || branches[0];
    }, [branches, selectedBranchId]);

    // Included rows with positive quantity
    const preparedReceipts = useMemo(() => {
        return ingredients
            .map((ing) => {
                const row = rows[ing.id];
                if (!row || !row.included) return null;
                const qty = parseFloat(row.quantity);
                if (isNaN(qty) || qty <= 0) return null;

                // Calculate resulting stock preview
                const currentStockBase = ing.current_stock_base;
                const receivedBase = convertToBaseQuantity(qty, row.unit);
                const resultingBase = currentStockBase + receivedBase;
                const resultingDisplay = convertFromBaseQuantity(resultingBase, ing.unit);

                return {
                    ingredient: ing,
                    row,
                    quantity: qty,
                    unit: row.unit,
                    current_stock: ing.current_stock,
                    resulting_stock: Number(resultingDisplay.toFixed(3)),
                    lot_number: row.lot_number,
                    expiration_date: row.expiration_date,
                    expiration_type: row.expiration_type,
                    supplier_id: row.supplier_id,
                    purchase_price: row.purchase_price,
                };
            })
            .filter(Boolean) as Array<{
            ingredient: RestockIngredient;
            row: IngredientRowState;
            quantity: number;
            unit: string;
            current_stock: number;
            resulting_stock: number;
            lot_number: string;
            expiration_date: string;
            expiration_type: 'use_by' | 'best_before' | 'none';
            supplier_id: string;
            purchase_price: string;
        }>;
    }, [ingredients, rows]);

    // Field updater helper
    const updateRow = (ingredientId: number, patch: Partial<IngredientRowState>) => {
        setRows((prev) => ({
            ...prev,
            [ingredientId]: {
                ...prev[ingredientId],
                ...patch,
            },
        }));
        // Clear specific validation error
        setValidationErrors((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((key) => {
                if (key.includes(`items.`) && key.includes(String(ingredientId))) {
                    delete next[key];
                }
            });
            return next;
        });
    };

    // Toggle include/exclude for all
    const toggleAll = (include: boolean) => {
        setRows((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((id) => {
                updated[Number(id)] = {
                    ...updated[Number(id)],
                    included: include,
                };
            });
            return updated;
        });
    };

    // Validate before showing confirmation summary
    const handleProceedToConfirm = () => {
        setErrorMessage(null);
        setValidationErrors({});

        if (preparedReceipts.length === 0) {
            setErrorMessage('Please enter a received quantity greater than 0 for at least one ingredient.');
            return;
        }

        // Check expiration requirements
        const errs: Record<string, string> = {};
        preparedReceipts.forEach((item, idx) => {
            if (
                item.ingredient.requires_expiration_tracking &&
                item.row.expiration_type !== 'none' &&
                !item.row.expiration_date
            ) {
                errs[`items.${idx}.expiration_date`] = `Expiration date is required for "${item.ingredient.name}".`;
            }
        });

        if (Object.keys(errs).length > 0) {
            setValidationErrors(errs);
            setErrorMessage('Please resolve the required expiration dates before continuing.');
            return;
        }

        setStep('confirm');
    };

    // Submit restock operation directly to backend
    const handleSubmitRestock = async () => {
        if (!product?.id || preparedReceipts.length === 0 || submitting) return;

        setSubmitting(true);
        setErrorMessage(null);

        const payload = {
            branch_id: selectedBranchId,
            idempotency_token: idempotencyToken,
            items: preparedReceipts.map((item) => ({
                ingredient_id: item.ingredient.id,
                included: true,
                quantity: item.quantity,
                unit: item.unit,
                purchase_price: item.purchase_price ? parseFloat(item.purchase_price) : 0,
                lot_number: item.row.lot_number || null,
                batch_code: item.row.batch_code || null,
                expiration_date: item.row.expiration_date || null,
                expiration_type: item.row.expiration_type,
                supplier_id: item.row.supplier_id ? Number(item.row.supplier_id) : null,
                notes: item.row.notes || `Product-Specific Restock for ${product.name}`,
            })),
        };

        try {
            const response = await fetch(`/products/${product.id}/restock-ingredients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setValidationErrors(data.errors);
                }
                throw new Error(data.message || 'Restock submission failed.');
            }

            // Success!
            setSuccessData({
                message: data.message,
                ingredients_received: data.ingredients_received || preparedReceipts.length,
                branch_name: currentBranch?.name || 'Selected Branch',
                receipts: data.receipts || [],
            });
            setStep('success');

            // Refresh product page props seamlessly in Inertia
            router.reload({ only: ['products', 'summary'] });
        } catch (err: unknown) {
            console.error('Restock submission error:', err);
            const msg = err instanceof Error ? err.message : 'An error occurred during restocking.';
            setErrorMessage(msg);
            setStep('form');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white/95 dark:bg-[#0E0E14]/95 backdrop-blur-2xl border-[#F8C8DC]/60 dark:border-white/10 rounded-3xl shadow-2xl">
                {/* Modal Header */}
                <div className="p-6 pb-4 border-b border-[#F8C8DC]/40 dark:border-white/10 bg-linear-to-r from-[#FFF5F7] via-white to-[#FFF5F7] dark:from-[#181822] dark:via-[#13131A] dark:to-[#181822]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            {product?.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="size-13 rounded-2xl object-cover border border-[#F8C8DC] dark:border-white/10 shadow-xs"
                                />
                            ) : (
                                <div className="size-13 rounded-2xl bg-[#FFF0F4] dark:bg-white/5 border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shadow-xs">
                                    <PackagePlus className="size-6.5" />
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                        {product?.category?.name || product?.category_name || 'Menu Product'}
                                    </span>
                                    {product?.sku && (
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-white/10 border border-[#F8C8DC]/40 dark:border-white/10 text-[#7D6B6E] dark:text-[#94A3B8]">
                                            {product.sku}
                                        </span>
                                    )}
                                </div>
                                <DialogTitle className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
                                    <span>Restock Ingredients:</span>
                                    <span className="text-[#E75480] dark:text-[#FF4F81]">{product?.name}</span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] mt-0.5">
                                    Replenish raw recipe materials into the shared branch inventory pool.
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Branch Selector / Display */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <span className="text-xs font-bold text-[#5D4A4D] dark:text-[#94A3B8] flex items-center gap-1.5 shrink-0">
                                <Store className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                <span>Branch:</span>
                            </span>

                            {isAdmin && branches.length > 1 ? (
                                <Select
                                    value={String(selectedBranchId)}
                                    onValueChange={(val) => setSelectedBranchId(Number(val))}
                                    disabled={step !== 'form' || loading || submitting}
                                >
                                    <SelectTrigger className="h-9 min-w-40 rounded-xl bg-white dark:bg-[#181824] border-[#F8C8DC] dark:border-white/10 text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-[#F8C8DC] dark:border-white/10">
                                        {branches.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)} className="text-xs font-semibold">
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="h-8 px-3 rounded-xl border-[#F8C8DC] dark:border-white/10 bg-white dark:bg-[#181824] text-xs font-bold text-[#E75480] dark:text-[#FF4F81]"
                                >
                                    {currentBranch?.name || 'Authorized Branch'}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Error Alert */}
                    {errorMessage && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs">
                            <AlertCircle className="size-4.5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                            <div className="flex-1 font-semibold">{errorMessage}</div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setErrorMessage(null)}
                                className="size-5 -mr-1 text-rose-600 hover:bg-rose-100 rounded-full"
                            >
                                <X className="size-3.5" />
                            </Button>
                        </div>
                    )}

                    {/* Step 1: Loading State */}
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                            <RefreshCw className="size-8 text-[#E75480] dark:text-[#FF4F81] animate-spin" />
                            <div className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                Loading product recipe & ingredient stock...
                            </div>
                            <div className="text-xs text-[#9E8B8E] dark:text-[#64748B]">
                                Fetching authoritative branch allocations
                            </div>
                        </div>
                    ) : ingredients.length === 0 ? (
                        /* Step 2: Empty Recipe State */
                        <div className="py-14 px-6 flex flex-col items-center justify-center text-center rounded-3xl bg-[#FFF5F7]/70 dark:bg-white/5 border border-[#F8C8DC]/60 dark:border-white/10">
                            <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 mb-3.5">
                                <ShieldAlert className="size-8" />
                            </div>
                            <h4 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                No Configured Recipe Ingredients
                            </h4>
                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] max-w-md mt-1 mb-5">
                                "{product?.name}" does not currently have any ingredients assigned to its recipe. Raw materials must be configured before ingredient restocking can be performed.
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-xl border-[#F8C8DC] text-xs font-bold"
                                >
                                    Close
                                </Button>
                                {isAdmin && onEditRecipe && product && (
                                    <Button
                                        onClick={() => {
                                            onOpenChange(false);
                                            onEditRecipe(product);
                                        }}
                                        className="rounded-xl bg-[#E75480] hover:bg-[#D43F6B] text-white text-xs font-bold gap-1.5 shadow-sm"
                                    >
                                        <Sparkles className="size-3.5" />
                                        <span>Configure Product Recipe</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : step === 'form' ? (
                        /* Step 3: Interactive Restock Form */
                        <div className="space-y-4">
                            {/* Toolbar: Search & Batch Action */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8B8E] dark:text-[#64748B]" />
                                    <Input
                                        placeholder="Filter ingredients..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-8.5 pl-8.5 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181824] text-xs"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9E8B8E] hover:text-[#E75480]"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                        {ingredients.length} Recipe Material{ingredients.length > 1 ? 's' : ''}
                                    </span>
                                    <div className="h-3.5 w-px bg-[#F8C8DC]/50 dark:bg-white/10" />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleAll(true)}
                                        className="h-7 px-2 text-[11px] font-bold text-[#E75480] dark:text-[#FF4F81] hover:bg-[#FFF0F4]"
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleAll(false)}
                                        className="h-7 px-2 text-[11px] font-bold text-[#9E8B8E] hover:bg-slate-100 dark:hover:bg-white/5"
                                    >
                                        Deselect All
                                    </Button>
                                </div>
                            </div>

                            {/* Ingredients Table */}
                            <div className="space-y-3">
                                {filteredIngredients.map((ing) => {
                                    const row = rows[ing.id] || {
                                        ingredient_id: ing.id,
                                        included: true,
                                        quantity: '',
                                        unit: ing.unit,
                                        lot_number: '',
                                        batch_code: '',
                                        expiration_date: '',
                                        expiration_type: 'use_by',
                                        supplier_id: '',
                                        supplier_name: '',
                                        purchase_price: '',
                                        notes: '',
                                    };

                                    const qty = parseFloat(row.quantity);
                                    const hasValidQty = !isNaN(qty) && qty > 0;
                                    const units = ing.compatible_units?.length > 0 ? ing.compatible_units : getCompatibleUnits(ing.unit);

                                    // Preview resulting stock
                                    let resultingStock = ing.current_stock;
                                    if (hasValidQty && row.included) {
                                        const receivedBase = convertToBaseQuantity(qty, row.unit);
                                        const totalBase = ing.current_stock_base + receivedBase;
                                        resultingStock = Number(convertFromBaseQuantity(totalBase, ing.unit).toFixed(3));
                                    }

                                    const isRowError = Object.keys(validationErrors).some((k) =>
                                        k.includes(`items.`) && k.includes(String(ing.id))
                                    );

                                    return (
                                        <div
                                            key={ing.id}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all duration-200",
                                                row.included
                                                    ? "bg-white dark:bg-[#14141E] border-[#F8C8DC]/60 dark:border-white/10 shadow-xs"
                                                    : "bg-slate-50/70 dark:bg-white/2 border-dashed border-slate-200 dark:border-white/5 opacity-60",
                                                isRowError && "border-rose-400 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20"
                                            )}
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                {/* Left Column: Checkbox, Name, Recipe spec & Current Stock */}
                                                <div className="flex items-start gap-3 min-w-60">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.included}
                                                        onChange={(e) => updateRow(ing.id, { included: e.target.checked })}
                                                        className="size-4.5 mt-1 rounded text-[#E75480] focus:ring-[#E75480] cursor-pointer"
                                                        id={`check_${ing.id}`}
                                                    />

                                                    <div>
                                                        <label
                                                            htmlFor={`check_${ing.id}`}
                                                            className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] cursor-pointer hover:text-[#E75480] transition-colors flex items-center gap-2"
                                                        >
                                                            <span>{ing.name}</span>
                                                            {ing.is_composite && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-700">
                                                                    Sub-recipe
                                                                </Badge>
                                                            )}
                                                            {ing.requires_expiration_tracking && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-rose-300 bg-rose-50 dark:bg-rose-950/30 text-rose-700" title="Expiration tracking required">
                                                                    Batch FEFO
                                                                </Badge>
                                                            )}
                                                        </label>

                                                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                                            <span>Recipe requires:</span>
                                                            <span className="font-mono font-bold text-[#E75480] dark:text-[#FF4F81]">
                                                                {ing.recipe_quantity} {ing.recipe_unit || ing.unit} / serving
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold">
                                                            <span className="text-[#9E8B8E] dark:text-[#64748B]">Current Branch Stock:</span>
                                                            <span className={cn(
                                                                "font-mono px-1.5 py-0.2 rounded border text-[11px]",
                                                                ing.current_stock <= 0
                                                                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200"
                                                                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                                                            )}>
                                                                {ing.current_stock} {ing.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Center/Right Inputs: Received Quantity, Unit, Resulting Stock Preview */}
                                                <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
                                                    {/* Quantity Input */}
                                                    <div className="space-y-1 w-28">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                                                Quantity <span className="text-rose-500">*</span>
                                                            </Label>
                                                            {initialSuggestedQuantities?.[ing.id] != null && Number(initialSuggestedQuantities[ing.id]) > 0 && (
                                                                <span className="text-[9px] font-bold text-[#E75480] dark:text-[#FF4F81] font-mono" title="Suggested from Prescriptive Analytics">
                                                                    Sugg.
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            placeholder="0.00"
                                                            disabled={!row.included}
                                                            value={row.quantity}
                                                            onChange={(e) => updateRow(ing.id, { quantity: e.target.value })}
                                                            className="h-9 font-mono font-bold text-xs rounded-xl border-[#F8C8DC]/80 dark:border-white/10"
                                                        />
                                                    </div>

                                                    {/* Unit Dropdown */}
                                                    <div className="space-y-1 w-24">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                                            Unit
                                                        </Label>
                                                        <Select
                                                            value={row.unit}
                                                            onValueChange={(val) => updateRow(ing.id, { unit: val })}
                                                            disabled={!row.included}
                                                        >
                                                            <SelectTrigger className="h-9 rounded-xl border-[#F8C8DC]/80 dark:border-white/10 text-xs font-semibold">
                                                                <SelectValue placeholder="Unit" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-[#F8C8DC]">
                                                                {units.map((u) => (
                                                                    <SelectItem key={u} value={u} className="text-xs">
                                                                        {u}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Expiration Date Input (if applicable) */}
                                                    <div className="space-y-1 w-34">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center justify-between">
                                                            <span>Expiration</span>
                                                            {ing.requires_expiration_tracking && <span className="text-rose-500">*</span>}
                                                        </Label>
                                                        <Input
                                                            type="date"
                                                            disabled={!row.included || row.expiration_type === 'none'}
                                                            value={row.expiration_date}
                                                            onChange={(e) => updateRow(ing.id, { expiration_date: e.target.value })}
                                                            className="h-9 text-xs rounded-xl border-[#F8C8DC]/80 dark:border-white/10 px-2 font-mono"
                                                        />
                                                    </div>

                                                    {/* Lot/Batch Number */}
                                                    <div className="space-y-1 w-28">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                                            Lot / Batch #
                                                        </Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="LOT-2026..."
                                                            disabled={!row.included}
                                                            value={row.lot_number}
                                                            onChange={(e) => updateRow(ing.id, { lot_number: e.target.value })}
                                                            className="h-9 text-xs font-mono rounded-xl border-[#F8C8DC]/80 dark:border-white/10"
                                                        />
                                                    </div>

                                                    {/* Acquisition Cost (Admin only) */}
                                                    {isAdmin && (
                                                        <div className="space-y-1 w-26">
                                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                                                Total Cost (₱)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                placeholder="0.00"
                                                                disabled={!row.included}
                                                                value={row.purchase_price}
                                                                onChange={(e) => updateRow(ing.id, { purchase_price: e.target.value })}
                                                                className="h-9 font-mono text-xs rounded-xl border-[#F8C8DC]/80 dark:border-white/10"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Live Resulting Stock Preview */}
                                                    <div className="space-y-1 min-w-30 text-right pl-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">
                                                            Resulting Stock
                                                        </span>
                                                        <div className="flex items-center justify-end gap-1 font-mono">
                                                            <span className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                                                {ing.current_stock}
                                                            </span>
                                                            <ArrowRight className="size-3 text-[#E75480] dark:text-[#FF4F81]" />
                                                            <span className={cn(
                                                                "text-xs font-black px-1.5 py-0.5 rounded-lg border",
                                                                hasValidQty && row.included
                                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                                                                    : "bg-slate-100 dark:bg-white/5 text-[#7D6B6E] border-slate-200"
                                                            )}>
                                                                {resultingStock} {ing.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : step === 'confirm' ? (
                        /* Step 4: Confirmation Summary View */
                        <div className="space-y-5">
                            <div className="p-4 rounded-2xl bg-[#FFF5F7] dark:bg-[#181824] border border-[#F8C8DC]/80 dark:border-white/10 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                        Restocking Destination:
                                    </div>
                                    <div className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-1.5 mt-0.5">
                                        <Store className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                        <span>{currentBranch?.name}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                        Ingredients to Restock:
                                    </div>
                                    <div className="text-lg font-black text-[#E75480] dark:text-[#FF4F81]">
                                        {preparedReceipts.length} Item{preparedReceipts.length > 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8]">
                                    Summary of Incoming Inventory Receipts
                                </h5>

                                <div className="border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#FFF5F7] dark:bg-white/5 border-b border-[#F8C8DC]/40 text-[#5D4A4D] dark:text-[#94A3B8] font-bold">
                                            <tr>
                                                <th className="p-3 pl-4">Ingredient</th>
                                                <th className="p-3">Received Qty</th>
                                                <th className="p-3">Current Stock</th>
                                                <th className="p-3">Resulting Stock</th>
                                                <th className="p-3">Lot / Expiration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5 font-medium text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {preparedReceipts.map((item) => (
                                                <tr key={item.ingredient.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2">
                                                    <td className="p-3 pl-4 font-bold">
                                                        {item.ingredient.name}
                                                    </td>
                                                    <td className="p-3 font-mono font-extrabold text-[#E75480] dark:text-[#FF4F81]">
                                                        +{item.quantity} {item.unit}
                                                    </td>
                                                    <td className="p-3 font-mono text-[#7D6B6E]">
                                                        {item.current_stock} {item.ingredient.unit}
                                                    </td>
                                                    <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                                        {item.resulting_stock} {item.ingredient.unit}
                                                    </td>
                                                    <td className="p-3 font-mono text-[11px] text-[#7D6B6E]">
                                                        {item.expiration_date ? (
                                                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                                                <Calendar className="size-3 text-[#E75480]" />
                                                                {item.expiration_date}
                                                            </span>
                                                        ) : (
                                                            'Standard Non-expiring'
                                                        )}
                                                        {item.lot_number && (
                                                            <span className="block text-[10px] text-[#9E8B8E]">
                                                                Lot: {item.lot_number}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2">
                                <Info className="size-4 shrink-0 text-blue-600" />
                                <span>
                                    These items will be recorded as traceable FIFO/FEFO batches in {currentBranch?.name}'s shared inventory, making them available to all products that use these ingredients.
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* Step 5: Success Breakdown Screen */
                        <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="size-10" />
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    Restock Completed Successfully!
                                </h3>
                                <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] mt-1 max-w-md mx-auto">
                                    {successData?.message || `Successfully replenished raw ingredients for ${product?.name}.`}
                                </p>
                            </div>

                            {successData?.receipts && successData.receipts.length > 0 && (
                                <div className="w-full max-w-lg border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl overflow-hidden text-left text-xs mt-2">
                                    <div className="p-3 bg-[#FFF5F7] dark:bg-white/5 border-b border-[#F8C8DC]/40 font-bold text-[#5D4A4D]">
                                        Recorded Receipts & Updated Batch Stock
                                    </div>
                                    <div className="divide-y divide-[#F8C8DC]/30 max-h-52 overflow-y-auto">
                                        {successData.receipts.map((r, i) => (
                                            <div key={i} className="p-3 flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                        {r.ingredient_name}
                                                    </span>
                                                    <span className="text-[11px] text-[#9E8B8E] block">
                                                        Batch: {r.batch_code || 'Auto-generated'}
                                                    </span>
                                                </div>
                                                <div className="text-right font-mono">
                                                    <span className="font-bold text-emerald-600">
                                                        +{r.quantity} {r.unit}
                                                    </span>
                                                    <span className="text-[11px] text-[#7D6B6E] block">
                                                        New Stock: {r.new_stock} {r.stock_unit}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Footer Actions */}
                <DialogFooter className="p-4 px-6 border-t border-[#F8C8DC]/40 dark:border-white/10 bg-slate-50/50 dark:bg-white/2 flex flex-row items-center justify-between gap-3">
                    {step === 'form' ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl border-[#F8C8DC]/80 text-xs font-bold"
                            >
                                Cancel
                            </Button>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#7D6B6E] hidden sm:inline">
                                    {preparedReceipts.length} ingredient{preparedReceipts.length === 1 ? '' : 's'} ready
                                </span>
                                <Button
                                    onClick={handleProceedToConfirm}
                                    disabled={loading || preparedReceipts.length === 0}
                                    className="rounded-xl bg-[#E75480] hover:bg-[#D43F6B] text-white text-xs font-bold gap-2 px-5 shadow-xs"
                                >
                                    <span>Review & Restock</span>
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </div>
                        </>
                    ) : step === 'confirm' ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setStep('form')}
                                disabled={submitting}
                                className="rounded-xl border-[#F8C8DC]/80 text-xs font-bold"
                            >
                                Back to Edit
                            </Button>

                            <Button
                                onClick={handleSubmitRestock}
                                disabled={submitting}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 px-6 shadow-md"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw className="size-3.5 animate-spin" />
                                        <span>Posting Stock-in Receipts...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="size-4" />
                                        <span>Confirm Restock ({preparedReceipts.length} Items)</span>
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <div className="w-full flex justify-end">
                            <Button
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl bg-[#E75480] hover:bg-[#D43F6B] text-white text-xs font-bold px-6 shadow-xs"
                            >
                                Done
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
