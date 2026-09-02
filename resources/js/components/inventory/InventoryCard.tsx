import { motion } from 'framer-motion';
import { Package, RefreshCw, Edit2, Trash2, Eye, MapPin, Layers } from 'lucide-react';

import type { InventoryRow } from '@/components/inventory/InventoryHero';
import { StatusBadge } from '@/components/products/StatusBadge';
import { Button } from '@/components/ui/button';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface InventoryCardProps {
    row: InventoryRow;
    isAdmin: boolean;
    onSelectRow: (row: InventoryRow) => void;
    onOpenStockIn: (row: InventoryRow) => void;
    onOpenWastage: (row: InventoryRow) => void;
    onOpenEdit: (row: InventoryRow) => void;
    onOpenDelete: (row: InventoryRow) => void;
    index?: number;
}

export function InventoryCard({
    row,
    isAdmin,
    onSelectRow,
    onOpenStockIn,
    onOpenWastage,
    onOpenEdit,
    onOpenDelete,
    index = 0,
}: InventoryCardProps) {
    const skuString = `ING-${row.id.toString().padStart(5, '0')}`;
    const statusString = row.is_out_of_stock
        ? 'Out of Stock'
        : row.is_low_stock
        ? 'Low Stock'
        : 'In Stock';

    const stockValuation = row.stock * (row.cost_per_unit || 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] p-5 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
            {/* Top Light Accent Bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-[#E75480]/30 dark:via-[#E1062C]/40 to-transparent group-hover:via-[#E75480] dark:group-hover:via-[#E1062C] transition-all duration-500" />

            <div>
                {/* SKU Header & Status */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-[#E75480] dark:text-[#FF4F81] bg-[#FADADD]/30 dark:bg-white/5 border border-[#F8C8DC]/50 dark:border-white/10 px-2.5 py-0.5 rounded-full">
                        {skuString}
                    </span>
                    <StatusBadge status={statusString} />
                </div>

                {/* Avatar Banner */}
                <div 
                    onClick={() => onSelectRow(row)}
                    className="relative w-full h-36 rounded-2xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/30 dark:from-[#1A1A24] dark:to-[#222230] border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden flex items-center justify-center mb-4 cursor-pointer group-hover:shadow-xs transition-all"
                >
                    <Package className="size-12 text-[#E75480]/50 dark:text-[#FF4F81]/50 group-hover:scale-110 transition-transform" />

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2.5 rounded-full bg-white/90 dark:bg-[#181820]/90 text-[#E75480] dark:text-[#FF4F81] shadow-md">
                            <Eye className="size-4" />
                        </span>
                    </div>
                </div>

                {/* Name & Branch */}
                <h3 
                    onClick={() => onSelectRow(row)}
                    className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] hover:text-[#E75480] dark:hover:text-[#FF4F81] transition-colors leading-snug cursor-pointer line-clamp-1 mb-1"
                >
                    {row.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-semibold mb-3">
                    <MapPin className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                    <span>{row.branch_name || 'Global'}</span>
                </div>
            </div>

            {/* Bottom Row: Stock Levels & Actions */}
            <div className="pt-3 border-t border-[#F8C8DC]/30 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Current Stock</span>
                        <span className="text-sm font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono">{row.stock} {row.unit}</span>
                    </div>

                    {isAdmin && (
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Est. Valuation</span>
                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(stockValuation)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                        onClick={() => onSelectRow(row)}
                        variant="outline"
                        className="flex-1 h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#5D4A4D] dark:text-[#E2E8F0] hover:text-[#E75480] dark:hover:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/5 cursor-pointer"
                    >
                        Specs
                    </Button>

                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            onClick={() => onOpenStockIn(row)}
                            className="size-9 rounded-xl bg-white dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 text-[#E75480] dark:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/10 shadow-2xs cursor-pointer"
                            title="Stock In"
                        >
                            <RefreshCw className="size-3.5" />
                        </Button>

                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => onOpenWastage(row)}
                            className="size-9 rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-2xs cursor-pointer"
                            title="Log Wastage"
                        >
                            <Layers className="size-3.5" />
                        </Button>

                        {isAdmin && (
                            <Button
                                size="icon"
                                onClick={() => onOpenEdit(row)}
                                className="size-9 rounded-xl bg-[#E75480] dark:bg-[#E1062C] text-white hover:bg-[#D43F6B] dark:hover:bg-[#C00525] shadow-2xs cursor-pointer"
                                title="Edit Specs"
                            >
                                <Edit2 className="size-3.5" />
                            </Button>
                        )}

                        {isAdmin && (
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => onOpenDelete(row)}
                                className="size-9 rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-2xs cursor-pointer"
                                title="Delete Ingredient"
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
