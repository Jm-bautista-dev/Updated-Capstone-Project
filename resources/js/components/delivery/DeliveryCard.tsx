import { AlertOctagon, Bike, Building2, ChevronRight, Clock, Eye, Store, Truck, User } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { Delivery } from './types';
import { formatCurrency, formatRelativeMinutes, formatTime } from './types';

interface DeliveryCardProps {
    delivery: Delivery;
    onSelect: (delivery: Delivery) => void;
    onUpdateStatus: (id: number) => void;
    onAssignRider?: (delivery: Delivery) => void;
    onFailDelivery?: (id: number) => void;
}

const DeliveryCard = React.memo(function DeliveryCard({ delivery, onSelect, onUpdateStatus, onAssignRider, onFailDelivery }: DeliveryCardProps) {
    const isPickup = Boolean(delivery.is_pickup || delivery.fulfillment_type === 'pickup');
    
    const TypeIcon = isPickup ? Store : (delivery.delivery_type === 'internal' ? Bike : Truck);
    const typeColor = isPickup 
        ? 'text-emerald-600 dark:text-emerald-400' 
        : (delivery.delivery_type === 'internal' ? 'text-[#E75480] dark:text-[#FF4F81]' : 'text-blue-600 dark:text-blue-400');
    const typeBg = isPickup 
        ? 'bg-emerald-50 dark:bg-emerald-950/20' 
        : (delivery.delivery_type === 'internal' ? 'bg-[#FFF5F7] dark:bg-[#1C1C28]' : 'bg-blue-50 dark:bg-blue-950/20');

    const isUnassignedInternal = !isPickup && delivery.delivery_type === 'internal' && !delivery.rider_id && ['ready_for_pickup', 'assigned_to_rider', 'failed_delivery'].includes(delivery.status);

    const getNextPickupLabel = (status: string) => {
        switch (status) {
            case 'pending':
            case 'confirmed':
                return 'Start Preparation';
            case 'preparing':
                return 'Mark Ready for Pickup';
            case 'ready_for_pickup':
                return 'Mark Customer Arrived';
            case 'customer_arrived':
                return 'Complete Pickup';
            default:
                return 'Advance Status';
        }
    };

    return (
        <div
            className={cn(
                "rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer font-['Outfit']",
                isPickup && "border-emerald-500/20 dark:border-emerald-500/20",
                isUnassignedInternal && "ring-1 ring-amber-500/30",
                delivery.is_failed && "ring-2 ring-red-500/50 bg-red-50/10 dark:bg-red-950/10"
            )}
            onClick={() => onSelect(delivery)}
        >
            <div className="flex items-stretch">
                {/* Type indicator strip */}
                <div className={`w-1.5 shrink-0 ${delivery.is_failed ? 'bg-red-500' : (isPickup ? 'bg-emerald-500' : (delivery.delivery_type === 'internal' ? (isUnassignedInternal ? 'bg-amber-400' : 'bg-[#E75480]/40') : 'bg-blue-400/40'))}`} />

                <div className="flex-1 p-4 space-y-3">
                    {/* Top row: Queue Position, Source Badge, Status, Order #, Amount */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            {delivery.queue_position && (
                                <Badge className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0">
                                    Queue #{delivery.queue_position}
                                </Badge>
                            )}
                            {isPickup ? (
                                <Badge className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 shrink-0">
                                    🏪 Pickup
                                </Badge>
                            ) : (
                                <Badge className={cn(
                                    "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0",
                                    delivery.order_source === 'pos'
                                        ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40"
                                        : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/40"
                                )}>
                                    {delivery.order_source === 'pos' ? '🖥️ POS' : '📱 Mobile'}
                                </Badge>
                            )}
                            <Badge className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 ${delivery.status_color}`}>
                                {delivery.status_label}
                            </Badge>
                            <div className="min-w-0">
                                <p className="font-black text-sm tracking-tight truncate text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {delivery.sale?.order_number || delivery.order?.order_number || (delivery.order && `ORD-${delivery.order.id}`) || `#${delivery.id}`}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                                    <span className="flex items-center gap-1">
                                        <Clock className="size-2.5" />
                                        {formatTime(delivery.created_at)}
                                    </span>
                                    {delivery.waiting_minutes !== undefined && (
                                        <span className={cn(
                                            "font-bold px-1.5 py-0.2 rounded-md text-[9px]",
                                            delivery.waiting_minutes > 30 ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                        )}>
                                            {formatRelativeMinutes(delivery.waiting_minutes)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-base font-black font-mono text-[#E75480] dark:text-[#FF4F81] shrink-0 tabular-nums">
                            {formatCurrency(delivery.sale?.total ?? delivery.order?.total_amount ?? 0)}
                        </p>
                    </div>

                    {/* Middle row: Customer + Type / Verification Code */}
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="size-6 rounded-lg bg-[#FFF5F7] dark:bg-[#1C1C28] flex items-center justify-center shrink-0 border border-[#F8C8DC]/60 dark:border-white/10">
                                <User className="size-3 text-[#7D6B6E] dark:text-[#94A3B8]" />
                            </div>
                            <span className="font-semibold truncate text-[#3D2C2E] dark:text-[#F8FAFC]">{delivery.customer_name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className={cn("size-6 rounded-lg flex items-center justify-center border border-[#F8C8DC]/60 dark:border-white/10", typeBg)}>
                                <TypeIcon className={cn("size-3", typeColor)} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase", 
                                isPickup ? "text-emerald-700 dark:text-emerald-400 font-bold" : (isUnassignedInternal ? "text-amber-600 animate-pulse" : typeColor)
                            )}>
                                {isPickup
                                    ? (delivery.pickup_verification_code ? `Code: ${delivery.pickup_verification_code}` : 'Store Pickup')
                                    : (delivery.delivery_type === 'internal'
                                        ? (delivery.rider?.name || 'Unassigned')
                                        : (delivery.external_service?.toUpperCase() || 'External'))}
                            </span>
                        </div>
                    </div>

                    {/* Branch & Scheduled Pickup */}
                    <div className="flex items-center gap-2 text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] flex-wrap">
                        <Building2 className="size-3" />
                        <span className="font-bold">
                            {delivery.sale?.branch?.name || delivery.order?.branch?.name || 'Victoria Plains'}
                        </span>
                        {isPickup ? (
                            <>
                                <span>•</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    Pickup: {delivery.scheduled_pickup_display || 'Immediate'}
                                </span>
                            </>
                        ) : (
                            <>
                                {delivery.distance_km && (
                                    <>
                                        <span>•</span>
                                        <span>{delivery.distance_km}km</span>
                                    </>
                                )}
                                <span>•</span>
                                <span className="font-mono">Fee: {formatCurrency(delivery.delivery_fee)}</span>
                            </>
                        )}
                    </div>

                    {/* Items Summary */}
                    {((delivery.sale?.items || delivery.order?.items) || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {((delivery.sale?.items || delivery.order?.items) || []).slice(0, 3).map((item) => (
                                <Badge key={item.id} variant="secondary" className="rounded-md px-1.5 py-0 text-[9px] font-bold bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#7D6B6E] dark:text-[#94A3B8] border border-[#F8C8DC]/40 dark:border-white/10">
                                    {item.quantity}× {item.product?.name || 'Product'}
                                </Badge>
                            ))}
                            {((delivery.sale?.items || delivery.order?.items) || []).length > 3 && (
                                <span className="text-[9px] text-[#7D6B6E] dark:text-[#94A3B8] font-bold pl-0.5 self-center">
                                    +{((delivery.sale?.items || delivery.order?.items) || []).length - 3} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {isUnassignedInternal && !delivery.is_cancelled && !delivery.is_delivered && !delivery.is_failed && (
                            <div className="flex-1 h-9 rounded-xl flex items-center justify-center gap-2 px-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold font-['Outfit']">
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                <span>Available for Rider Self-Acceptance</span>
                            </div>
                        )}
                        
                        {delivery.next_statuses.length > 0 && !delivery.is_cancelled && !delivery.is_failed && (
                            <Button
                                size="sm"
                                className={cn(
                                    "flex-1 h-9 rounded-xl font-bold text-xs gap-1.5 shadow-md text-white",
                                    isPickup 
                                        ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
                                        : "bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B]"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(delivery.id);
                                }}
                            >
                                {isPickup ? getNextPickupLabel(delivery.status) : `Mark as ${delivery.next_statuses[0].replace(/_/g, ' ')}`}
                                <ChevronRight className="size-3" />
                            </Button>
                        )}
                        
                        <div className="flex items-center gap-2 ml-auto">
                            {!isPickup && delivery.can_mark_failed && onFailDelivery && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl shrink-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onFailDelivery(delivery.id);
                                            }}
                                        >
                                            <AlertOctagon className="size-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Mark Delivery Failed</TooltipContent>
                                </Tooltip>
                            )}

                            {!isPickup && !isUnassignedInternal && delivery.delivery_type === 'internal' && !delivery.is_cancelled && !delivery.is_delivered && !delivery.is_failed && onAssignRider && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl shrink-0 border-[#F8C8DC]/60 dark:border-white/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAssignRider(delivery);
                                            }}
                                        >
                                            <Bike className="size-3.5 text-[#7D6B6E] dark:text-[#94A3B8]" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reassign Rider</TooltipContent>
                                </Tooltip>
                            )}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl shrink-0 border-[#F8C8DC]/60 dark:border-white/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(delivery);
                                        }}
                                    >
                                        <Eye className="size-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default DeliveryCard;
