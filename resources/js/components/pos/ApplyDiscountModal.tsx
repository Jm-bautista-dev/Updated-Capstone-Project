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
    | 'five_percent'
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
    type: DiscountType;
    label: string;
    defaultRate: number;
    isFixed?: boolean;
    requiresId: boolean;
    idLabel: string;
}[] = [
    {
        type: 'five_percent',
        label: '5% Promotional Discount',
        defaultRate: 5,
        requiresId: false,
        idLabel: 'Promo Code / Ref No.',
    },
    {
        type: 'senior_citizen',
        label: 'Senior Citizen (20%)',
        defaultRate: 20,
        requiresId: true,
        idLabel: 'Senior OSCA ID No.',
    },
    {
        type: 'pwd',
        label: 'Person with Disability / PWD (20%)',
        defaultRate: 20,
        requiresId: true,
        idLabel: 'PWD ID No.',
    },
    {
        type: 'solo_parent',
        label: 'Solo Parent (20%)',
        defaultRate: 20,
        requiresId: true,
        idLabel: 'Solo Parent ID No.',
    },
    {
        type: 'national_athlete',
        label: 'National Athlete / Coach (20%)',
        defaultRate: 20,
        requiresId: true,
        idLabel: 'Athlete / Coach ID No.',
    },
    {
        type: 'employee',
        label: 'Employee / Staff Discount',
        defaultRate: 20,
        requiresId: false,
        idLabel: 'Employee ID No.',
    },
    {
        type: 'custom_percentage',
        label: 'Custom Percentage (%)',
        defaultRate: 10,
        requiresId: false,
        idLabel: 'Approval / Reference No.',
    },
    {
        type: 'custom_fixed',
        label: 'Custom Fixed Amount (₱)',
        defaultRate: 0,
        isFixed: true,
        requiresId: false,
        idLabel: 'Approval / Voucher No.',
    },
];

interface FormProps {
    cart: PosCartItem[];
    currentDiscount: PosDiscount | null;
    onApplyDiscount: (discount: PosDiscount) => void;
    onRemoveDiscount: () => void;
    onClose: () => void;
}

function ApplyDiscountForm({
    cart,
    currentDiscount,
    onApplyDiscount,
    onRemoveDiscount,
    onClose,
}: FormProps) {
    const [selectedType, setSelectedType] = useState<DiscountType>(() => currentDiscount?.type || 'senior_citizen');
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

    const handleTypeChange = (type: DiscountType) => {
        setSelectedType(type);
        const preset = DISCOUNT_PRESETS.find((p) => p.type === type);
        if (preset) {
            if (preset.isFixed) {
                setFixedAmount(0);
            } else {
                setRatePercent(preset.defaultRate);
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

    const calculatedDiscountAmount = useMemo(() => {
        if (activePreset.isFixed) {
            return Math.min(eligibleSubtotal, Math.max(0, Number(fixedAmount || 0)));
        }
        const rate = Math.min(100, Math.max(0, Number(ratePercent || 0)));
        return (eligibleSubtotal * rate) / 100;
    }, [eligibleSubtotal, activePreset, fixedAmount, ratePercent]);

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

        if (activePreset.requiresId) {
            if (!customerName.trim()) {
                setError('Customer Name is required for statutory discounts.');
                return;
            }
            if (!idNumber.trim()) {
                setError(`${activePreset.idLabel} is required for statutory discounts.`);
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
            typeName: activePreset.label,
            percentage: activePreset.isFixed ? 0 : ratePercent,
            fixedAmount: activePreset.isFixed ? fixedAmount : undefined,
            discountAmount: calculatedDiscountAmount,
            customerName: customerName.trim(),
            idNumber: idNumber.trim(),
            eligibleItemIds: applyToAll ? [] : selectedItemIds,
            notes: notes.trim(),
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

            {/* Discount Type Dropdown / Grid */}
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                    Discount Type
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DISCOUNT_PRESETS.map((preset) => {
                        const isSelected = selectedType === preset.type;
                        return (
                            <button
                                key={preset.type}
                                type="button"
                                onClick={() => handleTypeChange(preset.type)}
                                className={cn(
                                    'p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer text-xs font-bold',
                                    isSelected
                                        ? 'bg-[#E75480]/10 dark:bg-[#FF4F81]/15 border-[#E75480] dark:border-[#FF4F81] text-[#E75480] dark:text-[#FF4F81] shadow-xs'
                                        : 'bg-[#FFF5F7]/50 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:border-[#E75480]/40'
                                )}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    {preset.requiresId ? (
                                        <UserCheck className="size-4 shrink-0" />
                                    ) : preset.isFixed ? (
                                        <DollarSign className="size-4 shrink-0" />
                                    ) : (
                                        <Percent className="size-4 shrink-0" />
                                    )}
                                    <span className="truncate">{preset.label}</span>
                                </div>
                                {isSelected && <Check className="size-4 shrink-0 text-[#E75480] dark:text-[#FF4F81]" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Rate / Amount Configuration (if customizable) */}
            {activePreset.type === 'custom_percentage' && (
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
                            value={ratePercent}
                            onChange={(e) => setRatePercent(Number(e.target.value))}
                            className="pr-8 rounded-xl font-mono font-bold"
                            placeholder="20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7D6B6E]">%</span>
                    </div>
                </div>
            )}

            {activePreset.type === 'custom_fixed' && (
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-[#94A3B8]">
                        Fixed Discount Amount (₱)
                    </Label>
                    <div className="relative">
                        <Input
                            type="number"
                            min="1"
                            step="any"
                            value={fixedAmount || ''}
                            onChange={(e) => setFixedAmount(Number(e.target.value))}
                            className="pl-8 rounded-xl font-mono font-bold"
                            placeholder="50.00"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7D6B6E]">₱</span>
                    </div>
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
                        className="h-11 px-6 rounded-xl bg-[#E75480] hover:bg-[#E75480]/90 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer gap-2"
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
                                Select statutory, employee, or custom discount and enter customer ID details
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
