import { AlertTriangle, Bike, Building2, Loader2, Mail, Phone, Trash2 } from 'lucide-react';
import React from 'react';
import { type Rider } from '@/components/riders/RiderTable';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface RemoveRiderModalProps {
    rider: Rider | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export function RemoveRiderModal({
    rider,
    open,
    onOpenChange,
    onConfirm,
    isDeleting = false,
}: RemoveRiderModalProps) {
    if (!rider) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
            <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border border-rose-200 dark:border-rose-900/40 shadow-2xl bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#E2E8F0] font-['Outfit']">
                {/* Header Banner */}
                <div className="p-6 bg-linear-to-r from-rose-500 via-rose-600 to-rose-700 text-white">
                    <DialogHeader className="space-y-1 text-left">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight text-white">
                                    Remove Rider from Fleet
                                </DialogTitle>
                                <DialogDescription className="text-xs font-medium text-white/80 mt-0.5">
                                    Destructive Action Confirmation
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-xs sm:text-sm text-[#7D6B6E] dark:text-[#94A3B8] leading-relaxed">
                        Are you sure you want to remove this rider? They will immediately lose access to rider delivery queues, but their historical delivery logs will remain archived.
                    </p>

                    {/* Rider Information Preview Card */}
                    <div className="p-4 rounded-2xl bg-[#FFF5F7] dark:bg-white/5 border border-[#F8C8DC]/60 dark:border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-base text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {rider.name}
                            </span>
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    rider.is_active
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                            >
                                {rider.is_active ? rider.status || 'Active' : 'Suspended'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-[#F8C8DC]/40 dark:border-white/5">
                            <div className="flex items-center gap-1.5 text-[#7D6B6E] dark:text-[#94A3B8]">
                                <Mail className="size-3.5 text-[#E75480] dark:text-[#FF4F81] shrink-0" />
                                <span className="truncate font-mono text-[11px]">{rider.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#7D6B6E] dark:text-[#94A3B8]">
                                <Building2 className="size-3.5 text-[#E75480] dark:text-[#FF4F81] shrink-0" />
                                <span className="truncate">{rider.branch?.name || 'Unassigned'}</span>
                            </div>
                            {rider.phone && (
                                <div className="flex items-center gap-1.5 text-[#7D6B6E] dark:text-[#94A3B8]">
                                    <Phone className="size-3.5 text-[#E75480] dark:text-[#FF4F81] shrink-0" />
                                    <span className="font-mono">{rider.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[#7D6B6E] dark:text-[#94A3B8]">
                                <Bike className="size-3.5 text-[#E75480] dark:text-[#FF4F81] shrink-0" />
                                <span>{rider.deliveries_count || 0} deliveries completed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <DialogFooter className="p-4 bg-zinc-50/80 dark:bg-zinc-900/60 border-t border-[#F8C8DC]/40 dark:border-white/10 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isDeleting}
                        onClick={() => onOpenChange(false)}
                        className="h-11 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 font-bold text-xs uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] hover:bg-[#FFF5F7] dark:hover:bg-white/10 cursor-pointer flex-1"
                    >
                        Keep Rider
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={onConfirm}
                        className="h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-rose-600/20 cursor-pointer flex-1"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Removing...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="size-4" />
                                <span>Remove Rider</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
