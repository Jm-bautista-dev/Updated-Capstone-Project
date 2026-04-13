import { Head, usePage, useForm } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ResultModal } from '@/components/result-modal';
import {
    FiEdit2,
    FiTrash2,
    FiPlus,
    FiSearch,
    FiPackage,
    FiAlertTriangle,
    FiSlash,
    FiFilter,
    FiChevronLeft,
    FiChevronRight,
    FiRefreshCw
} from 'react-icons/fi';
import { StockInModal } from '@/components/stock-in-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Category = {
    id: number;
    name: string;
};

type Ingredient = {
    id: number;
    name: string;
    unit: string;
    stock: number;
    branch_id: number;
};

type RecipeItem = {
    ingredient_id: string;
    ingredient?: Ingredient;
    quantity_required: string;
};

// Using database-driven units instead of static constants

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
    ingredients: (Ingredient & { pivot: { quantity_required: string } })[];
    branches: { id: number; name: string }[];
    branch_id: number;
    is_direct: boolean;
    unit: string;
    description: string | null;
    created_at: string;
};

type Summary = {
    total_products: number;
    low_stock: number;
    out_of_stock: number;
};

export default function ProductsIndex() {
    const { products: rawProducts, categories, summary, filters, branches, currentBranchId, isAdmin, allowedUnits } = usePage().props as any;
    const products: Product[] = rawProducts || [];
    const [search, setSearch] = useState(filters.search || '');
    const [filterCategory, setFilterCategory] = useState(filters.filter_category || '');

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

    // --- Sync Logic ---
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

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, transform } = useForm({
        name: '',
        sku: '',
        category_id: '',
        cost_price: '',
        selling_price: '',
        branch_id: currentBranchId ? String(currentBranchId) : '',
        branch_ids: [] as string[],
        recipe: [] as RecipeItem[],
        unit: 'pcs',
        description: '',
        image: null as File | null,
    });

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterCategory]);

    // Derived Paginated Data
    const filteredData = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(search.toLowerCase()));
            const matchesCategory = !filterCategory || product.category_id.toString() === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, search, filterCategory]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

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
            cost_price: product.cost_price.toString(),
            selling_price: product.selling_price.toString(),
            branch_id: product.branch_id?.toString() || '',
            branch_ids: product.branches.map(b => b.id.toString()),
            recipe: product.ingredients.map(ing => ({
                ingredient_id: ing.id.toString(),
                quantity_required: ing.pivot.quantity_required.toString()
            })),
            unit: product.unit || 'pcs',
            description: product.description || '',
        });
        setImageFile(null);
        setImagePreview(product.image_url || null);
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

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        transform((data) => ({
            ...data,
            image: imageFile,
        }));

        post('/products', {
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
            onError: (err) => {
                console.error('Registration failed:', err);
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct) {
            transform((data) => ({
                ...data,
                image: imageFile,
                _method: 'PUT',
            }));
            
            post(`/products/${selectedProduct.id}`, {
                forceFormData: true,
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    reset();
                    setImageFile(null);
                    setImagePreview(null);
                    setSuccessMessage({ title: 'Product Updated!', message: 'Changes have been saved successfully.' });
                    setIsSuccessModalOpen(true);
                },
                onError: (err) => {
                    console.error('Update failed:', err);
                }
            });
        }
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Stock': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'Low Stock': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'Out of Stock': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return '';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    const addRecipeItem = () => {
        setData('recipe', [...data.recipe, { ingredient_id: '', quantity_required: '1' }]);
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
            <Head title="Products" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-muted/20">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-background border-b flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
                        <p className="text-sm text-muted-foreground">Manage your product inventory and pricing.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {isAdmin && (
                            <Select
                                value={currentBranchId ? String(currentBranchId) : 'all'}
                                onValueChange={handleBranchFilter}
                            >
                                <SelectTrigger className="w-full sm:w-48 h-10 bg-muted/50">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches?.map((b: any) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <div className="relative w-full sm:w-64">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors"
                            />
                        </div>
                        <Select
                            value={String(filterCategory)}
                            onValueChange={(val) => setFilterCategory(val === 'all' ? '' : val)}
                        >
                            <SelectTrigger className="w-full sm:w-48 h-10 bg-muted/50">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((c: any) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isAdmin && (
                            <Button onClick={openAddModal} className="h-10 gap-2 shadow-lg shadow-primary/20">
                                <FiPlus className="size-4" /> <span className="hidden lg:inline">Add Product</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col gap-6">
                    {/* Summary Row */}
                    <div className="grid gap-4 md:grid-cols-3 flex-shrink-0">
                        <Card className="bg-primary/5 border-primary/20 shadow-sm group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Products</CardTitle>
                                <FiPackage className="size-4 text-primary group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{summary.total_products}</div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Unique items in system</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock Items</CardTitle>
                                <FiAlertTriangle className="size-4 text-amber-500 group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-amber-600">{summary.low_stock}</div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Stock levels ≤ 5 units</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-destructive/5 border-destructive/20 shadow-sm group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Out of Stock</CardTitle>
                                <FiSlash className="size-4 text-destructive group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-destructive">{summary.out_of_stock}</div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Items requiring restock</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table Card */}
                    <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-none ring-1 ring-black/5 flex-shrink min-h-0">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-background border-b shadow-sm">
                                    <tr className="bg-muted/30">
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Product Information</th>
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden lg:table-cell">Category</th>
                                        <th className="h-12 px-6 text-center align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Stock</th>
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden sm:table-cell">Pricing</th>
                                        <th className="h-12 px-6 text-center align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Stock Status</th>
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden md:table-cell">Created</th>
                                        <th className="h-12 px-6 text-right align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y relative">
                                    <AnimatePresence mode="popLayout">
                                        {paginatedData.length === 0 ? (
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="h-32 text-center"
                                            >
                                                <td colSpan={7} className="text-muted-foreground italic">
                                                    No products found matching your criteria.
                                                </td>
                                            </motion.tr>
                                        ) : (
                                            paginatedData.map((product: Product) => (
                                                <motion.tr
                                                    key={product.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    className="border-b transition-colors hover:bg-muted/40 group"
                                                >
                                                    <td className="p-4 align-middle">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{product.name}</span>
                                                            <span className="text-xs text-muted-foreground font-mono">{product.sku || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle hidden lg:table-cell">
                                                        <Badge variant="outline" className="bg-primary/5 border-primary/10">
                                                            {product.category?.name || 'Uncategorized'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <span className={cn(
                                                            "font-mono font-bold",
                                                            product.stock <= 0 ? "text-destructive" : product.stock <= 5 ? "text-amber-600" : ""
                                                        )}>
                                                            {product.stock} {product.unit || 'pcs'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle hidden sm:table-cell">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Cost: {formatCurrency(product.cost_price)}</span>
                                                            <span className="text-sm font-bold text-emerald-600">Sell: {formatCurrency(product.selling_price)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <Badge variant="outline" className={cn("px-2 py-0.5 whitespace-nowrap", getStatusColor(product.status))}>
                                                            {product.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle hidden md:table-cell text-muted-foreground">
                                                        {format(new Date(product.created_at), 'MMM d, yyyy')}
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {product.is_direct && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openStockInModal(product)}
                                                                    className="h-8 w-8 text-primary hover:bg-primary/10"
                                                                    title="Restock"
                                                                >
                                                                    <FiRefreshCw className="size-4" />
                                                                </Button>
                                                            )}
                                                            {isAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openEditModal(product)}
                                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                >
                                                                    <FiEdit2 className="size-4" />
                                                                </Button>
                                                            )}
                                                            {isAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(product)}
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <FiTrash2 className="size-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="p-4 bg-muted/5 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Show</span>
                                    <Select value={String(itemsPerPage)} onValueChange={(val) => {
                                        setItemsPerPage(Number(val));
                                        setCurrentPage(1);
                                    }}>
                                        <SelectTrigger className="w-[70px] h-8 rounded-lg border-none bg-background shadow-sm font-bold text-xs ring-1 ring-muted">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-none shadow-2xl min-w-[70px]">
                                            {[5, 10, 25, 50, 100].map(val => (
                                                <SelectItem key={val} value={String(val)} className="text-xs">{val}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                    {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} products
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="rounded-lg h-9 w-9 ring-1 ring-muted"
                                >
                                    <FiChevronLeft className="size-4" />
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
                                                variant={currentPage === pageNum ? 'default' : 'ghost'}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={cn(
                                                    "h-9 w-9 rounded-lg font-bold text-[10px] transition-all",
                                                    currentPage === pageNum ? "bg-primary shadow-lg shadow-primary/20 text-white" : "hover:bg-muted"
                                                )}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="rounded-lg h-9 w-9 ring-1 ring-muted"
                                >
                                    <FiChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Success Modal */}
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

            {/* Modals */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                    <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                        <DialogTitle className="text-xl font-bold">Add New Product</DialogTitle>
                        <DialogDescription className="text-sm">
                            Define product specifications and composition.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Product Name" className="h-10 rounded-lg" />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SKU</label>
                                    <Input value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder="Auto-generated if empty" className="h-10 rounded-lg" />
                                    {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                    >
                                        <option value="">Select Category</option>
                                        {categories
                                            .filter((c: any) => {
                                                if (!data.branch_id) return true;
                                                const targetId = Number(data.branch_id);
                                                // Check direct branch_id column or many-to-many relationship
                                                const hasDirectMatch = c.branch_id && Number(c.branch_id) === targetId;
                                                const hasRelationMatch = c.branches?.some((b: any) => Number(b.id) === targetId);
                                                const isGlobal = !c.branch_id && (!c.branches || c.branches.length === 0);

                                                return hasDirectMatch || hasRelationMatch || isGlobal;
                                            })
                                            .map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                    </select>
                                    {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
                                </div>
                                {isAdmin && (
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Owner Branch</label>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5 mb-1.5 leading-tight">Determines the core ownership and dictates which ingredients can be used.</p>
                                        <select
                                            value={data.branch_id}
                                            onChange={(e) => setData(d => ({ ...d, branch_id: e.target.value, recipe: [] }))}
                                            className="w-full h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none font-bold"
                                        >
                                            <option value="">-- Select Owner Branch --</option>
                                            {branches?.map((b: any) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                        {errors.branch_id && <p className="text-xs text-destructive">{errors.branch_id}</p>}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cost Price</label>
                                    <Input type="number" step="0.01" value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} placeholder="0.00" className="h-10 rounded-lg" />
                                    {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Selling Price</label>
                                    <Input type="number" step="0.01" value={data.selling_price} onChange={(e) => setData('selling_price', e.target.value)} placeholder="0.00" className="h-10 rounded-lg" />
                                    {errors.selling_price && <p className="text-xs text-destructive">{errors.selling_price}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Unit of Measure</label>
                                    <select
                                        value={data.unit}
                                        onChange={(e) => setData('unit', e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none font-bold"
                                    >
                                        <option value="">-- Select Unit --</option>
                                        {allowedUnits?.map((u: string) => (
                                            <option key={u} value={u}>{u.toUpperCase()} - {u === 'pcs' ? 'Pieces' : u === 'g' ? 'Grams' : u === 'ml' ? 'Milliliters' : u === 'kg' ? 'Kilograms' : u === 'L' ? 'Liters' : u}</option>
                                        ))}
                                    </select>
                                    {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
                                </div>
                                {/* Branch Visibility */}
                                <div className="col-span-2 space-y-2 border-t pt-4">
                                    <label className="text-sm font-bold">Branch Visibility</label>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Select branches that can see this product (Default: All)</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {branches?.map((branch: any) => (
                                            <div
                                                key={branch.id}
                                                onClick={() => toggleBranch(branch.id.toString())}
                                                className={cn(
                                                    "cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2",
                                                    data.branch_ids.includes(branch.id.toString())
                                                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                                                        : "bg-muted/30 border-muted text-muted-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "size-2 rounded-full",
                                                    data.branch_ids.includes(branch.id.toString()) ? "bg-primary" : "bg-muted-foreground/30"
                                                )} />
                                                {branch.name}
                                            </div>
                                        ))}
                                        {data.branch_ids.length === 0 && (
                                            <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                                                VISIBLE TO ALL BRANCHES
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                {/* Product Image Upload */}
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-medium">Product Image <span className="text-muted-foreground text-xs">(Optional, max 2MB)</span></label>
                                    {imagePreview && (
                                        <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-muted/30">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="absolute top-2 right-2 bg-destructive text-white rounded-full size-6 flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                                            >
                                                ✕
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
                                    />
                                </div>
                                <div className="col-span-2 space-y-1.5 mt-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Description (Optional)</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
                                        placeholder="Add descriptive details for your customers..."
                                    />
                                    {errors.description && <p className="text-xs text-destructive mt-1 ml-1 font-bold">{errors.description}</p>}
                                </div>
                                <div className="col-span-2 border-t pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <label className="text-sm font-bold">Recipe Composition</label>
                                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Define required materials for production</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} className="h-8 text-xs gap-1 shadow-sm hover:bg-primary/5 rounded-lg">
                                            <FiPlus className="size-3 text-primary" /> Add Ingredient
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {data.recipe.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-destructive/5 border border-dashed border-destructive/20">
                                                <FiSlash className="size-8 text-destructive/30 mb-2" />
                                                <p className="text-sm font-bold text-destructive italic tracking-tight uppercase">
                                                    No ingredients registered.
                                                </p>
                                                <p className="text-[10px] text-muted-foreground uppercase">This product will be unavailable for sale (0 stock)</p>
                                            </div>
                                        )}
                                        {/* Added Helper Text when no branch selected */}
                                        {!data.branch_id && (
                                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-2">
                                                <p className="text-xs text-amber-600 font-bold">Please select an Owner Branch first.</p>
                                                <p className="text-[10px] text-amber-600/80">Only ingredients from the selected branch are available.</p>
                                            </div>
                                        )}
                                        {data.recipe.map((item, idx) => {
                                            const filteredIngredients = (usePage().props as any).ingredients.filter((ing: Ingredient) => {
                                                if (!data.branch_id) return true;
                                                return Number(ing.branch_id) === Number(data.branch_id);
                                            });
                                            const selectedIng = filteredIngredients.find((ing: Ingredient) => ing.id.toString() === item.ingredient_id);
                                            const ingError = errors[`recipe.${idx}.ingredient_id` as keyof typeof errors];
                                            const qtyError = errors[`recipe.${idx}.quantity_required` as keyof typeof errors];

                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="grid grid-cols-12 gap-2 items-start bg-muted/20 p-3 rounded-xl border border-muted/50"
                                                >
                                                    <div className="col-span-12 sm:col-span-7 space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Select Material</label>
                                                        <select
                                                            disabled={!data.branch_id}
                                                            value={item.ingredient_id}
                                                            onChange={(e) => updateRecipeItem(idx, 'ingredient_id', e.target.value)}
                                                            className={cn(
                                                                "w-full h-10 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 transition-all appearance-none",
                                                                ingError ? "border-destructive ring-destructive/10 text-destructive" : "border-input ring-primary/20",
                                                                !data.branch_id ? "opacity-50 cursor-not-allowed bg-muted" : ""
                                                            )}
                                                        >
                                                            <option value="">-- Choose Ingredient --</option>
                                                            {filteredIngredients.map((ing: any) => {
                                                                const isTaken = data.recipe.some((r, rIdx) => r.ingredient_id === String(ing.id) && rIdx !== idx);
                                                                return (
                                                                    <option key={ing.id} value={ing.id} disabled={isTaken}>
                                                                        {ing.name} {isTaken ? '(Already added)' : `(${ing.unit})`} — Stock: {ing.stock}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                        {ingError && <p className="text-[10px] text-destructive font-bold ml-1">{ingError as string}</p>}
                                                    </div>
                                                    
                                                    <div className="col-span-3 space-y-1.5 px-1">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Qty</label>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                step="0.0001"
                                                                value={item.quantity_required}
                                                                onChange={(e) => updateRecipeItem(idx, 'quantity_required', e.target.value)}
                                                                className={cn(
                                                                    "h-10 text-xs font-bold pl-3 pr-8 bg-background rounded-lg",
                                                                    qtyError ? "border-destructive ring-destructive/10" : "border-input"
                                                                )}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground uppercase">
                                                                {selectedIng?.unit || '-'}
                                                            </span>
                                                        </div>
                                                        {qtyError && <p className="text-[10px] text-destructive font-bold ml-1">{qtyError as string}</p>}
                                                    </div>
                                                    <div className="col-span-2 flex justify-end pb-1 text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeRecipeItem(idx)}
                                                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-lg"
                                                        >
                                                            <FiTrash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    {errors.recipe && <p className="text-xs text-destructive font-bold mt-2 px-2">⚠ {errors.recipe}</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t bg-muted/10 mt-auto flex-shrink-0">
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-xl h-12 font-bold text-muted-foreground">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl h-12 flex-1 bg-primary shadow-lg shadow-primary/20 font-bold active:scale-95 transition-all"
                            >
                                {processing ? 'Processing...' : 'Confirm Registration'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Product Modal (Synced for scalability) */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                    <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                        <DialogTitle className="text-2xl font-black italic tracking-tighter">REVISE PRODUCT.</DialogTitle>
                        <DialogDescription className="font-medium">Modify existing product specifications and ingredients.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Product Name</label>
                                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} className="h-12 rounded-xl bg-muted/30" />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Identifier (SKU)</label>
                                    <Input value={data.sku} onChange={(e) => setData('sku', e.target.value)} className="h-12 rounded-xl bg-muted/30" />
                                    {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Category</label>
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="w-full h-12 px-3 rounded-xl border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 ring-primary/20 transition-all appearance-none"
                                    >
                                        <option value="">Select Category</option>
                                        {categories
                                            .filter((c: any) => !data.branch_id || String(c.branch_id) === String(data.branch_id))
                                            .map((c: Category) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                    </select>
                                </div>
                                {isAdmin && (
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Owner Branch</label>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase -mt-0.5 mb-1 ml-1 leading-tight">Determines the core ownership and dictates which ingredients can be used.</p>
                                        <select
                                            value={data.branch_id}
                                            onChange={(e) => setData(d => ({ ...d, branch_id: e.target.value, recipe: [] }))}
                                            className="w-full h-12 px-3 rounded-xl border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none font-bold"
                                        >
                                            <option value="">-- Select Owner Branch --</option>
                                            {branches?.map((b: any) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                        {errors.branch_id && <p className="text-xs text-destructive">{errors.branch_id}</p>}
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Cost (PHP)</label>
                                    <Input type="number" step="0.01" value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} className="h-12 rounded-xl bg-muted/30 font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Selling (PHP)</label>
                                    <Input type="number" step="0.01" value={data.selling_price} onChange={(e) => setData('selling_price', e.target.value)} className="h-12 rounded-xl bg-muted/30 font-bold text-emerald-600" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Unit of Measure</label>
                                    <select
                                        value={data.unit}
                                        onChange={(e) => setData('unit', e.target.value)}
                                        className="w-full h-12 px-3 rounded-xl border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none font-bold"
                                    >
                                        <option value="">Select Unit</option>
                                        {allowedUnits?.map((u: string) => (
                                            <option key={u} value={u}>{u.toUpperCase()} - {u === 'pcs' ? 'Pieces' : u === 'g' ? 'Grams' : u === 'ml' ? 'Milliliters' : u === 'kg' ? 'Kilograms' : u === 'L' ? 'Liters' : u}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Branch Visibility */}
                                <div className="col-span-2 space-y-2 border-t pt-4">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Branch Visibility</label>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium ml-1">Select branches that can see this product (Default: All)</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {branches?.map((branch: any) => (
                                            <div
                                                key={branch.id}
                                                onClick={() => toggleBranch(branch.id.toString())}
                                                className={cn(
                                                    "cursor-pointer px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2",
                                                    data.branch_ids.includes(branch.id.toString())
                                                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                                                        : "bg-muted/30 border-muted text-muted-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "size-2 rounded-full",
                                                    data.branch_ids.includes(branch.id.toString()) ? "bg-primary" : "bg-muted-foreground/30"
                                                )} />
                                                {branch.name}
                                            </div>
                                        ))}
                                        {data.branch_ids.length === 0 && (
                                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                VISIBLE TO ALL BRANCHES
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Product Image Upload */}
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Product Image <span className="font-normal">(Optional, max 2MB)</span></label>
                                    {imagePreview && (
                                        <div className="relative w-full h-40 rounded-xl overflow-hidden border bg-muted/30">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="absolute top-2 right-2 bg-destructive text-white rounded-full size-6 flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                                            >
                                                ✕
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
                                        className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-all border border-input rounded-xl p-2 bg-muted/30"
                                    />
                                </div>

                                <div className="col-span-2 space-y-1.5 pt-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Update Description (Optional)</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
                                        placeholder="Enter product details for customers..."
                                    />
                                    {errors.description && <p className="text-xs text-destructive mt-1 ml-1 font-bold">{errors.description}</p>}
                                </div>

                                <div className="col-span-2 border-t pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <label className="text-sm font-bold">Recipe Composition</label>
                                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Update required materials</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} className="h-8 text-xs gap-1 shadow-sm hover:bg-primary/5 rounded-lg">
                                            <FiPlus className="size-3 text-primary" /> Add Ingredient
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {data.recipe.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-destructive/5 border border-dashed border-destructive/20">
                                                <FiSlash className="size-8 text-destructive/30 mb-2" />
                                                <p className="text-sm font-bold text-destructive italic tracking-tight">
                                                    NO INGREDIENTS REGISTERED.
                                                </p>
                                            </div>
                                        )}
                                        {/* Added Helper Text when no branch selected */}
                                        {!data.branch_id && (
                                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-2 mt-2">
                                                <p className="text-xs text-amber-600 font-bold">Please select an Owner Branch.</p>
                                                <p className="text-[10px] text-amber-600/80">Only ingredients from the selected branch are available for recipes.</p>
                                            </div>
                                        )}
                                        {data.recipe.map((item, idx) => {
                                            const selectedIng = (usePage().props as any).ingredients.find((ing: Ingredient) => ing.id.toString() === item.ingredient_id);
                                            return (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    key={idx}
                                                    className="grid grid-cols-12 gap-2 items-end bg-background p-3 rounded-xl border border-muted"
                                                >
                                                    <div className="col-span-7 space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Select Material</label>
                                                        <select
                                                            required
                                                            disabled={!data.branch_id}
                                                            value={item.ingredient_id}
                                                            onChange={(e) => updateRecipeItem(idx, 'ingredient_id', e.target.value)}
                                                            className={cn(
                                                                "w-full h-10 px-3 rounded-lg border border-input bg-muted/30 text-xs focus:bg-background focus:outline-none focus:ring-1 ring-primary/20 transition-all appearance-none",
                                                                !data.branch_id ? "opacity-50 cursor-not-allowed bg-muted" : ""
                                                            )}
                                                        >
                                                            <option value="">-- Choose Ingredient --</option>
                                                            {(usePage().props as any).ingredients
                                                                .filter((ing: any) => !data.branch_id || String(ing.branch_id) === String(data.branch_id))
                                                                .map((ing: Ingredient) => {
                                                                    const isTaken = data.recipe.some((r, rIdx) => r.ingredient_id === String(ing.id) && rIdx !== idx);
                                                                    return (
                                                                        <option key={ing.id} value={ing.id} disabled={isTaken}>
                                                                            {ing.name} {isTaken ? '(Already added)' : `(${ing.unit})`}
                                                                        </option>
                                                                    );
                                                                })}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-3 space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Qty</label>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                step="0.0001"
                                                                required
                                                                value={item.quantity_required}
                                                                onChange={(e) => updateRecipeItem(idx, 'quantity_required', e.target.value)}
                                                                className="h-10 text-xs font-bold bg-muted/30 focus:bg-background rounded-lg border-input"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground uppercase">
                                                                {selectedIng?.unit || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 flex justify-end pb-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeRecipeItem(idx)}
                                                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-lg"
                                                        >
                                                            <FiTrash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    {errors.recipe && <p className="text-xs text-destructive font-bold mt-2 px-2">⚠ {errors.recipe}</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t bg-muted/10 mt-auto flex-shrink-0">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="rounded-xl h-12 font-bold text-muted-foreground">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl h-12 flex-1 bg-primary font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                {processing ? 'Updating...' : 'Push Updates'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <FiTrash2 className="size-5" /> Delete Product
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-base">
                            Are you sure you want to delete <span className="font-bold text-foreground">"{selectedProduct?.name}"</span>?
                            This will also remove all associated inventory logs.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-6">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>No, keep it</Button>
                        <Button variant="destructive" onClick={handleDeleteSubmit} disabled={processing}>Yes, delete product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout >
    );
}
