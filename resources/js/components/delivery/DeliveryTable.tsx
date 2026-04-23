import React, { useRef, useCallback } from 'react';
import { List } from 'react-window';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Eye, ChevronRight, Bike, Truck, ArrowUpDown,
    ChevronUp, ChevronDown, Package
} from 'lucide-react';
import type { Delivery } from './types';
import { formatCurrency, formatTime, formatDate } from './types';

interface DeliveryTableProps {
    deliveries: Delivery[];
    onSelect: (delivery: Delivery) => void;
    onUpdateStatus: (id: number) => void;
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
}

const TableRow = React.memo(function TableRow({
    index,
    style,
    ariaAttributes,
    deliveries,
    onSelect,
    onUpdateStatus,
}: {
    index: number;
    style: React.CSSProperties;
    ariaAttributes?: any;
} & RowProps) {
    const delivery = deliveries[index];
    const TypeIcon = delivery.delivery_type === 'internal' ? Bike : Truck;
    const typeColor = delivery.delivery_type === 'internal' ? 'text-primary' : 'text-emerald-600';

    return (
        <div
            style={style}
            className="flex items-center gap-2 px-5 border-b border-border/50 hover:bg-muted/30 cursor-pointer group transition-colors duration-150"
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
                <p className="font-bold text-xs truncate">
                    {delivery.sale?.order_number || (delivery.order && `MOB-${delivery.order.id.toString().padStart(4, '0')}`) || 'N/A'}
                </p>
            </div>

            {/* Items Summary (Hoverable) */}
            <div className="w-[60px] shrink-0 flex items-center justify-center">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-primary transition-colors cursor-help">
                            <Package className="size-3.5" />
                            <span className="text-[10px] font-black">
                                {((delivery.sale?.items || delivery.order?.items) || []).length}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-0 overflow-hidden rounded-xl border-none shadow-2xl bg-popover" side="right">
                        <div className="p-3 min-w-[180px] space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Order Contents</p>
                            <div className="space-y-1.5">
                                {((delivery.sale?.items || delivery.order?.items) || []).map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center gap-4 text-[11px]">
                                        <span className="font-semibold truncate max-w-[110px]">{item.product.name}</span>
                                        <span className="font-black text-primary shrink-0">×{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Customer */}
            <div className="flex-1 min-w-[140px]">
                <p className="font-semibold text-xs truncate">{delivery.customer_name}</p>
            </div>

            {/* Type */}
            <div className="w-[100px] shrink-0 flex items-center gap-1.5">
                <TypeIcon className={`size-3.5 ${typeColor}`} />
                <span className="text-[10px] font-bold uppercase truncate">
                    {delivery.delivery_type === 'internal' ? 'Internal' : (delivery.external_service?.toUpperCase() || 'External')}
                </span>
            </div>

            {/* Branch */}
            <div className="w-[120px] shrink-0 hidden xl:block">
                <p className="text-xs text-muted-foreground truncate">
                    {delivery.sale?.branch?.name || delivery.order?.branch?.name || 'Main Branch'}
                </p>
            </div>

            {/* Amount */}
            <div className="w-[100px] shrink-0 text-right">
                <p className="font-black text-xs tabular-nums text-primary">
                    {formatCurrency(delivery.sale?.total || delivery.order?.total_amount || 0)}
                </p>
            </div>

            {/* Date */}
            <div className="w-[90px] shrink-0 hidden lg:block">
                <p className="text-[10px] text-muted-foreground">{formatDate(delivery.created_at)}</p>
                <p className="text-[10px] text-muted-foreground">{formatTime(delivery.created_at)}</p>
            </div>

            {/* Actions */}
            <div className="w-[100px] shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {delivery.next_statuses.length > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                className="h-7 w-7 rounded-lg"
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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
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
            className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors ${className || ''}`}
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
        <div className="rounded-2xl border overflow-hidden bg-background shadow-sm">
            {/* Table Header */}
            <div
                className="flex items-center gap-2 px-5 bg-muted/30 border-b select-none"
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Items</span>
                </div>
                <div className="flex-1 min-w-[140px]">
                    <SortableHeader label="Customer" sortKey="customer" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-[100px] shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</span>
                </div>
                <div className="w-[120px] shrink-0 hidden xl:block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branch</span>
                </div>
                <div className="w-[100px] shrink-0 text-right">
                    <SortableHeader label="Amount" sortKey="amount" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="justify-end" />
                </div>
                <div className="w-[90px] shrink-0 hidden lg:block">
                    <SortableHeader label="Date" sortKey="date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                </div>
                <div className="w-[100px] shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right block">Actions</span>
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
                        onUpdateStatus
                    } as any}
                />
            </div>
        </div>
    );
});

export default DeliveryTable;
