import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { FiShoppingBag, FiArrowRight, FiInfo, FiPlus } from 'react-icons/fi';
import { CategoryBar } from '@/components/customer/category-bar';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Product {
    id: number;
    name: string;
    price: number;
    description: string | null;
    image: string | null;
    category_id: number;
    stock?: number;
    is_available?: boolean;
    available_to_sell?: number;
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

    // Initial Fetch: Categories and All Products
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [catRes, prodRes] = await Promise.all([
                    fetch('/api/v1/customer/categories'),
                    fetch('/api/v1/customer/products')
                ]);

                const catData = await catRes.json();
                const prodData = await prodRes.json();

                const safeCats = Array.isArray(catData) ? catData : (catData?.categories || catData?.data || []);
                const safeProds = Array.isArray(prodData) ? prodData : (prodData?.products || prodData?.data || []);

                setCategories(safeCats);
                setProducts(safeProds);
            } catch (error) {
                console.error('Failed to fetch initial menu data:', error);
                setCategories([]);
                setProducts([]);
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
            const url = slug === 'all'
                ? '/api/v1/customer/products'
                : `/api/v1/customer/products?category=${slug}`;

            const res = await fetch(url);
            const data = await res.json();
            const safeProds = Array.isArray(data) ? data : (data?.products || data?.data || []);
            setProducts(safeProds);
        } catch (error) {
            console.error('Failed to filter products:', error);
            setProducts([]);
        } finally {
            setIsMenuLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(price);
    };

    const safeProductsList = Array.isArray(products) ? products : [];

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A]">
            <Head title="Menu Ordering" />

            {/* Header */}
            <header className="bg-background border-b px-4 py-4 flex items-center justify-between sticky top-0 z-60">
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

            {/* Category Selector */}
            <CategoryBar
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                isLoading={isLoading}
            />

            {/* Products Grid */}
            <main className="px-4 py-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        {activeCategory === 'all' ? 'Featured Items' : `${activeCategory.replace(/-/g, ' ')} Items`}
                        <Badge variant="secondary" className="font-bold">{safeProductsList.length}</Badge>
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
                                <div key={i} className="aspect-4/5 rounded-3xl bg-muted animate-pulse" />
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
                            {safeProductsList.length > 0 ? (
                                safeProductsList.map((product: Product) => {
                                    const isOutOfStock = product.is_available === false || (product.stock !== undefined && product.stock <= 0) || (product.available_to_sell !== undefined && product.available_to_sell <= 0);

                                    return (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            whileHover={!isOutOfStock ? { y: -5 } : {}}
                                            className="group"
                                        >
                                            <Card className={`rounded-[2.5rem] overflow-hidden border-none shadow-xl shadow-black/5 hover:shadow-primary/10 transition-all duration-300 bg-white dark:bg-[#161615] ${isOutOfStock ? 'opacity-60' : ''}`}>
                                                <div className="aspect-square relative overflow-hidden bg-muted group-hover:scale-105 transition-transform duration-500">
                                                    <ImageWithFallback
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                        fallbackIcon={
                                                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                                                <FiInfo className="w-12 h-12" />
                                                            </div>
                                                        }
                                                    />

                                                    {isOutOfStock && (
                                                        <div className="absolute top-4 left-4 z-10">
                                                            <span className="bg-rose-600 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-md">
                                                                SOLD OUT
                                                            </span>
                                                        </div>
                                                    )}

                                                    {!isOutOfStock && (
                                                        <div className="absolute top-4 right-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                            <button className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                                                                <FiPlus />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <CardContent className="p-5">
                                                    <h3 className="font-bold text-sm leading-tight mb-1 truncate">{product.name}</h3>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 h-8 mb-3 leading-relaxed">
                                                        {product.description || 'No description available.'}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-auto">
                                                        <span className="text-base font-black text-primary">
                                                            {formatPrice(product.price)}
                                                        </span>
                                                        <button className="text-xs font-bold text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors group/btn">
                                                            Details <FiArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                                        </button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="p-6 rounded-full bg-muted w-20 h-20 flex items-center justify-center mx-auto mb-4 italic opacity-50">
                                        ?
                                    </div>
                                    <h3 className="font-bold text-lg text-foreground mb-1">No products found</h3>
                                    <p className="text-sm text-muted-foreground">Try selecting a different category.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
