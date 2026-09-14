import axios from 'axios';
import { MinusCircle, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

interface StockReductionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ingredient: InventoryRow | null;
    onSuccess?: () => void;
}

export function StockReductionModal({
    open,
    onOpenChange,
    ingredient,
    onSuccess,
}: StockReductionModalProps) {
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('pcs');
    const [reason, setReason] = useState<string>('damaged');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (open && ingredient) {
            setQuantity('1');
            setUnit(ingredient.unit || 'pcs');
            setReason('damaged');
            setNotes('');
            setErrorMsg(null);
        }
    }, [open, ingredient]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingredient) return;

        const qtyNum = Number(quantity);
        if (qtyNum <= 0) {
            setErrorMsg('Reduction quantity must be greater than zero.');
            return;
        }

        if (qtyNum > ingredient.stock) {
            setErrorMsg(`Reduction quantity (${qtyNum} ${unit}) exceeds available stock (${ingredient.stock} ${ingredient.unit}).`);
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);

        try {
            await axios.post(
                `/inventory/${ingredient.id}/reduce-stock`,
                {
                    quantity: qtyNum,
                    unit,
                    reason,
                    notes,
                    branch_id: ingredient.branch_id,
                },
                { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
            );

            toast.success(`Stock reduced: -${qtyNum} ${unit} from ${ingredient.name}.`);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            let message = 'Failed to reduce stock.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            } else if (axios.isAxiosError(err) && err.response?.data?.error) {
                message = err.response.data.error;
            } else if (axios.isAxiosError(err) && err.response?.data?.errors?.quantity) {
                message = Array.isArray(err.response.data.errors.quantity)
                    ? err.response.data.errors.quantity.join(', ')
                    : String(err.response.data.errors.quantity);
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
            <DialogContent className="sm:max-w-lg rounded-4xl bg-white dark:bg-[#121218] p-6 sm:p-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit'] shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider">
                        <MinusCircle className="size-4" />
                        <span>Manual Stock Reduction</span>
                    </div>
                    <DialogTitle className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Adjust {ingredient.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                        Manually deduct available stock for spoilage, damage, or adjustments. Creates an immutable audit record.
                    </DialogDescription>
                </DialogHeader>

                {errorMsg && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Current Stock Banner */}
                    <div className="p-4 rounded-2xl bg-[#FFF5F7]/70 dark:bg-[#181822] border border-[#F8C8DC]/50 dark:border-white/10 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                Current Available Stock
                            </span>
                            <h4 className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono">
                                {ingredient.stock} {ingredient.unit}
                            </h4>
                        </div>
                        <span className="text-xs font-bold text-[#E75480] dark:text-[#FF4F81] bg-white dark:bg-[#121218] px-3 py-1.5 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs">
                            {ingredient.branch_name || 'Branch Stock'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">
                                Deduct Quantity
                            </label>
                            <Input
                                type="number"
                                step="0.0001"
                                min="0.0001"
                                required
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="0"
                                className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono font-bold text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">
                                Unit
                            </label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full h-12 px-3 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-sm font-bold"
                            >
                                <option value="pcs">pcs</option>
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="liters">L</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">
                            Reason for Reduction
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full h-12 px-3 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-sm font-bold"
                        >
                            <option value="damaged">Damaged</option>
                            <option value="expired">Expired</option>
                            <option value="waste">Kitchen Waste / Trim</option>
                            <option value="spoiled">Spoiled</option>
                            <option value="manual_adjustment">Manual Adjustment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">
                            Operational Notes (Optional)
                        </label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Provide additional details for the management audit log..."
                            rows={3}
                            className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-xs"
                        />
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
                            disabled={submitting}
                            className="rounded-xl h-11 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Applying Reduction...</span>
                                </>
                            ) : (
                                <>
                                    <MinusCircle className="size-4" />
                                    <span>Confirm Stock Reduction</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
