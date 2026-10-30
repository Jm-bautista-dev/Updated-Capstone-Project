import { motion, AnimatePresence } from 'framer-motion';
import { Package, RefreshCw, Edit2, Trash2, Eye, Layers, PackageSearch, MinusCircle, MapPin } from 'lucide-react';

import type { InventoryRow } from '@/components/inventory/InventoryHero';
import { StatusBadge } from '@/components/products/StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface InventoryTableProps {
    inventory: InventoryRow[];
    isAdmin: boolean;
    density: 'compact' | 'comfortable';
    selectedIds: number[];
    onToggleSelectAll: (checked: boolean) => void;
    onToggleSelectRow: (id: number) => void;
    onSelectRow: (row: InventoryRow) => void;
    onOpenStockIn: (row: InventoryRow) => void;
    onOpenWastage: (row: InventoryRow) => void;
    onOpenReduceStock?: (row: InventoryRow) => void;
    onOpenEdit: (row: InventoryRow) => void;
    onOpenDelete: (row: InventoryRow) => void;
    branchName?: string;
    emptyMessage?: string;
}

export function InventoryTable({
    inventory,
    isAdmin,
    density,
    selectedIds,
    onToggleSelectAll,
    onToggleSelectRow,
    onSelectRow,
    onOpenStockIn,
    onOpenWastage,
    onOpenReduceStock,
    onOpenEdit,
    onOpenDelete,
    branchName,
    emptyMessage,
}: InventoryTableProps) {
    const isAllSelected = inventory.length > 0 && inventory.every((r) => selectedIds.includes(r.id));

    return (
        <div className="rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 overflow-hidden flex flex-col min-h-0 w-full max-w-full">
            <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700 w-full">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-[#FFFDFE]/95 dark:bg-[#14141E]/95 border-b border-[#F8C8DC]/40 dark:border-white/10 backdrop-blur-md">
                        <tr className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                            <th className="py-3 px-1.5 sm:px-2 w-8 sm:w-10 text-center">
                                {isAdmin && (
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={(e) => onToggleSelectAll(e.target.checked)}
                                        className="size-3.5 sm:size-4 rounded border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#E1062C] focus:ring-[#E75480]/20 cursor-pointer"
                                    />
                                )}
                            </th>
                            <th className="py-3 px-2 sm:px-3 min-w-30">SKU / Item Specs</th>
                            <th className="py-3 px-1.5 sm:px-2 text-center w-20 sm:w-24 whitespace-nowrap">Stock Level</th>
                            {isAdmin && (
                                <th className="py-3 px-1.5 sm:px-2 text-left w-22 sm:w-28 whitespace-nowrap">
                                    <span className="hidden xl:inline 2xl:hidden">Cost & Val</span>
                                    <span className="xl:hidden 2xl:inline">Cost & Valuation</span>
                                </th>
                            )}
                            <th className="py-3 px-1.5 sm:px-2 text-center w-18 sm:w-22 whitespace-nowrap">
                                <span className="hidden xl:inline 2xl:hidden">Location</span>
                                <span className="xl:hidden 2xl:inline">Branch Location</span>
                            </th>
                            <th className="py-3 px-1.5 sm:px-2 text-center w-20 sm:w-24 whitespace-nowrap">Status</th>
                            <th className="py-3 px-1.5 sm:px-2.5 text-right w-22 sm:w-26 whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8C8DC]/20 dark:divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {inventory.length === 0 ? (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-48 text-center"
                                >
                                    <td colSpan={isAdmin ? 7 : 6} className="p-8 text-[#7D6B6E] dark:text-[#94A3B8]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <PackageSearch className="size-8 text-[#E75480]/50 dark:text-[#FF4F81]/50 mb-1" />
                                            <span className="font-bold text-sm text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {emptyMessage || 'No Inventory Rows Found'}
                                            </span>
                                            <span className="text-xs text-[#9E8B8E] dark:text-[#64748B]">
                                                {branchName ? `No ingredients recorded for ${branchName}.` : 'Try adjusting your search query or branch filter selections.'}
                                            </span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ) : (
                                inventory.map((row) => {
                                    const skuString = `ING-${row.id.toString().padStart(5, '0')}`;
                                    const statusString = row.is_out_of_stock
                                        ? 'Out of Stock'
                                        : row.is_low_stock
                                        ? 'Low Stock'
                                        : 'In Stock';
                                    const stockValuation = row.stock * (row.cost_per_unit || 0);

                                    return (
                                        <motion.tr
                                            key={`${row.id}-${row.branch_id}`}
                                            layout
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="hover:bg-[#FADADD]/15 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                            onClick={() => onSelectRow(row)}
                                        >
                                            {/* Checkbox */}
                                            <td className={cn('px-1.5 sm:px-2 text-center align-middle', density === 'compact' ? 'py-1.5' : 'py-2.5')} onClick={(e) => e.stopPropagation()}>
                                                {isAdmin && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(row.id)}
                                                        onChange={() => onToggleSelectRow(row.id)}
                                                        className="size-3.5 sm:size-4 rounded border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#E1062C] focus:ring-[#E75480]/20 cursor-pointer"
                                                    />
                                                )}
                                            </td>

                                            {/* Item Name & SKU */}
                                            <td className={cn('px-2 sm:px-3 align-middle min-w-30', density === 'compact' ? 'py-1.5' : 'py-2.5')}>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="size-8 sm:size-9 rounded-xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/40 dark:from-[#1A1A24] dark:to-[#222230] border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                                        <Package className="size-4 text-[#E75480]/70 dark:text-[#FF4F81]/70" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors leading-snug wrap-break-word text-xs line-clamp-2">
                                                                {row.name}
                                                            </span>
                                                            {row.is_composite && (
                                                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shrink-0">
                                                                    Composite
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[#9E8B8E] dark:text-[#64748B] mt-0.5">
                                                            <span>SKU: {skuString}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Stock Level */}
                                            <td className={cn('px-1.5 sm:px-2 align-middle text-center font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]', density === 'compact' ? 'py-1.5' : 'py-2.5')}>
                                                <span className="text-xs wrap-break-word">{row.stock} {row.unit}</span>
                                                <span className="block text-[9px] text-[#9E8B8E] dark:text-[#64748B] font-medium leading-tight mt-0.5">
                                                    Low: {row.low_stock_level} {row.unit}
                                                </span>
                                            </td>

                                            {/* Cost & Valuation */}
                                            {isAdmin && (
                                                <td className={cn('px-1.5 sm:px-2 align-middle font-mono', density === 'compact' ? 'py-1.5' : 'py-2.5')}>
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-xs font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] leading-snug truncate" title={`${formatCurrency(row.cost_per_unit || 0)} / ${row.unit}`}>
                                                            {formatCurrency(row.cost_per_unit || 0)} <span className="text-[10px] text-[#9E8B8E] dark:text-[#64748B] font-normal">/{row.unit}</span>
                                                        </span>
                                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5 truncate" title={`Valuation: ${formatCurrency(stockValuation)}`}>
                                                            Val: {formatCurrency(stockValuation)}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}

                                            {/* Branch Location */}
                                            <td className={cn('px-1.5 sm:px-2 align-middle text-center', density === 'compact' ? 'py-1.5' : 'py-2.5')}>
                                                <span
                                                    className="inline-flex items-center gap-1 bg-[#FADADD]/30 dark:bg-white/5 border border-[#F8C8DC]/50 dark:border-white/10 px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#5D4A4D] dark:text-[#E2E8F0] max-w-23.75 truncate"
                                                    title={row.branch_name || 'Global'}
                                                >
                                                    <MapPin className="size-2.5 text-[#E75480] dark:text-[#FF4F81] shrink-0" />
                                                    <span className="truncate">{row.branch_name || 'Global'}</span>
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className={cn('px-1.5 sm:px-2 align-middle text-center', density === 'compact' ? 'py-1.5' : 'py-2.5')}>
                                                <StatusBadge status={statusString} className="px-2 py-0.5 text-[10px] tracking-tight font-bold" />
                                            </td>

                                            {/* Quick Actions */}
                                            <td className={cn('px-1.5 sm:px-2.5 align-middle text-right', density === 'compact' ? 'py-1.5' : 'py-2.5')} onClick={(e) => e.stopPropagation()}>
                                                <div className="flex flex-wrap items-center justify-end gap-1 max-w-22 2xl:max-w-none 2xl:flex-nowrap ml-auto">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => onSelectRow(row)}
                                                        className="size-7 rounded-lg hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#5D4A4D] dark:text-[#E2E8F0] hover:text-[#E75480] dark:hover:text-[#FF4F81] cursor-pointer"
                                                        title="View Specifications"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => onOpenStockIn(row)}
                                                        className="size-7 rounded-lg hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#E75480] dark:text-[#FF4F81] cursor-pointer"
                                                        title="Stock In"
                                                    >
                                                        <RefreshCw className="size-3.5" />
                                                    </Button>

                                                    {onOpenReduceStock && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => onOpenReduceStock(row)}
                                                            className="size-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 dark:text-rose-400 cursor-pointer"
                                                            title="Reduce Stock"
                                                        >
                                                            <MinusCircle className="size-3.5" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => onOpenWastage(row)}
                                                        className="size-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 cursor-pointer"
                                                        title="Log Wastage"
                                                    >
                                                        <Layers className="size-3.5" />
                                                    </Button>

                                                    {isAdmin && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => onOpenEdit(row)}
                                                            className="size-7 rounded-lg hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#E75480] dark:text-[#FF4F81] cursor-pointer"
                                                            title="Edit Specs"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </Button>
                                                    )}

                                                    {isAdmin && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => onOpenDelete(row)}
                                                            className="size-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 cursor-pointer"
                                                            title="Delete Ingredient"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
