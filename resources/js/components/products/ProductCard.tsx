import { motion } from 'framer-motion';
import { Package, RefreshCw, Edit2, Trash2, Eye, Building2 } from 'lucide-react';

import type { Product } from '@/components/products/ProductDrawer';
import { StatusBadge } from '@/components/products/StatusBadge';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface ProductCardProps {
    product: Product;
    isAdmin: boolean;
    onSelectProduct: (product: Product) => void;
    onOpenStockIn: (product: Product) => void;
    onOpenEdit: (product: Product) => void;
    onOpenDelete: (product: Product) => void;
    index?: number;
}

export function ProductCard({
    product,
    isAdmin,
    onSelectProduct,
    onOpenStockIn,
    onOpenEdit,
    onOpenDelete,
    index = 0,
}: ProductCardProps) {
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
                {/* Image & Status Badge */}
                <div 
                    onClick={() => onSelectProduct(product)}
                    className="relative w-full h-44 rounded-2xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/30 dark:from-[#1A1A24] dark:to-[#222230] border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden flex items-center justify-center mb-4 cursor-pointer group-hover:shadow-xs transition-all"
                >
                    <ImageWithFallback
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallbackIcon={
                            <div className="flex flex-col items-center gap-1.5 text-[#E75480]/40 dark:text-[#FF4F81]/40 group-hover:scale-110 transition-transform">
                                <Package className="size-10" />
                            </div>
                        }
                    />

                    <div className="absolute top-3 left-3">
                        <StatusBadge status={product.status} />
                    </div>

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2.5 rounded-full bg-white/90 dark:bg-[#181820]/90 text-[#E75480] dark:text-[#FF4F81] shadow-md">
                            <Eye className="size-4" />
                        </span>
                    </div>
                </div>

                {/* SKU, Category & Branch */}
                <div className="flex items-center justify-between text-[11px] font-bold text-[#9E8B8E] dark:text-[#64748B] mb-1">
                    <span className="font-mono uppercase">{product.sku || 'N/A'}</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[#E75480] dark:text-[#FF4F81] uppercase tracking-wider">{product.category?.name || 'Uncategorized'}</span>
                        <span className="text-[9px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] bg-[#FADADD]/40 dark:bg-white/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Building2 className="size-2.5 text-[#E75480] dark:text-[#FF4F81]" />
                            {product.branches && product.branches.length > 1
                                ? 'Both'
                                : product.branches && product.branches.length === 1
                                    ? product.branches[0].name
                                    : 'Global'}
                        </span>
                    </div>
                </div>

                {/* Name */}
                <h3 
                    onClick={() => onSelectProduct(product)}
                    className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] hover:text-[#E75480] dark:hover:text-[#FF4F81] transition-colors leading-snug cursor-pointer line-clamp-1 mb-3"
                >
                    {product.name}
                </h3>
            </div>

            {/* Bottom Row: Pricing & Actions */}
            <div className="pt-3 border-t border-[#F8C8DC]/30 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Selling Price</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(product.selling_price)}</span>
                    </div>

                    <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Stock Level</span>
                        {product.branch_breakdown && Object.keys(product.branch_breakdown).length > 0 ? (
                            <div className="flex flex-col items-end gap-0.5 mt-0.5">
                                <div className="flex flex-wrap justify-end gap-1">
                                    {Object.values(product.branch_breakdown).map((b) => (
                                        <span
                                            key={b.branch_id}
                                            className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                                                b.stock > 0
                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                                                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                                            )}
                                            title={`${b.branch_name}: ${b.stock}`}
                                        >
                                            {b.branch_name}: <span className="font-mono font-extrabold">{b.stock}</span>
                                        </span>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-[#9E8B8E] dark:text-[#64748B]">
                                    Total: {product.stock} {product.unit || 'pcs'}
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] font-mono">{product.stock} {product.unit || 'pcs'}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                        onClick={() => onSelectProduct(product)}
                        variant="outline"
                        className="flex-1 h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#5D4A4D] dark:text-[#E2E8F0] hover:text-[#E75480] dark:hover:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/5 cursor-pointer"
                    >
                        View Specs
                    </Button>

                    <div className="flex items-center gap-1">
                        {product.is_direct && (
                            <Button
                                size="icon"
                                onClick={() => onOpenStockIn(product)}
                                className="size-9 rounded-xl bg-white dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 text-[#E75480] dark:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/10 shadow-2xs cursor-pointer"
                                title="Stock In"
                            >
                                <RefreshCw className="size-3.5" />
                            </Button>
                        )}

                        {isAdmin && (
                            <Button
                                size="icon"
                                onClick={() => onOpenEdit(product)}
                                className="size-9 rounded-xl bg-[#E75480] dark:bg-[#E1062C] text-white hover:bg-[#D43F6B] dark:hover:bg-[#C00525] shadow-2xs cursor-pointer"
                                title="Edit Product"
                            >
                                <Edit2 className="size-3.5" />
                            </Button>
                        )}

                        {isAdmin && (
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => onOpenDelete(product)}
                                className="size-9 rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-2xs cursor-pointer"
                                title="Delete Product"
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
