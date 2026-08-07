import { AnimatePresence } from 'framer-motion';
import { PackageSearch } from 'lucide-react';

import type { Category } from '@/components/categories/CategoriesHero';
import { CategoryCard } from '@/components/categories/CategoryCard';

interface CategoryGridProps {
    categories: Category[];
    isAdmin: boolean;
    onSelectCategory: (category: Category) => void;
    onOpenEdit: (category: Category) => void;
    onOpenDelete: (category: Category) => void;
}

export function CategoryGrid({
    categories,
    isAdmin,
    onSelectCategory,
    onOpenEdit,
    onOpenDelete,
}: CategoryGridProps) {
    if (categories.length === 0) {
        return (
            <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-12 text-center backdrop-blur-2xl transition-colors duration-300">
                <div className="flex flex-col items-center justify-center gap-2">
                    <PackageSearch className="size-10 text-[#E75480]/50 dark:text-[#FF4F81]/50 mb-1" />
                    <span className="font-extrabold text-base text-[#3D2C2E] dark:text-[#F8FAFC]">No Categories Match Criteria</span>
                    <span className="text-xs font-medium text-[#9E8B8E] dark:text-[#64748B]">Try adjusting your search query or register a new category.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
                {categories.map((category, idx) => (
                    <CategoryCard
                        key={category.id}
                        category={category}
                        isAdmin={isAdmin}
                        onSelectCategory={onSelectCategory}
                        onOpenEdit={onOpenEdit}
                        onOpenDelete={onOpenDelete}
                        index={idx}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
