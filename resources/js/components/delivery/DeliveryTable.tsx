import {
    AlertOctagon,
    ArrowUpDown,
    Bike, ChevronDown, ChevronRight, ChevronUp, Eye, Package, RotateCcw, Truck,
} from 'lucide-react';
import React, { useCallback, useRef } from 'react';
import { List } from 'react-window';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { Delivery } from './types';
import { formatCurrency, formatTime } from './types';

interface DeliveryTableProps {
    deliveries: Delivery[];
    onSelect: (delivery: Delivery) => void;
    onUpdateStatus: (id: number) => void;
    onAssignRider: (delivery: Delivery) => void;
    onFailDelivery?: (id: number) => void;
    containerHeight?: number;
}

type SortKey = 'order' | 'customer' | 'status' | 'amount' | 'date';
type SortDir = 'asc' | 'desc';

const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 44;

interface RowProps {
    deliveries: Delivery[];
    onSelect: (delivery: Delivery) => void;
    onUpdateStatus: (id: number) => void;
    onAssignRider: (delivery: Delivery) => void;
    onFailDelivery?: (id: number) => void;
}

const TableRow = React.memo(function TableRow({
    index,
    style,
    deliveries,
    onSelect,
    onUpdateStatus,
    onAssignRider,
    onFailDelivery,
}: {
    index: number;
    style: React.CSSProperties;
} & RowProps) {
    const delivery = deliveries[index];
    const TypeIcon = delivery.delivery_type === 'internal' ? Bike : Truck;
    const typeColor = delivery.delivery_type === 'internal' ? 'text-[#E75480] dark:text-[#FF4F81]' : 'text-emerald-600 dark:text-emerald-400';

    const isUnassignedInternal = delivery.delivery_type === 'internal' && !delivery.rider_id;

    return (
        <div
            style={style}
            className={cn(
                "flex items-center gap-2 px-5 border-b border-[#F8C8DC]/30 dark:border-white/5 hover:bg-[#FFF5F7]/60 dark:hover:bg-[#1C1C28]/60 cursor-pointer group transition-colors duration-150 font-['Outfit']",
                delivery.status === 'delivered' && "opacity-75"
            )}
            onClick={() => onSelect(delivery)}
        >
            {/* 1. Order / Tracking Number */}
            <div className="w-38 shrink-0 font-bold">
                <div className="flex items-center gap-1.5">
                    <TypeIcon className={cn("size-3.5 shrink-0", typeColor)} />
                    <span className="font-mono text-xs text-[#3D2C2E] dark:text-[#F8FAFC]">
                        {delivery.sale?.order_number || delivery.order?.order_number || delivery.tracking_number || `#${delivery.id}`}
                    </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                    <span className={cn(
                        "text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-sans",
                        (delivery.order_source === 'pos' || Boolean(delivery.sale_id))
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60"
                            : "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/60"
                    )}>
                        {(delivery.order_source === 'pos' || Boolean(delivery.sale_id)) ? 'POS' : 'Mobile'}
                    </span>
                </div>
            </div>

            {/* 2. Customer */}
            <div className="w-40 shrink-0">
                <p className="font-bold text-xs text-[#3D2C2E] dark:text-[#F8FAFC] truncate">{delivery.customer_name}</p>
                <p className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] font-mono truncate">{delivery.customer_phone || 'No phone'}</p>
            </div>

            {/* 3. Items Hover Tooltip */}
            <div className="w-30 shrink-0">
                <TooltipProvider delayDuration={150}>
                    <Tooltip>
                        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#E75480] dark:hover:text-[#FF4F81] cursor-help bg-[#FFF5F7] dark:bg-[#1C1C28] px-2 py-0.5 rounded-md border border-[#F8C8DC]/40 dark:border-white/10 transition-colors">
                                <Package className="size-3 text-[#E75480] dark:text-[#FF4F81]" />
                                {((delivery.sale?.items || delivery.order?.items) || []).length} items
                            </span>
                        </TooltipTrigger>
                        <TooltipContent className="p-0 overflow-hidden rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xl bg-white dark:bg-[#121218]" side="right">
                            <div className="p-3 min-w-45 space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8] border-b border-[#F8C8DC]/30 dark:border-white/5 pb-2">Order Contents</p>
                                <div className="space-y-1.5">
                                    {((delivery.sale?.items || delivery.order?.items) || []).map((item: { id: number; product?: { name: string; image_url?: string }; quantity: number }) => (
                                    <div key={item.id} className="flex justify-between items-center gap-3 text-[11px]">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="size-6 rounded bg-[#FFF5F7] dark:bg-[#1C1C28] flex items-center justify-center shrink-0 border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden">
                                                <ImageWithFallback
                                                    src={item.product?.image_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    fallbackIcon={<Package className="size-2.5 text-[#7D6B6E]/40 dark:text-[#94A3B8]/40" />}
                                                />
                                            </div>
                                            <span className="font-semibold truncate max-w-27.5 text-[#3D2C2E] dark:text-[#F8FAFC]">{item.product?.name || 'Product'}</span>
                                        </div>
                                        <span className="font-black text-[#E75480] dark:text-[#FF4F81] shrink-0">×{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>

            {/* Customer */}
            <div className="flex-1 min-w-35">
                <p className="font-semibold text-xs truncate text-[#3D2C2E] dark:text-[#F8FAFC]">{delivery.customer_name}</p>
            </div>

            {/* Type & Rider */}
            <div className="w-30 shrink-0">
                <div className="flex items-center gap-1.5">
                    <TypeIcon className={`size-3.5 ${isUnassignedInternal ? 'text-amber-500' : typeColor}`} />
                    <span className={cn(
                        "text-[10px] font-bold uppercase truncate",
                        isUnassignedInternal && "text-amber-600 animate-pulse"
                    )}>
                        {delivery.delivery_type === 'internal'
                            ? (delivery.rider?.name || 'Unassigned')
                            : (delivery.external_service?.toUpperCase() || 'External')}
                    </span>
                </div>
            </div>

            {/* Branch */}
            <div className="w-25 shrink-0 hidden xl:block">
                <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] truncate">
                    {delivery.sale?.branch?.name || delivery.order?.branch?.name || 'Main Branch'}
                </p>
            </div>

            {/* Amount */}
            <div className="w-22.5 shrink-0 text-right">
                <p className="font-black text-xs font-mono tabular-nums text-[#E75480] dark:text-[#FF4F81]">
                    {formatCurrency(delivery.sale?.total || delivery.order?.total_amount || 0)}
                </p>
            </div>

            {/* Date */}
            <div className="w-20 shrink-0 hidden lg:block">
                <p className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8]">{formatTime(delivery.created_at)}</p>
            </div>

            {/* Actions */}
            <div className="w-30 shrink-0 flex items-center justify-end gap-1 group-hover:opacity-100 transition-opacity duration-200">
                {delivery.can_mark_failed && onFailDelivery && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFailDelivery(delivery.id);
                                }}
                            >
                                <AlertOctagon className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-[10px] font-bold">Mark Delivery Failed</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {delivery.is_failed && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 rounded-lg hover:bg-red-500/10 text-red-600 transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAssignRider(delivery);
                                }}
                            >
                                <RotateCcw className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-[10px] font-bold">Reassign Rider</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {!delivery.is_failed && delivery.delivery_type === 'internal' && !delivery.is_cancelled && !delivery.is_delivered && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant={isUnassignedInternal ? "default" : "ghost"}
                                className={cn(
                                    "size-7 rounded-lg transition-all",
                                    isUnassignedInternal ? "bg-[#E75480] hover:bg-[#D43F6B] text-white shadow-xs" : "hover:bg-[#FFF5F7] dark:hover:bg-white/10"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAssignRider(delivery);
                                }}
                            >
                                <Bike className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-[10px] font-bold">{delivery.rider_id ? 'Change Rider' : 'Assign Rider'}</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {delivery.next_statuses.length > 0 && !delivery.is_cancelled && !delivery.is_delivered && !delivery.is_failed && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 rounded-lg hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(delivery.id);
                                }}
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-[10px] font-bold">Advance Status</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 rounded-lg hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#7D6B6E] dark:text-[#94A3B8] transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(delivery);
                            }}
                        >
                            <Eye className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-[10px] font-bold">View Details</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
});

interface SortableHeaderProps {
    label: string;
    sortKey: SortKey;
    currentSort: SortKey;
    currentDir: SortDir;
    onSort: (key: SortKey) => void;
    className?: string;
}

function SortableHeader({ label, sortKey, currentSort, currentDir, onSort, className }: SortableHeaderProps) {
    const isActive = currentSort === sortKey;
    const Icon = isActive ? (currentDir === 'asc' ? ChevronUp : ChevronDown) : ArrowUpDown;

    return (
        <button
            type="button"
            className={cn(
                "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer",
                isActive && "text-[#E75480] dark:text-[#FF4F81]",
                className
            )}
            onClick={() => onSort(sortKey)}
        >
            <span>{label}</span>
            <Icon className="size-3 shrink-0" />
        </button>
    );
}

export function DeliveryTable({
    deliveries,
    onSelect,
    onUpdateStatus,
    onAssignRider,
    onFailDelivery,
    containerHeight = 600,
}: DeliveryTableProps) {
    const [sortKey, setSortKey] = React.useState<SortKey>('date');
    const [sortDir, setSortDir] = React.useState<SortDir>('desc');
    const listRef = useRef<HTMLDivElement>(null);

    const handleSort = useCallback((key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }, [sortKey]);

    const sortedDeliveries = React.useMemo(() => {
        const sorted = [...deliveries];
        sorted.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'order':
                    cmp = (a.sale?.order_number || a.order?.order_number || '').localeCompare(b.sale?.order_number || b.order?.order_number || '');
                    break;
                case 'customer':
                    cmp = a.customer_name.localeCompare(b.customer_name);
                    break;
                case 'status':
                    cmp = a.status.localeCompare(b.status);
                    break;
                case 'amount': {
                    const totalA = a.sale?.total || a.order?.total_amount || 0;
                    const totalB = b.sale?.total || b.order?.total_amount || 0;
                    cmp = totalA - totalB;
                    break;
                }
                case 'date':
                    cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return sorted;
    }, [deliveries, sortKey, sortDir]);

    const listHeight = Math.max(200, containerHeight - HEADER_HEIGHT);

    return (
        <div className="w-full overflow-hidden rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors duration-300 font-['Outfit']">
            {/* Table Header */}
            <div
                className="flex items-center gap-2 px-5 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 border-b border-[#F8C8DC]/60 dark:border-white/10 select-none"
                style={{ height: HEADER_HEIGHT }}
                role="row"
            >
                <div className="w-27.5 shrink-0">
                    <SortableHeader label="Status" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-30 shrink-0">
                    <SortableHeader label="Order #" sortKey="order" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-15 shrink-0 flex justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8]">Items</span>
                </div>
                <div className="flex-1 min-w-35">
                    <SortableHeader label="Customer" sortKey="customer" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-25 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8]">Type</span>
                </div>
                <div className="w-30 shrink-0 hidden xl:block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8]">Branch</span>
                </div>
                <div className="w-25 shrink-0 text-right">
                    <SortableHeader label="Amount" sortKey="amount" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="justify-end" />
                </div>
                <div className="w-22.5 shrink-0 hidden lg:block">
                    <SortableHeader label="Date" sortKey="date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-25 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8] text-right block">Actions</span>
                </div>
            </div>

            {/* Virtualized Rows */}
            <div className="relative">
                <List
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    listRef={listRef as any}
                    style={{ height: listHeight, overflowX: 'hidden' }}
                    rowCount={sortedDeliveries.length}
                    rowHeight={ROW_HEIGHT}
                    overscanCount={5}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    rowComponent={TableRow as any}
                    rowProps={{
                        deliveries: sortedDeliveries,
                        onSelect,
                        onUpdateStatus,
                        onAssignRider,
                        onFailDelivery,
                    }}
                />
            </div>
        </div>
    );
}

export default DeliveryTable;
