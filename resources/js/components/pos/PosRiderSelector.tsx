import React, { useState, useEffect, useMemo } from 'react';
import { FiCheck, FiTruck, FiPhone, FiAlertCircle } from 'react-icons/fi';
import { cn } from '@/lib/utils';

export interface PosRider {
    id: number;
    name: string;
    phone?: string;
    is_active?: boolean;
    status?: 'available' | 'busy' | 'offline' | string;
    in_transit?: boolean;
    active_deliveries_count?: number;
    is_assignable?: boolean;
}

interface PosRiderSelectorProps {
    riders: PosRider[];
    selectedRiderId: number | string | null;
    onSelectRider: (riderId: number | string) => void;
    disabled?: boolean;
}

export const PosRiderSelector: React.FC<PosRiderSelectorProps> = ({
    riders: initialRiders,
    selectedRiderId,
    onSelectRider,
    disabled = false,
}) => {
    const [riders, setRiders] = useState<PosRider[]>(initialRiders);

    // Sync when props change
    useEffect(() => {
        setRiders(initialRiders);
    }, [initialRiders]);

    // Real-time synchronization for rider availability
    useEffect(() => {
        if (typeof window === 'undefined' || !(window as any).Echo) return;

        const echo = (window as any).Echo;
        const channel = echo.private('admin.orders');

        channel.listen('RiderStatusUpdated', (event: any) => {
            console.log('[PosRiderSelector] Realtime RiderStatusUpdated:', event);
            setRiders(prev => {
                return prev.map(rider => {
                    if (rider.id === event.rider_id) {
                        const inTransit = event.in_transit ?? rider.in_transit;
                        const isActive = event.is_active ?? rider.is_active;
                        const status = event.status ?? rider.status;
                        const isAssignable = isActive && status !== 'offline' && !inTransit;

                        return {
                            ...rider,
                            is_active: isActive,
                            status: status,
                            in_transit: inTransit,
                            is_assignable: isAssignable,
                            active_deliveries_count: event.active_deliveries_count ?? rider.active_deliveries_count,
                        };
                    }
                    return rider;
                });
            });
        });

        return () => {
            channel.stopListening('RiderStatusUpdated');
        };
    }, []);

    // Filter available vs unavailable riders
    const { availableRiders, unavailableRiders } = useMemo(() => {
        const available: PosRider[] = [];
        const unavailable: PosRider[] = [];

        riders.forEach(rider => {
            const isAssignable = rider.is_assignable ?? (rider.is_active && rider.status === 'available' && !rider.in_transit);
            if (isAssignable) {
                available.push(rider);
            } else {
                unavailable.push(rider);
            }
        });

        return { availableRiders: available, unavailableRiders: unavailable };
    }, [riders]);

    const numericSelectedId = selectedRiderId ? Number(selectedRiderId) : null;

    return (
        <div className="space-y-3 font-['Outfit']">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7D6B6E] dark:text-zinc-400">
                        Select Internal Rider
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {availableRiders.length} Available
                    </span>
                </div>
                {numericSelectedId && (
                    <button
                        type="button"
                        onClick={() => onSelectRider('')}
                        className="text-[10px] font-bold text-[#E75480] hover:underline cursor-pointer"
                    >
                        Clear selection
                    </button>
                )}
            </div>

            {/* Rider Cards Grid */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {/* 1. AVAILABLE RIDERS */}
                {availableRiders.length > 0 ? (
                    <div className="space-y-1.5">
                        {availableRiders.map((rider) => {
                            const isSelected = numericSelectedId === rider.id;
                            return (
                                <button
                                    key={rider.id}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onSelectRider(rider.id)}
                                    className={cn(
                                        "w-full text-left p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer",
                                        isSelected
                                            ? "bg-[#FFF5F7] dark:bg-[#2A1820] border-[#E75480] dark:border-[#E75480] shadow-sm ring-1 ring-[#E75480]"
                                            : "bg-white dark:bg-[#1A1A1D] border-[#F8C8DC]/60 dark:border-[#26262A] hover:border-[#E75480]/60 hover:bg-[#FFFDFE] dark:hover:bg-[#222226]"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={cn(
                                            "size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                            isSelected
                                                ? "bg-[#E75480] text-white"
                                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        )}>
                                            <FiTruck className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-bold text-[#3D2C2E] dark:text-white truncate">
                                                    {rider.name}
                                                </p>
                                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-[#7D6B6E] dark:text-zinc-400">
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active · Available</span>
                                                <span>•</span>
                                                <span>{rider.active_deliveries_count || 0} active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-2">
                                        {rider.phone && (
                                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-400">
                                                <FiPhone className="size-2.5" />
                                                {rider.phone}
                                            </span>
                                        )}
                                        <div className={cn(
                                            "size-5 rounded-md flex items-center justify-center border transition-all",
                                            isSelected
                                                ? "bg-[#E75480] border-[#E75480] text-white"
                                                : "border-[#F8C8DC] dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                        )}>
                                            {isSelected && <FiCheck className="size-3 stroke-[3]" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                            <FiAlertCircle className="size-4" />
                            <span>No Active Riders Available Right Now</span>
                        </div>
                        <p className="text-[10px] text-[#7D6B6E] dark:text-zinc-400">
                            You can place this delivery without a rider. It will enter the unassigned queue in the Web Delivery Nav.
                        </p>
                    </div>
                )}

                {/* 2. UNAVAILABLE RIDERS (Collapsible/Visual only) */}
                {unavailableRiders.length > 0 && (
                    <div className="pt-2 border-t border-[#F8C8DC]/40 dark:border-[#26262A] space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8E91] dark:text-zinc-500">
                            Currently Unavailable ({unavailableRiders.length})
                        </p>
                        {unavailableRiders.map((rider) => {
                            const isDelivering = rider.in_transit || (rider.active_deliveries_count && rider.active_deliveries_count > 0);
                            return (
                                <div
                                    key={rider.id}
                                    className="p-2 rounded-xl border border-dashed border-[#F8C8DC]/50 dark:border-zinc-800 bg-[#FFF5F7]/30 dark:bg-zinc-900/30 flex items-center justify-between opacity-60 cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={cn(
                                            "size-7 rounded-lg flex items-center justify-center shrink-0",
                                            isDelivering
                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                : "bg-zinc-500/10 text-zinc-500"
                                        )}>
                                            <FiTruck className="size-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-[#7D6B6E] dark:text-zinc-400 truncate">
                                                {rider.name}
                                            </p>
                                            <p className="text-[9px] font-semibold text-[#9E8E91] dark:text-zinc-500">
                                                {isDelivering
                                                    ? `🟡 Currently Delivering (${rider.active_deliveries_count || 1} active)`
                                                    : `⚫ Inactive / Offline`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        Locked
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
