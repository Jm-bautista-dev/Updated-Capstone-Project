import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryBar } from '@/components/customer/category-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FiShoppingBag, FiArrowRight, FiInfo } from 'react-icons/fi';

interface Product {
    id: number;
    name: string;
    price: number;
    description: string | null;
    image: string | null;
    category_id: number;
    available_to_sell: number;
    limiting_ingredient: string | null;
    is_low_stock: boolean;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    image: string | null;
}

export default function Menu() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isMenuLoading, setIsMenuLoading] = useState<boolean>(false);

    // Helper to get correct API URL regardless of subdirectory deployment
    const getApiUrl = (path: string) => {
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        
        // Find the base app path by stripping known page suffixes
        // This is more robust than just checking for /menu at the end
        const basePath = pathname
            .split('/menu')[0]
            .replace(/\/index\.php\/?$/, '') 
            .replace(/\/$/, '');
            
        return `${origin}${basePath}${path}`.replace(/(?<!:)\/\//g, '/');
    };

    // Initial Fetch: Categories and All Products
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const catUrl = getApiUrl('/api/v1/customer/categories');
                const prodUrl = getApiUrl('/api/v1/customer/products');
                
                console.log('Fetching from:', { catUrl, prodUrl });

                const [catRes, prodRes] = await Promise.all([
                    fetch(catUrl),
                    fetch(prodUrl)
                ]);
                
                if (!catRes.ok || !prodRes.ok) {
                    console.error('API Response Status:', catRes.status, prodRes.status);
                }

                const catData = await catRes.json().catch(() => []);
                const prodData = await prodRes.json().catch(() => []);
                
                console.log('Menu Data Received:', { 
                    categories: Array.isArray(catData) ? catData.length : 'not an array', 
                    products: Array.isArray(prodData) ? prodData.length : 'not an array' 
                });
                
                setCategories(Array.isArray(catData) ? catData : []);
                setProducts(Array.isArray(prodData) ? prodData : []);
            } catch (error) {
                console.error('Failed to fetch initial menu data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch Products when Category changes
    const handleCategoryChange = async (slug: string) => {
        if (slug === activeCategory) return;
        
        setActiveCategory(slug);
        setIsMenuLoading(true);
        
        try {
            const endpoint = slug === 'all' 
                ? '/api/v1/customer/products' 
                : `/api/v1/customer/products?category=${slug}`;
            
            const url = getApiUrl(endpoint);
            console.log('Filtering Products:', url);
                
            const res = await fetch(url);
            const data = await res.json().catch(() => []);
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to filter products:', error);
        } finally {
            setIsMenuLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        try {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
            }).format(price ?? 0);
        } catch (error) {
            console.warn('Intl format failed, using fallback');
            return `₱${(price ?? 0).toLocaleString()}`;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A]">
            <Head title="Menu Ordering" />

            {/* Header */}
            <header className="bg-background border-b px-4 py-4 flex items-center justify-between sticky top-0 z-[60]">
                <div>
                    <h1 className="text-xl font-black tracking-tighter text-primary">KITCHEN OPS</h1>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Customer Menu</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                        <FiShoppingBag className="w-5 h-5" />
                    </button>
                    <Link href="/login" className="text-xs font-bold px-4 py-2 rounded-full border border-primary/20 hover:bg-primary/5 transition-colors">
                        Staff Login
                    </Link>
                </div>
            </header>

            {/* Category Selector - Sticky with offset to not overlap header */}
            <div className="sticky top-[64px] sm:top-[73px] z-50">
                <CategoryBar 
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={handleCategoryChange}
                    isLoading={isLoading}
                />
            </div>

            {/* Products Grid */}
            <main className="px-4 py-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        {activeCategory === 'all' ? 'Featured Items' : `${activeCategory.replace(/-/g, ' ')} Items`}
                        <Badge variant="secondary" className="font-bold">{products.length}</Badge>
                    </h2>
                </div>

                <AnimatePresence mode="wait">
                    {isMenuLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-[4/5] rounded-3xl bg-muted animate-pulse" />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <motion.div
                                        key={product.id}
                                        whileHover={{ y: -5 }}
                                        className="group"
                                    >
                                        <Card className={cn(
                                            "rounded-[2.5rem] overflow-hidden border-none shadow-xl shadow-black/5 transition-all duration-300 bg-white dark:bg-[#161615] relative",
                                            product.available_to_sell <= 0 && "opacity-60 grayscale blur-[0.5px]"
                                        )}>
                                            <div className="aspect-square relative overflow-hidden bg-muted group-hover:scale-105 transition-transform duration-500">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-20">
                                                        <FiInfo className="w-12 h-12" />
                                                    </div>
                                                )}

                                                {/* Availability Overlays */}
                                                {product.available_to_sell <= 0 ? (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                        <div className="bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-[.2em] shadow-2xl">
                                                            Currently Unavailable
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                        <Badge className="bg-white/90 backdrop-blur-md text-black border-none font-black text-[10px] px-3 h-7 shadow-lg flex items-center gap-1.5 rounded-full">
                                                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            CAN MAKE: {Math.floor(product.available_to_sell)}
                                                        </Badge>
                                                        {product.limiting_ingredient && (
                                                             <Badge className="bg-amber-500/90 backdrop-blur-md text-white border-none font-black text-[8px] px-3 h-5 shadow-lg rounded-full uppercase italic">
                                                                Limited by {product.limiting_ingredient}
                                                             </Badge>
                                                        )}
                                                    </div>
                                                )}

                                                {product.available_to_sell > 0 && (
                                                    <div className="absolute top-4 right-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                        <button className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                                                            <FiPlus />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <CardContent className="p-5 flex flex-col h-[140px]">
                                                <h3 className="font-bold text-sm leading-tight mb-1 truncate">{product.name}</h3>
                                                <p className="text-[11px] text-muted-foreground line-clamp-2 h-8 mb-3 leading-relaxed">
                                                    {product.description || 'No description available.'}
                                                </p>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <span className={cn(
                                                        "text-base font-black transition-colors",
                                                        product.available_to_sell <= 0 ? "text-muted-foreground" : "text-primary"
                                                    )}>
                                                        {formatPrice(product.price)}
                                                    </span>
                                                    <button 
                                                        disabled={product.available_to_sell <= 0}
                                                        className="text-xs font-bold text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors group/btn disabled:opacity-30"
                                                    >
                                                        Details <FiArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="p-6 rounded-full bg-muted w-20 h-20 flex items-center justify-center mx-auto mb-4 italic opacity-50">
                                        ?
                                    </div>
                                    <h3 className="text-lg font-bold">No items found</h3>
                                    <p className="text-muted-foreground text-sm">Try choosing another category.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Cart Suggestion (Bonus sticky bottom) */}
            <div className="fixed bottom-6 left-0 right-0 px-4 z-[70] pointer-events-none">
                <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="max-w-md mx-auto pointer-events-auto"
                >
                    <button className="w-full bg-primary text-primary-foreground h-16 rounded-full shadow-2xl flex items-center justify-between px-8 group">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">0</div>
                            <span className="font-bold tracking-tight">View Cart Items</span>
                        </div>
                        <span className="text-lg font-black">₱0.00</span>
                    </button>
                </motion.div>
            </div>
            
            <div className="h-24" /> {/* Spacer */}
        </div>
    );
}

// Helper icons
function FiPlus(props: any) {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
    )
}
