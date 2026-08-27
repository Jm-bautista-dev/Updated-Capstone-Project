import { format } from 'date-fns';
import { Layers, Edit2, Trash2, Tag, Calendar, Package } from 'lucide-react';

import type { Category } from '@/components/categories/CategoriesHero';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';

interface CategoryDrawerProps {
    category: Category | null;
    open: boolean;
    onClose: () => void;
    isAdmin: boolean;
    onOpenEdit: (category: Category) => void;
    onOpenDelete: (category: Category) => void;
}

export function CategoryDrawer({
    category,
    open,
    onClose,
    isAdmin,
    onOpenEdit,
    onOpenDelete,
}: CategoryDrawerProps) {
    if (!category) return null;

    const formattedDate = category.created_at
        ? format(new Date(category.created_at), 'MMM d, yyyy')
        : 'N/A';

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 bg-[#FFFDFE] dark:bg-[#0F0F14] border-l border-[#F8C8DC]/60 dark:border-white/10 overflow-y-auto font-['Outfit'] transition-colors duration-300">
                
                {/* Header Image Banner */}
                <div className="relative w-full h-60 bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/40 dark:from-[#181822] dark:to-[#20202E] flex items-center justify-center border-b border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden">
                    <ImageWithFallback
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        fallbackIcon={
                            <div className="flex flex-col items-center gap-2 text-[#E75480]/40 dark:text-[#FF4F81]/40">
                                <Layers className="size-16" />
                                <span className="text-xs font-bold uppercase tracking-widest">No Thumbnail Asset</span>
                            </div>
                        }
                    />
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    
                    {/* Header Info */}
                    <SheetHeader className="p-0 text-left">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#E75480] dark:text-[#FF4F81] uppercase tracking-wider">
                            <Tag className="size-3.5" />
                            <span>Product Classification</span>
                        </div>
                        <SheetTitle className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight mt-1">
                            {category.name}
                        </SheetTitle>
                        <SheetDescription className="text-xs font-mono text-[#9E8B8E] dark:text-[#64748B] mt-0.5 flex items-center gap-1.5">
                            <Calendar className="size-3.5" />
                            <span>Created {formattedDate}</span>
                        </SheetDescription>
                    </SheetHeader>

                    {/* Assigned Products Metric Card */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            <span className="flex items-center gap-2">
                                <Package className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                <span>Assigned Products</span>
                            </span>
                            <span className="font-mono text-sm font-extrabold text-[#E75480] dark:text-[#FF4F81]">{category.products_count || 0} items</span>
                        </div>
                    </div>

                    {/* Category Description */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8]">
                            Description & Summary
                        </span>
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/30 dark:border-white/10 text-xs text-[#7D6B6E] dark:text-[#94A3B8] leading-relaxed">
                            {category.description || 'No detailed description registered for this category.'}
                        </div>
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10 flex flex-wrap gap-3">
                        <Button
                            onClick={() => { onClose(); onOpenEdit(category); }}
                            className="flex-1 h-11 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white rounded-xl font-bold text-xs gap-2 cursor-pointer shadow-xs"
                        >
                            <Edit2 className="size-3.5" />
                            <span>Edit Category</span>
                        </Button>

                        {isAdmin && (
                            <Button
                                onClick={() => { onClose(); onOpenDelete(category); }}
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
