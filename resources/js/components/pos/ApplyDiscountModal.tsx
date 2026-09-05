import {
    AlertCircle,
    BadgePercent,
    Check,
    DollarSign,
    Layers,
    Percent,
    Tag,
    Trash2,
    UserCheck,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, formatCurrency } from '@/lib/utils';

export interface PosCartItem {
    id: number;
    name: string;
    selling_price: number;
    quantity: number;
    image_url?: string | null;
    [key: string]: unknown;
}

export type DiscountType =
    | 'twenty_percent'
    | 'five_percent'
    | 'custom'
    // Legacy backward compatibility
    | 'senior_citizen'
    | 'pwd'
    | 'solo_parent'
    | 'national_athlete'
    | 'employee'
    | 'custom_percentage'
    | 'custom_fixed';

export interface PosDiscount {
    type: DiscountType;
    typeName: string;
    percentage: number;
    fixedAmount?: number;
    discountAmount: number;
    customerName: string;
    idNumber: string;
    eligibleItemIds: number[]; // empty means all items
    notes?: string;
    mode?: 'percentage' | 'fixed';
}

interface ApplyDiscountModalProps {
    open: boolean;
    onClose: () => void;
    cart: PosCartItem[];
    currentDiscount: PosDiscount | null;
    onApplyDiscount: (discount: PosDiscount) => void;
    onRemoveDiscount: () => void;
}

const DISCOUNT_PRESETS: {
    type: 'twenty_percent' | 'five_percent' | 'custom';
    label: string;
    sublabel: string;
    defaultRate: number;
    requiresId: boolean;
    idLabel: string;
}[] = [
    {
        type: 'twenty_percent',
        label: '20% Discount',
        sublabel: 'Senior Citizen / PWD / Solo Parent / Athlete',
        defaultRate: 20,
        requiresId: true,
        idLabel: 'Customer / Statutory ID No.',
    },
    {
        type: 'five_percent',
        label: '5% Discount',
        sublabel: 'Promotional & Special Discounts',
        defaultRate: 5,
        requiresId: false,
        idLabel: 'Promo Code / Reference No.',
    },
    {
        type: 'custom',
        label: 'Custom Discount',
        sublabel: 'Custom percentage or fixed amount',
        defaultRate: 10,
        requiresId: false,
        idLabel: 'Approval / Reference No.',
    },
];

interface FormProps {
    cart: PosCartItem[];
    currentDiscount: PosDiscount | null;
    onApplyDiscount: (discount: PosDiscount) => void;
    onRemoveDiscount: () => void;
    onClose: () => void;
}

function resolveInitialType(type?: DiscountType): 'twenty_percent' | 'five_percent' | 'custom' {
    if (!type) return 'twenty_percent';
    if (type === 'five_percent') return 'five_percent';
    if (type === 'custom' || type === 'custom_percentage' || type === 'custom_fixed') return 'custom';
    return 'twenty_percent';
}

function ApplyDiscountForm({
    cart,
    currentDiscount,
    onApplyDiscount,
    onRemoveDiscount,
    onClose,
}: FormProps) {
    const [selectedType, setSelectedType] = useState<'twenty_percent' | 'five_percent' | 'custom'>(() =>
        resolveInitialType(currentDiscount?.type)
    );

    const [customMode, setCustomMode] = useState<'percentage' | 'fixed'>(() => {
        if (currentDiscount?.type === 'custom_fixed' || (currentDiscount?.fixedAmount && currentDiscount.fixedAmount > 0)) {
            return 'fixed';
        }
        return 'percentage';
    });

    const [ratePercent, setRatePercent] = useState<number>(() => currentDiscount?.percentage ?? 20);
    const [fixedAmount, setFixedAmount] = useState<number>(() => currentDiscount?.fixedAmount ?? 0);
    const [customerName, setCustomerName] = useState<string>(() => currentDiscount?.customerName ?? '');
    const [idNumber, setIdNumber] = useState<string>(() => currentDiscount?.idNumber ?? '');
    const [notes, setNotes] = useState<string>(() => currentDiscount?.notes ?? '');
    const [applyToAll, setApplyToAll] = useState<boolean>(() => !currentDiscount?.eligibleItemIds || currentDiscount.eligibleItemIds.length === 0);
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>(() =>
        currentDiscount?.eligibleItemIds && currentDiscount.eligibleItemIds.length > 0
            ? currentDiscount.eligibleItemIds
            : cart.map((i) => i.id)
    );
    const [error, setError] = useState<string | null>(null);

    const activePreset = useMemo(
        () => DISCOUNT_PRESETS.find((p) => p.type === selectedType) || DISCOUNT_PRESETS[0],
        [selectedType]
    );

    const handleTypeChange = (type: 'twenty_percent' | 'five_percent' | 'custom') => {
        setSelectedType(type);
        const preset = DISCOUNT_PRESETS.find((p) => p.type === type);
        if (preset) {
            if (type === 'twenty_percent') {
                setRatePercent(20);
            } else if (type === 'five_percent') {
                setRatePercent(5);
            } else if (type === 'custom') {
                if (customMode === 'percentage' && (ratePercent === 20 || ratePercent === 5)) {
                    setRatePercent(10);
                }
            }
        }
        setError(null);
    };

    const eligibleSubtotal = useMemo(() => {
        if (applyToAll || selectedItemIds.length === 0) {
            return cart.reduce((acc, it) => acc + (Number(it.selling_price) * Number(it.quantity)), 0);
        }
        return cart
            .filter((it) => selectedItemIds.includes(it.id))
            .reduce((acc, it) => acc + (Number(it.selling_price) * Number(it.quantity)), 0);
    }, [cart, applyToAll, selectedItemIds]);

    // Validation for Fixed Discount exceeding Subtotal (Item #1)
    const isFixedMode = selectedType === 'custom' && customMode === 'fixed';
    const isFixedExceedingSubtotal = isFixedMode && fixedAmount > eligibleSubtotal;

    const calculatedDiscountAmount = useMemo(() => {
        if (selectedType === 'twenty_percent') {
            return (eligibleSubtotal * 20) / 100;
        }
        if (selectedType === 'five_percent') {
            return (eligibleSubtotal * 5) / 100;
        }
        // Custom
        if (customMode === 'fixed') {
            return Math.min(eligibleSubtotal, Math.max(0, Number(fixedAmount || 0)));
        }
        const rate = Math.min(100, Math.max(0, Number(ratePercent || 0)));
        return (eligibleSubtotal * rate) / 100;
    }, [eligibleSubtotal, selectedType, customMode, fixedAmount, ratePercent]);

    const netSubtotal = Math.max(0, eligibleSubtotal - calculatedDiscountAmount);

    const toggleItemSelection = (id: number) => {
        setSelectedItemIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (cart.length === 0) {
            setError('Cart is empty. Cannot apply discount.');
            return;
        }

        if (isFixedExceedingSubtotal) {
            setError(`Fixed discount (₱${fixedAmount.toFixed(2)}) cannot exceed the eligible subtotal (₱${eligibleSubtotal.toFixed(2)}).`);
            return;
        }

        if (activePreset.requiresId) {
            if (!customerName.trim()) {
                setError('Customer Name is required for 20% statutory discounts.');
                return;
            }
            if (!idNumber.trim()) {
                setError(`${activePreset.idLabel} is required for 20% statutory discounts.`);
                return;
            }
        }

        if (!applyToAll && selectedItemIds.length === 0) {
            setError('Please select at least one eligible item for the discount.');
            return;
        }

        if (calculatedDiscountAmount <= 0) {
            setError('Discount amount must be greater than ₱0.00.');
            return;
        }

        onApplyDiscount({
            type: selectedType,
            typeName: selectedType === 'custom' 
                ? (customMode === 'fixed' ? `Custom (₱${fixedAmount.toFixed(2)})` : `Custom (${ratePercent}%)`)
                : activePreset.label,
            percentage: isFixedMode ? 0 : (selectedType === 'twenty_percent' ? 20 : (selectedType === 'five_percent' ? 5 : ratePercent)),
            fixedAmount: isFixedMode ? fixedAmount : undefined,
            discountAmount: calculatedDiscountAmount,
            customerName: customerName.trim(),
            idNumber: idNumber.trim(),
            eligibleItemIds: applyToAll ? [] : selectedItemIds,
            notes: notes.trim(),
            mode: selectedType === 'custom' ? customMode : 'percentage',
        });

        onClose();
    };

    return (
        <form onSubmit={handleApply} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in duration-200">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {isFixedExceedingSubtotal && !error && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-amber-700 dark:text-amber-300 text-xs font-bold animate-in fade-in duration-200">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>Fixed discount amount (₱{Number(fixedAmount || 0).toFixed(2)}) cannot exceed the eligible subtotal (₱{Number(eligibleSubtotal).toFixed(2)}).</span>
                </div>
            )}

            {/* Discount Type 3-Card Grid */}
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                    Discount Type
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {DISCOUNT_PRESETS.map((preset) => {
                        const isSelected = selectedType === preset.type;
                        return (
                            <button
                                key={preset.type}
                                type="button"
                                onClick={() => handleTypeChange(preset.type)}
                                className={cn(
                                    'p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer text-xs font-bold',
                                    isSelected
                                        ? 'bg-[#E75480]/10 dark:bg-[#FF4F81]/15 border-[#E75480] dark:border-[#FF4F81] text-[#E75480] dark:text-[#FF4F81] shadow-xs ring-1 ring-[#E75480]/30'
                                        : 'bg-[#FFF5F7]/50 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:border-[#E75480]/40'
                                )}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-1.5">
                                        {preset.type === 'twenty_percent' ? (
                                            <UserCheck className="size-4 shrink-0 text-[#E75480] dark:text-[#FF4F81]" />
                                        ) : preset.type === 'five_percent' ? (
                                            <Percent className="size-4 shrink-0 text-emerald-500" />
                                        ) : (
                                            <Tag className="size-4 shrink-0 text-amber-500" />
                                        )}
                                        <span className="font-extrabold">{preset.label}</span>
                                    </div>
                                    {isSelected && <Check className="size-4 shrink-0 text-[#E75480] dark:text-[#FF4F81]" />}
                                </div>
                                <span className="text-[10px] font-medium text-[#7D6B6E] dark:text-[#94A3B8] leading-tight">
                                    {preset.sublabel}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Custom Discount Configuration Options */}
            {selectedType === 'custom' && (
                <div className="p-4 rounded-2xl bg-[#FFF5F7]/80 dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                            Custom Mode
                        </Label>
                        <div className="flex items-center gap-1 bg-white dark:bg-[#121218] p-1 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setCustomMode('percentage')}
                                className={cn(
                                    'px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer',
                                    customMode === 'percentage'
                                        ? 'bg-[#E75480] text-white shadow-xs'
                                        : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E]'
                                )}
                            >
                                <Percent className="size-3" /> Percentage (%)
                            </button>
                            <button
                                type="button"
                                onClick={() => setCustomMode('fixed')}
                                className={cn(
                                    'px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer',
                                    customMode === 'fixed'
                                        ? 'bg-[#E75480] text-white shadow-xs'
                                        : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E]'
                                )}
                            >
                                <DollarSign className="size-3" /> Fixed Amount (₱)
                            </button>
                        </div>
                    </div>

                    {customMode === 'percentage' ? (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-[#94A3B8]">
                                Discount Percentage (%)
                            </Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={ratePercent || ''}
                                    onChange={(e) => setRatePercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                                    className="pr-8 rounded-xl font-mono font-bold"
                                    placeholder="10"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7D6B6E]">%</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Fixed Amount (₱)
                                </Label>
                                <span className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] font-mono">
                                    Max: {formatCurrency(eligibleSubtotal)}
                                </span>
                            </div>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={fixedAmount || ''}
                                    onChange={(e) => setFixedAmount(Number(e.target.value))}
                                    className={cn(
                                        "pl-8 rounded-xl font-mono font-bold",
                                        isFixedExceedingSubtotal && "border-rose-500 focus-visible:ring-rose-500"
                                    )}
                                    placeholder="30.00"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7D6B6E]">₱</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Customer & ID Details */}
            <div className="p-4 rounded-2xl bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-1.5">
                        <UserCheck className="size-3.5 text-[#E75480]" />
                        <span>Customer / ID Details</span>
                    </h4>
                    {activePreset.requiresId ? (
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                            Required for BIR Audit
                        </span>
                    ) : (
                        <span className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] font-bold">
                            Optional Reference
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                            Customer Name {activePreset.requiresId && <span className="text-rose-500">*</span>}
                        </Label>
                        <Input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. Juan dela Cruz"
                            className="h-9 rounded-xl text-xs"
                            required={activePreset.requiresId}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                            {activePreset.idLabel} {activePreset.requiresId && <span className="text-rose-500">*</span>}
                        </Label>
                        <Input
                            type="text"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            placeholder="e.g. SC-10294-A"
                            className="h-9 rounded-xl text-xs font-mono"
                            required={activePreset.requiresId}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                        Reference Notes / Authorized By
                    </Label>
                    <Input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Validated by Cashier Staff"
                        className="h-9 rounded-xl text-xs"
                    />
                </div>
            </div>

            {/* Eligible Items Selector */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] flex items-center gap-1.5">
                        <Layers className="size-3.5 text-[#E75480]" />
                        <span>Eligible Items</span>
                    </Label>
                    <div className="flex items-center gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => {
                                setApplyToAll(true);
                                setSelectedItemIds(cart.map((i) => i.id));
                            }}
                            className={cn(
                                'px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer',
                                applyToAll
                                    ? 'bg-[#E75480] text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-white/5 text-[#7D6B6E] hover:text-[#3D2C2E]'
                            )}
                        >
                            All Items ({cart.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setApplyToAll(false)}
                            className={cn(
                                'px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer',
                                !applyToAll
                                    ? 'bg-[#E75480] text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-white/5 text-[#7D6B6E] hover:text-[#3D2C2E]'
                            )}
                        >
                            Select Specific
                        </button>
                    </div>
                </div>

                {!applyToAll && (
                    <div className="p-2 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 max-h-36 overflow-y-auto space-y-1 bg-white dark:bg-[#181820]">
                        {cart.map((item) => {
                            const isChecked = selectedItemIds.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItemSelection(item.id)}
                                    className={cn(
                                        'p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors',
                                        isChecked
                                            ? 'bg-[#FFF5F7] dark:bg-white/10 font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-[#7D6B6E]'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}}
                                            className="size-3.5 accent-[#E75480] rounded"
                                        />
                                        <span>{item.name} (x{item.quantity})</span>
                                    </div>
                                    <span className="font-mono">{formatCurrency(Number(item.selling_price) * Number(item.quantity))}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 space-y-2">
                <div className="flex justify-between text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                    <span>Eligible Subtotal:</span>
                    <span className="font-bold font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">
                        {formatCurrency(eligibleSubtotal)}
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                        <Tag className="size-4" />
                        <span>Discount Amount:</span>
                    </span>
                    <span className="font-mono text-lg font-black">
                        -{formatCurrency(calculatedDiscountAmount)}
                    </span>
                </div>
                <div className="pt-2 border-t border-emerald-500/20 flex justify-between text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                    <span>Net Items Total:</span>
                    <span className="font-mono font-extrabold text-sm">
                        {formatCurrency(netSubtotal)}
                    </span>
                </div>
            </div>

            {/* Dialog Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
                {currentDiscount ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            onRemoveDiscount();
                            onClose();
                        }}
                        className="h-11 px-4 rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 cursor-pointer font-bold text-xs"
                    >
                        <Trash2 className="size-4" />
                        <span>REMOVE DISCOUNT</span>
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="h-11 px-5 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] hover:bg-[#FFF5F7] dark:hover:bg-white/5 cursor-pointer"
                    >
                        CANCEL
                    </Button>
                )}

                <div className="flex items-center gap-2">
                    {currentDiscount && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-11 px-4 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] hover:bg-[#FFF5F7] dark:hover:bg-white/5 cursor-pointer"
                        >
                            CANCEL
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isFixedExceedingSubtotal}
                        className="h-11 px-6 rounded-xl bg-[#E75480] hover:bg-[#E75480]/90 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="size-4" />
                        <span>APPLY DISCOUNT</span>
                    </Button>
                </div>
            </div>
        </form>
    );
}

export function ApplyDiscountModal({
    open,
    onClose,
    cart,
    currentDiscount,
    onApplyDiscount,
    onRemoveDiscount,
}: ApplyDiscountModalProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl bg-white dark:bg-[#121218] border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xl">
                {/* Header */}
                <div className="p-6 bg-linear-to-r from-[#FFF5F7] to-white dark:from-[#181824] dark:to-[#121218] border-b border-[#F8C8DC]/60 dark:border-white/10 relative">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-[#E75480]/10 dark:bg-[#FF4F81]/15 text-[#E75480] dark:text-[#FF4F81] border border-[#E75480]/20 flex items-center justify-center shadow-xs">
                            <BadgePercent className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                Apply Discount
                            </DialogTitle>
                            <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                Select statutory 20%, 5% promo, or custom discount and enter customer details
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {open && (
                    <ApplyDiscountForm
                        key={currentDiscount ? `${currentDiscount.type}_${currentDiscount.discountAmount}_${currentDiscount.idNumber}` : 'new_discount'}
                        cart={cart}
                        currentDiscount={currentDiscount}
                        onApplyDiscount={onApplyDiscount}
                        onRemoveDiscount={onRemoveDiscount}
                        onClose={onClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
