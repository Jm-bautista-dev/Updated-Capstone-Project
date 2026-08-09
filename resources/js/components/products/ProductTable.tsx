import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, RefreshCw, Edit2, Trash2, Eye, PackageSearch, Building2 } from 'lucide-react';

import type { Product } from '@/components/products/ProductDrawer';
import { StatusBadge } from '@/components/products/StatusBadge';
import { Button } from '@/components/ui/button';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface ProductTableProps {
    products: Product[];
    isAdmin: boolean;
    onSelectProduct: (product: Product) => void;
    onOpenStockIn: (product: Product) => void;
    onOpenEdit: (product: Product) => void;
    onOpenDelete: (product: Product) => void;
}

export function ProductTable({
    products,
    isAdmin,
    onSelectProduct,
    onOpenStockIn,
    onOpenEdit,
    onOpenDelete,
}: ProductTableProps) {
    return (
        <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-[#FFFDFE]/90 dark:bg-[#14141E]/90 border-b border-[#F8C8DC]/40 dark:border-white/10 backdrop-blur-md">
                        <tr className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                            <th className="py-4 px-6">Product Specifications</th>
                            <th className="py-4 px-6 hidden lg:table-cell">Category</th>
                            <th className="py-4 px-6 hidden lg:table-cell">Branch</th>
                            <th className="py-4 px-6 text-center">Stock Level</th>
                            <th className="py-4 px-6 hidden sm:table-cell">Pricing & Cost</th>
                            <th className="py-4 px-6 text-center">Status</th>
                            <th className="py-4 px-6 hidden md:table-cell">Registered</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8C8DC]/20 dark:divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {products.length === 0 ? (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-48 text-center"
                                >
                                    <td colSpan={7} className="p-8 text-[#7D6B6E] dark:text-[#94A3B8]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <PackageSearch className="size-8 text-[#E75480]/50 dark:text-[#FF4F81]/50 mb-1" />
                                            <span className="font-bold text-sm text-[#3D2C2E] dark:text-[#F8FAFC]">No Products Match Criteria</span>
                                            <span className="text-xs text-[#9E8B8E] dark:text-[#64748B]">Try adjusting your search query or filter selections.</span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ) : (
                                products.map((product) => (
                                    <motion.tr
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="hover:bg-[#FADADD]/15 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => onSelectProduct(product)}
                                    >
                                        {/* Product info with image thumbnail */}
                                        <td className="p-4 px-6 align-middle">
                                            <div className="flex items-center gap-3.5">
                                                <div className="size-11 rounded-xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/40 dark:from-[#1A1A24] dark:to-[#222230] border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 relative">
                                                    <Package className="size-5 text-[#E75480]/50 dark:text-[#FF4F81]/50 absolute" />
                                                    {product.image_url && (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                            className="w-full h-full object-cover relative z-10"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors leading-snug">
                                                        {product.name}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-[#9E8B8E] dark:text-[#64748B]">
                                                        SKU: {product.sku || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td className="p-4 px-6 align-middle hidden lg:table-cell">
                                            <span className="text-xs font-bold text-[#3D2C2E] dark:text-[#E2E8F0] bg-[#FADADD]/30 dark:bg-white/5 border border-[#F8C8DC]/50 dark:border-white/10 px-3 py-1 rounded-xl">
                                                {product.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>

                                        {/* Branch */}
                                        <td className="p-4 px-6 align-middle hidden lg:table-cell">
                                            <span className="text-xs font-bold text-[#E75480] dark:text-[#FF4F81] bg-[#FFF5F7] dark:bg-white/5 border border-[#F8C8DC]/50 dark:border-white/10 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5">
                                                <Building2 className="size-3" />
                                                {product.branches && product.branches.length > 1
                                                    ? 'Both Branches (Global)'
                                                    : product.branches && product.branches.length === 1
                                                        ? product.branches[0].name
                                                        : 'Global'}
                                            </span>
                                        </td>

                                        {/* Stock Level */}
                                        <td className="p-4 px-6 align-middle text-center font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            <span>{product.stock} {product.unit || 'pcs'}</span>
                                        </td>

                                        {/* Pricing */}
                                        <td className="p-4 px-6 align-middle hidden sm:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-[#9E8B8E] dark:text-[#64748B] font-bold uppercase">
                                                    Cost: {formatCurrency(product.cost_price)}
                                                </span>
                                                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                                    Sell: {formatCurrency(product.selling_price)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="p-4 px-6 align-middle text-center">
                                            <StatusBadge status={product.status} />
                                        </td>

                                        {/* Registered */}
                                        <td className="p-4 px-6 align-middle hidden md:table-cell text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                                            {format(new Date(product.created_at), 'MMM d, yyyy')}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 px-6 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => onSelectProduct(product)}
                                                    className="size-8 rounded-xl hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#5D4A4D] dark:text-[#E2E8F0] hover:text-[#E75480] dark:hover:text-[#FF4F81] cursor-pointer"
                                                    title="View Specifications"
                                                >
                                                    <Eye className="size-4" />
                                                </Button>

                                                {product.is_direct && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => onOpenStockIn(product)}
                                                        className="size-8 rounded-xl hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#E75480] dark:text-[#FF4F81] cursor-pointer"
                                                        title="Stock In"
                                                    >
                                                        <RefreshCw className="size-4" />
                                                    </Button>
                                                )}

                                                {isAdmin && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => onOpenEdit(product)}
                                                        className="size-8 rounded-xl hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#E75480] dark:text-[#FF4F81] cursor-pointer"
                                                        title="Edit Product"
                                                    >
                                                        <Edit2 className="size-4" />
                                                    </Button>
                                                )}

                                                {isAdmin && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => onOpenDelete(product)}
                                                        className="size-8 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 cursor-pointer"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
