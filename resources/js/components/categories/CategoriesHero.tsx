import { motion } from 'framer-motion';
import { Layers, Grid, TrendingUp, Sparkles, Package } from 'lucide-react';
import { useMemo } from 'react';

export interface Category {
    id: number;
    name: string;
    description: string;
    image_path: string | null;
    image_url: string | null;
    products_count: number;
    created_at: string;
}

interface CategoriesHeroProps {
    categories: Category[];
}

export function CategoriesHero({ categories }: CategoriesHeroProps) {
    const totalCategories = categories.length;

    const activeCategories = useMemo(() => {
        return categories.filter((c) => (c.products_count || 0) > 0).length;
    }, [categories]);

    const totalProductsAssigned = useMemo(() => {
        return categories.reduce((sum, c) => sum + (c.products_count || 0), 0);
    }, [categories]);

    const avgProductsPerCategory = useMemo(() => {
        if (totalCategories === 0) return 0;
        return Math.round((totalProductsAssigned / totalCategories) * 10) / 10;
    }, [totalCategories, totalProductsAssigned]);

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
                    <span>Classification Hub</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight leading-tight">
                    Categories{' '}
                    <span className="bg-linear-to-r from-[#E75480] via-[#D43F6B] to-[#F472B6] dark:from-[#FF4F81] dark:via-[#E1062C] dark:to-[#F472B6] bg-clip-text text-transparent">
                        Management
                    </span>
                </h1>

                <p className="text-sm sm:text-base text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-xl">
                    Organize and classify your product catalog efficiently with hierarchical grouping and visual assets.
                </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 pt-2">
                
                {/* Total Categories */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] shrink-0">
                        <Grid className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Total Groups</p>
                        <h3 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5">{totalCategories}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Categories defined</p>
                    </div>
                </motion.div>

                {/* Active Categories */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <TrendingUp className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Active Groups</p>
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{activeCategories}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Contains products &gt; 0</p>
                    </div>
                </motion.div>

                {/* Total Assigned Products */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] shrink-0">
                        <Layers className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Items Classified</p>
                        <h3 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5">{totalProductsAssigned}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Total assigned products</p>
                    </div>
                </motion.div>

                {/* Average Items per Category */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
                >
                    <div className="p-3 rounded-2xl bg-purple-100/60 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                        <Package className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Density Ratio</p>
                        <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">{avgProductsPerCategory}</h3>
                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Avg items per category</p>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}
