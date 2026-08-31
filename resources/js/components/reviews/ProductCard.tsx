import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import React from 'react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { cn } from '@/lib/utils';
import { CategoryBadge } from './CategoryBadge';
import { RatingStars } from './RatingStars';
import type { ProductItem } from './types';

interface ProductCardProps {
    product: ProductItem;
    isSelected: boolean;
    onSelect: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    isSelected,
    onSelect,
}) => {
    const hasUnseen = product.unseen_count > 0;

    return (
        <motion.div
            whileHover={{ scale: 1.008 }}
            whileTap={{ scale: 0.992 }}
            onClick={() => onSelect(product)}
            className={cn(
                'group p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden',
                isSelected
                    ? 'bg-slate-50 dark:bg-[#1A1B26] border-[#FF3366] dark:border-[#FF4F81] shadow-md ring-2 ring-[#FF3366]/25 dark:ring-[#FF4F81]/30'
                    : 'bg-white dark:bg-[#12131A] border-slate-200/80 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/16 hover:bg-slate-50/50 dark:hover:bg-[#161722] shadow-2xs'
            )}
        >
            <div className="flex items-center gap-3.5">
                {/* Product Thumbnail */}
                <div className="size-14 rounded-xl bg-slate-100 dark:bg-[#181924] border border-slate-200/70 dark:border-white/8 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                    <ImageWithFallback
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        fallbackIcon={<Package className="size-5 text-slate-400 dark:text-slate-500" />}
                    />
                </div>

                {/* Product Meta */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                        <CategoryBadge category={product.category_name} />

                        {hasUnseen && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-xs shrink-0 animate-pulse">
                                <span className="size-1.5 rounded-full bg-white animate-ping" />
                                {product.unseen_count} unread
                            </span>
                        )}
                    </div>

                    <h3
                        className={cn(
                            'font-bold text-xs leading-snug truncate transition-colors',
                            isSelected
                                ? 'text-[#FF3366] dark:text-[#FF4F81]'
                                : 'text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white'
                        )}
                        title={product.name}
                    >
                        {product.name}
                    </h3>

                    {/* Rating & Price Row */}
                    <div className="flex items-center justify-between gap-2 mt-1.5 text-xs">
                        <div className="flex items-center min-w-0">
                            {product.total_reviews > 0 ? (
                                <RatingStars
                                    rating={product.average_rating}
                                    size="xs"
                                    showScore
                                    reviewCount={product.total_reviews}
                                />
                            ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">
                                    No reviews yet
                                </span>
                            )}
                        </div>

                        <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                            ₱{Number(product.selling_price).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
