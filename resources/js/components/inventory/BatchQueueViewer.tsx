import axios from 'axios';
import { format } from 'date-fns';
import {
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Layers,
    RefreshCw,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface BatchItem {
    id: number;
    batch_code: string;
    lot_number: string;
    ingredient_id: number;
    branch_id: number;
    supplier_name: string;
    received_at: string | null;
    received_at_formatted: string;
    manufacture_date: string | null;
    expiration_date: string | null;
    expiration_date_formatted: string;
    expiration_type: string;
    expiration_status: 'expired' | 'expiring_today' | 'expiring_soon' | 'valid' | 'no_expiry';
    days_until_expiration: number | null;
    initial_quantity: number;
    initial_quantity_base: number;
    current_quantity: number;
    current_quantity_base: number;
    unit: string;
    cost_per_base_unit: number;
    purchase_price: number;
    status: 'available' | 'depleted' | 'expired' | 'quarantined' | 'recalled' | 'damaged';
    is_eligible: boolean;
    is_legacy: boolean;
    priority: number | null;
    priority_explanation: string;
    notes: string | null;
    reference: string | null;
}

export interface BatchMovement {
    id: number;
    movement_type: string;
    created_at: string;
    quantity: number;
    unit: string;
    new_batch_quantity: number;
    notes?: string | null;
}

export interface QueueResponse {
    ingredient: {
        id: number;
        name: string;
        unit: string;
        requires_expiry: boolean;
        expiry_warning_days: number;
    };
    branch_id: number;
    eligible_batches: BatchItem[];
    ineligible_batches: BatchItem[];
    all_batches: BatchItem[];
    total_eligible_stock: number;
    total_eligible_stock_base: number;
    total_physical_stock: number;
    total_physical_stock_base: number;
}

interface BatchQueueViewerProps {
    ingredientId: number;
    branchId: number;
    isAdmin: boolean;
    onBatchUpdated?: () => void;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

export function BatchQueueViewer({
    ingredientId,
    branchId,
    isAdmin,
    onBatchUpdated
}: BatchQueueViewerProps) {
    const [queueData, setQueueData] = useState<QueueResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selected batch for adjustment modal
    const [adjustBatch, setAdjustBatch] = useState<BatchItem | null>(null);
    const [adjustQty, setAdjustQty] = useState('');
    const [adjustReason, setAdjustReason] = useState('physical_count');
    const [adjustNotes, setAdjustNotes] = useState('');
    const [adjusting, setAdjusting] = useState(false);

    // Status change modal
    const [statusBatch, setStatusBatch] = useState<BatchItem | null>(null);
    const [targetStatus, setTargetStatus] = useState<'available' | 'quarantined' | 'recalled' | 'damaged' | 'expired'>('quarantined');
    const [statusReason, setStatusReason] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Batch movements modal
    const [historyBatch, setHistoryBatch] = useState<BatchItem | null>(null);
    const [batchMovements, setBatchMovements] = useState<BatchMovement[]>([]);
    const [loadingMovements, setLoadingMovements] = useState(false);

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`/inventory/${ingredientId}/queue`, {
                params: { branch_id: branchId }
            });
            setQueueData(res.data);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } }; message?: string };
            setError(error.response?.data?.error || error.message || 'Failed to load batch queue');
        } finally {
            setLoading(false);
        }
    }, [ingredientId, branchId]);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustBatch) return;

        const val = parseFloat(adjustQty);
        if (isNaN(val) || val < 0) {
            toast.error('Please enter a valid quantity.');
            return;
        }

        setAdjusting(true);
        try {
            await axios.post(`/inventory/batches/${adjustBatch.id}/adjust`, {
                new_quantity: val,
                unit: adjustBatch.unit,
                reason: adjustReason,
                notes: adjustNotes,
            });

            toast.success(`Batch ${adjustBatch.batch_code} quantity adjusted.`);
            setAdjustBatch(null);
            fetchQueue();
            onBatchUpdated?.();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            toast.error(error.response?.data?.message || error.message || 'Failed to adjust batch');
        } finally {
            setAdjusting(false);
        }
    };

    const handleStatusSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusBatch) return;

        setUpdatingStatus(true);
        try {
            await axios.post(`/inventory/batches/${statusBatch.id}/status`, {
                status: targetStatus,
                reason: statusReason,
            });

            toast.success(`Batch ${statusBatch.batch_code} status updated to ${targetStatus}.`);
            setStatusBatch(null);
            fetchQueue();
            onBatchUpdated?.();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            toast.error(error.response?.data?.message || error.message || 'Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const openMovements = async (batch: BatchItem) => {
        setHistoryBatch(batch);
        setLoadingMovements(true);
        try {
            const res = await axios.get(`/inventory/batches/${batch.id}`);
            setBatchMovements(res.data?.movements || []);
        } catch {
            toast.error('Failed to load batch movement history');
        } finally {
            setLoadingMovements(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <RefreshCw className="size-6 text-[#E75480] animate-spin" />
                <span className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Loading FIFO/FEFO Batch Queue...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="size-4" /> Error loading batch queue
                </p>
                <p>{error}</p>
                <Button size="sm" variant="outline" onClick={fetchQueue}>Try Again</Button>
            </div>
        );
    }

    const eligibleBatches = queueData?.eligible_batches || [];
    const ineligibleBatches = queueData?.ineligible_batches || [];

    return (
        <div className="space-y-6">
            {/* Staff Guidance Banner */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-amber-500/10 via-rose-500/10 to-pink-500/10 border border-rose-500/20 text-xs text-[#3D2C2E] dark:text-[#F8FAFC] space-y-2">
                <div className="flex items-center gap-2 font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[11px]">
                    <Layers className="size-4 shrink-0" />
                    <span>How the Consumption Queue Works</span>
                </div>
                <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] leading-relaxed">
                    Stock with the <strong>earliest expiration date</strong> is used first (FEFO). When expiration dates are identical or missing, the <strong>oldest delivery</strong> is used first (FIFO). When a qualifying POS sale occurs, recipe ingredients are deducted automatically in this exact priority. Expired or quarantined stock is excluded.
                </p>
            </div>

            {/* Quick Stock Summary */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Eligible Stock</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                        {queueData?.total_eligible_stock} {queueData?.ingredient.unit}
                    </span>
                    <span className="text-[10px] text-[#9E8B8E] dark:text-[#64748B]">Available for automatic sale</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Total Physical Stock</span>
                    <span className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5 block">
                        {queueData?.total_physical_stock} {queueData?.ingredient.unit}
                    </span>
                    <span className="text-[10px] text-[#9E8B8E] dark:text-[#64748B]">Includes quarantined/restricted</span>
                </div>
            </div>

            {/* ELIGIBLE BATCHES SECTION */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <span>Consumption Queue ({eligibleBatches.length} Batches)</span>
                    </h3>
                    <Button variant="ghost" size="sm" onClick={fetchQueue} className="h-7 text-xs gap-1">
                        <RefreshCw className="size-3" /> Refresh
                    </Button>
                </div>

                {eligibleBatches.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-[#F8C8DC]/60 dark:border-white/10 bg-white/50 dark:bg-[#181822]/50 text-xs text-[#9E8B8E] dark:text-[#64748B]">
                        No eligible batches available for consumption. Restock needed.
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {eligibleBatches.map((batch) => {
                            const percentRemaining = batch.initial_quantity > 0
                                ? Math.min(100, Math.round((batch.current_quantity / batch.initial_quantity) * 100))
                                : 0;

                            return (
                                <div
                                    key={batch.id}
                                    className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/50 dark:border-white/10 shadow-2xs space-y-3 transition-all hover:border-[#E75480]/50"
                                >
                                    {/* Priority Badge & Code */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <Badge className={cn(
                                                "font-bold text-[10px] px-2 py-0.5 rounded-lg",
                                                batch.priority === 1
                                                    ? "bg-emerald-500 text-white shadow-xs"
                                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                            )}>
                                                {batch.priority_explanation}
                                            </Badge>
                                            <span className="font-mono font-bold text-xs text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {batch.batch_code}
                                            </span>
                                            {batch.lot_number && batch.lot_number !== 'N/A' && (
                                                <span className="text-[10px] font-mono text-[#9E8B8E] dark:text-[#64748B]">
                                                    Lot: {batch.lot_number}
                                                </span>
                                            )}
                                        </div>

                                        {batch.expiration_date ? (
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] font-mono",
                                                batch.expiration_status === 'expiring_today' && "border-rose-500 text-rose-600 bg-rose-500/10 font-bold",
                                                batch.expiration_status === 'expiring_soon' && "border-amber-500 text-amber-600 bg-amber-500/10",
                                                batch.expiration_status === 'valid' && "border-muted text-muted-foreground"
                                            )}>
                                                Exp: {batch.expiration_date_formatted}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                                                FIFO (No Expiry)
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Quantities & Progress */}
                                    <div>
                                        <div className="flex justify-between text-xs font-mono mb-1">
                                            <span className="text-[#7D6B6E] dark:text-[#94A3B8]">
                                                Remaining: <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{batch.current_quantity} {batch.unit}</strong>
                                            </span>
                                            <span className="text-[#9E8B8E] dark:text-[#64748B]">
                                                Initial: {batch.initial_quantity} {batch.unit} ({percentRemaining}%)
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    percentRemaining > 30 ? "bg-emerald-500" : percentRemaining > 10 ? "bg-amber-500" : "bg-rose-500"
                                                )}
                                                style={{ width: `${percentRemaining}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Meta info & Actions */}
                                    <div className="flex flex-wrap items-center justify-between text-[11px] text-[#9E8B8E] dark:text-[#64748B] border-t border-[#F8C8DC]/30 dark:border-white/5 pt-2 gap-2">
                                        <div className="flex items-center gap-3">
                                            <span>Received: {batch.received_at_formatted}</span>
                                            {isAdmin && batch.cost_per_base_unit > 0 && (
                                                <span>Cost: {formatCurrency(batch.cost_per_base_unit)} / base</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px]"
                                                onClick={() => openMovements(batch)}
                                            >
                                                History
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px]"
                                                onClick={() => {
                                                    setAdjustBatch(batch);
                                                    setAdjustQty(String(batch.current_quantity));
                                                    setAdjustReason('physical_count');
                                                    setAdjustNotes('');
                                                }}
                                            >
                                                Adjust
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-amber-600 hover:bg-amber-500/10"
                                                onClick={() => {
                                                    setStatusBatch(batch);
                                                    setTargetStatus('quarantined');
                                                    setStatusReason('');
                                                }}
                                            >
                                                Quarantine
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* INELIGIBLE BATCHES SECTION */}
            {ineligibleBatches.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                        <ShieldAlert className="size-4" />
                        <span>Restricted / Ineligible Batches ({ineligibleBatches.length})</span>
                    </h3>
                    <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                        The following batches are excluded from automatic sales consumption due to expiration, quarantine, or damage.
                    </p>

                    <div className="space-y-2">
                        {ineligibleBatches.map((batch) => (
                            <div
                                key={batch.id}
                                className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-xs space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-mono font-bold">
                                        <Badge variant="destructive" className="text-[10px] py-0 px-2 uppercase">
                                            {batch.status === 'available' ? 'Expired' : batch.status}
                                        </Badge>
                                        <span>{batch.batch_code}</span>
                                    </div>
                                    <span className="font-mono text-muted-foreground text-[11px]">
                                        Remaining: {batch.current_quantity} {batch.unit}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] pt-1 border-t border-rose-200/40 dark:border-rose-900/20">
                                    <span>{batch.priority_explanation}</span>

                                    <div className="flex items-center gap-1.5">
                                        {batch.status === 'quarantined' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px]"
                                                onClick={() => {
                                                    setStatusBatch(batch);
                                                    setTargetStatus('available');
                                                    setStatusReason('Released from quarantine after inspection');
                                                }}
                                            >
                                                Release
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                setAdjustBatch(batch);
                                                setAdjustQty('0');
                                                setAdjustReason('expired_removal');
                                                setAdjustNotes('Disposed / written off');
                                            }}
                                        >
                                            Dispose
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ADJUSTMENT MODAL */}
            <Dialog open={!!adjustBatch} onOpenChange={(open) => !open && setAdjustBatch(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Adjust Batch Quantity
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Adjust physical count or write off discrepancies for batch {adjustBatch?.batch_code}.
                        </DialogDescription>
                    </DialogHeader>

                    {adjustBatch && (
                        <form onSubmit={handleAdjustSubmit} className="space-y-4 pt-2">
                            <div className="p-3 rounded-xl bg-muted/30 border text-xs space-y-1 font-mono">
                                <div className="flex justify-between">
                                    <span>Current Quantity:</span>
                                    <strong>{adjustBatch.current_quantity} {adjustBatch.unit}</strong>
                                </div>
                                <div className="flex justify-between text-muted-foreground text-[11px]">
                                    <span>Batch Code:</span>
                                    <span>{adjustBatch.batch_code}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">New Quantity ({adjustBatch.unit})</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(e.target.value)}
                                    className="font-bold text-base h-10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Reason</label>
                                <Select value={adjustReason} onValueChange={setAdjustReason}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="physical_count">Physical Count Discrepancy</SelectItem>
                                        <SelectItem value="spoilage">Spoilage / Wastage</SelectItem>
                                        <SelectItem value="damage">Damaged Packaging</SelectItem>
                                        <SelectItem value="expired_removal">Expired Ingredients Disposal</SelectItem>
                                        <SelectItem value="correction">Data Correction</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Audit Notes / Explanation</label>
                                <Input
                                    placeholder="Enter reason or count verification notes..."
                                    value={adjustNotes}
                                    onChange={(e) => setAdjustNotes(e.target.value)}
                                    className="h-10 text-xs"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setAdjustBatch(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={adjusting}>
                                    {adjusting ? 'Saving...' : 'Confirm Adjustment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* STATUS CHANGE MODAL */}
            <Dialog open={!!statusBatch} onOpenChange={(open) => !open && setStatusBatch(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Update Batch Status
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Change quarantine or safety availability for batch {statusBatch?.batch_code}.
                        </DialogDescription>
                    </DialogHeader>

                    {statusBatch && (
                        <form onSubmit={handleStatusSubmit} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Target Status</label>
                                <Select value={targetStatus} onValueChange={(val: 'available' | 'quarantined' | 'recalled' | 'damaged' | 'expired') => setTargetStatus(val)}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available (Active in Queue)</SelectItem>
                                        <SelectItem value="quarantined">Quarantined (Excluded from Sales)</SelectItem>
                                        <SelectItem value="recalled">Recalled (Supplier Hold)</SelectItem>
                                        <SelectItem value="damaged">Damaged (Awaiting Disposal)</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Reason / Inspection Notes</label>
                                <Input
                                    placeholder="Enter reason for status change..."
                                    value={statusReason}
                                    onChange={(e) => setStatusReason(e.target.value)}
                                    className="h-10 text-xs"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setStatusBatch(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={updatingStatus}>
                                    {updatingStatus ? 'Updating...' : 'Update Status'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* BATCH MOVEMENTS MODAL */}
            <Dialog open={!!historyBatch} onOpenChange={(open) => !open && setHistoryBatch(null)}>
                <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Batch Traceability Ledger
                        </DialogTitle>
                        <DialogDescription className="text-xs font-mono">
                            Movement history for batch {historyBatch?.batch_code}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 pt-2">
                        {loadingMovements ? (
                            <div className="p-8 text-center text-xs text-muted-foreground">
                                Loading movements...
                            </div>
                        ) : batchMovements.length === 0 ? (
                            <div className="p-8 text-center text-xs text-muted-foreground">
                                No movements recorded yet.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {batchMovements.map((mov) => (
                                    <div
                                        key={mov.id}
                                        className="p-3 rounded-xl bg-muted/20 border text-xs space-y-1"
                                    >
                                        <div className="flex justify-between items-center">
                                            <Badge variant="outline" className="text-[10px] font-mono uppercase">
                                                {mov.movement_type.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {format(new Date(mov.created_at), 'MMM d, yyyy h:mm a')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs font-mono pt-1">
                                            <span>Qty Changed: <strong>{mov.quantity} {mov.unit}</strong></span>
                                            <span>Remaining: <strong>{mov.new_batch_quantity} {mov.unit}</strong></span>
                                        </div>
                                        {mov.notes && (
                                            <p className="text-[11px] text-muted-foreground italic pt-0.5">
                                                {mov.notes}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
