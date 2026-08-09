import { router, type RequestPayload } from '@inertiajs/core';
import { Head, usePage, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';

import { FilterToolbar } from '@/components/products/FilterToolbar';
import { ProductDrawer } from '@/components/products/ProductDrawer';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductTable } from '@/components/products/ProductTable';
import type { ViewMode } from '@/components/products/ViewSwitcher';
import { ResultModal } from '@/components/result-modal';
import { StockInModal } from '@/components/stock-in-modal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Category = {
    id: number;
    name: string;
};

type Ingredient = {
    id: number;
    name: string;
    unit: string;
    stock: number;
};

const PRODUCT_UNITS = [
    { label: 'Pieces (pcs)', value: 'pcs' },
    { label: 'Kilograms (kg)', value: 'kg' },
    { label: 'Grams (g)', value: 'g' },
    { label: 'Milligrams (mg)', value: 'mg' },
    { label: 'Liters (L)', value: 'liters' },
    { label: 'Milliliters (ml)', value: 'ml' },
    { label: 'Box', value: 'box' },
    { label: 'Bottle', value: 'bottle' },
    { label: 'Pack', value: 'pack' },
    { label: 'Sack', value: 'sack' },
];

type Product = {
    id: number;
    name: string;
    sku: string;
    category_id: number;
    category: Category;
    stock: number;
    cost_price: number;
    selling_price: number;
    status: string;
    image_url: string | null;
    ingredients: (Ingredient & { pivot: { quantity_required: string; unit?: string } })[];
    branches: { id: number; name: string }[];
    branch_id: number;
    is_direct: boolean;
    unit: string;
    created_at: string;
};

type Summary = {
    total_products: number;
    low_stock: number;
    out_of_stock: number;
};

interface Branch {
    id: number;
    name: string;
}

export default function ProductsIndex() {
    const rawProps = usePage().props;
    const pageProps = rawProps as unknown as {
        products?: Product[];
        categories: Category[];
        summary: Summary;
        filters: { search?: string; filter_category?: string };
        branches: Branch[];
        currentBranchId?: number | string;
        isAdmin: boolean;
        ingredients: Ingredient[];
    };

    const {
        categories = [],
        summary = { total_products: 0, low_stock: 0, out_of_stock: 0 },
        filters = {},
        branches = [],
        currentBranchId,
        isAdmin = false,
        ingredients = [],
    } = pageProps;

    const rawProducts = pageProps.products;

    const products: Product[] = useMemo(() => {
        return rawProducts || [];
    }, [rawProducts]);

    const [search, setSearch] = useState(filters.search || '');
    const [filterCategory, setFilterCategory] = useState(filters.filter_category || '');
    const [filterStockStatus, setFilterStockStatus] = useState('');

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const handleCategoryChange = (val: string) => {
        setFilterCategory(val);
        setCurrentPage(1);
    };

    const handleStockStatusChange = (val: string) => {
        setFilterStockStatus(val);
        setCurrentPage(1);
    };

    // View Mode Switcher with localStorage persistence
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('products_view_mode');
            if (saved === 'grid' || saved === 'table') return saved;
        }
        return 'table';
    });

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('products_view_mode', mode);
        }
    };

    // Branch filter handler
    const handleBranchFilter = (value: string) => {
        router.get('/products', {
            branch_id: value === 'all' ? '' : value,
            search,
            filter_category: filterCategory
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Realtime Sync Logic
    const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'inventory-updated' || e.data.type === 'products-updated') {
                router.reload();
            }
        };
        stateChannel.addEventListener('message', handleMessage);

        const handleFocus = () => {
            router.reload();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            stateChannel.removeEventListener('message', handleMessage);
            window.removeEventListener('focus', handleFocus);
        };
    }, [stateChannel]);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal & Drawer States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data, setData, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        sku: '',
        category_id: '',
        description: '',
        cost_price: '',
        selling_price: '',
        branch_id: currentBranchId ? String(currentBranchId) : '',
        branch_ids: [] as string[],
        recipe: [] as { ingredient_id: string; quantity_required: string; unit: string }[],
        unit: 'pcs',
        stock: '0',
    });

    // Local error state for edit form (router.post doesn't auto-populate useForm errors)
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [addErrors, setAddErrors] = useState<Record<string, string>>({});

    // Filtered Products Calculation
    const filteredData = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(search.toLowerCase()));
            const matchesCategory = !filterCategory || product.category_id.toString() === filterCategory;
            const matchesStatus = !filterStockStatus || product.status === filterStockStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [products, search, filterCategory, filterStockStatus]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));
        const start = (validPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage, totalPages]);

    // Modal Handlers
    const openAddModal = () => {
        reset();
        setImageFile(null);
        setImagePreview(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setSelectedProduct(product);
        setData({
            name: product.name,
            sku: product.sku || '',
            category_id: product.category_id.toString(),
            description: (product as unknown as { description?: string }).description || '',
            cost_price: product.cost_price.toString(),
            selling_price: product.selling_price.toString(),
            branch_id: product.branch_id?.toString() || '',
            branch_ids: product.branches ? product.branches.map(b => b.id.toString()) : [],
            recipe: product.ingredients ? product.ingredients.map(ing => ({
                ingredient_id: ing.id.toString(),
                quantity_required: ing.pivot?.quantity_required ? ing.pivot.quantity_required.toString() : '1',
                unit: ing.pivot?.unit || ing.unit || 'pcs'
            })) : [],
            unit: product.unit || 'pcs',
            stock: product.stock.toString(),
        });
        setImageFile(null);
        setImagePreview(product.image_url || null);
        setEditErrors({});
        setIsEditModalOpen(true);
    };

    const openStockInModal = (product: Product) => {
        setSelectedProduct(product);
        setIsStockInModalOpen(true);
    };

    const openDeleteModal = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    const openDrawer = (product: Product) => {
        setSelectedProduct(product);
        setIsDrawerOpen(true);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAddErrors({});
        router.post('/products', {
            ...data,
            image: imageFile,
        } as RequestPayload, {
            forceFormData: true,
            onSuccess: () => {
                setSearch('');
                setIsAddModalOpen(false);
                reset();
                stateChannel.postMessage({ type: 'products-updated' });
                setSuccessMessage({ title: 'Product Added!', message: 'The product has been registered successfully.' });
                setIsSuccessModalOpen(true);
                setImageFile(null);
                setImagePreview(null);
            },
            onError: (errs) => {
                setAddErrors(errs as Record<string, string>);
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        setEditErrors({});
        router.post(`/products/${selectedProduct.id}`, {
            _method: 'PUT',
            ...data,
            image: imageFile,
        } as RequestPayload, {
            forceFormData: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                setImageFile(null);
                setImagePreview(null);
                setSuccessMessage({ title: 'Product Updated!', message: 'Changes have been saved successfully.' });
                setIsSuccessModalOpen(true);
            },
            onError: (errs) => {
                setEditErrors(errs as Record<string, string>);
            },
        });
    };

    const handleDeleteSubmit = () => {
        if (selectedProduct) {
            destroy(`/products/${selectedProduct.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    stateChannel.postMessage({ type: 'products-updated' });
                    setSelectedProduct(null);
                },
            });
        }
    };

    const addRecipeItem = () => {
        setData('recipe', [...data.recipe, { ingredient_id: '', quantity_required: '1', unit: 'pcs' }]);
    };

    const removeRecipeItem = (index: number) => {
        const newRecipe = [...data.recipe];
        newRecipe.splice(index, 1);
        setData('recipe', newRecipe);
    };

    const updateRecipeItem = (index: number, field: string, value: string) => {
        const newRecipe = [...data.recipe];
        newRecipe[index] = { ...newRecipe[index], [field]: value };
        setData('recipe', newRecipe);
    };

    const toggleBranch = (id: string) => {
        const current = [...data.branch_ids];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setData('branch_ids', current);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }]}>
            <Head title="Products Management" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                
                {/* ── ZONE 1: HERO & STATISTICS ── */}
                <ProductsHero
                    summary={summary}
                    products={products}
                />

                {/* ── ZONE 2: SEARCH & FILTER TOOLBAR ── */}
                <FilterToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    filterCategory={filterCategory}
                    onCategoryChange={handleCategoryChange}
                    filterStockStatus={filterStockStatus}
                    onStockStatusChange={handleStockStatusChange}
                    currentBranchId={currentBranchId}
                    branches={branches}
                    categories={categories}
                    isAdmin={isAdmin}
                    onBranchFilter={handleBranchFilter}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    onOpenAddModal={openAddModal}
                />

                {/* ── ZONE 3: PRODUCTS DISPLAY (TABLE vs GRID) ── */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {viewMode === 'table' ? (
                            <motion.div
                                key="table-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ProductTable
                                    products={paginatedData}
                                    isAdmin={isAdmin}
                                    onSelectProduct={openDrawer}
                                    onOpenStockIn={openStockInModal}
                                    onOpenEdit={openEditModal}
                                    onOpenDelete={openDeleteModal}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="grid-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ProductGrid
                                    products={paginatedData}
                                    isAdmin={isAdmin}
                                    onSelectProduct={openDrawer}
                                    onOpenStockIn={openStockInModal}
                                    onOpenEdit={openEditModal}
                                    onOpenDelete={openDeleteModal}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Pagination Controls */}
                    {filteredData.length > 0 && (
                        <div className="rounded-2xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_25px_-5px_rgba(231,84,128,0.06)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] p-4 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300">
                            <div className="flex items-center gap-4 text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                <div className="flex items-center gap-2">
                                    <span className="uppercase tracking-wider">Per Page</span>
                                    <Select 
                                        value={String(itemsPerPage)} 
                                        onValueChange={(val) => {
                                            setItemsPerPage(Number(val));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-20 h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] font-mono font-bold text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl min-w-20 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                            {[8, 12, 24, 48, 96].map(val => (
                                                <SelectItem key={val} value={String(val)} className="text-xs font-mono font-bold dark:focus:bg-white/10">{val}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <span className="font-mono">
                                    Showing {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} items
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="rounded-xl h-9 w-9 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5 && currentPage > 3) {
                                            pageNum = currentPage - 3 + i + 1;
                                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                        }
                                        if (pageNum <= 0) return null;

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={cn(
                                                    "h-9 w-9 rounded-xl font-bold text-xs font-mono transition-all cursor-pointer",
                                                    currentPage === pageNum 
                                                        ? "bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent shadow-xs" 
                                                        : "border-[#F8C8DC]/60 dark:border-white/10 text-[#5D4A4D] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10"
                                                )}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="rounded-xl h-9 w-9 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Product Details Side Drawer */}
            <ProductDrawer
                product={selectedProduct}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                isAdmin={isAdmin}
                onOpenStockIn={openStockInModal}
                onOpenEdit={openEditModal}
                onOpenDelete={openDeleteModal}
            />

            {/* Preserved Action Modals */}
            <ResultModal
                open={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                type="success"
                title={successMessage.title}
                message={successMessage.message}
            />

            <StockInModal
                open={isStockInModalOpen}
                onOpenChange={setIsStockInModalOpen}
                item={selectedProduct}
                type="product"
            />

            {/* Add Product Dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col rounded-4xl bg-white dark:bg-[#121218] p-6 sm:p-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit'] overflow-hidden">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="text-2xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">Register New Product</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Enter product specifications, base pricing, and recipe materials.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit} className="flex flex-col flex-1 overflow-hidden space-y-4 pt-2">
                        {Object.keys(addErrors).length > 0 && (
                            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold space-y-1">
                                <p className="font-extrabold uppercase tracking-tight">Validation Error</p>
                                {Object.entries(addErrors).map(([key, err]) => (
                                    <p key={key} className="text-[11px] font-medium">• {err}</p>
                                ))}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[60vh] pr-1 pb-2">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Product Name</label>
                                <Input required value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Salmon Aburi Nigiri" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]" />
                                {errors.name && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">SKU Identifier</label>
                                <Input value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder="e.g. NGR-SLM-01" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]" />
                                {errors.sku && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{errors.sku}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Category</label>
                                <select
                                    required
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full h-12 px-3 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-sm focus:ring-4 focus:ring-[#E75480]/15 dark:focus:ring-[#E1062C]/20 focus:border-[#E75480] dark:focus:border-[#E1062C] transition-all appearance-none font-medium"
                                >
                                    <option value="">Select Category</option>
                                    {categories
                                        .filter((c) => !data.branch_id || String((c as unknown as { branch_id?: number }).branch_id) === data.branch_id)
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                </select>
                                {errors.category_id && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{errors.category_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Cost Price (PHP)</label>
                                <Input type="number" step="0.01" required value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} placeholder="0.00" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono font-bold" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Selling Price (PHP)</label>
                                <Input type="number" step="0.01" required value={data.selling_price} onChange={(e) => setData('selling_price', e.target.value)} placeholder="0.00" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-emerald-600 dark:text-emerald-400 font-mono font-bold" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Base Unit</label>
                                <select
                                    required
                                    value={data.unit}
                                    onChange={(e) => setData('unit', e.target.value)}
                                    className="w-full h-12 px-3 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-sm font-bold appearance-none"
                                >
                                    {PRODUCT_UNITS.map(unit => (
                                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Initial Stock</label>
                                <Input type="number" step="0.0001" value={data.stock} onChange={(e) => setData('stock', e.target.value)} placeholder="0" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono" />
                            </div>

                            {/* Branch Visibility Tags Selection */}
                            {branches && branches.length > 0 && (
                                <div className="col-span-2 space-y-2 border-t border-[#F8C8DC]/40 dark:border-white/10 pt-3">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Branch Visibility</label>
                                    <div className="flex flex-wrap gap-2">
                                        {branches.map((b) => (
                                            <button
                                                type="button"
                                                key={b.id}
                                                onClick={() => toggleBranch(b.id.toString())}
                                                className={cn(
                                                    "px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                                                    data.branch_ids.includes(b.id.toString())
                                                        ? "bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent"
                                                        : "bg-white dark:bg-[#181820] text-[#7D6B6E] dark:text-[#94A3B8] border-[#F8C8DC] dark:border-white/10"
                                                )}
                                            >
                                                {b.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Image Upload */}
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Product Image</label>
                                {imagePreview && (
                                    <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7] dark:bg-[#181820] mb-2">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                                            className="absolute top-2 right-2 bg-rose-600 text-white rounded-full size-6 flex items-center justify-center text-xs shadow-xs"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setImageFile(file);
                                        if (file) setImagePreview(URL.createObjectURL(file));
                                    }}
                                    className="w-full text-xs font-medium border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FADADD]/40 dark:file:bg-white/10 file:text-[#E75480] dark:file:text-[#FF4F81] cursor-pointer"
                                />
                            </div>

                            {/* Recipe Composition */}
                            <div className="col-span-2 border-t border-[#F8C8DC]/40 dark:border-white/10 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">Recipe Composition</h4>
                                        <p className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8]">Define required raw materials per unit</p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} className="h-8 text-xs font-bold rounded-xl border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#FF4F81]">
                                        <Plus className="size-3 mr-1" /> Add Material
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {data.recipe.map((item, idx) => {
                                        const selectedIng = ingredients.find((ing) => ing.id.toString() === item.ingredient_id);
                                        return (
                                            <div key={idx} className="flex items-center gap-2 bg-[#FFF5F7] dark:bg-[#181820] p-2.5 rounded-xl border border-[#F8C8DC]/40 dark:border-white/10">
                                                <select
                                                    required
                                                    value={item.ingredient_id}
                                                    onChange={(e) => updateRecipeItem(idx, 'ingredient_id', e.target.value)}
                                                    className="flex-1 h-9 px-2 rounded-lg border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#F8FAFC] text-xs font-medium"
                                                >
                                                    <option value="">-- Choose Ingredient --</option>
                                                    {ingredients.map((ing) => (
                                                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                                    ))}
                                                </select>
                                                <Input
                                                    type="number"
                                                    step="0.0001"
                                                    required
                                                    value={item.quantity_required}
                                                    onChange={(e) => updateRecipeItem(idx, 'quantity_required', e.target.value)}
                                                    className="w-20 h-9 text-xs font-bold font-mono bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#F8FAFC] rounded-lg border-[#F8C8DC]/60 dark:border-white/10"
                                                    placeholder="Qty"
                                                />
                                                <span className="text-[10px] font-mono text-[#9E8B8E] dark:text-[#64748B] w-8">{selectedIng?.unit || '-'}</span>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeRecipeItem(idx)} className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>

                        <DialogFooter className="shrink-0 pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">Cancel</Button>
                            <Button type="submit" disabled={processing} className="rounded-xl h-11 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white text-xs font-bold cursor-pointer">
                                {processing ? 'Registering...' : 'Confirm Registration'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Product Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col rounded-4xl bg-white dark:bg-[#121218] p-6 sm:p-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit'] overflow-hidden">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="text-2xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">Revise Product Specifications</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Modify existing product parameters, pricing, and raw material composition.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden space-y-4 pt-2">
                        {Object.keys(editErrors).length > 0 && (
                            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold space-y-1">
                                <p className="font-extrabold uppercase tracking-tight">Validation Error</p>
                                {Object.entries(editErrors).map(([key, err]) => (
                                    <p key={key} className="text-[11px] font-medium">• {err}</p>
                                ))}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[60vh] pr-1 pb-2">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Product Name</label>
                                <Input required value={data.name} onChange={(e) => setData('name', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]" />
                                {editErrors.name && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{editErrors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">SKU</label>
                                <Input value={data.sku} onChange={(e) => setData('sku', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]" />
                                {editErrors.sku && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{editErrors.sku}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Category</label>
                                <select
                                    required
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full h-12 px-3 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-sm font-medium appearance-none"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((c: Category) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {editErrors.category_id && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{editErrors.category_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Cost Price</label>
                                <Input type="number" step="0.01" required value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono font-bold" />
                                {editErrors.cost_price && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{editErrors.cost_price}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Selling Price</label>
                                <Input type="number" step="0.01" required value={data.selling_price} onChange={(e) => setData('selling_price', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-emerald-600 dark:text-emerald-400 font-mono font-bold" />
                                {editErrors.selling_price && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{editErrors.selling_price}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Base Unit</label>
                                <select
                                    required
                                    value={data.unit}
                                    onChange={(e) => setData('unit', e.target.value)}
                                    className="w-full h-12 px-3 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-sm font-bold appearance-none"
                                >
                                    {PRODUCT_UNITS.map(unit => (
                                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Current Stock</label>
                                <Input type="number" step="0.0001" value={data.stock} onChange={(e) => setData('stock', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono" />
                            </div>

                            {/* Branch Visibility Tags Selection */}
                            {branches && branches.length > 0 && (
                                <div className="col-span-2 space-y-2 border-t border-[#F8C8DC]/40 dark:border-white/10 pt-3">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Branch Visibility</label>
                                    <div className="flex flex-wrap gap-2">
                                        {branches.map((b) => (
                                            <button
                                                type="button"
                                                key={b.id}
                                                onClick={() => toggleBranch(b.id.toString())}
                                                className={cn(
                                                    "px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                                                    data.branch_ids.includes(b.id.toString())
                                                        ? "bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent"
                                                        : "bg-white dark:bg-[#181820] text-[#7D6B6E] dark:text-[#94A3B8] border-[#F8C8DC] dark:border-white/10"
                                                )}
                                            >
                                                {b.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Product Image Upload */}
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Product Image</label>
                                {imagePreview && (
                                    <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7] dark:bg-[#181820] mb-2">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                                            className="absolute top-2 right-2 bg-rose-600 text-white rounded-full size-6 flex items-center justify-center text-xs shadow-xs"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setImageFile(file);
                                        if (file) setImagePreview(URL.createObjectURL(file));
                                    }}
                                    className="w-full text-xs font-medium border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FADADD]/40 dark:file:bg-white/10 file:text-[#E75480] dark:file:text-[#FF4F81] cursor-pointer"
                                />
                            </div>

                            {/* Recipe Composition */}
                            <div className="col-span-2 border-t border-[#F8C8DC]/40 dark:border-white/10 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">Recipe Composition</h4>
                                        <p className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8]">Define required raw materials per unit</p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} className="h-8 text-xs font-bold rounded-xl border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#FF4F81]">
                                        <Plus className="size-3 mr-1" /> Add Material
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {data.recipe.map((item, idx) => {
                                        const selectedIng = ingredients.find((ing) => ing.id.toString() === item.ingredient_id);
                                        return (
                                            <div key={idx} className="flex items-center gap-2 bg-[#FFF5F7] dark:bg-[#181820] p-2.5 rounded-xl border border-[#F8C8DC]/40 dark:border-white/10">
                                                <select
                                                    required
                                                    value={item.ingredient_id}
                                                    onChange={(e) => updateRecipeItem(idx, 'ingredient_id', e.target.value)}
                                                    className="flex-1 h-9 px-2 rounded-lg border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#F8FAFC] text-xs font-medium"
                                                >
                                                    <option value="">-- Choose Ingredient --</option>
                                                    {ingredients.map((ing) => (
                                                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                                    ))}
                                                </select>
                                                <Input
                                                    type="number"
                                                    step="0.0001"
                                                    required
                                                    value={item.quantity_required}
                                                    onChange={(e) => updateRecipeItem(idx, 'quantity_required', e.target.value)}
                                                    className="w-20 h-9 text-xs font-bold font-mono bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#F8FAFC] rounded-lg border-[#F8C8DC]/60 dark:border-white/10"
                                                    placeholder="Qty"
                                                />
                                                <span className="text-[10px] font-mono text-[#9E8B8E] dark:text-[#64748B] w-8">{selectedIng?.unit || '-'}</span>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeRecipeItem(idx)} className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="shrink-0 pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">Cancel</Button>
                            <Button type="submit" disabled={processing} className="rounded-xl h-11 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white text-xs font-bold cursor-pointer">
                                {processing ? 'Updating...' : 'Push Updates'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Product Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#121218] p-6 font-['Outfit'] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-2 text-xl font-bold">
                            <Trash2 className="size-5 text-rose-600 dark:text-rose-400" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                            Are you sure you want to delete <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">"{selectedProduct?.name}"</strong>? This will remove all associated inventory records.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteSubmit} disabled={processing} className="rounded-xl text-xs font-bold bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-800">
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
