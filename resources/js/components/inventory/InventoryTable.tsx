import { motion, AnimatePresence } from 'framer-motion';
import { Package, RefreshCw, Edit2, Trash2, Eye, Layers, PackageSearch } from 'lucide-react';

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
    onOpenEdit: (row: InventoryRow) => void;
    onOpenDelete: (row: InventoryRow) => void;
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
    onOpenEdit,
    onOpenDelete,
}: InventoryTableProps) {
    const isAllSelected = inventory.length > 0 && inventory.every((r) => selectedIds.includes(r.id));

    return (
        <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-[#FFFDFE]/90 dark:bg-[#14141E]/90 border-b border-[#F8C8DC]/40 dark:border-white/10 backdrop-blur-md">
                        <tr className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                            <th className="py-4 px-6 w-10">
                                {isAdmin && (
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={(e) => onToggleSelectAll(e.target.checked)}
                                        className="size-4 rounded border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#E1062C] focus:ring-[#E75480]/20 cursor-pointer"
                                    />
                                )}
                            </th>
                            <th className="py-4 px-6">SKU / Item Specs</th>
                            <th className="py-4 px-6 text-center">Stock Level</th>
                            <th className="py-4 px-6 hidden sm:table-cell">Cost & Valuation</th>
                            <th className="py-4 px-6 hidden md:table-cell">Branch Location</th>
                            <th className="py-4 px-6 text-center">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
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
                                    <td colSpan={7} className="p-8 text-[#7D6B6E] dark:text-[#94A3B8]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <PackageSearch className="size-8 text-[#E75480]/50 dark:text-[#FF4F81]/50 mb-1" />
                                            <span className="font-bold text-sm text-[#3D2C2E] dark:text-[#F8FAFC]">No Inventory Rows Found</span>
                                            <span className="text-xs text-[#9E8B8E] dark:text-[#64748B]">Try adjusting your search query or branch filter selections.</span>
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
                                            <td className="p-4 px-6 align-middle" onClick={(e) => e.stopPropagation()}>
                                                {isAdmin && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(row.id)}
                                                        onChange={() => onToggleSelectRow(row.id)}
                                                        className="size-4 rounded border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#E1062C] focus:ring-[#E75480]/20 cursor-pointer"
                                                    />
                                                )}
                                            </td>

                                            {/* Item Name & SKU */}
                                            <td className={cn('px-6 align-middle', density === 'compact' ? 'py-2.5' : 'py-4')}>
                                                <div className="flex items-center gap-3.5">
                                                    <div className="size-11 rounded-xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/40 dark:from-[#1A1A24] dark:to-[#222230] border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                                        <Package className="size-5 text-[#E75480]/60 dark:text-[#FF4F81]/60" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors leading-snug">
                                                            {row.name}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-[#9E8B8E] dark:text-[#64748B]">
                                                            SKU: {skuString}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Stock Level */}
                                            <td className="p-4 px-6 align-middle text-center font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                <span>{row.stock} {row.unit}</span>
                                                <span className="block text-[10px] text-[#9E8B8E] dark:text-[#64748B] font-semibold">
                                                    Low mark: {row.low_stock_level} {row.unit}
                                                </span>
                                            </td>

                                            {/* Cost & Valuation */}
                                            <td className="p-4 px-6 align-middle hidden sm:table-cell font-mono">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                        {formatCurrency(row.cost_per_unit || 0)} / {row.unit}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        Val: {formatCurrency(stockValuation)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Branch Location */}
                                            <td className="p-4 px-6 align-middle hidden md:table-cell text-xs font-bold text-[#5D4A4D] dark:text-[#E2E8F0]">
                                                <span className="bg-[#FADADD]/30 dark:bg-white/5 border border-[#F8C8DC]/50 dark:border-white/10 px-3 py-1 rounded-xl">
                                                    {row.branch_name || 'Global'}
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-4 px-6 align-middle text-center">
                                                <StatusBadge status={statusString} />
                                            </td>

                                            {/* Quick Actions */}
                                            <td className="p-4 px-6 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => onSelectRow(row)}
                                                        className="size-8 rounded-xl hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#5D4A4D] dark:text-[#E2E8F0] hover:text-[#E75480] dark:hover:text-[#FF4F81] cursor-pointer"
                                                        title="View Specifications"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => onOpenStockIn(row)}
                                                        className="size-8 rounded-xl hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#E75480] dark:text-[#FF4F81] cursor-pointer"
                                                        title="Stock In"
                                                    >
                                                        <RefreshCw className="size-4" />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => onOpenWastage(row)}
                                                        className="size-8 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 cursor-pointer"
                                                        title="Log Wastage"
                                                    >
                                                        <Layers className="size-4" />
                                                    </Button>

                                                    {isAdmin && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => onOpenEdit(row)}
                                                            className="size-8 rounded-xl hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#E75480] dark:text-[#FF4F81] cursor-pointer"
                                                            title="Edit Specs"
                                                        >
                                                            <Edit2 className="size-4" />
                                                        </Button>
                                                    )}

                                                    {isAdmin && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => onOpenDelete(row)}
                                                            className="size-8 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 cursor-pointer"
                                                            title="Delete Ingredient"
                                                        >
                                                            <Trash2 className="size-4" />
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
