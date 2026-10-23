import { useForm, usePage } from '@inertiajs/react';
import React, { useMemo, useEffect, useState } from 'react';
import { FiPackage, FiTruck, FiArrowRight, FiCalendar, FiAlertCircle, FiCheck, FiInfo } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { getCompatibleUnits, convertToBaseQuantity, normalizeUnit } from '@/lib/unit-converter';
import { cn } from '@/lib/utils';
import inventory from '@/routes/inventory';

interface StockInItem {
    id: number;
    name: string;
    stock: number;
    unit?: string;
    branch_id?: number | string;
    type?: string;
    requires_expiration_tracking?: boolean;
    default_expiry_days?: number;
}

interface Branch {
    id: number | string;
    name: string;
}

interface StockInPageProps extends Record<string, unknown> {
    isAdmin?: boolean;
    branches?: Branch[];
    currentBranchId?: number | string;
}

interface StockInModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: StockInItem | null;
    type: 'ingredient' | 'product';
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

export function StockInModal({ open, onOpenChange, item, type }: StockInModalProps) {
    const { isAdmin, branches, currentBranchId } = usePage<StockInPageProps>().props;
    
    // Default to user's branch if not admin, or first available branch
    const defaultBranchId = isAdmin ? (currentBranchId ? String(currentBranchId) : String(branches?.[0]?.id ?? '')) : String(currentBranchId ?? '');

    const [reviewedItemId, setReviewedItemId] = useState<number | null>(null);
    const showSummary = Boolean(open && item && reviewedItemId === item.id);

    const { data, setData, post, processing, reset, errors } = useForm({
        type: type,
        id: item?.id,
        quantity: '',
        unit: item?.unit || (type === 'product' ? 'pcs' : 'g'),
        branch_id: item?.branch_id ? String(item.branch_id) : defaultBranchId,
        purchase_price: '',
        expiration_type: 'use_by',
        expiration_date: '',
        received_at: new Date().toISOString().slice(0, 10),
        notes: '',
        idempotency_token: '',
    });

    // Sync form data when item changes or modal opens
    useEffect(() => {
        if (open && item) {
            setData({
                type: type,
                id: item.id,
                quantity: '',
                unit: item.unit || (type === 'product' ? 'pcs' : 'g'),
                branch_id: item.branch_id ? String(item.branch_id) : defaultBranchId,
                purchase_price: '',
                expiration_type: 'use_by',
                expiration_date: '',
                received_at: new Date().toISOString().slice(0, 10),
                notes: '',
                idempotency_token: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            });
        }
    }, [open, item, type, defaultBranchId, setData]);

    // Units options based on type
    const units = useMemo(() => {
        if (type === 'product') return ['pcs'];
        return getCompatibleUnits(item?.unit || 'g');
    }, [type, item]);

    // Conversion preview
    const preview = useMemo(() => {
        const qty = parseFloat(data.quantity);
        if (isNaN(qty) || qty <= 0) return null;

        const baseQty = convertToBaseQuantity(qty, data.unit);
        const baseUnit = normalizeUnit(data.unit);
        const price = parseFloat(data.purchase_price);
        const unitCost = !isNaN(price) && baseQty > 0 ? price / baseQty : null;

        return {
            baseQty: Number(baseQty.toFixed(4)),
            baseUnit,
            unitCost,
        };
    }, [data.quantity, data.unit, data.purchase_price]);

    const isPerishable = data.expiration_type !== 'none';
    const requiresExpiry = Boolean(item?.requires_expiration_tracking);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(inventory.stockIn.url(), {
            onSuccess: () => {
                reset();
                setReviewedItemId(null);
                onOpenChange(false);
            },
        });
    };

    if (!item) return null;

    const errorRecord = errors as Record<string, string>;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 font-['Outfit']">
                {/* Header Banner */}
                <div className="bg-linear-to-r from-[#FFF5F7] to-[#FADADD]/40 dark:from-[#181822] dark:to-[#222232] p-6 pb-5 border-b border-[#F8C8DC]/40 dark:border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-11 rounded-2xl bg-[#E75480]/15 dark:bg-[#FF4F81]/15 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81]">
                            <FiTruck className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight text-[#3D2C2E] dark:text-[#F8FAFC]">
                                Restock & Batch Intake ({type})
                            </DialogTitle>
                            <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                Traceable receipt registered directly into the branch FEFO/FIFO queue.
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Operational explanation badge */}
                    <div className="mt-3 flex items-start gap-2.5 p-3 rounded-2xl bg-white/80 dark:bg-[#121218]/80 border border-[#F8C8DC]/50 dark:border-white/10 text-xs text-[#5D4A4D] dark:text-[#CBD5E1]">
                        <FiInfo className="size-4 text-[#E75480] dark:text-[#FF4F81] shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                            <span className="font-bold text-[#E75480] dark:text-[#FF4F81]">How the queue works:</span> Each stock-in is tracked as a separate batch so the system can prioritize ingredients with the earliest expiration dates.
                        </p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5">
                    {/* Item Identification Card */}
                    <div className="flex items-center justify-between bg-white dark:bg-[#181822] p-4 rounded-2xl border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-[#9E8B8E] dark:text-[#64748B] tracking-wider">Item Details</span>
                            <span className="font-black text-base text-[#3D2C2E] dark:text-[#F8FAFC] truncate max-w-64">{item.name}</span>
                        </div>
                        <Badge variant="outline" className="bg-[#FFF5F7] dark:bg-[#181820] font-mono text-xs px-3 py-1 border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#FF4F81] font-bold">
                            CURRENT: {item.stock} {item.unit || 'units'}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Destination Branch */}
                        {isAdmin && (
                            <div className="col-span-1 sm:col-span-2 space-y-1.5">
                                <label className="text-[11px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Destination Branch</label>
                                <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)}>
                                    <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-[#181822] border-[#F8C8DC]/40 dark:border-white/10 font-bold">
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {branches?.map((b: Branch) => (
                                            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Quantity Received */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Quantity Received *</label>
                            <Input
                                type="number"
                                step="0.0001"
                                min="0.0001"
                                max="1000000"
                                required
                                value={data.quantity}
                                onChange={(e) => setData('quantity', e.target.value)}
                                className={cn(
                                    "h-11 rounded-xl bg-white dark:bg-[#181822] border-[#F8C8DC]/40 dark:border-white/10 font-mono font-bold text-base transition-all",
                                    errors.quantity ? "border-rose-500 ring-rose-500/20" : ""
                                )}
                                placeholder="0.00"
                            />
                            {errors.quantity && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.quantity}</p>}
                        </div>

                        {/* Unit Selection */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Receipt Unit *</label>
                            <Select value={data.unit} onValueChange={(v) => setData('unit', v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-[#181822] border-[#F8C8DC]/40 dark:border-white/10 font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {units.map((u) => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Expiration Tracking Policy */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Expiration Policy</label>
                            <Select value={data.expiration_type} onValueChange={(v) => setData('expiration_type', v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-[#181822] border-[#F8C8DC]/40 dark:border-white/10 text-xs font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="use_by">Use-By / Expiration Date (Strict FEFO)</SelectItem>
                                    <SelectItem value="best_before">Best-Before Date (Food Safety)</SelectItem>
                                    <SelectItem value="none">Non-Perishable / No Expiration (FIFO)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Expiration Date Picker */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8] flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <FiCalendar className="size-3 text-[#E75480]" />
                                    <span>Expiration Date {isPerishable && requiresExpiry ? '*' : ''}</span>
                                </span>
                                {!isPerishable && <span className="text-[9px] text-[#9E8B8E] lowercase italic">(non-perishable)</span>}
                            </label>
                            <Input
                                type="date"
                                disabled={!isPerishable}
                                value={data.expiration_date}
                                onChange={(e) => setData('expiration_date', e.target.value)}
                                className={cn(
                                    "h-11 rounded-xl bg-white dark:bg-[#181822] border-[#F8C8DC]/40 dark:border-white/10 font-bold text-xs",
                                    !isPerishable && "opacity-50 cursor-not-allowed bg-muted/40",
                                    errors.expiration_date ? "border-rose-500 ring-rose-500/20" : ""
                                )}
                            />
                            {errors.expiration_date && (
                                <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.expiration_date}</p>
                            )}
                        </div>

                        {/* Batch Acquisition Cost */}
                        {type === 'ingredient' && (
                            <div className="col-span-1 sm:col-span-2 space-y-1.5">
                                <label className="text-[11px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Total Batch Acquisition Cost</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8B8E] dark:text-[#64748B] font-bold">₱</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.purchase_price}
                                        onChange={(e) => setData('purchase_price', e.target.value)}
                                        className="h-11 pl-9 rounded-xl bg-white dark:bg-[#181822] border-[#F8C8DC]/40 dark:border-white/10 font-mono font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-[10px] text-[#9E8B8E] dark:text-[#64748B] ml-1">
                                    Updates acquisition records and weighted cost without mutating historical transaction prices.
                                </p>
                            </div>
                        )}

                        {/* Delivery Notes */}
                        <div className="col-span-1 sm:col-span-2 space-y-1.5">
                            <label className="text-[11px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Receiving Notes / Discrepancies</label>
                            <Input
                                type="text"
                                maxLength={500}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="h-11 rounded-xl bg-white dark:bg-[#181822] border-[#F8C8DC]/40 dark:border-white/10 text-xs"
                                placeholder="Optional packaging condition, delivery invoice number, or inspector notes"
                            />
                        </div>
                    </div>

                    {/* Conversion & Unit Cost Preview */}
                    {preview && (
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Normalized Base Units</span>
                                <span className="text-xs font-semibold text-emerald-700/80 dark:text-emerald-300/80">
                                    Standardized for atomic recipe calculations
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                                    <span>{data.quantity} {data.unit}</span>
                                    <FiArrowRight className="size-3.5" />
                                    <span className="bg-emerald-600 dark:bg-emerald-500 text-white px-2.5 py-1 rounded-lg">
                                        {preview.baseQty} {preview.baseUnit}
                                    </span>
                                </div>
                                {preview.unitCost !== null && (
                                    <Badge variant="outline" className="border-emerald-500/30 font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                                        {formatCurrency(preview.unitCost)} / {preview.baseUnit}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pre-Confirmation Summary Card */}
                    {showSummary && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                                <FiAlertCircle className="size-4" />
                                <span>Proposed Stock-In Confirmation Summary</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-[#5D4A4D] dark:text-[#CBD5E1]">
                                <div><span className="font-bold">Item:</span> {item.name}</div>
                                <div><span className="font-bold">Batch Tracking:</span> Auto-assigned (Queue)</div>
                                <div><span className="font-bold">Quantity:</span> {data.quantity} {data.unit} ({preview?.baseQty} {preview?.baseUnit})</div>
                                <div><span className="font-bold">Expiry Policy:</span> {data.expiration_type === 'none' ? 'Non-perishable (FIFO)' : (data.expiration_date || 'None')}</div>
                            </div>
                            <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 italic pt-1">
                                Once confirmed, this delivery will be assigned a permanent traceable batch code and immediately prioritized in the active consumption queue.
                            </p>
                        </div>
                    )}

                    {/* Error Alerts */}
                    {errorRecord.error && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                            <FiAlertCircle className="size-4 shrink-0" />
                            <span>{errorRecord.error}</span>
                        </div>
                    )}

                    {Object.keys(errors).length > 0 && !errorRecord.error && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-1 font-bold">
                            <p className="text-[11px] uppercase">Please review the following requirements:</p>
                            <ul className="list-disc list-inside text-[11px] font-normal opacity-90">
                                {Object.entries(errors).map(([k, v]) => (
                                    <li key={k}>{v}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Dialog Footer Actions */}
                    <DialogFooter className="pt-2 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { onOpenChange(false); setReviewedItemId(null); reset(); }}
                            className="rounded-2xl h-12 font-bold text-[#7D6B6E] dark:text-[#94A3B8] cursor-pointer"
                        >
                            Cancel
                        </Button>

                        {!showSummary ? (
                            <Button
                                type="button"
                                onClick={() => setReviewedItemId(item.id)}
                                disabled={!data.quantity || Number(data.quantity) <= 0 || (isPerishable && requiresExpiry && !data.expiration_date)}
                                className="rounded-2xl h-12 flex-1 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white font-bold cursor-pointer shadow-xs gap-2"
                            >
                                <FiArrowRight className="size-4" />
                                <span>Review Batch Summary</span>
                            </Button>
                        ) : (
                            <div className="flex gap-2 flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setReviewedItemId(null)}
                                    className="rounded-2xl h-12 font-bold text-xs cursor-pointer border-[#F8C8DC] dark:border-white/10"
                                >
                                    Modify Details
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !data.quantity || Number(data.quantity) <= 0}
                                    className="rounded-2xl h-12 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-md gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <FiPackage className="size-4 animate-bounce" />
                                            <span>Recording Batch...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="size-4" />
                                            <span>Confirm & Post Receipt</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
