import { router } from '@inertiajs/core';
import {
    PackagePlus,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ArrowRight,
    Search,
    Store,
    Building2,
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
    getBusinessTodayManila,
    isExpirationDateExpired,
    EXPIRED_DATE_ERROR_MESSAGE,
} from '@/lib/inventory-expiry-validator';
import {
    getCompatibleUnits,
    convertToBaseQuantity,
    convertFromBaseQuantity,
} from '@/lib/unit-converter';
import { cn } from '@/lib/utils';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

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
    current_unit_cost?: number;
    current_cost_per_base_unit?: number;
    total_stock_value?: number;
    last_purchase_price?: number | null;
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
    expiration_date: string;
    expiration_type: 'use_by' | 'best_before' | 'none';
    supplier_id: string;
    supplier_name: string;
    unit_cost: string; // New unit acquisition cost per receipt unit (₱)
    purchase_price: string; // Total batch acquisition cost (₱)
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
    const [availableBranches, setAvailableBranches] = useState<Branch[]>(branches || []);
    const [selectedBranchId, setSelectedBranchId] = useState<number>(() => {
        if (currentBranchId && currentBranchId !== 'all') {
            return Number(currentBranchId);
        }
        return branches?.[0]?.id ? Number(branches[0].id) : 1;
    });

    const [loading, setLoading] = useState(false);
    const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);
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
            unit_cost?: number;
            purchase_price?: number;
            new_stock: number;
            stock_unit: string;
            cost_per_unit?: number;
            cost_per_base_unit?: number;
            reference: string;
            batch_code?: string;
        }>;
    } | null>(null);

    // Sync available branches if props change
    useEffect(() => {
        if (branches && branches.length > 0) {
            setAvailableBranches(branches);
        }
    }, [branches]);

    // Sync selected branch if external currentBranchId changes when modal opens
    useEffect(() => {
        if (open) {
            if (currentBranchId && currentBranchId !== 'all') {
                setSelectedBranchId(Number(currentBranchId));
            } else if (availableBranches.length > 0 && !selectedBranchId) {
                setSelectedBranchId(Number(availableBranches[0].id));
            }
        }
    }, [open, currentBranchId, availableBranches, selectedBranchId]);

    // Reset modal state when opened for a new product
    useEffect(() => {
        if (open && product?.id) {
            setStep('form');
            setErrorMessage(null);
            setValidationErrors({});
            setSuccessData(null);
            setRows({});
            setIdempotencyToken(`restock_${product.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
        }
    }, [open, product?.id]);

    // Fetch fresh authoritative ingredients whenever modal opens or branch changes
    useEffect(() => {
        if (!open || !product?.id) {
            return;
        }

        let isMounted = true;
        // Distinguish initial modal load vs switching destination branch
        if (ingredients.length === 0) {
            setLoading(true);
        } else {
            setIsSwitchingBranch(true);
        }

        const targetBranch = selectedBranchId || (availableBranches[0]?.id ? Number(availableBranches[0].id) : 1);

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
                if (Array.isArray(data.branches) && data.branches.length > 0) {
                    setAvailableBranches(data.branches);
                }

                // Preserve user-typed restock quantities, prices and notes when switching branches,
                // while updating to the newly selected branch's authoritative balances and unit costs
                setRows((prev) => {
                    const next: Record<number, IngredientRowState> = {};
                    (data.ingredients || []).forEach((ing: RestockIngredient) => {
                        const existing = prev[ing.id];
                        const defaultExpDate = ing.default_expiry_days
                            ? new Date(Date.now() + ing.default_expiry_days * 86400000).toISOString().slice(0, 10)
                            : '';

                        const suggestedQty = initialSuggestedQuantities?.[ing.id];
                        const prefilledQuantity = suggestedQty != null && Number(suggestedQty) > 0
                            ? String(suggestedQty)
                            : '';

                        const unit = existing?.unit || ing.unit || 'g';
                        const receiptFactor = convertToBaseQuantity(1, unit);
                        const baseCost = ing.current_cost_per_base_unit ?? ing.cost_per_base_unit ?? 0;
                        const defaultUnitCost = baseCost > 0 ? Number((baseCost * receiptFactor).toFixed(4)) : 0;

                        const initUnitCost = existing?.unit_cost !== undefined && existing?.unit_cost !== ''
                            ? existing.unit_cost
                            : (defaultUnitCost > 0 ? String(defaultUnitCost) : '');

                        const initQuantity = existing?.quantity !== undefined && existing?.quantity !== ''
                            ? existing.quantity
                            : prefilledQuantity;

                        const calcBatchCost = initQuantity && initUnitCost && Number(initQuantity) > 0 && Number(initUnitCost) >= 0
                            ? String(Number((Number(initQuantity) * Number(initUnitCost)).toFixed(2)))
                            : (existing?.purchase_price || '');

                        next[ing.id] = {
                            ingredient_id: ing.id,
                            included: existing ? existing.included : true,
                            quantity: initQuantity,
                            unit: unit,
                            expiration_date: existing?.expiration_date || defaultExpDate,
                            expiration_type: existing?.expiration_type || (ing.requires_expiration_tracking ? 'use_by' : 'none'),
                            supplier_id: existing?.supplier_id || '',
                            supplier_name: existing?.supplier_name || '',
                            unit_cost: initUnitCost,
                            purchase_price: calcBatchCost,
                            notes: existing?.notes || '',
                        };
                    });
                    return next;
                });
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error(err);
                setErrorMessage(err.message || 'Error loading product recipe.');
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                    setIsSwitchingBranch(false);
                }
            });

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, product?.id, selectedBranchId]);

    // Handle user switching destination branch
    const handleBranchChange = (newBranchId: number) => {
        if (Number(newBranchId) === Number(selectedBranchId) || loading || submitting || isSwitchingBranch) {
            return;
        }
        setSelectedBranchId(Number(newBranchId));
    };

    // Filtered ingredients
    const filteredIngredients = useMemo(() => {
        if (!searchQuery.trim()) return ingredients;
        const q = searchQuery.toLowerCase();
        return ingredients.filter((ing) => ing.name.toLowerCase().includes(q));
    }, [ingredients, searchQuery]);

    // Active destination branch object
    const currentBranch = useMemo(() => {
        return (
            availableBranches.find((b) => Number(b.id) === Number(selectedBranchId)) ||
            branches.find((b) => Number(b.id) === Number(selectedBranchId)) ||
            availableBranches[0] ||
            branches[0]
        );
    }, [availableBranches, branches, selectedBranchId]);

    // Included rows with positive quantity and authoritative costing model
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

                // Costing Calculations
                const parsedUnitCost = parseFloat(row.unit_cost);
                const parsedPurchasePrice = parseFloat(row.purchase_price);

                const totalBatchCost = !isNaN(parsedPurchasePrice) && parsedPurchasePrice >= 0
                    ? parsedPurchasePrice
                    : (!isNaN(parsedUnitCost) && parsedUnitCost >= 0 ? parsedUnitCost * qty : 0);

                const effectiveUnitCost = !isNaN(parsedUnitCost) && parsedUnitCost >= 0
                    ? parsedUnitCost
                    : (qty > 0 && totalBatchCost > 0 ? totalBatchCost / qty : 0);

                // Current authoritative branch cost
                const effectiveBaseCost = ing.current_cost_per_base_unit ?? ing.cost_per_base_unit ?? 0;
                const receiptFactor = convertToBaseQuantity(1, row.unit);
                const currentCostPerReceiptUnit = effectiveBaseCost * receiptFactor;

                const ingDisplayFactor = convertToBaseQuantity(1, ing.unit);
                const currentCostPerDisplayUnit = effectiveBaseCost * ingDisplayFactor;

                // Real-time WAC Simulation (reusing backend InventoryBatchService formula)
                const currentTotalVal = ing.total_stock_value && ing.total_stock_value > 0
                    ? ing.total_stock_value
                    : (currentStockBase * effectiveBaseCost);

                const newTotalVal = currentTotalVal + totalBatchCost;
                const newWacBase = resultingBase > 0
                    ? (newTotalVal / resultingBase)
                    : (totalBatchCost > 0 && receivedBase > 0 ? (totalBatchCost / receivedBase) : effectiveBaseCost);

                const newWacDisplay = newWacBase * ingDisplayFactor;

                return {
                    ingredient: ing,
                    row,
                    quantity: qty,
                    unit: row.unit,
                    unit_cost: effectiveUnitCost,
                    total_batch_cost: Number(totalBatchCost.toFixed(2)),
                    current_cost_per_receipt_unit: currentCostPerReceiptUnit,
                    current_cost_per_display_unit: currentCostPerDisplayUnit,
                    current_stock: ing.current_stock,
                    resulting_stock: Number(resultingDisplay.toFixed(3)),
                    new_wac_display: Number(newWacDisplay.toFixed(4)),
                    new_wac_base: Number(newWacBase.toFixed(4)),
                    expiration_date: row.expiration_date,
                    expiration_type: row.expiration_type,
                    supplier_id: row.supplier_id,
                };
            })
            .filter(Boolean) as Array<{
            ingredient: RestockIngredient;
            row: IngredientRowState;
            quantity: number;
            unit: string;
            unit_cost: number;
            total_batch_cost: number;
            current_cost_per_receipt_unit: number;
            current_cost_per_display_unit: number;
            current_stock: number;
            resulting_stock: number;
            new_wac_display: number;
            new_wac_base: number;
            expiration_date: string;
            expiration_type: 'use_by' | 'best_before' | 'none';
            supplier_id: string;
        }>;
    }, [ingredients, rows]);

    const totalAcquisitionCost = useMemo(() => {
        return preparedReceipts.reduce((acc, item) => acc + (item.total_batch_cost || 0), 0);
    }, [preparedReceipts]);

    // Field updater helper with unit conversion and cost synchronization
    const updateRow = (ingredientId: number, patch: Partial<IngredientRowState>) => {
        setRows((prev) => {
            const current = prev[ingredientId] || {
                ingredient_id: ingredientId,
                included: true,
                quantity: '',
                unit: 'g',
                expiration_date: '',
                expiration_type: 'use_by',
                supplier_id: '',
                supplier_name: '',
                unit_cost: '',
                purchase_price: '',
                notes: '',
            };

            const merged: IngredientRowState = {
                ...current,
                ...patch,
            };

            // If unit changed, convert unit_cost appropriately so total cost remains preserved
            if (patch.unit && patch.unit !== current.unit) {
                const oldFactor = convertToBaseQuantity(1, current.unit);
                const newFactor = convertToBaseQuantity(1, patch.unit);
                const factorRatio = newFactor / (oldFactor > 0 ? oldFactor : 1);
                const currentNumericCost = parseFloat(current.unit_cost);
                if (!isNaN(currentNumericCost) && currentNumericCost > 0) {
                    const convertedUnitCost = currentNumericCost * factorRatio;
                    merged.unit_cost = String(Number(convertedUnitCost.toFixed(4)));
                }
            }

            const qtyNum = parseFloat(merged.quantity);
            const hasValidQty = !isNaN(qtyNum) && qtyNum > 0;

            // Synchronize unit_cost and purchase_price
            if (patch.unit_cost !== undefined && patch.purchase_price === undefined) {
                const unitCostNum = parseFloat(patch.unit_cost);
                if (hasValidQty && !isNaN(unitCostNum) && unitCostNum >= 0) {
                    merged.purchase_price = (qtyNum * unitCostNum).toFixed(2);
                }
            } else if (patch.purchase_price !== undefined && patch.unit_cost === undefined) {
                const purchasePriceNum = parseFloat(patch.purchase_price);
                if (hasValidQty && !isNaN(purchasePriceNum) && purchasePriceNum >= 0) {
                    merged.unit_cost = (purchasePriceNum / qtyNum).toFixed(4);
                }
            } else if (patch.quantity !== undefined && patch.purchase_price === undefined) {
                const unitCostNum = parseFloat(merged.unit_cost);
                if (hasValidQty && !isNaN(unitCostNum) && unitCostNum >= 0) {
                    merged.purchase_price = (qtyNum * unitCostNum).toFixed(2);
                } else {
                    const purchasePriceNum = parseFloat(merged.purchase_price);
                    if (hasValidQty && !isNaN(purchasePriceNum) && purchasePriceNum >= 0) {
                        merged.unit_cost = (purchasePriceNum / qtyNum).toFixed(4);
                    }
                }
            }

            return {
                ...prev,
                [ingredientId]: merged,
            };
        });

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
            } else if (
                item.row.expiration_type !== 'none' &&
                item.row.expiration_date &&
                isExpirationDateExpired(item.row.expiration_date)
            ) {
                errs[`items.${idx}.expiration_date`] = `The expiration date for "${item.ingredient.name}" has already passed. You cannot restock expired ingredients.`;
            }
        });

        if (Object.keys(errs).length > 0) {
            setValidationErrors(errs);
            setErrorMessage('Please resolve the expiration date issues before continuing.');
            return;
        }

        setStep('confirm');
    };

    // Submit restock operation directly to backend
    const handleSubmitRestock = async () => {
        if (!product?.id || preparedReceipts.length === 0 || submitting) return;

        // Final safety check against expired items
        for (const item of preparedReceipts) {
            if (item.row.expiration_type !== 'none' && item.row.expiration_date && isExpirationDateExpired(item.row.expiration_date)) {
                setErrorMessage(EXPIRED_DATE_ERROR_MESSAGE);
                return;
            }
        }

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
                unit_cost: item.unit_cost,
                purchase_price: item.total_batch_cost,
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

                        {/* Branch Selector / Display in Header */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <span className="text-xs font-bold text-[#5D4A4D] dark:text-[#94A3B8] flex items-center gap-1.5 shrink-0">
                                <Store className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                <span>Destination:</span>
                            </span>

                            {isAdmin && availableBranches.length > 1 ? (
                                <Select
                                    value={String(selectedBranchId)}
                                    onValueChange={(val) => handleBranchChange(Number(val))}
                                    disabled={step !== 'form' || loading || submitting || isSwitchingBranch}
                                >
                                    <SelectTrigger className="h-9 min-w-44 rounded-xl bg-white dark:bg-[#181824] border-[#F8C8DC] dark:border-white/10 text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        <SelectValue placeholder="Select Destination Branch" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-[#F8C8DC] dark:border-white/10">
                                        {availableBranches.map((b) => (
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
                            {/* Explicit Destination Branch Selector */}
                            <div className="p-4 rounded-2xl bg-linear-to-r from-[#FFF5F7] via-white to-[#FFF5F7] dark:from-[#181822] dark:via-[#13131A] dark:to-[#181822] border-2 border-[#F8C8DC]/70 dark:border-white/10 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-[#E75480]/10 text-[#E75480] dark:bg-[#FF4F81]/15 dark:text-[#FF4F81]">
                                            <Store className="size-4.5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                    Destination Branch
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] font-extrabold border-[#E75480]/40 text-[#E75480] bg-white/80 dark:bg-black/30 px-2 py-0"
                                                >
                                                    Required
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                                Choose target branch. Only the selected branch will receive inventory stock.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Real-time Status Indicator */}
                                    <div className="sm:text-right shrink-0">
                                        <span className="text-[10px] uppercase font-bold text-[#9E8B8E] dark:text-[#64748B] block">
                                            Current Destination
                                        </span>
                                        <span className="text-xs font-black text-[#E75480] dark:text-[#FF4F81] flex items-center gap-1 sm:justify-end">
                                            {isSwitchingBranch ? (
                                                <RefreshCw className="size-3 animate-spin text-[#E75480]" />
                                            ) : (
                                                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                            )}
                                            <span>{currentBranch?.name || 'Selected Branch'}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Branch Selection Buttons: Victoria & Sta. Cruz */}
                                {isAdmin && availableBranches.length > 1 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {availableBranches.map((b) => {
                                            const isSelected = Number(selectedBranchId) === Number(b.id);
                                            return (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => handleBranchChange(Number(b.id))}
                                                    disabled={loading || submitting || isSwitchingBranch}
                                                    className={cn(
                                                        "relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer",
                                                        isSelected
                                                            ? "border-[#E75480] bg-white dark:bg-[#1C1C28] shadow-md ring-2 ring-[#E75480]/20"
                                                            : "border-[#F8C8DC]/60 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:border-[#E75480]/50 hover:bg-white dark:hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "p-2 rounded-xl transition-colors",
                                                                isSelected
                                                                    ? "bg-[#E75480] text-white shadow-xs"
                                                                    : "bg-[#FFF0F4] dark:bg-white/10 text-[#7D6B6E] dark:text-[#94A3B8]"
                                                            )}
                                                        >
                                                            <Building2 className="size-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                                {b.name}
                                                            </div>
                                                            <div className="text-[10px] font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                                                {isSelected
                                                                    ? "Active Destination • Balances Loaded"
                                                                    : "Click to restock this branch instead"}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 ml-2">
                                                        {isSelected ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#E75480] dark:text-[#FF4F81] bg-[#FFF0F4] dark:bg-[#E75480]/20 px-2.5 py-1 rounded-full border border-[#E75480]/30 shadow-2xs">
                                                                <Check className="size-3 stroke-3" />
                                                                <span>Selected</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-bold text-[#9E8B8E] hover:text-[#5D4A4D] px-2 py-0.5">
                                                                Switch
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* Single Branch Authorized (e.g. Cashier) */
                                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1C28] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-[#E75480] text-white shadow-xs">
                                                <Building2 className="size-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                    {currentBranch?.name || 'Assigned Branch'}
                                                </div>
                                                <div className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                                    Authorized Staff Destination (Restricted to Assigned Location)
                                                </div>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="border-[#E75480]/40 text-[#E75480] bg-[#FFF0F4] dark:bg-[#E75480]/20 text-xs font-bold"
                                        >
                                            Single Branch Authorized
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* Switching Branch Live Feedback */}
                            {isSwitchingBranch && (
                                <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300 text-xs font-bold animate-pulse">
                                    <RefreshCw className="size-3.5 animate-spin" />
                                    <span>Updating ingredient inventory balances for {currentBranch?.name}...</span>
                                </div>
                            )}

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
                                        expiration_date: '',
                                        expiration_type: 'use_by',
                                        supplier_id: '',
                                        supplier_name: '',
                                        unit_cost: '',
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

                                    // Unit acquisition cost calculation for current branch
                                    const effectiveBaseCost = ing.current_cost_per_base_unit ?? ing.cost_per_base_unit ?? 0;
                                    const receiptFactor = convertToBaseQuantity(1, row.unit);
                                    const currentCostPerReceiptUnit = effectiveBaseCost * receiptFactor;
                                    const ingDisplayFactor = convertToBaseQuantity(1, ing.unit);
                                    const currentCostPerDisplayUnit = effectiveBaseCost * ingDisplayFactor;

                                    // Real-time WAC simulation
                                    const parsedUnitCost = parseFloat(row.unit_cost);
                                    const parsedPurchasePrice = parseFloat(row.purchase_price);
                                    const totalBatchCost = !isNaN(parsedPurchasePrice) && parsedPurchasePrice >= 0
                                        ? parsedPurchasePrice
                                        : (!isNaN(parsedUnitCost) && parsedUnitCost >= 0 && hasValidQty ? parsedUnitCost * qty : 0);

                                    const receivedBase = hasValidQty ? convertToBaseQuantity(qty, row.unit) : 0;
                                    const resultingBase = ing.current_stock_base + receivedBase;
                                    const currentTotalVal = ing.total_stock_value && ing.total_stock_value > 0
                                        ? ing.total_stock_value
                                        : (ing.current_stock_base * effectiveBaseCost);
                                    const newTotalVal = currentTotalVal + (hasValidQty ? totalBatchCost : 0);
                                    const newWacBase = resultingBase > 0
                                        ? (newTotalVal / resultingBase)
                                        : (totalBatchCost > 0 && receivedBase > 0 ? (totalBatchCost / receivedBase) : effectiveBaseCost);
                                    const newWacDisplay = newWacBase * ingDisplayFactor;

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
                                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                                {/* Left Column: Checkbox, Name, Recipe spec, Current Stock & Current Unit Cost */}
                                                <div className="flex items-start gap-3 min-w-64">
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

                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-bold">
                                                            <span className="text-[#9E8B8E] dark:text-[#64748B]">
                                                                Stock at <span className="text-[#3D2C2E] dark:text-[#F8FAFC]">{currentBranch?.name || 'Selected Branch'}</span>:
                                                            </span>
                                                            <span className={cn(
                                                                "font-mono px-1.5 py-0.2 rounded border text-[11px]",
                                                                ing.current_stock <= 0
                                                                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200"
                                                                    : ing.current_stock <= (ing.recipe_quantity * 5)
                                                                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200"
                                                                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                                                            )}>
                                                                {ing.current_stock} {ing.unit}
                                                            </span>
                                                            {ing.current_stock <= 0 ? (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-rose-300 bg-rose-50 dark:bg-rose-950/30 text-rose-700 font-bold">
                                                                    Out of Stock
                                                                </Badge>
                                                            ) : ing.current_stock <= (ing.recipe_quantity * 5) ? (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-700 font-bold">
                                                                    Low Stock
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 font-bold">
                                                                    In Stock
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Current Unit Acquisition Cost */}
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-bold">
                                                            <span className="text-[#9E8B8E] dark:text-[#64748B]">Current Unit Cost:</span>
                                                            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[#FFF5F7] dark:bg-white/5 border border-[#F8C8DC]/60 dark:border-white/10 text-[#5D4A4D] dark:text-[#CBD5E1]">
                                                                {formatCurrency(currentCostPerReceiptUnit)} / {row.unit}
                                                                {row.unit !== ing.unit && (
                                                                    <span className="opacity-70 ml-1.5 text-[10px]">
                                                                        ({formatCurrency(currentCostPerDisplayUnit)} / {ing.unit})
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Center/Right Inputs: Received Quantity, Unit, Unit Cost, Total Cost, Resulting WAC, Expiration, Resulting Stock */}
                                                <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
                                                    {/* Quantity Input */}
                                                    <div className="space-y-1 w-24">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                                                Qty <span className="text-rose-500">*</span>
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
                                                    <div className="space-y-1 w-20">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                                            Unit
                                                        </Label>
                                                        <Select
                                                            value={row.unit}
                                                            onValueChange={(val) => updateRow(ing.id, { unit: val })}
                                                            disabled={!row.included}
                                                        >
                                                            <SelectTrigger className="h-9 rounded-xl border-[#F8C8DC]/80 dark:border-white/10 text-xs font-semibold px-2">
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

                                                    {/* Unit Acquisition Cost */}
                                                    <div className="space-y-1 w-28">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] truncate block" title={`Cost in ₱ per ${row.unit}`}>
                                                            Unit Cost (₱/{row.unit})
                                                        </Label>
                                                        <div className="relative">
                                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9E8B8E] pointer-events-none">₱</span>
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                placeholder="0.00"
                                                                disabled={!row.included}
                                                                value={row.unit_cost}
                                                                onChange={(e) => updateRow(ing.id, { unit_cost: e.target.value })}
                                                                className="h-9 pl-6 font-mono font-bold text-xs rounded-xl border-[#F8C8DC]/80 dark:border-white/10"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Total Batch Acquisition Cost */}
                                                    <div className="space-y-1 w-28">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] truncate block">
                                                            Total Cost (₱)
                                                        </Label>
                                                        <div className="relative">
                                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9E8B8E] pointer-events-none">₱</span>
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                placeholder="0.00"
                                                                disabled={!row.included}
                                                                value={row.purchase_price}
                                                                onChange={(e) => updateRow(ing.id, { purchase_price: e.target.value })}
                                                                className="h-9 pl-6 font-mono font-bold text-xs rounded-xl border-[#F8C8DC]/80 dark:border-white/10"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Live Resulting WAC Preview */}
                                                    <div className="space-y-1 min-w-26 text-right">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block truncate" title="Updated weighted-average cost after receipt">
                                                            Est. New WAC
                                                        </span>
                                                        <div className="flex items-center justify-end font-mono">
                                                            <span className={cn(
                                                                "text-xs font-bold px-1.5 py-1 rounded-lg border",
                                                                hasValidQty && row.included
                                                                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200"
                                                                    : "bg-slate-100 dark:bg-white/5 text-[#7D6B6E] border-slate-200"
                                                            )}>
                                                                {formatCurrency(newWacDisplay)} / {ing.unit}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Expiration Date Input (if applicable) */}
                                                    <div className="space-y-1 w-32">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center justify-between">
                                                            <span>Expiration</span>
                                                            {ing.requires_expiration_tracking && <span className="text-rose-500">*</span>}
                                                        </Label>
                                                        <Input
                                                            type="date"
                                                            min={getBusinessTodayManila()}
                                                            disabled={!row.included || row.expiration_type === 'none'}
                                                            value={row.expiration_date}
                                                            onChange={(e) => updateRow(ing.id, { expiration_date: e.target.value })}
                                                            className={cn(
                                                                "h-9 text-xs rounded-xl border-[#F8C8DC]/80 dark:border-white/10 px-2 font-mono",
                                                                row.expiration_type !== 'none' && isExpirationDateExpired(row.expiration_date) && "border-rose-500 ring-rose-500/20 bg-rose-500/5 text-rose-600 font-bold"
                                                            )}
                                                        />
                                                        {row.expiration_type !== 'none' && isExpirationDateExpired(row.expiration_date) && (
                                                            <p className="text-[9px] text-rose-500 font-bold">Past date</p>
                                                        )}
                                                    </div>

                                                    {/* Live Resulting Stock Preview */}
                                                    <div className="space-y-1 min-w-28 text-right pl-1">
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
                            {/* Prominent Destination Branch & Total Acquisition Cost Card */}
                            <div className="p-4 rounded-2xl bg-linear-to-r from-[#FFF5F7] via-white to-[#FFF5F7] dark:from-[#181822] dark:via-[#13131A] dark:to-[#181822] border-2 border-[#E75480]/60 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 rounded-2xl bg-[#E75480] text-white shadow-md">
                                        <Building2 className="size-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                                Target Destination Branch
                                            </span>
                                            <Badge className="bg-[#E75480] text-white text-[10px] font-extrabold uppercase">
                                                Restock Destination
                                            </Badge>
                                        </div>
                                        <div className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-1.5 mt-0.5">
                                            <span>{currentBranch?.name}</span>
                                        </div>
                                        <div className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                            Stock and inventory valuations will be received exclusively into this branch ledger.
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="sm:text-right p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-[#F8C8DC]/60 dark:border-white/10">
                                        <div className="text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                            Items to Restock
                                        </div>
                                        <div className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {preparedReceipts.length} Item{preparedReceipts.length > 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    <div className="sm:text-right p-3 rounded-xl bg-linear-to-br from-[#FFF0F4] to-white dark:from-[#1E1E2C] dark:to-[#14141E] border-2 border-[#E75480]/40 shadow-xs">
                                        <div className="text-[11px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                            Total Restock Cost
                                        </div>
                                        <div className="text-xl font-black text-[#E75480] dark:text-[#FF4F81] font-mono">
                                            {formatCurrency(totalAcquisitionCost)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Isolation Notice Alert */}
                            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                                <ShieldAlert className="size-4.5 shrink-0 text-amber-600 mt-0.5" />
                                <div>
                                    <strong className="font-extrabold">Branch Isolation Protected:</strong> This restock operation will record inventory batches only for <span className="font-black underline">{currentBranch?.name}</span>. Other branch inventories and customer selling prices will remain untouched.
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8]">
                                    Summary of Incoming Inventory Receipts & Cost Valuation
                                </h5>

                                <div className="border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xs">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#FFF5F7] dark:bg-white/5 border-b border-[#F8C8DC]/40 text-[#5D4A4D] dark:text-[#94A3B8] font-bold">
                                            <tr>
                                                <th className="p-3 pl-4">Ingredient</th>
                                                <th className="p-3">Received Qty</th>
                                                <th className="p-3">Unit Acquisition Cost</th>
                                                <th className="p-3">Total Batch Cost</th>
                                                <th className="p-3">Resulting Stock</th>
                                                <th className="p-3">Est. New WAC</th>
                                                <th className="p-3">Expiration Date</th>
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
                                                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                        {formatCurrency(item.unit_cost)} / {item.unit}
                                                    </td>
                                                    <td className="p-3 font-mono font-black text-[#E75480] dark:text-[#FF4F81]">
                                                        {formatCurrency(item.total_batch_cost)}
                                                    </td>
                                                    <td className="p-3 font-mono">
                                                        <span className="text-[#7D6B6E]">{item.current_stock}</span>
                                                        <span className="mx-1 text-[#E75480]">&rarr;</span>
                                                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                                                            {item.resulting_stock} {item.ingredient.unit}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                                                        {formatCurrency(item.new_wac_display)} / {item.ingredient.unit}
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
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-[#FFF5F7]/80 dark:bg-white/5 border-t border-[#F8C8DC]/60 font-bold">
                                            <tr>
                                                <td colSpan={3} className="p-3 pl-4 text-[#5D4A4D] uppercase text-[11px]">
                                                    Total Batch Investment
                                                </td>
                                                <td className="p-3 font-mono font-black text-sm text-[#E75480] dark:text-[#FF4F81]">
                                                    {formatCurrency(totalAcquisitionCost)}
                                                </td>
                                                <td colSpan={3} className="p-3 text-right text-[11px] text-[#7D6B6E]">
                                                    {preparedReceipts.length} recipe item{preparedReceipts.length > 1 ? 's' : ''} to replenish
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2">
                                <Info className="size-4 shrink-0 text-blue-600" />
                                <span>
                                    These items will be recorded as traceable FIFO/FEFO batches in {currentBranch?.name}'s shared inventory with authoritative acquisition costs and updated weighted average costs.
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
                                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF0F4] dark:bg-white/10 border border-[#E75480]/30 text-xs font-bold text-[#E75480] dark:text-[#FF4F81]">
                                    <Store className="size-3.5" />
                                    <span>Restocked Destination: <strong>{successData?.branch_name || currentBranch?.name}</strong></span>
                                </div>
                            </div>

                            {successData?.receipts && successData.receipts.length > 0 && (
                                <div className="w-full max-w-xl border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl overflow-hidden text-left text-xs mt-2 shadow-sm">
                                    <div className="p-3 bg-[#FFF5F7] dark:bg-white/5 border-b border-[#F8C8DC]/40 font-bold text-[#5D4A4D] flex items-center justify-between">
                                        <span>Recorded Receipts & Inventory Valuation</span>
                                        <span className="text-[11px] font-mono text-[#E75480]">
                                            {successData.receipts.length} Item{successData.receipts.length > 1 ? 's' : ''} Received
                                        </span>
                                    </div>
                                    <div className="divide-y divide-[#F8C8DC]/30 max-h-60 overflow-y-auto">
                                        {successData.receipts.map((r, i) => (
                                            <div key={i} className="p-3 flex items-center justify-between gap-3">
                                                <div>
                                                    <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                        {r.ingredient_name}
                                                    </span>
                                                    <div className="text-[11px] text-[#9E8B8E] flex items-center gap-2 mt-0.5">
                                                        <span>Batch: {r.batch_code || 'Auto-generated'}</span>
                                                        {r.purchase_price !== undefined && Number(r.purchase_price) > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="font-mono text-[#5D4A4D] dark:text-[#CBD5E1]">
                                                                    Batch Cost: {formatCurrency(Number(r.purchase_price))}
                                                                    {r.unit_cost !== undefined && Number(r.unit_cost) > 0 && (
                                                                        <span className="ml-1 opacity-80">({formatCurrency(Number(r.unit_cost))} / {r.unit})</span>
                                                                    )}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right font-mono">
                                                    <span className="font-bold text-emerald-600 block">
                                                        +{r.quantity} {r.unit}
                                                    </span>
                                                    <span className="text-[11px] text-[#7D6B6E] block">
                                                        New Stock: {r.new_stock} {r.stock_unit}
                                                    </span>
                                                    {r.cost_per_unit !== undefined && Number(r.cost_per_unit) > 0 && (
                                                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">
                                                            New WAC: {formatCurrency(Number(r.cost_per_unit))} / {r.stock_unit}
                                                        </span>
                                                    )}
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
                                        <span>Confirm Restock to {currentBranch?.name} ({preparedReceipts.length} Items)</span>
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
