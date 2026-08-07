import { motion } from 'framer-motion';
import { Package, AlertTriangle, Slash, DollarSign, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

interface Summary {
    total_products: number;
    low_stock: number;
    out_of_stock: number;
}

interface Product {
    stock: number;
    selling_price: number;
}

interface ProductsHeroProps {
    summary: Summary;
    products: Product[];
}

export function ProductsHero({ summary, products }: ProductsHeroProps) {
    const totalInventoryValue = useMemo(() => {
        return products.reduce((acc, p) => acc + (p.stock * p.selling_price || 0), 0);
    }, [products]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-white/90 via-[#FFF9FA]/80 to-[#FFF0F5]/60 dark:from-[#0F0F14]/90 dark:via-[#14141E]/80 dark:to-[#181824]/70 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] p-6 sm:p-8 lg:p-10 backdrop-blur-2xl transition-colors duration-300 space-y-6"
        >
            {/* Background Ambient Glows */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-radial from-[#FADADD]/40 via-[#F8C8DC]/15 dark:from-[#E1062C]/20 dark:via-rose-950/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -ml-20 -mb-20 size-60 rounded-full bg-radial from-[#FFE4E1]/50 dark:from-[#E1062C]/15 to-transparent blur-3xl pointer-events-none" />

            {/* Title & Tagline */}
            <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E75480]/10 dark:bg-[#E1062C]/15 border border-[#E75480]/20 dark:border-[#E1062C]/30 text-[#E75480] dark:text-[#FF4F81] text-xs font-bold tracking-wider uppercase">
                    <Sparkles className="size-3.5" />
                    <span>Catalog Command</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight leading-tight">
                    Products{' '}
                    <span className="bg-linear-to-r from-[#E75480] via-[#D43F6B] to-[#F472B6] dark:from-[#FF4F81] dark:via-[#E1062C] dark:to-[#F472B6] bg-clip-text text-transparent">
                        Management
                    </span>
                </h1>

                <p className="text-sm sm:text-base text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-xl">
                    Manage and organize your product catalog, recipe compositions, pricing, and branch availability efficiently.
                </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 pt-2">
                
                {/* Total Products */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] shrink-0">
                        <Package className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Total Items</p>
                        <h3 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5">{summary.total_products}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Registered in catalog</p>
                    </div>
                </motion.div>

                {/* Total Inventory Value */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <DollarSign className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Est. Catalog Value</p>
                        <h3 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5">{formatCurrency(totalInventoryValue)}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Sum of selling stock</p>
                    </div>
                </motion.div>

                {/* Low Stock Items */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                        <AlertTriangle className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Low Stock</p>
                        <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{summary.low_stock}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Stock ≤ 5 units</p>
                    </div>
                </motion.div>

                {/* Out of Stock Items */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-rose-100/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
                        <Slash className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Out of Stock</p>
                        <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">{summary.out_of_stock}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Immediate restock needed</p>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}
