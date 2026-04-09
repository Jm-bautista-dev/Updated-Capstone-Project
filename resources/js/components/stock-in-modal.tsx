import React, { useState, useMemo, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import inventory from '@/routes/inventory';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FiPackage, FiTruck, FiArrowRight } from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface StockInModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
    type: 'ingredient' | 'product';
}

export function StockInModal({ open, onOpenChange, item, type }: StockInModalProps) {
    const { isAdmin, branches, currentBranchId } = usePage().props as any;
    
    // Default to user's branch if not admin, or first available branch
    const defaultBranchId = isAdmin ? (currentBranchId ? String(currentBranchId) : String(branches?.[0]?.id)) : String(currentBranchId);

    const { data, setData, post, processing, reset, errors } = useForm({
        type: type,
        id: item?.id,
        quantity: '',
        unit: item?.unit || (type === 'product' ? 'pcs' : 'g'),
        branch_id: defaultBranchId,
    });

    // Sync form data when item changes or modal opens
    useEffect(() => {
        if (open && item) {
            setData({
                type: type,
                id: item.id,
                quantity: '',
                unit: item.unit || (type === 'product' ? 'pcs' : 'g'),
                branch_id: defaultBranchId,
            });
        }
    }, [open, item, type, defaultBranchId]);

    // Units options based on type
    const units = useMemo(() => {
        if (type === 'product') return ['pcs'];
        // For ingredients, we support mass or volume
        const isLiquid = (item as any)?.type === 'liquid';
        return isLiquid ? ['L', 'ml'] : ['kg', 'g', 'pcs'];
    }, [type, item]);

    // Conversion preview
    const preview = useMemo(() => {
        const qty = parseFloat(data.quantity);
        if (isNaN(qty) || qty <= 0) return null;

        let baseQty = qty;
        let baseUnit = data.unit;

        if (data.unit === 'kg') {
            baseQty = qty * 1000;
            baseUnit = 'g';
        } else if (data.unit === 'L') {
            baseQty = qty * 1000;
            baseUnit = 'ml';
        }

        return { baseQty: baseQty.toFixed(2), baseUnit };
    }, [data.quantity, data.unit]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(inventory.stockIn.url(), {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden rounded-[1.5rem] p-0">
                <div className="bg-primary/5 p-6 pb-4 border-b">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FiTruck className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight uppercase">Restock {type}</DialogTitle>
                            <DialogDescription className="text-xs font-medium">Add incoming stock to your inventory records.</DialogDescription>
                        </div>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5">
                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl border border-dashed border-muted-foreground/20">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Item Identifying</span>
                            <span className="font-bold text-sm truncate max-w-[200px]">{item.name}</span>
                        </div>
                        <Badge variant="outline" className="bg-background font-mono text-[10px] py-1 border-primary/20 text-primary">
                            CURRENT: {item.stock} {item.unit || 'units'}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {isAdmin && (
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Destination Branch</label>
                                <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)}>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none ring-1 ring-muted">
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {branches?.map((b: any) => (
                                            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Quantity Received</label>
                            <Input
                                type="number"
                                step="0.0001"
                                required
                                value={data.quantity}
                                onChange={(e) => setData('quantity', e.target.value)}
                                className="h-11 rounded-xl bg-muted/20 border-none ring-1 ring-muted font-bold text-lg"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Receipt Unit</label>
                            <Select value={data.unit} onValueChange={(v) => setData('unit', v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none ring-1 ring-muted">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {units.map((u) => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {preview && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">System Logic</span>
                                <span className="text-xs font-medium text-emerald-700/70 italic">Normalized conversion</span>
                            </div>
                            <div className="flex items-center gap-2 font-black text-emerald-600">
                                <span>{data.quantity} {data.unit}</span>
                                <FiArrowRight className="size-3" />
                                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-xs">{preview.baseQty} {preview.baseUnit}</span>
                            </div>
                        </div>
                    )}

                    {(errors as any).error && (
                        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold ring-1 ring-destructive/20 animate-in shake-in duration-300">
                            ⚠ {(errors as any).error}
                        </div>
                    )}

                    {/* Catch-all for other validation errors (id, type, etc) */}
                    {Object.keys(errors).length > 0 && !(errors as any).error && (
                        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-[10px] font-bold ring-1 ring-destructive/20">
                            <p className="mb-1 text-xs uppercase tracking-tight">Requirement Failures:</p>
                            <ul className="list-disc list-inside opacity-70">
                                {Object.entries(errors).map(([key, msg]) => (
                                    <li key={key}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold text-muted-foreground">Dismiss</Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.quantity}
                            className="rounded-xl h-12 flex-1 bg-primary shadow-lg shadow-primary/20 font-bold active:scale-95 transition-all"
                        >
                            {processing ? 'Processing...' : 'Confirm Delivery'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
