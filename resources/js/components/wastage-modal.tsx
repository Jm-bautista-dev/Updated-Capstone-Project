import React, { useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FiAlertTriangle, FiTrash2, FiInfo } from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface WastageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
    type: 'ingredient' | 'product';
}

export function WastageModal({ open, onOpenChange, item, type }: WastageModalProps) {
    const { currentBranchId } = usePage().props as any;

    const { data, setData, post, processing, reset, errors } = useForm({
        type: type,
        id: item?.id,
        quantity: '',
        unit: item?.unit || (type === 'product' ? 'pcs' : 'g'),
        reason: 'expired',
        notes: '',
    });

    useEffect(() => {
        if (open && item) {
            setData({
                type: type,
                id: item.id,
                quantity: '',
                unit: item.unit || (type === 'product' ? 'pcs' : 'g'),
                reason: 'expired',
                notes: '',
            });
        }
    }, [open, item, type]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/wastage', {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden rounded-[1.5rem] p-0 border-none shadow-2xl">
                <div className="bg-rose-500/5 p-6 pb-4 border-b border-rose-500/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                            <FiTrash2 className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tighter uppercase italic text-rose-600">Log Wastage</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">Record inventory loss due to spoilage or damage.</DialogDescription>
                        </div>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5">
                    <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-dashed border-rose-500/20">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em]">Item Specification</span>
                            <span className="font-black text-sm italic uppercase tracking-tight">{item.name}</span>
                        </div>
                        <Badge variant="outline" className="bg-background font-black text-[10px] py-1 border-rose-200 text-rose-600 uppercase tracking-widest">
                            {item.stock} {item.unit} ON HAND
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Waste Quantity</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={data.quantity}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('quantity', e.target.value)}
                                className={cn(
                                    "h-11 rounded-xl bg-muted/20 border-none ring-1 font-black text-lg transition-all",
                                    errors.quantity ? "ring-destructive bg-destructive/5" : "ring-border focus:ring-rose-500/50"
                                )}
                                placeholder="0.00"
                            />
                            {errors.quantity && <p className="text-[9px] text-destructive font-black uppercase tracking-widest ml-1">{errors.quantity}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Measurement</label>
                            <Select value={data.unit} onValueChange={(v) => setData('unit', v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none ring-1 ring-border font-black text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl font-bold">
                                    {type === 'product' ? (
                                        <SelectItem value="pcs">pcs</SelectItem>
                                    ) : (
                                        <>
                                            <SelectItem value="g">g (Grams)</SelectItem>
                                            <SelectItem value="kg">kg (Kilograms)</SelectItem>
                                            <SelectItem value="ml">ml (Milliliters)</SelectItem>
                                            <SelectItem value="L">L (Liters)</SelectItem>
                                            <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Primary Reason</label>
                            <Select value={data.reason} onValueChange={(v) => setData('reason', v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none ring-1 ring-border font-black text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl font-bold">
                                    <SelectItem value="expired">Expired / Soursed</SelectItem>
                                    <SelectItem value="spilled">Spilled / Wasted</SelectItem>
                                    <SelectItem value="damaged">Damaged Packaging</SelectItem>
                                    <SelectItem value="other">Other / Manual Adjustment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Additional Notes</label>
                            <Textarea 
                                value={data.notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                                placeholder="Explain what happened..."
                                className="min-h-[80px] rounded-xl bg-muted/20 border-none ring-1 ring-border focus:ring-rose-500/50 font-medium text-xs resize-none"
                            />
                        </div>
                    </div>

                    <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl flex gap-3">
                        <FiInfo className="size-4 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-rose-700/70 font-bold leading-tight uppercase">
                            Warning: This action will permanently deduct stock and record a financial loss in the analytics module.
                        </p>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={() => { onOpenChange(false); reset(); }} className="rounded-xl h-11 font-black uppercase text-[10px] tracking-widest italic">Dismiss</Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.quantity || Number(data.quantity) <= 0}
                            className={cn(
                                "rounded-xl h-11 flex-1 shadow-lg font-black uppercase text-[10px] tracking-widest italic active:scale-95 transition-all gap-2",
                                processing ? "bg-muted text-muted-foreground" : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                            )}
                        >
                            {processing ? 'Processing Destruction...' : 'Confirm Wastage Loss'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
