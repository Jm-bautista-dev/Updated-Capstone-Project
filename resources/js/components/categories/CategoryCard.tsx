import { motion } from 'framer-motion';
import { Layers, Edit2, Trash2, Eye } from 'lucide-react';

import type { Category } from '@/components/categories/CategoriesHero';
import { Button } from '@/components/ui/button';

interface CategoryCardProps {
    category: Category;
    isAdmin: boolean;
    onSelectCategory: (category: Category) => void;
    onOpenEdit: (category: Category) => void;
    onOpenDelete: (category: Category) => void;
    index?: number;
}

export function CategoryCard({
    category,
    isAdmin,
    onSelectCategory,
    onOpenEdit,
    onOpenDelete,
    index = 0,
}: CategoryCardProps) {
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
                {/* Thumbnail Image */}
                <div 
                    onClick={() => onSelectCategory(category)}
                    className="relative w-full h-44 rounded-2xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/30 dark:from-[#1A1A24] dark:to-[#222230] border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden flex items-center justify-center mb-4 cursor-pointer group-hover:shadow-xs transition-all"
                >
                    <div className="flex flex-col items-center gap-1.5 text-[#E75480]/40 dark:text-[#FF4F81]/40 group-hover:scale-110 transition-transform absolute">
                        <Layers className="size-10" />
                    </div>
                    {category.image_url && (
                        <img
                            src={category.image_url}
                            alt={category.name}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-10"
                        />
                    )}

                    <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black font-mono bg-white/90 dark:bg-[#181820]/90 backdrop-blur-md text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs">
                            {category.products_count || 0} products
                        </span>
                    </div>

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2.5 rounded-full bg-white/90 dark:bg-[#181820]/90 text-[#E75480] dark:text-[#FF4F81] shadow-md">
                            <Eye className="size-4" />
                        </span>
                    </div>
                </div>

                {/* Name */}
                <h3 
                    onClick={() => onSelectCategory(category)}
                    className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] hover:text-[#E75480] dark:hover:text-[#FF4F81] transition-colors leading-snug cursor-pointer line-clamp-1 mb-1"
                >
                    {category.name}
                </h3>

                {/* Description */}
                <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] line-clamp-2 min-h-8 mb-3">
                    {category.description || 'No description provided.'}
                </p>
            </div>

            {/* Bottom Row: Actions */}
            <div className="pt-3 border-t border-[#F8C8DC]/30 dark:border-white/10 flex items-center justify-between gap-2">
                <Button
                    onClick={() => onSelectCategory(category)}
                    variant="outline"
                    className="flex-1 h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#5D4A4D] dark:text-[#E2E8F0] hover:text-[#E75480] dark:hover:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/5 cursor-pointer"
                >
                    View Details
                </Button>

                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        onClick={() => onOpenEdit(category)}
                        className="size-9 rounded-xl bg-[#E75480] dark:bg-[#E1062C] text-white hover:bg-[#D43F6B] dark:hover:bg-[#C00525] shadow-2xs cursor-pointer"
                        title="Edit Category"
                    >
                        <Edit2 className="size-3.5" />
                    </Button>

                    {isAdmin && (
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => onOpenDelete(category)}
                            className="size-9 rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-2xs cursor-pointer"
                            title="Delete Category"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
