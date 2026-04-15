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
import { FiZap } from 'react-icons/fi';
import { StockInModal } from '@/components/stock-in-modal';
import { ValidationErrorModal } from '@/components/validation-error-modal';
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
import { 
    normalizeUnit, 
    convertToBaseQuantityWithIngredient 
} from '@/lib/unit-converter';

type Category = {
    id: number;
    name: string;
};

type Ingredient = {
    id: number;
    name: string;
    unit: string;
    avg_weight_per_piece: number;
    cost_per_base_unit?: number;
    stocks?: { branch_id: number; stock: number; cost_per_unit: number }[];
};

type RecipeItem = {
    ingredient_id: string;
    ingredient?: Ingredient;
    quantity_required: string;
    unit: string;
};

// Using database-driven units instead of static constants

type Product = {
    id: number;
    name: string;
    sku: string;
    category_id: number;
    category: Category;
    stock: number;
    limiting_ingredient: string | null;
    is_low_stock: boolean;
    cost_price: number;
    selling_price: number;
    status: string;
    image_url: string | null;
    ingredients: (Ingredient & { pivot: { quantity_required: string } })[];
    branch: { id: number; name: string };
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
    const { products: rawProducts, categories, ingredients: rawIngredients, summary, filters, branches, currentBranchId, isAdmin, allowedUnits } = usePage().props as any;
    const products: Product[] = rawProducts || [];
    const ingredients: Ingredient[] = Array.isArray(rawIngredients) ? rawIngredients : [];
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

    // --- Real-time Sync Logic (Now handled globally by useRealTime hook in AppLayout) ---
    useEffect(() => {
        const handleFocus = () => {
            router.reload({ preserveScroll: true, preserveState: true } as any);
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);


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
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorInfo, setErrorInfo] = useState({ title: '', message: '' });

    const { data, setData, post, put, delete: destroy, processing, errors, reset, transform } = useForm({
        name: '',
        sku: '',
        category_id: '',
        cost_price: '',
        selling_price: '',
        branch_id: currentBranchId ? String(currentBranchId) : '',
        branch_option: 'single', // 'single' or 'both'
        recipe: [] as RecipeItem[],
        unit: 'pcs',
        description: '',
        image: null as File | null,
    });

    const [ingredientSearch, setIngredientSearch] = useState('');


    const getAvailableUnits = (ing?: any) => {
        if (!ing || !ing.unit) return [];
        const base = ing.unit.toLowerCase();
        let options = [base];
        if (base === 'g' || base === 'grams') options.push('kg');
        if (base === 'ml') options.push('l', 'liters');
        
        if (ing.avg_weight_per_piece && Number(ing.avg_weight_per_piece) > 0) {
            options.push('pcs', 'half', 'cloves', 'whole');
        } else if (base === 'pcs') {
            options.push('half');
        }
        
        return Array.from(new Set(options));
    };

    const calculateComputedCost = () => {
        let total = 0;
        data.recipe.forEach(item => {
            const ing = ingredients.find((i: any) => i.id.toString() === item.ingredient_id);
            if (ing) {
                const branchId = data.branch_option === 'both' ? null : data.branch_id;
                const stockRow = ing.stocks?.find((s: any) => branchId ? String(s.branch_id) === String(branchId) : true);
                
                // Priority: Branch procurement cost -> Global base cost -> 0
                const cpu = (stockRow && Number(stockRow.cost_per_unit) > 0) 
                    ? Number(stockRow.cost_per_unit) 
                    : Number(ing.cost_per_base_unit || 0);

                const u = (item.unit || ing.unit).toLowerCase().trim();
                const qty = Number(item.quantity_required) || 0;
                
                const baseQty = convertToBaseQuantityWithIngredient(
                    qty, 
                    u, 
                    ing.unit, 
                    Number(ing.avg_weight_per_piece || 0)
                );
                
                total += baseQty * cpu;
            }
        });
        return total;
    };

    // Helper to truncate long names safely for UI
    const formatName = (name: string, limit: number = 25) => {
        return name.length > limit ? name.substring(0, limit) + '...' : name;
    };

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
        setIngredientSearch('');
        setImageFile(null);
        setImagePreview(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setSelectedProduct(product);
        setIngredientSearch('');
        setData({
            name: product.name,
            sku: product.sku || '',
            category_id: product.category_id.toString(),
            cost_price: product.cost_price.toString(),
            selling_price: product.selling_price.toString(),
            branch_id: product.branch_id?.toString() || '',
            branch_option: 'single',
            recipe: product.ingredients.map((ing: any) => ({
                ingredient_id: ing.id.toString(),
                quantity_required: ing.pivot.quantity_required.toString(),
                unit: ing.pivot.unit || ing.unit
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
                setSuccessMessage({ title: 'Product Added!', message: 'The product has been registered successfully.' });
                setIsSuccessModalOpen(true);
                setImageFile(null);
                setImagePreview(null);
            },
            onError: (err) => {
                const firstError = Object.values(err)[0] as string;
                setErrorInfo({ 
                    title: 'Material Conflict', 
                    message: firstError || 'Please check your recipe and branch availability.' 
                });
                setIsErrorModalOpen(true);
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
                    const firstError = Object.values(err)[0] as string;
                    setErrorInfo({ 
                        title: 'Update Rejected', 
                        message: firstError || 'Ingredient validation failed for this branch.' 
                    });
                    setIsErrorModalOpen(true);
                }
            });
        }
    };

    const handleDeleteSubmit = () => {
        if (selectedProduct) {
            destroy(`/products/${selectedProduct.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
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
        setData('recipe', [...data.recipe, { ingredient_id: '', quantity_required: '1', unit: 'pcs' }]);
    };

    const removeRecipeItem = (index: number) => {
        const newRecipe = [...data.recipe];
        newRecipe.splice(index, 1);
        setData('recipe', newRecipe);
    };

    const updateRecipeItem = (index: number, field: string, value: string) => {
        setData(d => {
            const newRecipe = [...d.recipe];
            newRecipe[index] = { ...newRecipe[index], [field]: value };
            return { ...d, recipe: newRecipe };
        });
    };

    const handleBranchOptionChange = (val: string) => {
        setData(d => ({
            ...d,
            branch_option: val,
            branch_id: val === 'both' ? d.branch_id : d.branch_id
        }));
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }]}>
            <Head title="Products" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background dark:bg-zinc-950">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">Products</h1>
                        <p className="text-sm text-muted-foreground dark:text-zinc-400">Manage your product inventory and pricing.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {isAdmin && (
                            <Select
                                value={currentBranchId ? String(currentBranchId) : 'all'}
                                onValueChange={handleBranchFilter}
                            >
                                <SelectTrigger className="w-full sm:w-48 h-10 bg-muted/50 dark:bg-zinc-800/50 dark:text-zinc-300">
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
                                className="pl-9 h-10 bg-muted/50 dark:bg-zinc-800/50 focus:bg-background dark:focus:bg-zinc-900 transition-colors border-none ring-1 ring-border dark:ring-zinc-700"
                            />
                        </div>
                        <Select
                            value={String(filterCategory)}
                            onValueChange={(val) => setFilterCategory(val === 'all' ? '' : val)}
                        >
                            <SelectTrigger className="w-full sm:w-48 h-10 bg-muted/50 dark:bg-zinc-800/50 dark:text-zinc-300">
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
                        <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30 shadow-sm group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400">Total Products</CardTitle>
                                <FiPackage className="size-4 text-primary dark:text-primary-foreground group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-foreground dark:text-white">{summary.total_products}</div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Unique SKUs</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30 shadow-sm group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400">Low Stock Items</CardTitle>
                                <FiAlertTriangle className="size-4 text-amber-500 group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-amber-600 dark:text-amber-500">{summary.low_stock}</div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Limited by Ingredients</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20 dark:border-destructive/30 shadow-sm group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400">Out of Stock</CardTitle>
                                <FiSlash className="size-4 text-destructive group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-destructive dark:text-red-500">{summary.out_of_stock}</div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Ingredients Exhausted</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table Card */}
                    <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-none ring-1 ring-black/5 dark:ring-white/5 bg-card dark:bg-zinc-900/50 flex-shrink min-h-0">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 shadow-sm">
                                    <tr className="bg-muted/30 dark:bg-zinc-800/50">
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest text-[10px]">Product Information</th>
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest text-[10px] hidden lg:table-cell">Category</th>
                                        {isAdmin && !currentBranchId && <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest text-[10px] hidden lg:table-cell">Branch</th>}
                                        <th className="h-12 px-6 text-center align-middle font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest text-[10px]">Available to Sell</th>
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest text-[10px] hidden sm:table-cell">Pricing</th>
                                        <th className="h-12 px-6 text-center align-middle font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest text-[10px]">Stock Status</th>
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest text-[10px] hidden md:table-cell">Created</th>
                                        <th className="h-12 px-6 text-right align-middle font-bold text-muted-foreground dark:text-zinc-500 uppercase tracking-widest text-[10px]">Actions</th>
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
                                                    className="border-b dark:border-zinc-800 transition-colors hover:bg-muted/40 dark:hover:bg-zinc-800/30 group text-foreground dark:text-zinc-300"
                                                >
                                                    <td className="p-4 align-middle">
                                                        <div className="flex flex-col max-w-[250px]">
                                                            <span className="font-semibold truncate text-foreground dark:text-white" title={product.name}>{product.name}</span>
                                                            <span className="text-xs text-muted-foreground dark:text-zinc-500 font-mono">{product.sku || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle hidden lg:table-cell">
                                                        <Badge variant="outline" className="bg-primary/5 dark:bg-primary/10 border-primary/10 dark:border-primary/20 text-foreground dark:text-zinc-300">
                                                            {product.category?.name || 'Uncategorized'}
                                                        </Badge>
                                                    </td>
                                                    {isAdmin && !currentBranchId && (
                                                        <td className="p-4 align-middle hidden lg:table-cell">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="size-1.5 rounded-full bg-primary/40" />
                                                                <span className="text-[10px] font-bold uppercase text-muted-foreground">{product.branch?.name || 'Global'}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="p-4 align-middle text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={cn(
                                                                "font-mono font-black text-lg tracking-tighter leading-none",
                                                                product.stock <= 0 ? "text-destructive" : product.stock <= 5 ? "text-amber-600" : "text-primary dark:text-primary-foreground"
                                                            )}>
                                                                {product.stock}
                                                            </span>
                                                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider mt-0.5">Servings Available</span>
                                                            
                                                            {product.limiting_ingredient && product.stock <= 10 && (
                                                                <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                                                    <FiAlertTriangle className="size-2.5 text-amber-600" />
                                                                    <span className="text-[9px] font-black uppercase text-amber-700/80 tracking-tighter italic">Limited by: {product.limiting_ingredient}</span>
                                                                </div>
                                                            )}
                                                        </div>
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
                                                                    className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
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
                        <div className="p-4 bg-muted/5 dark:bg-zinc-800/10 border-t dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Show</span>
                                    <Select value={String(itemsPerPage)} onValueChange={(val) => {
                                        setItemsPerPage(Number(val));
                                        setCurrentPage(1);
                                    }}>
                                    <SelectTrigger className="w-[70px] h-8 rounded-lg border-none bg-background dark:bg-zinc-900 shadow-sm font-bold text-xs ring-1 ring-muted dark:ring-zinc-800">
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

            <ValidationErrorModal
                open={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                title={errorInfo.title}
                message={errorInfo.message}
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
                        {Object.keys(errors).length > 0 && (
                            <div className="mx-6 mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col gap-1">
                                <p className="text-sm font-bold text-destructive">Please fix the following validation errors:</p>
                                <ul className="list-disc pl-5 text-xs text-destructive/90">
                                    {Object.entries(errors).map(([key, error]) => (
                                        <li key={key}>{key}: {error as string}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Product Name <span className="text-destructive">*</span></label>
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            data.name.length > 70 ? "text-amber-500" : "text-muted-foreground"
                                        )}>
                                            {data.name.length}/80
                                        </span>
                                    </div>
                                    <Input 
                                        required
                                        maxLength={80}
                                        value={data.name} 
                                        onChange={(e) => {
                                            const cleaned = e.target.value.replace(/[^A-Za-z0-9\s\-]/g, '');
                                            setData('name', cleaned);
                                        }} 
                                        placeholder="e.g. Chicken Burger Deluxe" 
                                        className={cn(
                                            "h-10 rounded-lg",
                                            errors.name && "border-destructive focus-visible:ring-destructive"
                                        )} 
                                    />
                                    {errors.name && <p className="text-[10px] text-destructive font-bold">{errors.name}</p>}
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
                                    <div className="space-y-4 col-span-2 border p-4 rounded-xl bg-primary/5 border-primary/10">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold flex items-center gap-2">
                                                <div className="size-2 bg-primary rounded-full" />
                                                Branch Configuration
                                            </label>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase leading-tight">
                                                Choose "Both Branches" to automatically create this product in all locations.
                                            </p>
                                            
                                            <div className="flex gap-4 mt-3">
                                                {['single', 'both'].map((opt) => (
                                                    <div 
                                                        key={opt}
                                                        onClick={() => handleBranchOptionChange(opt)}
                                                        className={cn(
                                                            "flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all text-center font-bold text-xs uppercase",
                                                            data.branch_option === opt 
                                                                ? "bg-primary text-white border-primary shadow-md scale-[1.02]" 
                                                                : "bg-background border-muted text-muted-foreground hover:border-primary/30"
                                                        )}
                                                    >
                                                        {opt === 'single' ? 'Specific Branch' : 'Both Branches'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {data.branch_option === 'single' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Owner Branch</label>
                                                <select
                                                    value={data.branch_id}
                                                    onChange={(e) => setData(d => ({ ...d, branch_id: e.target.value }))}
                                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-bold shadow-sm"
                                                >
                                                    <option value="">-- Choose Branch --</option>
                                                    {branches?.map((b: any) => (
                                                        <option key={b.id} value={b.id}>{b.name}</option>
                                                    ))}
                                                </select>
                                                {errors.branch_id && <p className="text-xs text-destructive font-bold">{errors.branch_id}</p>}
                                            </div>
                                        )}
                                        {data.branch_option === 'both' && (
                                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase italic">System will auto-duplicate this product for:</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {branches?.map((b: any) => (
                                                        <Badge key={b.id} variant="outline" className="bg-emerald-500/20 text-emerald-700 border-none px-2 py-0.5 text-[9px] font-black">
                                                            {b.name.toUpperCase()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* ── LIVE RECIPE COST PANEL ── */}
                                <div className="space-y-3 mt-4">
                                    <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl shadow-inner space-y-3">
                                        <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                                            <FiZap className="size-4 text-emerald-500" />
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">Live Recipe Cost Panel</h4>
                                        </div>
                                        
                                        {data.recipe.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-border/30 rounded-xl bg-background/40">
                                                <FiPackage className="size-6 text-muted-foreground/30 mb-2" />
                                                <p className="text-[10px] italic font-bold text-muted-foreground/60 text-center">Add ingredients to build your recipe and calculate costs.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {data.recipe.map((rItem, idx) => {
                                                        const ing = ingredients.find((i: any) => i.id.toString() === rItem.ingredient_id);
                                                        if (!ing) return null;
                                                        
                                                        const qty = Number(rItem.quantity_required) || 0;
                                                        const branchId = data.branch_option === 'both' ? null : data.branch_id;
                                                        const stockRow = ing.stocks?.find((s: any) => branchId ? String(s.branch_id) === String(branchId) : true);
                                                        const cpu = stockRow && Number(stockRow.cost_per_unit) > 0 ? Number(stockRow.cost_per_unit) : Number(ing.cost_per_base_unit || 0);

                                                        const u = (rItem.unit || ing.unit).toLowerCase().trim();
                                                        const baseQty = convertToBaseQuantityWithIngredient(
                                                            qty, 
                                                            u, 
                                                            ing.unit, 
                                                            Number(ing.avg_weight_per_piece || 0)
                                                        );
                                                        const itemTotalCost = baseQty * cpu;

                                                        const pieceUnits = ['pcs', 'pc', 'pieces', 'piece', 'cloves', 'clove', 'half', 'whole'];
                                                        const isPieceUsed = pieceUnits.includes(u);
                                                        const showConversion = isPieceUsed && ing.unit !== u && ing.avg_weight_per_piece > 0;

                                                        return (
                                                            <div key={idx} className="group relative bg-background/60 hover:bg-background border border-border/40 hover:border-emerald-500/30 p-3 rounded-xl transition-all shadow-sm">
                                                                <div className="flex justify-between items-start gap-3">
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[11px] font-black text-foreground uppercase tracking-tight">{ing.name}</span>
                                                                            <Badge variant="outline" className="text-[8px] font-black uppercase py-0 px-1 border-primary/20 text-primary bg-primary/5">{qty} {u}</Badge>
                                                                        </div>
                                                                        {showConversion && (
                                                                            <span className="text-[9px] text-muted-foreground font-bold italic">
                                                                                ≈ {baseQty.toFixed(1)}{ing.unit} at ₱{cpu.toFixed(2)}/{ing.unit}
                                                                            </span>
                                                                        )}
                                                                        {!showConversion && (
                                                                             <span className="text-[9px] text-muted-foreground font-bold italic">
                                                                                ₱{cpu.toFixed(2)} / {ing.unit}
                                                                             </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[11px] font-black tabular-nums text-emerald-600">₱{itemTotalCost.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="pt-4 border-t-2 border-dashed border-border/40 space-y-3">
                                                    <div className="flex justify-between items-center px-1">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Production Cost</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground/50">Base ingredients only</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block text-2xl font-black text-emerald-600 tabular-nums">₱{calculateComputedCost().toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Suggested Margins */}
                                    {calculateComputedCost() > 0 && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex flex-col gap-2 shadow-sm">
                                            <p className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest flex items-center gap-1.5 justify-center"><FiZap className="size-3"/> Suggested Selling Price</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(() => {
                                                    const baseCost = calculateComputedCost();
                                                    const lowMargin = baseCost / (1 - 0.30); // 30% Margin
                                                    const stdMargin = baseCost / (1 - 0.50); // 50% Margin
                                                    const premMargin = baseCost / (1 - 0.80); // 80% Margin
                                                    return (
                                                        <>
                                                            <div className="bg-background rounded-lg p-2 text-center border border-amber-500/20 shadow-sm cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => setData('selling_price', lowMargin.toFixed(2))}>
                                                                <span className="block text-[8px] uppercase tracking-widest font-black text-muted-foreground mb-0.5">30% Margin</span>
                                                                <span className="text-xs font-black tabular-nums">₱{lowMargin.toFixed(0)}</span>
                                                            </div>
                                                            <div className="bg-background rounded-lg p-2 text-center border border-amber-500/40 shadow-md cursor-pointer hover:border-amber-500/70 transition-colors relative overflow-hidden group" onClick={() => setData('selling_price', stdMargin.toFixed(2))}>
                                                                <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500 w-full"></div>
                                                                <span className="block text-[8px] uppercase tracking-widest font-black text-amber-600 mb-0.5 mt-1">50% Margin</span>
                                                                <span className="text-xs font-black text-amber-600 tabular-nums">₱{stdMargin.toFixed(0)}</span>
                                                            </div>
                                                            <div className="bg-background rounded-lg p-2 text-center border border-emerald-500/20 shadow-sm cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => setData('selling_price', premMargin.toFixed(2))}>
                                                                <span className="block text-[8px] uppercase tracking-widest font-black text-emerald-600 mb-0.5">80% Margin</span>
                                                                <span className="text-xs font-black text-emerald-600 tabular-nums">₱{premMargin.toFixed(0)}</span>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <p className="text-[8px] text-center font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">Click a suggestion to apply</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium uppercase text-[10px] font-bold text-muted-foreground">Selling Price (₱) <span className="text-destructive">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-emerald-600">₱</span>
                                        <Input 
                                            type="number" 
                                            step="0.01" 
                                            min="0"
                                            max="999999.99"
                                            value={data.selling_price} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (Number(val) < 0) return;
                                                setData('selling_price', val);
                                            }} 
                                            placeholder="0.00" 
                                            className={cn("h-10 rounded-lg pl-7 border-emerald-500/20 focus-visible:ring-emerald-500", errors.selling_price && "border-destructive")} 
                                        />
                                    </div>
                                    {errors.selling_price && <p className="text-[10px] text-destructive font-bold">{errors.selling_price}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium uppercase text-[10px] font-bold text-muted-foreground">Package Type (Sold As)</label>
                                    <select
                                        value={data.unit}
                                        onChange={(e) => setData('unit', e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none font-bold"
                                    >
                                        <option value="">-- Select Label --</option>
                                        {allowedUnits?.map((u: string) => (
                                            <option key={u} value={u}>{u.toUpperCase()} - {u === 'pcs' ? 'Pieces' : u === 'g' ? 'Grams' : u === 'ml' ? 'Milliliters' : u === 'kg' ? 'Kilograms' : u === 'L' ? 'Liters' : u}</option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-muted-foreground italic font-bold">This is just a label for your POS/Menu (e.g. 1 Pc, 1 Serving).</p>
                                    {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
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
                                    {errors.image && <p className="text-[10px] text-destructive font-bold">{errors.image}</p>}
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
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-48 hidden sm:block">
                                                <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                                <Input 
                                                    placeholder="Search ingredients..." 
                                                    value={ingredientSearch}
                                                    onChange={e => setIngredientSearch(e.target.value)}
                                                    className="h-8 pl-7 text-[10px] bg-muted/30"
                                                />
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
                                        {!data.branch_id && data.branch_option === 'single' && (
                                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-2">
                                                <p className="text-xs text-amber-600 font-bold">Please select an Owner Branch first.</p>
                                                <p className="text-[10px] text-amber-600/80 uppercase">Ingredients must be available in the chosen branch inventory.</p>
                                            </div>
                                        )}
                                        {data.branch_option === 'both' && (
                                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-2">
                                                <div className="flex items-center gap-2 text-blue-600 mb-1">
                                                    <FiPlus className="size-3" />
                                                    <p className="text-xs font-bold uppercase italic">Auto-Sync Mode Active</p>
                                                </div>
                                                <p className="text-[10px] text-blue-600/80 leading-relaxed uppercase">The system will verify that these ingredients exist in ALL branches. Stock levels shown are baseline estimates from the primary location.</p>
                                            </div>
                                        )}
                                        {data.recipe.map((item, idx) => {
                                            const filteredIngredients = ingredients.filter((ing: any) => {
                                                const matchesSearch = ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
                                                const isCurrentSelection = String(ing.id) === String(item.ingredient_id);
                                                
                                                if (isCurrentSelection) return true;
                                                if (!matchesSearch) return false;

                                                if (data.branch_option === 'both') {
                                                    return ing.stocks?.length > 0;
                                                }
                                                if (!data.branch_id) return true;
                                                return ing.stocks?.some((s: any) => Number(s.branch_id) === Number(data.branch_id));
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
                                                    <div className="col-span-12 sm:col-span-5 space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Select Material</label>
                                                        <select
                                                            disabled={!data.branch_id && data.branch_option === 'single'}
                                                            value={item.ingredient_id}
                                                            onChange={(e) => {
                                                                updateRecipeItem(idx, 'ingredient_id', e.target.value);
                                                                // auto-reset unit
                                                                const sIng = filteredIngredients.find((i: Ingredient) => i.id.toString() === e.target.value);
                                                                if(sIng) updateRecipeItem(idx, 'unit', sIng.unit);
                                                            }}
                                                            className={cn(
                                                                "w-full h-10 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 transition-all appearance-none",
                                                                ingError ? "border-destructive ring-destructive/10 text-destructive" : "border-input ring-primary/20",
                                                                !data.branch_id && data.branch_option === 'single' ? "opacity-50 cursor-not-allowed bg-muted" : ""
                                                            )}
                                                        >
                                                            <option value="">-- Choose Ingredient --</option>
                                                            {filteredIngredients.length === 0 && ingredientSearch && (
                                                                <option disabled>No matches found for "{ingredientSearch}"</option>
                                                            )}
                                                            {filteredIngredients.map((ing: any) => {
                                                                const isTaken = data.recipe.some((r, rIdx) => r.ingredient_id === String(ing.id) && rIdx !== idx);
                                                                const stock = data.branch_option === 'both' 
                                                                    ? (ing.stocks?.[0]?.stock || 0) 
                                                                    : (ing.stocks?.find((s: any) => Number(s.branch_id) === Number(data.branch_id))?.stock || 0);
                                                                
                                                                return (
                                                                    <option 
                                                                        key={ing.id} 
                                                                        value={ing.id} 
                                                                        disabled={isTaken}
                                                                        title={ing.name}
                                                                        className={cn(isTaken && "text-muted-foreground italic")}
                                                                    >
                                                                        {formatName(ing.name)} {isTaken ? ' (Added)' : `(${ing.unit})`} — Stock: {stock}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                        {ingError && <p className="text-[10px] text-destructive font-bold ml-1">{ingError as string}</p>}
                                                        {selectedIng && selectedIng.avg_weight_per_piece > 0 && (
                                                            <p className="text-[9px] text-muted-foreground italic ml-1 mt-1 font-medium">1 pc/clove ≈ {Number(selectedIng.avg_weight_per_piece)} {selectedIng.unit}</p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="col-span-3 space-y-1.5 px-1">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Qty</label>
                                                        <Input
                                                            type="number"
                                                            step="0.0001"
                                                            value={item.quantity_required}
                                                            onChange={(e) => updateRecipeItem(idx, 'quantity_required', e.target.value)}
                                                            className={cn(
                                                                "h-10 text-xs font-bold px-3 bg-background rounded-lg",
                                                                qtyError ? "border-destructive ring-destructive/10" : "border-input"
                                                            )}
                                                        />
                                                        {qtyError && <p className="text-[10px] text-destructive font-bold ml-1">{qtyError as string}</p>}
                                                    </div>

                                                    <div className="col-span-3 space-y-1.5 px-1">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Unit</label>
                                                        <select
                                                            disabled={!selectedIng}
                                                            value={item.unit || selectedIng?.unit || ''}
                                                            onChange={(e) => updateRecipeItem(idx, 'unit', e.target.value)}
                                                            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 ring-primary/20 transition-all appearance-none uppercase font-bold"
                                                        >
                                                            {getAvailableUnits(selectedIng).map(u => (
                                                                <option key={u} value={u}>{u}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="col-span-1 flex justify-end pb-1 pr-1 items-end h-full mt-6 text-right">
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
                                disabled={processing || !data.name || !data.category_id || data.recipe.length === 0 || !!errors.recipe || !!errors.name}
                                className="rounded-xl h-12 flex-1 bg-primary shadow-lg shadow-primary/20 font-bold active:scale-95 transition-all gap-2"
                            >
                                {processing ? (
                                    <>
                                        <FiRefreshCw className="size-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : 'Confirm Registration'}
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
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Product Name</label>
                                        <span className="text-[10px] font-bold text-muted-foreground mr-1">{data.name.length}/80</span>
                                    </div>
                                    <Input 
                                        maxLength={80}
                                        value={data.name} 
                                        onChange={(e) => {
                                            const cleaned = e.target.value.replace(/[^A-Za-z0-9\s\-]/g, '');
                                            setData('name', cleaned);
                                        }} 
                                        className={cn("h-12 rounded-xl bg-muted/30", errors.name && "border-destructive")} 
                                    />
                                    {errors.name && <p className="text-[10px] text-destructive font-bold ml-1">{errors.name}</p>}
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
                                    {errors.category_id && <p className="text-[10px] text-destructive font-bold ml-1">{errors.category_id}</p>}
                                </div>
                                {isAdmin && (
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Current Owner Branch</label>
                                        <div className="h-12 w-full flex items-center px-4 rounded-xl bg-primary/5 border border-primary/10 text-primary font-bold text-sm">
                                            <div className="size-2 bg-primary rounded-full mr-2" />
                                            {branches?.find((b: any) => String(b.id) === String(data.branch_id))?.name || 'N/A'}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic ml-1 mt-1">Note: Branch ownership cannot be changed after creation.</p>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Computed Cost (₱)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₱</span>
                                        <Input 
                                            disabled
                                            value={calculateComputedCost().toFixed(2)}
                                            className="h-12 rounded-xl bg-muted/50 font-bold pl-7 cursor-not-allowed text-muted-foreground" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Selling (₱)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₱</span>
                                        <Input 
                                            type="number" 
                                            step="0.01" 
                                            min="0"
                                            max="999999.99"
                                            value={data.selling_price} 
                                            onChange={(e) => {
                                                if (Number(e.target.value) < 0) return;
                                                setData('selling_price', e.target.value);
                                            }} 
                                            className="h-12 rounded-xl bg-muted/30 font-bold text-emerald-600 pl-7" 
                                        />
                                    </div>
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
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-48 hidden sm:block">
                                                <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                                <Input 
                                                    placeholder="Search ingredients..." 
                                                    value={ingredientSearch}
                                                    onChange={e => setIngredientSearch(e.target.value)}
                                                    className="h-8 pl-7 text-[10px] bg-muted/30"
                                                />
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} className="h-8 text-xs gap-1 shadow-sm hover:bg-primary/5 rounded-lg">
                                                <FiPlus className="size-3 text-primary" /> Add Ingredient
                                            </Button>
                                        </div>
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
                                        {!data.branch_id && data.branch_option !== 'both' && (
                                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-2 mt-2">
                                                <p className="text-xs text-amber-600 font-bold">Please select an Owner Branch.</p>
                                                <p className="text-[10px] text-amber-600/80">Only ingredients from the selected branch are available for recipes.</p>
                                            </div>
                                        )}
                                        {data.recipe.map((item, idx) => {
                                            const selectedIng = ingredients.find((ing: Ingredient) => ing.id.toString() === item.ingredient_id);
                                            return (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    key={idx}
                                                    className="grid grid-cols-12 gap-2 items-start bg-background p-3 rounded-xl border border-muted"
                                                >
                                                    <div className="col-span-12 sm:col-span-5 space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Select Material</label>
                                                        <select
                                                            required
                                                            value={item.ingredient_id}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const sIng = ingredients.find((i: Ingredient) => String(i.id) === val);
                                                                    
                                                                    // Update both ID and default unit in a single state update for stability
                                                                    setData(prev => {
                                                                        const newRecipe = [...prev.recipe];
                                                                        newRecipe[idx] = { 
                                                                            ...newRecipe[idx], 
                                                                            ingredient_id: val,
                                                                            unit: sIng ? sIng.unit : newRecipe[idx].unit
                                                                        };
                                                                        return { ...prev, recipe: newRecipe };
                                                                    });
                                                                }}
                                                            className={cn(
                                                                "w-full h-10 px-3 rounded-lg border border-input bg-muted/30 text-xs focus:bg-background focus:outline-none focus:ring-1 ring-primary/20 transition-all dropdown-item shadow-sm cursor-pointer ml-0"
                                                            )}
                                                        >
                                                            <option value="">-- Choose Ingredient --</option>
                                                            {ingredientSearch && ingredients.filter((ing: any) => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())).length === 0 && (
                                                                <option disabled>No matches found</option>
                                                            )}
                                                            {ingredients
                                                                .filter((ing: any) => {
                                                                    const matchesSearch = ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
                                                                    const isCurrentSelection = String(ing.id) === String(item.ingredient_id);

                                                                    if (isCurrentSelection) return true;
                                                                    if (!matchesSearch) return false;

                                                                    // Always allow selection in both modes, stock records are for costing/display only
                                                                    return true;
                                                                })
                                                                .map((ing: Ingredient) => {
                                                                    const isTaken = data.recipe.some((r, rIdx) => r.ingredient_id === String(ing.id) && rIdx !== idx);
                                                                    const branchId = data.branch_option === 'both' ? (ing.stocks?.[0]?.branch_id || '') : data.branch_id;
                                                                    const stockLabel = ing.stocks?.find((s: any) => Number(s.branch_id) === Number(branchId))?.stock || 0;
                                                                    return (
                                                                        <option 
                                                                            key={ing.id} 
                                                                            value={String(ing.id)} 
                                                                            disabled={isTaken}
                                                                            title={ing.name}
                                                                        >
                                                                            {formatName(ing.name)} {isTaken ? '(Already added)' : `(${ing.unit})`} — Stock: {stockLabel}
                                                                        </option>
                                                                    );
                                                                })}
                                                        </select>
                                                        {selectedIng && selectedIng.avg_weight_per_piece > 0 && (
                                                            <p className="text-[9px] text-muted-foreground italic ml-1 mt-1 font-medium">1 pc/clove ≈ {Number(selectedIng.avg_weight_per_piece)} {selectedIng.unit}</p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-3 space-y-1.5 px-1">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Qty</label>
                                                        <Input
                                                            type="number"
                                                            step="0.0001"
                                                            required
                                                            value={item.quantity_required}
                                                            onChange={(e) => updateRecipeItem(idx, 'quantity_required', e.target.value)}
                                                            className="h-10 text-xs font-bold bg-muted/30 focus:bg-background rounded-lg border-input px-3"
                                                        />
                                                    </div>

                                                    <div className="col-span-3 space-y-1.5 px-1">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Unit</label>
                                                        <select
                                                            disabled={!selectedIng}
                                                            value={item.unit || selectedIng?.unit || ''}
                                                            onChange={(e) => updateRecipeItem(idx, 'unit', e.target.value)}
                                                            className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-xs focus:outline-none focus:ring-1 ring-primary/20 transition-all appearance-none uppercase font-bold"
                                                        >
                                                            {getAvailableUnits(selectedIng).map(u => (
                                                                <option key={u} value={u}>{u}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="col-span-1 flex justify-end pr-1 items-end h-full pb-1 mt-6">
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
                                disabled={processing || !data.name || !data.category_id || data.recipe.length === 0 || !!errors.recipe || !!errors.name}
                                className="rounded-xl h-12 flex-1 bg-primary font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all gap-2"
                            >
                                {processing ? (
                                    <>
                                        <FiRefreshCw className="size-4 animate-spin" />
                                        Pushing Updates...
                                    </>
                                ) : 'Push Updates'}
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
