import { format } from 'date-fns';
import { 
    RefreshCw, 
    Edit2, 
    Trash2, 
    MapPin, 
    Tag, 
    Clock,
    Activity,
    DollarSign,
    Scale,
    AlertTriangle,
    Layers
} from 'lucide-react';

import type { InventoryRow } from '@/components/inventory/InventoryHero';
import { StatusBadge } from '@/components/products/StatusBadge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

export type ActivityLog = {
    id?: number | string;
    change_qty?: number | string;
    time_ago?: string;
    reason?: string;
    source?: string;
    employee_name?: string;
    remaining?: string;
    created_at?: string;
};

interface InventoryDrawerProps {
    row: InventoryRow | null;
    open: boolean;
    onClose: () => void;
    isAdmin: boolean;
    drawerLogs: ActivityLog[];
    loadingDrawerLogs: boolean;
    drawerTab: 'overview' | 'history' | 'procurement';
    onTabChange: (tab: 'overview' | 'history' | 'procurement') => void;
    onOpenStockIn: (row: InventoryRow) => void;
    onOpenWastage: (row: InventoryRow) => void;
    onOpenEdit: (row: InventoryRow) => void;
    onOpenDelete: (row: InventoryRow) => void;
}

export function InventoryDrawer({
    row,
    open,
    onClose,
    isAdmin,
    drawerLogs,
    loadingDrawerLogs,
    drawerTab,
    onTabChange,
    onOpenStockIn,
    onOpenWastage,
    onOpenEdit,
    onOpenDelete,
}: InventoryDrawerProps) {
    if (!row) return null;

    const skuString = `ING-${row.id.toString().padStart(5, '0')}`;
    const statusString = row.is_out_of_stock
        ? 'Out of Stock'
        : row.is_low_stock
        ? 'Low Stock'
        : 'In Stock';

    const stockValuation = row.stock * (row.cost_per_unit || 0);

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 bg-[#FFFDFE] dark:bg-[#0F0F14] border-l border-[#F8C8DC]/60 dark:border-white/10 overflow-y-auto font-['Outfit'] transition-colors duration-300">
                
                {/* Header Banner */}
                <div className="relative w-full h-44 bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/40 dark:from-[#181822] dark:to-[#20202E] p-6 flex flex-col justify-between border-b border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <StatusBadge status={statusString} />
                        <span className="text-xs font-mono font-bold text-[#E75480] dark:text-[#FF4F81] bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 px-3 py-1 rounded-full shadow-2xs">
                            {skuString}
                        </span>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#9E8B8E] dark:text-[#64748B] uppercase tracking-wider">
                            <Tag className="size-3.5" />
                            <span>Ingredient Item</span>
                        </div>
                        <h2 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight truncate">
                            {row.name}
                        </h2>
                    </div>
                </div>

                {/* Tab Controls */}
                <div className="flex border-b border-[#F8C8DC]/40 dark:border-white/10 bg-[#FFF5F7]/50 dark:bg-[#121218]/50 p-1.5 gap-1">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'history', label: 'Stock Movement' },
                        { id: 'procurement', label: 'Actions' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id as 'overview' | 'history' | 'procurement')}
                            className={cn(
                                'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
                                drawerTab === tab.id
                                    ? 'bg-white dark:bg-[#181820] text-[#E75480] dark:text-[#FF4F81] shadow-2xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    
                    {/* OVERVIEW TAB */}
                    {drawerTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stock & Valuation Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Current Stock</span>
                                    <span className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-1 block">
                                        {row.stock} {row.unit}
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Stock Valuation</span>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                                        {formatCurrency(stockValuation)}
                                    </span>
                                </div>
                            </div>

                            {/* Item Specs Cards */}
                            <div className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-2 font-bold text-[#5D4A4D] dark:text-[#94A3B8]">
                                        <AlertTriangle className="size-4 text-amber-500" />
                                        <span>Low Stock Mark</span>
                                    </span>
                                    <span className="font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{row.low_stock_level} {row.unit}</span>
                                </div>

                                {isAdmin && (
                                    <div className="flex items-center justify-between text-xs border-t border-[#F8C8DC]/30 dark:border-white/10 pt-2.5">
                                        <span className="flex items-center gap-2 font-bold text-[#5D4A4D] dark:text-[#94A3B8]">
                                            <DollarSign className="size-4 text-emerald-500" />
                                            <span>Cost Per Base Unit</span>
                                        </span>
                                        <span className="font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(row.cost_per_unit || 0)} / {row.unit}</span>
                                    </div>
                                )}

                                {row.unit === 'pcs' && row.avg_weight_per_piece && (
                                    <div className="flex items-center justify-between text-xs border-t border-[#F8C8DC]/30 dark:border-white/10 pt-2.5">
                                        <span className="flex items-center gap-2 font-bold text-[#5D4A4D] dark:text-[#94A3B8]">
                                            <Scale className="size-4 text-purple-500" />
                                            <span>Avg Weight / Piece</span>
                                        </span>
                                        <span className="font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{row.avg_weight_per_piece} g / pc</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs border-t border-[#F8C8DC]/30 dark:border-white/10 pt-2.5">
                                    <span className="flex items-center gap-2 font-bold text-[#5D4A4D] dark:text-[#94A3B8]">
                                        <MapPin className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                        <span>Branch Location</span>
                                    </span>
                                    <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{row.branch_name || 'Global'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STOCK MOVEMENT TIMELINE TAB */}
                    {drawerTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] flex items-center gap-1.5">
                                    <Activity className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                    <span>Stock Adjustment History</span>
                                </span>
                            </div>

                            {loadingDrawerLogs ? (
                                <div className="p-8 text-center text-xs text-[#9E8B8E] dark:text-[#64748B]">
                                    Fetching movement logs...
                                </div>
                            ) : drawerLogs.length === 0 ? (
                                <div className="p-6 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 text-center text-xs text-[#9E8B8E] dark:text-[#64748B]">
                                    No logged movements found for this item.
                                </div>
                            ) : (
                                <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F8C8DC]/50 dark:before:bg-white/10">
                                    {drawerLogs.map((log, idx) => {
                                        const qtyNum = Number(log.change_qty || 0);
                                        const isPositive = qtyNum > 0;
                                        return (
                                            <div key={log.id || idx} className="flex items-start gap-4 relative pl-7">
                                                <div className={cn(
                                                    "absolute left-1 top-1.5 size-3 rounded-full border-2 bg-white dark:bg-[#121218]",
                                                    isPositive ? "border-emerald-500" : "border-rose-500"
                                                )} />
                                                <div className="flex-1 p-3 rounded-xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/30 dark:border-white/10 text-xs">
                                                    <div className="flex items-center justify-between font-bold">
                                                        <span className={isPositive ? "text-emerald-600 dark:text-emerald-400 font-mono" : "text-rose-600 dark:text-rose-400 font-mono"}>
                                                            {isPositive ? `+${log.change_qty}` : log.change_qty} {row.unit}
                                                        </span>
                                                        <span className="text-[10px] text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1 font-mono">
                                                            <Clock className="size-3" />
                                                            {log.time_ago || (log.created_at ? format(new Date(log.created_at), 'MMM d, h:mm a') : '')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] mt-1 font-medium">
                                                        Reason: {log.reason || 'Manual Adjustment'} • By {log.employee_name || 'System'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ACTIONS TAB */}
                    {drawerTab === 'procurement' && (
                        <div className="space-y-3">
                            <Button
                                onClick={() => { onClose(); onOpenStockIn(row); }}
                                className="w-full h-12 bg-white dark:bg-[#181822] hover:bg-[#FFF5F7] dark:hover:bg-white/10 border border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#FF4F81] rounded-2xl font-bold text-xs gap-2 cursor-pointer shadow-2xs"
                            >
                                <RefreshCw className="size-4" />
                                <span>Restock / Stock In</span>
                            </Button>

                            <Button
                                onClick={() => { onClose(); onOpenWastage(row); }}
                                variant="outline"
                                className="w-full h-12 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl font-bold text-xs gap-2 cursor-pointer shadow-2xs"
                            >
                                <Layers className="size-4" />
                                <span>Log Spoilage / Wastage</span>
                            </Button>

                            {isAdmin && (
                                <Button
                                    onClick={() => { onClose(); onOpenEdit(row); }}
                                    className="w-full h-12 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white rounded-2xl font-bold text-xs gap-2 cursor-pointer shadow-xs"
                                >
                                    <Edit2 className="size-4" />
                                    <span>Edit Ingredient Specs</span>
                                </Button>
                            )}

                            {isAdmin && (
                                <Button
                                    onClick={() => { onClose(); onOpenDelete(row); }}
                                    variant="outline"
                                    className="w-full h-12 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl font-bold text-xs gap-2 cursor-pointer shadow-2xs"
                                >
                                    <Trash2 className="size-4" />
                                    <span>Delete Ingredient</span>
                                </Button>
                            )}
                        </div>
                    )}

                </div>
            </SheetContent>
        </Sheet>
    );
}
