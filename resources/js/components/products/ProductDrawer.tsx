import { format } from 'date-fns';
import { 
    Package, 
    Layers, 
    RefreshCw, 
    Edit2, 
    Trash2, 
    MapPin, 
    Tag, 
    Info,
    AlertCircle,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

import { StatusBadge } from '@/components/products/StatusBadge';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

export interface Ingredient {
    id: number;
    name: string;
    unit: string;
    stock: number;
    pivot: {
        quantity_required: string;
        unit?: string;
    };
}

export interface Branch {
    id: number;
    name: string;
}

export interface InsufficientIngredient {
    ingredient_id: number | null;
    ingredient_name: string;
    name: string;
    required_quantity: number;
    required: number;
    available_quantity: number;
    stock: number;
    shortage_quantity: number;
    shortage: number;
    unit: string;
    status: 'INSUFFICIENT_STOCK' | 'NO_INVENTORY_RECORD';
    has_inventory_record: boolean;
    reason: string;
    reason_display: string;
    branch_id?: number;
    branch_name?: string;
}

export interface BranchStockItem {
    branch_id: number;
    branch_name: string;
    stock: number;
    available?: number;
    is_available: boolean;
    status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    status_label?: string;
    is_low_stock?: boolean;
    limiting_ingredient?: string | null;
    insufficient_ingredients?: InsufficientIngredient[];
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    category_id: number;
    category: {
        id: number;
        name: string;
    };
    description?: string | null;
    stock: number;
    cost_price: number;
    selling_price: number;
    status: string;
    availability_status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    is_available?: boolean;
    limiting_ingredient?: string | null;
    insufficient_ingredients?: InsufficientIngredient[];
    blocking_ingredients?: InsufficientIngredient[];
    image_url: string | null;
    ingredients: Ingredient[];
    branches: Branch[];
    branch_id: number;
    branch_breakdown?: Record<number, BranchStockItem>;
    is_direct: boolean;
    unit: string;
    created_at: string;
}

interface ProductDrawerProps {
    product: Product | null;
    open: boolean;
    onClose: () => void;
    isAdmin: boolean;
    onOpenStockIn: (product: Product) => void;
    onOpenEdit: (product: Product) => void;
    onOpenDelete: (product: Product) => void;
}

export function ProductDrawer({
    product,
    open,
    onClose,
    isAdmin,
    onOpenStockIn,
    onOpenEdit,
    onOpenDelete,
}: ProductDrawerProps) {
    if (!product) return null;

    const hasValidCost = product.cost_price != null && Number(product.cost_price) > 0;
    const profit = hasValidCost ? product.selling_price - product.cost_price : 0;
    const marginPct = (hasValidCost && product.selling_price > 0) ? (profit / product.selling_price) * 100 : null;

    const isOutOfStock = product.status === 'Out of Stock' || product.availability_status === 'OUT_OF_STOCK' || product.stock <= 0;
    const isLowStock = product.status === 'Low Stock' || product.availability_status === 'LOW_STOCK';
    const insufficientList = product.insufficient_ingredients || product.blocking_ingredients || [];

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 bg-[#FFFDFE] dark:bg-[#0F0F14] border-l border-[#F8C8DC]/60 dark:border-white/10 overflow-y-auto font-['Outfit'] transition-colors duration-300">
                
                {/* Image Header Banner */}
                <div className="relative w-full h-60 bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/40 dark:from-[#181822] dark:to-[#20202E] flex items-center justify-center border-b border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden">
                    <ImageWithFallback
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover relative z-10"
                        fallbackIcon={
                            <div className="flex flex-col items-center gap-2 text-[#E75480]/40 dark:text-[#FF4F81]/40">
                                <Package className="size-16" />
                                <span className="text-xs font-bold uppercase tracking-widest">No Image Asset</span>
                            </div>
                        }
                    />

                    <div className="absolute top-4 left-4 z-20">
                        <StatusBadge status={product.status} />
                    </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    
                    {/* Header Info */}
                    <SheetHeader className="p-0 text-left">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#E75480] dark:text-[#FF4F81] uppercase tracking-wider">
                            <Tag className="size-3.5" />
                            <span>{product.category?.name || 'Uncategorized'}</span>
                        </div>
                        <SheetTitle className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight mt-1">
                            {product.name}
                        </SheetTitle>
                        <SheetDescription className="text-xs font-mono text-[#9E8B8E] dark:text-[#64748B] mt-0.5">
                            SKU: {product.sku || 'N/A'} • Created {format(new Date(product.created_at), 'MMM d, yyyy')}
                        </SheetDescription>
                    </SheetHeader>

                    {/* Product Availability & Stock Shortage Diagnostics */}
                    <div className={cn(
                        "p-4 rounded-2xl border transition-all duration-300 space-y-3",
                        isOutOfStock
                            ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50"
                            : isLowStock
                                ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50"
                                : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/50"
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isOutOfStock ? (
                                    <AlertCircle className="size-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                ) : isLowStock ? (
                                    <AlertTriangle className="size-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                ) : (
                                    <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                )}
                                <span className={cn(
                                    "text-xs font-extrabold uppercase tracking-wider",
                                    isOutOfStock
                                        ? "text-rose-800 dark:text-rose-300"
                                        : isLowStock
                                            ? "text-amber-800 dark:text-amber-300"
                                            : "text-emerald-800 dark:text-emerald-300"
                                )}>
                                    Product Availability: {product.status}
                                </span>
                            </div>
                            <span className={cn(
                                "text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full border",
                                isOutOfStock
                                    ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                                    : isLowStock
                                        ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                        : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            )}>
                                {product.stock} {product.unit || 'pcs'} Available
                            </span>
                        </div>

                        {/* Reason Breakdown when Insufficient Ingredients or Out of Stock */}
                        {isOutOfStock ? (
                            <div className="space-y-2 pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
                                <span className="text-[11px] font-bold text-rose-900 dark:text-rose-200 block uppercase tracking-wider">
                                    Why is this product out of stock?
                                </span>

                                {insufficientList.length > 0 ? (
                                    <div className="space-y-2">
                                        {insufficientList.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 rounded-xl bg-white/90 dark:bg-[#15151F] border border-rose-200 dark:border-rose-900/60 shadow-2xs space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-extrabold text-xs text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                        {item.ingredient_name || item.name}
                                                        {item.branch_name && (
                                                            <span className="text-[10px] font-normal text-[#9E8B8E] dark:text-[#94A3B8] ml-1.5">
                                                                ({item.branch_name})
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase font-mono",
                                                        item.status === 'NO_INVENTORY_RECORD'
                                                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                                    )}>
                                                        {item.status === 'NO_INVENTORY_RECORD' ? 'No Inventory Record' : `Short by ${item.shortage_quantity ?? item.shortage} ${item.unit}`}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-[#5D4A4D] dark:text-[#CBD5E1] bg-rose-50/40 dark:bg-rose-950/20 p-2 rounded-lg font-mono">
                                                    <div>
                                                        <span className="text-[#9E8B8E] dark:text-[#64748B] block">Required:</span>
                                                        <span className="font-bold">{item.required_quantity ?? item.required} {item.unit}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[#9E8B8E] dark:text-[#64748B] block">Available:</span>
                                                        <span className="font-bold">{item.available_quantity ?? item.stock} {item.unit}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-rose-600 dark:text-rose-400 block font-bold">Shortage:</span>
                                                        <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                                            -{item.shortage_quantity ?? item.shortage} {item.unit}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-[11px] text-rose-800 dark:text-rose-300 font-medium italic">
                                                    {item.reason_display || `${item.name} is short by ${item.shortage_quantity ?? item.shortage} ${item.unit}.`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                                        Physical stock is depleted or unavailable for fulfillment in selected branch.
                                    </p>
                                )}
                            </div>
                        ) : isLowStock ? (
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                                {product.limiting_ingredient
                                    ? `Stock capacity is limited by available ${product.limiting_ingredient}. Restock soon to prevent order blockage.`
                                    : 'Remaining inventory is nearing low stock threshold.'}
                            </p>
                        ) : (
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                                All required recipe ingredients and materials are fully stocked and available for preparation.
                            </p>
                        )}
                    </div>

                    {/* Product Description */}
                    {product.description && (
                        <div className="p-4 rounded-2xl bg-[#FFF5F7]/70 dark:bg-[#181824] border border-[#F8C8DC]/50 dark:border-white/10 shadow-2xs space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E75480] dark:text-[#FF4F81] flex items-center gap-1.5">
                                <Info className="size-3.5" />
                                <span>Description</span>
                            </span>
                            <p className="text-xs text-[#5D4A4D] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-line font-medium">
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* Financial Metrics Cards */}
                    {isAdmin ? (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs text-center flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Cost Price</span>
                                {hasValidCost ? (
                                    <span className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-1 block">{formatCurrency(product.cost_price)}</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 block">Cost unavailable</span>
                                )}
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs text-center flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Selling Price</span>
                                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{formatCurrency(product.selling_price)}</span>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 shadow-2xs text-center flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Est. Margin</span>
                                {marginPct !== null ? (
                                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-1 block">{marginPct >= 0 ? `+${marginPct.toFixed(1)}%` : `${marginPct.toFixed(1)}%`}</span>
                                ) : (
                                    <span className="text-xs font-bold text-[#9E8B8E] dark:text-[#64748B] mt-1 block">N/A</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs text-center flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Selling Price</span>
                                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{formatCurrency(product.selling_price)}</span>
                            </div>
                        </div>
                    )}

                    {/* Stock By Branch (Global Product Inventory Consolidation) */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8]">
                            <span className="flex items-center gap-1.5">
                                <Package className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                <span>Stock By Branch</span>
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {product.branch_breakdown && Object.keys(product.branch_breakdown).length > 0 ? (
                                Object.values(product.branch_breakdown).map((b) => (
                                    <div key={b.branch_id} className="p-2.5 rounded-xl bg-[#FFFDFE] dark:bg-[#15151E] border border-[#F8C8DC]/30 dark:border-white/5 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-[#3D2C2E] dark:text-[#E2E8F0] flex items-center gap-1.5">
                                                <MapPin className="size-3 text-[#E75480] dark:text-[#FF4F81]" />
                                                {b.branch_name}
                                            </span>
                                            <span className={cn(
                                                "font-mono font-extrabold px-2 py-0.5 rounded-lg border text-xs",
                                                b.stock > 0
                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                                                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                                            )}>
                                                {b.stock} {product.unit || 'pcs'}
                                            </span>
                                        </div>

                                        {/* If branch is out of stock and has shortages */}
                                        {b.insufficient_ingredients && b.insufficient_ingredients.length > 0 && (
                                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium pl-4 space-y-0.5">
                                                {b.insufficient_ingredients.map((ins, i) => (
                                                    <div key={i} className="flex items-center gap-1">
                                                        <span>• {ins.name}:</span>
                                                        <span className="font-mono">
                                                            {ins.status === 'NO_INVENTORY_RECORD' ? 'No inventory record' : `short by ${ins.shortage_quantity} ${ins.unit}`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-between py-1 text-xs">
                                    <span className="font-semibold text-[#3D2C2E] dark:text-[#E2E8F0]">Branch Stock</span>
                                    <span className="font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">{product.stock} {product.unit || 'pcs'}</span>
                                </div>
                            )}
                        </div>

                        {/* Total Stock Divider & Total */}
                        <div className="pt-2.5 border-t border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-between text-xs font-extrabold">
                            <span className="uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">Total Stock</span>
                            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-black">
                                {product.stock} {product.unit || 'pcs'}
                            </span>
                        </div>
                    </div>

                    {/* Recipe Composition Materials */}
                    <div className="space-y-3 pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] flex items-center gap-1.5">
                            <Layers className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                            <span>Recipe Composition Materials</span>
                        </span>

                        {product.ingredients && product.ingredients.length > 0 ? (
                            <div className="space-y-2">
                                {product.ingredients.map((ing) => (
                                    <div key={ing.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/30 dark:border-white/10 text-xs">
                                        <span className="font-semibold text-[#3D2C2E] dark:text-[#F8FAFC]">{ing.name}</span>
                                        <span className="font-bold text-[#E75480] dark:text-[#FF4F81] font-mono">
                                            {ing.pivot?.quantity_required} {ing.pivot?.unit || ing.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                                <Info className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span>No raw materials assigned to this item.</span>
                            </div>
                        )}
                    </div>

                    {/* Assigned Add-ons & Modifiers */}
                    <div className="space-y-3 pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] flex items-center gap-1.5">
                            <Tag className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                            <span>Assigned Add-ons & Modifiers</span>
                        </span>

                        {(product as unknown as { addons?: Array<{ id: number; name: string; price: number }> }).addons && (product as unknown as { addons?: Array<{ id: number; name: string; price: number }> }).addons!.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {(product as unknown as { addons?: Array<{ id: number; name: string; price: number }> }).addons!.map((ad) => (
                                    <span
                                        key={ad.id}
                                        className="px-3 py-1.5 rounded-xl bg-[#FFF5F7] dark:bg-[#181822] border border-[#F8C8DC]/60 dark:border-white/10 text-xs font-semibold text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-1.5"
                                    >
                                        <span>{ad.name}</span>
                                        <span className="text-[10px] font-mono font-bold text-[#E75480] dark:text-[#FF4F81]">+{formatCurrency(ad.price)}</span>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-[#FFF5F7]/60 dark:bg-[#181822]/60 border border-[#F8C8DC]/30 dark:border-white/10 text-[#9E8B8E] dark:text-[#64748B] text-xs font-medium flex items-center gap-2">
                                <Info className="size-4 shrink-0" />
                                <span>No product-specific add-ons assigned.</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10 flex flex-wrap gap-3">
                        {product.is_direct && (
                            <Button
                                onClick={() => { onClose(); onOpenStockIn(product); }}
                                className="flex-1 h-11 bg-white dark:bg-[#181822] hover:bg-[#FFF5F7] dark:hover:bg-white/10 border border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#FF4F81] rounded-xl font-bold text-xs gap-2 cursor-pointer"
                            >
                                <RefreshCw className="size-3.5" />
                                <span>Stock In</span>
                            </Button>
                        )}

                        {isAdmin && (
                            <Button
                                onClick={() => { onClose(); onOpenEdit(product); }}
                                className="flex-1 h-11 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white rounded-xl font-bold text-xs gap-2 cursor-pointer shadow-xs"
                            >
                                <Edit2 className="size-3.5" />
                                <span>Edit Product</span>
                            </Button>
                        )}

                        {isAdmin && (
                            <Button
                                onClick={() => { onClose(); onOpenDelete(product); }}
                                variant="outline"
                                className="h-11 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-bold text-xs cursor-pointer"
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
}
