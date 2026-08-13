import { AlertTriangle, Truck } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import type { Delivery, Rider } from './types';

interface Props {
    open: boolean;
    onClose: () => void;
    onAssign: (riderId: number) => void;
    riders: Rider[];
    delivery: Delivery | null;
    processing?: boolean;
}

export default function RiderAssignmentModal({ open, onClose, onAssign, riders, delivery, processing }: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleAssign = () => {
        if (selectedId) {
            onAssign(selectedId);
        }
    };

    const riderStatusConfig = {
        available: { color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50', dot: 'bg-emerald-500' },
        busy: { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50', dot: 'bg-amber-500' },
        offline: { color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-900/50', dot: 'bg-slate-500' },
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-125 rounded-3xl p-0 overflow-hidden border border-white/90 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl font-['Outfit']">
                <div className="bg-linear-to-r from-[#E75480] to-[#FF4F81] p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Truck className="size-5" />
                        </div>
                        <DialogTitle className="text-xl font-black text-white">Assign Rider</DialogTitle>
                    </div>
                    <DialogDescription className="text-white/80 font-medium">
                        Select a rider to handle delivery for order {delivery?.sale?.order_number || `#${delivery?.id}`}.
                    </DialogDescription>
                </div>

                <div className="p-6">
                    <div className="space-y-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                        {riders.length === 0 ? (
                            <div className="text-center py-10">
                                <AlertTriangle className="size-10 text-amber-500 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-bold text-[#7D6B6E] dark:text-[#94A3B8]">No active riders found.</p>
                            </div>
                        ) : (
                            riders.map((rider) => {
                                const isLocked = rider.is_out_for_delivery || rider.can_be_assigned === false;
                                const isCollecting = (rider.active_pickup_count ?? 0) > 0 && !isLocked;

                                return (
                                    <button
                                        key={rider.id}
                                        disabled={isLocked}
                                        onClick={() => !isLocked && setSelectedId(rider.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                                            isLocked
                                                ? "opacity-60 bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 cursor-not-allowed"
                                                : selectedId === rider.id
                                                    ? "border-[#E75480] dark:border-[#FF4F81] bg-[#FFF5F7] dark:bg-[#1C1C28] ring-1 ring-[#E75480]/20 cursor-pointer"
                                                    : "border-[#F8C8DC]/40 dark:border-white/10 hover:border-[#F8C8DC] dark:hover:border-white/20 hover:bg-[#FFF5F7]/50 dark:hover:bg-[#1C1C28]/50 cursor-pointer"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "size-12 rounded-xl flex items-center justify-center font-black text-lg",
                                                isLocked
                                                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                                                    : selectedId === rider.id
                                                        ? "bg-[#E75480] text-white"
                                                        : "bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#7D6B6E] dark:text-[#94A3B8]"
                                            )}>
                                                {rider.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-[#3D2C2E] dark:text-[#F8FAFC]">{rider.name}</p>
                                                    {isLocked && (
                                                        <span className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-900/40">
                                                            Out for Delivery (Locked)
                                                        </span>
                                                    )}
                                                    {isCollecting && (
                                                        <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                                                            Collecting ({rider.active_pickup_count})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase py-0 px-2 h-4", isLocked ? "bg-rose-50 text-rose-700 dark:text-rose-400 border-rose-200" : riderStatusConfig[rider.status]?.color || riderStatusConfig.available.color)}>
                                                        <span className={cn("size-1.5 rounded-full mr-1", isLocked ? "bg-rose-500" : riderStatusConfig[rider.status]?.dot || riderStatusConfig.available.dot)} />
                                                        {isLocked ? 'out for delivery' : rider.status}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">• {rider.branch_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8] tracking-widest">Active Tasks</p>
                                            <p className={cn(
                                                "text-lg font-black font-mono tabular-nums",
                                                isLocked
                                                    ? "text-rose-600 dark:text-rose-400"
                                                    : rider.active_deliveries > 0
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : "text-emerald-600 dark:text-emerald-400"
                                            )}>
                                                {rider.active_deliveries}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-[#FFF5F7]/50 dark:bg-[#181824]/50 border-t border-[#F8C8DC]/40 dark:border-white/10 flex flex-col sm:flex-row gap-3">
                    <Button variant="ghost" className="rounded-xl font-bold order-2 sm:order-1 text-[#7D6B6E] dark:text-[#94A3B8]" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        className="rounded-xl font-black px-8 order-1 sm:order-2 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white"
                        disabled={!selectedId || processing}
                        onClick={handleAssign}
                    >
                        {processing ? 'Assigning...' : 'Confirm Assignment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
