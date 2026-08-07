import { motion } from 'framer-motion';
import { PackageSearch } from 'lucide-react';

import { ProductCard } from '@/components/products/ProductCard';
import type { Product } from '@/components/products/ProductDrawer';

interface ProductGridProps {
    products: Product[];
    isAdmin: boolean;
    onSelectProduct: (product: Product) => void;
    onOpenStockIn: (product: Product) => void;
    onOpenEdit: (product: Product) => void;
    onOpenDelete: (product: Product) => void;
}

export function ProductGrid({
    products,
    isAdmin,
    onSelectProduct,
    onOpenStockIn,
    onOpenEdit,
    onOpenDelete,
}: ProductGridProps) {
    if (products.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] bg-white/80 border border-white/90 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] backdrop-blur-2xl"
            >
                <div className="p-4 rounded-3xl bg-[#FFF5F7] border border-[#F8C8DC]/40 text-[#E75480] mb-4">
                    <PackageSearch className="size-10" />
                </div>
                <h3 className="text-lg font-extrabold text-[#3D2C2E] tracking-tight">No Products Found</h3>
                <p className="text-xs text-[#7D6B6E] font-medium max-w-sm mt-1">
                    No items in your catalog match the current search keyword or category filter.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, idx) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    isAdmin={isAdmin}
                    onSelectProduct={onSelectProduct}
                    onOpenStockIn={onOpenStockIn}
                    onOpenEdit={onOpenEdit}
                    onOpenDelete={onOpenDelete}
                    index={idx}
                />
            ))}
        </div>
    );
}
