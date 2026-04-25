import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Truck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rider, Delivery } from './types';

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
        available: { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        busy: { color: 'bg-amber-500/10 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
        offline: { color: 'bg-slate-500/10 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary p-6 text-primary-foreground">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Truck className="size-5" />
                        </div>
                        <DialogTitle className="text-xl font-black">Assign Rider</DialogTitle>
                    </div>
                    <DialogDescription className="text-primary-foreground/80 font-medium">
                        Select a rider to handle delivery for order {delivery?.sale?.order_number || `#${delivery?.id}`}.
                    </DialogDescription>
                </div>

                <div className="p-6">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {riders.length === 0 ? (
                            <div className="text-center py-10">
                                <AlertTriangle className="size-10 text-amber-500 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-bold text-muted-foreground">No active riders found.</p>
                            </div>
                        ) : (
                            riders.map((rider) => (
                                <button
                                    key={rider.id}
                                    onClick={() => setSelectedId(rider.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                                        selectedId === rider.id
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-border/40 hover:border-border hover:bg-muted/30"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "size-12 rounded-xl flex items-center justify-center font-black text-lg",
                                            selectedId === rider.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                        )}>
                                            {rider.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground">{rider.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className={cn("text-[9px] font-black uppercase py-0 px-2 h-4", riderStatusConfig[rider.status].color)}>
                                                    <span className={cn("size-1.5 rounded-full mr-1", riderStatusConfig[rider.status].dot)} />
                                                    {rider.status}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-muted-foreground">• {rider.branch_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Tasks</p>
                                        <p className={cn(
                                            "text-lg font-black tabular-nums",
                                            rider.active_deliveries > 0 ? "text-amber-600" : "text-emerald-600"
                                        )}>
                                            {rider.active_deliveries}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row gap-3">
                    <Button variant="ghost" className="rounded-xl font-bold order-2 sm:order-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        className="rounded-xl font-black px-8 order-1 sm:order-2"
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
