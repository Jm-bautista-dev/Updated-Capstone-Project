import { Bike, Building2, ChevronRight, Clock, Eye, Truck, User } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { Delivery } from './types';
import { formatCurrency, formatTime } from './types';

interface DeliveryCardProps {
    delivery: Delivery;
    onSelect: (delivery: Delivery) => void;
    onUpdateStatus: (id: number) => void;
    onAssignRider: (delivery: Delivery) => void;
}

const DeliveryCard = React.memo(function DeliveryCard({ delivery, onSelect, onUpdateStatus, onAssignRider }: DeliveryCardProps) {
    const TypeIcon = delivery.delivery_type === 'internal' ? Bike : Truck;
    const typeColor = delivery.delivery_type === 'internal' ? 'text-[#E75480] dark:text-[#FF4F81]' : 'text-emerald-600 dark:text-emerald-400';
    const typeBg = delivery.delivery_type === 'internal' ? 'bg-[#FFF5F7] dark:bg-[#1C1C28]' : 'bg-emerald-50 dark:bg-emerald-950/20';

    const isUnassignedInternal = delivery.delivery_type === 'internal' && !delivery.rider_id;

    return (
        <div
            className={cn(
                "rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer font-['Outfit']",
                isUnassignedInternal && "ring-1 ring-amber-500/30"
            )}
            onClick={() => onSelect(delivery)}
        >
            <div className="flex items-stretch">
                {/* Type indicator strip */}
                <div className={`w-1.5 shrink-0 ${delivery.delivery_type === 'internal' ? (isUnassignedInternal ? 'bg-amber-400' : 'bg-[#E75480]/40') : 'bg-emerald-400/40'}`} />

                <div className="flex-1 p-4 space-y-3">
                    {/* Top row: Status, Order #, Amount */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Badge className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 ${delivery.status_color}`}>
                                {delivery.status_label}
                            </Badge>
                            <div className="min-w-0">
                                <p className="font-black text-sm tracking-tight truncate text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {delivery.sale?.order_number || (delivery.order && `#ORD-${delivery.order.id}`)}
                                </p>
                                <p className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] flex items-center gap-1 font-medium">
                                    <Clock className="size-2.5" />
                                    {formatTime(delivery.created_at)}
                                </p>
                            </div>
                        </div>
                        <p className="text-base font-black font-mono text-[#E75480] dark:text-[#FF4F81] shrink-0 tabular-nums">
                            {formatCurrency(delivery.sale?.total ?? delivery.order?.total_amount ?? 0)}
                        </p>
                    </div>

                    {/* Middle row: Customer + Type */}
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
                                isUnassignedInternal ? "text-amber-600 animate-pulse" : typeColor
                            )}>
                                {delivery.delivery_type === 'internal'
                                    ? (delivery.rider?.name || 'Unassigned')
                                    : (delivery.external_service?.toUpperCase() || 'External')}
                            </span>
                        </div>
                    </div>

                    {/* Branch */}
                    <div className="flex items-center gap-2 text-[10px] text-[#7D6B6E] dark:text-[#94A3B8]">
                        <Building2 className="size-3" />
                        <span className="font-bold">
                            {delivery.sale?.branch?.name || delivery.order?.branch?.name || 'Victoria Plains'}
                        </span>
                        {delivery.distance_km && (
                            <>
                                <span>•</span>
                                <span>{delivery.distance_km}km</span>
                            </>
                        )}
                        <span>•</span>
                        <span className="font-mono">Fee: {formatCurrency(delivery.delivery_fee)}</span>
                    </div>

                    {/* Items Summary */}
                    {((delivery.sale?.items || delivery.order?.items) || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {((delivery.sale?.items || delivery.order?.items) || []).slice(0, 3).map((item: any) => (
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
                        {isUnassignedInternal && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-9 rounded-xl font-bold text-xs gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/20 shadow-sm shadow-amber-500/10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAssignRider(delivery);
                                }}
                            >
                                <Bike className="size-3.5" />
                                Assign Rider
                            </Button>
                        )}
                        
                        {delivery.next_statuses.length > 0 && !delivery.is_cancelled && (
                            <Button
                                size="sm"
                                className="flex-1 h-9 rounded-xl font-bold text-xs gap-1.5 shadow-md bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(delivery.id);
                                }}
                            >
                                Mark as {delivery.next_statuses[0].replace(/_/g, ' ')}
                                <ChevronRight className="size-3" />
                            </Button>
                        )}
                        
                        <div className="flex items-center gap-2 ml-auto">
                            {!isUnassignedInternal && delivery.delivery_type === 'internal' && !delivery.is_cancelled && !delivery.is_delivered && (
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
