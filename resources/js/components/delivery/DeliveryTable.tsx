import {
    ArrowUpDown,
    Bike, ChevronDown, ChevronRight, ChevronUp, Eye, Package, Truck,
} from 'lucide-react';
import React, { useCallback, useRef } from 'react';
import { List } from 'react-window';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { Delivery } from './types';
import { formatCurrency, formatTime } from './types';

interface DeliveryTableProps {
    deliveries: Delivery[];
    onSelect: (delivery: Delivery) => void;
    onUpdateStatus: (id: number) => void;
    onAssignRider: (delivery: Delivery) => void;
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
}

const TableRow = React.memo(function TableRow({
    index,
    style,
    ariaAttributes,
    deliveries,
    onSelect,
    onUpdateStatus,
    onAssignRider,
}: {
    index: number;
    style: React.CSSProperties;
    ariaAttributes?: any;
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
                isUnassignedInternal && "bg-amber-500/5 hover:bg-amber-500/10"
            )}
            onClick={() => onSelect(delivery)}
            role="row"
        >
            {/* Status */}
            <div className="w-[110px] shrink-0">
                <Badge className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${delivery.status_color}`}>
                    {delivery.status_label}
                </Badge>
            </div>

            {/* Order # */}
            <div className="w-[120px] shrink-0">
                <p className="font-bold text-xs truncate text-[#3D2C2E] dark:text-[#F8FAFC]">
                    {delivery.sale?.order_number || (delivery.order && `MOB-${delivery.order.id.toString().padStart(4, '0')}`) || 'N/A'}
                </p>
            </div>

            {/* Items count */}
            <div className="w-[60px] shrink-0 flex items-center justify-center">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-[#7D6B6E]/60 dark:text-[#94A3B8]/60 hover:text-[#E75480] dark:hover:text-[#FF4F81] transition-colors cursor-help">
                            <Package className="size-3.5" />
                            <span className="text-[10px] font-black">
                                {((delivery.sale?.items || delivery.order?.items) || []).length}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-0 overflow-hidden rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xl bg-white dark:bg-[#121218]" side="right">
                        <div className="p-3 min-w-[180px] space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8] border-b border-[#F8C8DC]/30 dark:border-white/5 pb-2">Order Contents</p>
                            <div className="space-y-1.5">
                                {((delivery.sale?.items || delivery.order?.items) || []).map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center gap-3 text-[11px]">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="size-6 rounded bg-[#FFF5F7] dark:bg-[#1C1C28] flex items-center justify-center shrink-0 border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden">
                                                {item.product?.image_url ? (
                                                    <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="size-2.5 text-[#7D6B6E]/40 dark:text-[#94A3B8]/40" />
                                                )}
                                            </div>
                                            <span className="font-semibold truncate max-w-[110px] text-[#3D2C2E] dark:text-[#F8FAFC]">{item.product?.name || 'Product'}</span>
                                        </div>
                                        <span className="font-black text-[#E75480] dark:text-[#FF4F81] shrink-0">×{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Customer */}
            <div className="flex-1 min-w-[140px]">
                <p className="font-semibold text-xs truncate text-[#3D2C2E] dark:text-[#F8FAFC]">{delivery.customer_name}</p>
            </div>

            {/* Type & Rider */}
            <div className="w-[120px] shrink-0">
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
            <div className="w-[100px] shrink-0 hidden xl:block">
                <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] truncate">
                    {delivery.sale?.branch?.name || delivery.order?.branch?.name || 'Main Branch'}
                </p>
            </div>

            {/* Amount */}
            <div className="w-[90px] shrink-0 text-right">
                <p className="font-black text-xs font-mono tabular-nums text-[#E75480] dark:text-[#FF4F81]">
                    {formatCurrency(delivery.sale?.total || delivery.order?.total_amount || 0)}
                </p>
            </div>

            {/* Date */}
            <div className="w-[80px] shrink-0 hidden lg:block">
                <p className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8]">{formatTime(delivery.created_at)}</p>
            </div>

            {/* Actions */}
            <div className="w-[120px] shrink-0 flex items-center justify-end gap-1 group-hover:opacity-100 transition-opacity duration-200">
                {delivery.delivery_type === 'internal' && !delivery.is_cancelled && !delivery.is_delivered && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant={isUnassignedInternal ? "default" : "ghost"}
                                className={cn(
                                    "h-7 w-7 rounded-lg cursor-pointer",
                                    isUnassignedInternal && "bg-amber-500 hover:bg-amber-600 text-white animate-bounce-subtle"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAssignRider(delivery);
                                }}
                            >
                                <Bike className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isUnassignedInternal ? 'Assign Rider' : 'Reassign Rider'}</TooltipContent>
                    </Tooltip>
                )}

                {delivery.next_statuses.length > 0 && !delivery.is_cancelled && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                className="h-7 w-7 rounded-lg bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(delivery.id);
                                }}
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark as {delivery.next_statuses[0].replace(/_/g, ' ')}</TooltipContent>
                    </Tooltip>
                )}
                
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(delivery);
                    }}
                >
                    <Eye className="size-3.5" />
                </Button>
            </div>
        </div>
    );
});

// Sort column header component
function SortableHeader({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
    className,
}: {
    label: string;
    sortKey: SortKey;
    currentSort: SortKey;
    currentDir: SortDir;
    onSort: (key: SortKey) => void;
    className?: string;
}) {
    const isActive = currentSort === sortKey;
    return (
        <button
            className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer ${className || ''}`}
            onClick={() => onSort(sortKey)}
        >
            {label}
            {isActive ? (
                currentDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
            ) : (
                <ArrowUpDown className="size-3 opacity-30" />
            )}
        </button>
    );
}

const DeliveryTable = React.memo(function DeliveryTable({
    deliveries,
    onSelect,
    onUpdateStatus,
    onAssignRider,
    containerHeight = 600,
}: DeliveryTableProps) {
    const [sortKey, setSortKey] = React.useState<SortKey>('date');
    const [sortDir, setSortDir] = React.useState<SortDir>('desc');
    const listRef = useRef<any>(null);

    const handleSort = useCallback((key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }, [sortKey]);

    const sortedDeliveries = React.useMemo(() => {
        const sorted = [...deliveries].sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'order':
                    cmp = (a.sale?.order_number || '').localeCompare(b.sale?.order_number || '');
                    break;
                case 'customer':
                    cmp = a.customer_name.localeCompare(b.customer_name);
                    break;
                case 'status':
                    cmp = a.status.localeCompare(b.status);
                    break;
                case 'amount':
                    const totalA = a.sale?.total || a.order?.total_amount || 0;
                    const totalB = b.sale?.total || b.order?.total_amount || 0;
                    cmp = totalA - totalB;
                    break;
                case 'date':
                    cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return sorted;
    }, [deliveries, sortKey, sortDir]);

    const listHeight = Math.min(containerHeight, sortedDeliveries.length * ROW_HEIGHT);

    return (
        <div className="rounded-4xl border border-white/90 dark:border-white/10 overflow-hidden bg-white/80 dark:bg-[#121218]/80 backdrop-blur-2xl shadow-[0_10px_30px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
            {/* Table Header */}
            <div
                className="flex items-center gap-2 px-5 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 border-b border-[#F8C8DC]/60 dark:border-white/10 select-none"
                style={{ height: HEADER_HEIGHT }}
                role="row"
            >
                <div className="w-[110px] shrink-0">
                    <SortableHeader label="Status" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-[120px] shrink-0">
                    <SortableHeader label="Order #" sortKey="order" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-[60px] shrink-0 flex justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8]">Items</span>
                </div>
                <div className="flex-1 min-w-[140px]">
                    <SortableHeader label="Customer" sortKey="customer" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-[100px] shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8]">Type</span>
                </div>
                <div className="w-[120px] shrink-0 hidden xl:block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8]">Branch</span>
                </div>
                <div className="w-[100px] shrink-0 text-right">
                    <SortableHeader label="Amount" sortKey="amount" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="justify-end" />
                </div>
                <div className="w-[90px] shrink-0 hidden lg:block">
                    <SortableHeader label="Date" sortKey="date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-[100px] shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8] text-right block">Actions</span>
                </div>
            </div>

            {/* Virtualized Rows */}
            <div className="relative">
                <List
                    listRef={listRef}
                    style={{ height: listHeight, overflowX: 'hidden' }}
                    rowCount={sortedDeliveries.length}
                    rowHeight={ROW_HEIGHT}
                    overscanCount={5}
                    rowComponent={TableRow as any}
                    rowProps={{
                        deliveries: sortedDeliveries,
                        onSelect,
                        onUpdateStatus,
                        onAssignRider
                    } as any}
                />
            </div>
        </div>
    );
});

export default DeliveryTable;
