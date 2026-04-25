import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, User, Bike, Truck, Building2, Eye, ChevronRight } from 'lucide-react';
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
    const typeColor = delivery.delivery_type === 'internal' ? 'text-primary' : 'text-emerald-600';
    const typeBg = delivery.delivery_type === 'internal' ? 'bg-primary/5' : 'bg-emerald-50 dark:bg-emerald-950/20';

    const isUnassignedInternal = delivery.delivery_type === 'internal' && !delivery.rider_id;

    return (
        <Card
            className={cn(
                "border-none shadow-lg shadow-black/5 rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer",
                isUnassignedInternal && "ring-1 ring-amber-500/30"
            )}
            onClick={() => onSelect(delivery)}
        >
            <CardContent className="p-0">
                <div className="flex items-stretch">
                    {/* Type indicator strip */}
                    <div className={`w-1.5 shrink-0 ${delivery.delivery_type === 'internal' ? (isUnassignedInternal ? 'bg-amber-400' : 'bg-primary/40') : 'bg-emerald-400/40'}`} />

                    <div className="flex-1 p-4 space-y-3">
                        {/* Top row: Status, Order #, Amount */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <Badge className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 ${delivery.status_color}`}>
                                    {delivery.status_label}
                                </Badge>
                                <div className="min-w-0">
                                    <p className="font-black text-sm tracking-tight truncate">
                                        {delivery.sale?.order_number || (delivery.order && `#ORD-${delivery.order.id}`)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="size-2.5" />
                                        {formatTime(delivery.created_at)}
                                    </p>
                                </div>
                            </div>
                            <p className="text-base font-black text-primary shrink-0 tabular-nums">
                                {formatCurrency(delivery.sale?.total ?? delivery.order?.total_amount ?? 0)}
                            </p>
                        </div>

                        {/* Middle row: Customer + Type */}
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="size-6 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                    <User className="size-3 text-muted-foreground" />
                                </div>
                                <span className="font-semibold truncate">{delivery.customer_name}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <div className={cn("size-6 rounded-lg flex items-center justify-center", typeBg)}>
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
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
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
                            <span>Fee: {formatCurrency(delivery.delivery_fee)}</span>
                        </div>

                        {/* Items Summary */}
                        {((delivery.sale?.items || delivery.order?.items) || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {((delivery.sale?.items || delivery.order?.items) || []).slice(0, 3).map((item: any) => (
                                    <Badge key={item.id} variant="secondary" className="rounded-md px-1.5 py-0 text-[9px] font-bold bg-muted/50 text-muted-foreground border-none">
                                        {item.quantity}× {item.product?.name || 'Product'}
                                    </Badge>
                                ))}
                                {((delivery.sale?.items || delivery.order?.items) || []).length > 3 && (
                                    <span className="text-[9px] text-muted-foreground font-bold pl-0.5 self-center">
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
                                    className="flex-1 h-9 rounded-xl font-bold text-xs gap-1.5 shadow-md shadow-primary/10"
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
                                                className="h-9 w-9 rounded-xl shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAssignRider(delivery);
                                                }}
                                            >
                                                <Bike className="size-3.5 text-muted-foreground" />
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
                                            className="h-9 w-9 rounded-xl shrink-0"
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
            </CardContent>
        </Card>
    );
});

export default DeliveryCard;
