import { format } from 'date-fns';
import { 
    Package, 
    Layers, 
    RefreshCw, 
    Edit2, 
    Trash2, 
    MapPin, 
    Tag, 
    Info 
} from 'lucide-react';

import { StatusBadge } from '@/components/products/StatusBadge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

export interface Ingredient {
    id: number;
    name: string;
    unit: string;
    stock: number;
    pivot: {
        quantity_required: string;
    };
}

export interface Branch {
    id: number;
    name: string;
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
    stock: number;
    cost_price: number;
    selling_price: number;
    status: string;
    image_url: string | null;
    ingredients: Ingredient[];
    branches: Branch[];
    branch_id: number;
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

    const profit = product.selling_price - product.cost_price;
    const marginPct = product.selling_price > 0 ? (profit / product.selling_price) * 100 : 0;

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 bg-[#FFFDFE] dark:bg-[#0F0F14] border-l border-[#F8C8DC]/60 dark:border-white/10 overflow-y-auto font-['Outfit'] transition-colors duration-300">
                
                {/* Image Header Banner */}
                <div className="relative w-full h-60 bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/40 dark:from-[#181822] dark:to-[#20202E] flex items-center justify-center border-b border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-[#E75480]/40 dark:text-[#FF4F81]/40">
                            <Package className="size-16" />
                            <span className="text-xs font-bold uppercase tracking-widest">No Image Asset</span>
                        </div>
                    )}

                    <div className="absolute top-4 left-4">
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

                    {/* Financial Metrics Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Cost Price</span>
                            <span className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-1 block">{formatCurrency(product.cost_price)}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">Selling Price</span>
                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{formatCurrency(product.selling_price)}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 shadow-2xs text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Est. Margin</span>
                            <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-1 block">+{marginPct.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Stock Level Details */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            <span className="flex items-center gap-2">
                                <Package className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                <span>Current Stock Level</span>
                            </span>
                            <span className="font-mono text-sm">{product.stock} {product.unit || 'pcs'}</span>
                        </div>
                    </div>

                    {/* Branch Visibility Tags */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                            <span>Branch Availability</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {product.branches && product.branches.length > 0 ? (
                                product.branches.map((b) => (
                                    <span key={b.id} className="text-xs font-bold text-[#3D2C2E] dark:text-[#E2E8F0] bg-[#FADADD]/30 dark:bg-white/5 border border-[#F8C8DC]/50 dark:border-white/10 px-3 py-1 rounded-xl">
                                        {b.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 px-3 py-1 rounded-xl">
                                    All Branches (Global)
                                </span>
                            )}
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
                                            {ing.pivot?.quantity_required} {ing.unit}
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
