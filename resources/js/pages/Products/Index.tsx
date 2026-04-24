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
    FiRefreshCw,
    FiGrid,
    FiList,
    FiZap
} from 'react-icons/fi';
import { MobileFilter } from '@/components/shared/mobile-filter';
import { StockInModal } from '@/components/stock-in-modal';
import { ValidationErrorModal } from '@/components/validation-error-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    
    // View mode (persisted in localStorage)
    const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('product-view-mode') as 'table' | 'card') || 'table';
        }
        return 'table';
    });

    const toggleViewMode = (mode: 'table' | 'card') => {
        setViewMode(mode);
        localStorage.setItem('product-view-mode', mode);
    };

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
        branch_option: 'single', 
        recipe: [] as RecipeItem[],
        unit: 'pcs',
        description: '',
        image: null as File | null,
    });

    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
    const [costWarning, setCostWarning] = useState<string | null>(null);

    const validateField = (name: string, value: any) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value || String(value).trim().length === 0) error = 'Product name is required';
                else if (String(value).trim().length < 3) error = 'Must be at least 3 characters';
                else if (String(value).trim().length > 80) error = 'Too long (max 80 characters)';
                else if (!/^[A-Za-z0-9\s\-\.\(\)\'\&\/]+$/.test(String(value).trim())) error = 'Invalid name (Allowed: A-Z, 0-9, -, ., (), \', &, /)';
                break;
            case 'sku':
                if (value && value.trim().length > 0) {
                    if (/\s/.test(value)) error = 'SKU must not contain spaces';
                    else if (!/^[A-Za-z0-9\-]+$/.test(value)) error = 'Invalid SKU format (Alphanumeric + dashes only)';
                }
                break;
            case 'category_id':
                if (!value) error = 'Please select a category';
                break;
            case 'branch_id':
                if (data.branch_option === 'single' && !value) error = 'Please select a branch';
                break;
            case 'selling_price':
                if (!value) error = 'Selling price is required';
                else if (isNaN(Number(value))) error = 'Must be a valid number';
                else if (Number(value) <= 0) error = 'Price must be greater than 0';
                else if (Number(value) > 100000) error = 'Suspiciously high price detected';
                break;
            case 'unit':
                if (!value) error = 'Unit label is required';
                else if (String(value).length > 10) error = 'Too long (max 10 characters)';
                break;
            case 'image':
                if (value) {
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                    if (!allowedTypes.includes(value.type)) error = 'Invalid file type (JPG, PNG, WEBP only)';
                    else if (value.size > 2 * 1024 * 1024) error = 'Image must be less than 2MB';
                }
                break;
            case 'recipe':
                if (!value || value.length === 0) {
                    error = 'At least one ingredient is required to build a recipe';
                } else {
                    for (const item of value) {
                        if (!item.ingredient_id) {
                            error = 'Please select a material for all rows';
                            break;
                        }
                        if (Number(item.quantity_required) <= 0 || isNaN(Number(item.quantity_required))) {
                            error = 'Quantity must be greater than 0';
                            break;
                        }
                    }
                }
                break;
        }

        setLocalErrors(prev => {
            const next = { ...prev };
            if (error) next[name] = error;
            else delete next[name];
            return next;
        });

        return error;
    };

    // Recipe Cost Warning Logic
    useEffect(() => {
        const cost = calculateComputedCost();
        const price = Number(data.selling_price) || 0;
        if (cost > 0 && price > 0 && cost > price) {
            setCostWarning(`Warning: Recipe cost (₱${cost.toFixed(2)}) exceeds selling price`);
        } else {
            setCostWarning(null);
        }
    }, [data.recipe, data.selling_price]);

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
                const cpu = (stockRow && Number(stockRow.cost_per_unit) > 0) 
                    ? Number(stockRow.cost_per_unit) 
                    : Number(ing.cost_per_base_unit || 0);

                const u = (item.unit || ing.unit).toLowerCase().trim();
                const qty = Number(item.quantity_required) || 0;
                
                const baseQty = convertToBaseQuantityWithIngredient(qty, u, ing.unit, Number(ing.avg_weight_per_piece || 0));
                total += baseQty * cpu;
            }
        });
        return total;
    };

    const computedCost = useMemo(() => calculateComputedCost(), [data.recipe, data.branch_id, data.branch_option, ingredients]);

    const formatName = (name: string, limit: number = 25) => {
        return name.length > limit ? name.substring(0, limit) + '...' : name;
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterCategory]);

    const filteredData = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(search.toLowerCase())) ||
                (product.category?.name?.toLowerCase().includes(search.toLowerCase())) ||
                (product.branch?.name?.toLowerCase().includes(search.toLowerCase()));
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
        setLocalErrors({});
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
            image: null,
        });
        setImageFile(null);
        setImagePreview(product.image_url || null);
        setLocalErrors({});
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

        // Final Validation
        const fields = ['name', 'sku', 'category_id', 'branch_id', 'selling_price', 'unit', 'recipe'];
        let hasError = false;
        fields.forEach(f => {
            const err = validateField(f, (data as any)[f]);
            if (err) hasError = true;
        });
        if (imageFile) {
            const imgErr = validateField('image', imageFile);
            if (imgErr) hasError = true;
        }

        if (hasError) {
            setErrorInfo({
                title: 'Validation Error',
                message: 'Please check the form for errors. Some required fields might be missing or invalid.'
            });
            setIsErrorModalOpen(true);
            return;
        }

        transform((data) => ({ ...data, image: imageFile }));
        post('/products', {
            forceFormData: true,
            onSuccess: () => {
                setSearch('');
                setIsAddModalOpen(false);
                reset();
                setLocalErrors({});
                router.reload({ only: ['products', 'summary'] });
                setSuccessMessage({ title: 'Product Added!', message: 'The product has been registered successfully.' });
                setIsSuccessModalOpen(true);
                setImageFile(null);
                setImagePreview(null);
            },
            onError: (errs) => {
                setLocalErrors(prev => ({ ...prev, ...errs }));
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        // Final Validation
        const fields = ['name', 'sku', 'category_id', 'selling_price', 'unit', 'recipe'];
        let hasError = false;
        fields.forEach(f => {
            const err = validateField(f, (data as any)[f]);
            if (err) hasError = true;
        });
        if (imageFile) {
            const imgErr = validateField('image', imageFile);
            if (imgErr) hasError = true;
        }

        if (hasError) {
            setErrorInfo({
                title: 'Validation Error',
                message: 'Please check the form for errors before saving.'
            });
            setIsErrorModalOpen(true);
            return;
        }

        transform((data) => ({ ...data, image: imageFile, _method: 'PUT' }));
        post(`/products/${selectedProduct.id}`, {
            forceFormData: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                setLocalErrors({});
                router.reload({ only: ['products', 'summary'] });
                setImageFile(null);
                setImagePreview(null);
                setSuccessMessage({ title: 'Product Updated!', message: 'Changes have been saved successfully.' });
                setIsSuccessModalOpen(true);
            },
            onError: (errs) => {
                setLocalErrors(prev => ({ ...prev, ...errs }));
            }
        });
    };

    const handleDeleteSubmit = () => {
        if (!selectedProduct) return;
        destroy(`/products/${selectedProduct.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedProduct(null);
                router.reload({ only: ['products', 'summary'] });
            },
        });
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
        setData(d => ({ ...d, branch_option: val }));
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }]}>
            <Head title="Products" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
                {/* Header Bar */}
                <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 bg-background border-b flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FiPackage className="text-primary size-7" />
                        <div>
                            <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">Products</h1>
                            <p className="hidden sm:block text-[11px] text-muted-foreground uppercase font-black tracking-widest mt-1">Inventory Management</p>
                        </div>
                        
                        {/* View Switcher Toggle */}
                        <div className="hidden md:flex border rounded-xl p-1 bg-muted/30 ml-4">
                            <Button 
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-8 px-4 rounded-lg gap-2 text-[10px] font-black uppercase transition-all shadow-sm"
                                onClick={() => toggleViewMode('table')}
                            >
                                <FiList className="size-4" />
                                List
                            </Button>
                            <Button 
                                variant={viewMode === 'card' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-8 px-4 rounded-lg gap-2 text-[10px] font-black uppercase transition-all shadow-sm"
                                onClick={() => toggleViewMode('card')}
                            >
                                <FiGrid className="size-4" />
                                Cards
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Desktop Search Bars */}
                        <div className="hidden md:flex items-center gap-3">
                            {isAdmin && (
                                <Select value={currentBranchId ? String(currentBranchId) : 'all'} onValueChange={handleBranchFilter}>
                                    <SelectTrigger className="w-44 h-10 bg-muted/30 border-none font-bold text-xs uppercase tracking-widest">
                                        <SelectValue placeholder="All Branches" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {branches?.map((b: any) => (<SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            )}
                            <div className="relative w-56">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search catalog..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10 bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                                />
                            </div>
                            <Select value={String(filterCategory)} onValueChange={(val) => setFilterCategory(val === 'all' ? '' : val)}>
                                <SelectTrigger className="w-44 h-10 bg-muted/30 border-none font-bold text-xs uppercase tracking-widest">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((c: any) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Mobile Trigger */}
                        <MobileFilter
                            title="Catalog Filters"
                            description="Refine your list"
                            activeFilterCount={(search ? 1 : 0) + (filterCategory ? 1 : 0)}
                            onClear={() => { setSearch(''); setFilterCategory(''); }}
                        >
                            <div className="flex flex-col gap-6 w-full">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Search</label>
                                    <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-14 rounded-2xl bg-muted/30" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Category</label>
                                    <Select value={String(filterCategory || 'all')} onValueChange={(val) => setFilterCategory(val === 'all' ? '' : val)}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-muted/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map((c: any) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </MobileFilter>

                        {isAdmin && (
                            <Button onClick={openAddModal} className="h-10 px-5 gap-2 shadow-lg shadow-primary/20 rounded-xl font-black uppercase text-[10px] tracking-widest italic transition-all active:scale-95">
                                <FiPlus className="size-4" /> <span className="hidden sm:inline">Add Product</span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">
                    {/* Summary Counters */}
                    <div className="grid gap-4 md:grid-cols-3 flex-shrink-0">
                        <Card className="bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FiPackage className="size-12" /></div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Units</CardTitle>
                            </CardHeader>
                            <CardContent><div className="text-2xl font-black">{summary.total_products}</div></CardContent>
                        </Card>
                        <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Low Stock</CardTitle>
                                <FiAlertTriangle className="size-4 text-amber-500" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-black text-amber-600">{summary.low_stock}</div></CardContent>
                        </Card>
                        <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Out of Stock</CardTitle>
                                <FiSlash className="size-4 text-destructive" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-black text-destructive">{summary.out_of_stock}</div></CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-auto bg-transparent custom-scrollbar">
                        {viewMode === 'table' ? (
                            /* TABLE VIEW */
                            <Card className="flex flex-col shadow-xl border-none ring-1 ring-black/5 bg-card min-w-max md:min-w-0">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-background border-b shadow-sm">
                                        <tr className="bg-muted/30">
                                            <th className="h-12 px-6 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground">Product Details</th>
                                            {isAdmin && (
                                                <th className="h-12 px-6 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground hidden xl:table-cell">Branch</th>
                                            )}
                                            <th className="h-12 px-6 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground hidden lg:table-cell">Category</th>
                                            <th className="h-12 px-6 text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Stock Status</th>
                                            <th className="h-12 px-6 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground hidden sm:table-cell">Price</th>
                                            <th className="h-12 px-6 text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <AnimatePresence mode="popLayout">
                                            {paginatedData.length === 0 ? (
                                                <tr className="h-32 text-center text-muted-foreground italic">
                                                    <td colSpan={5}>Empty catalog results.</td>
                                                </tr>
                                            ) : paginatedData.map((product) => (
                                                <motion.tr
                                                    key={product.id}
                                                    layout
                                                    className="border-b transition-colors hover:bg-muted/40 group cursor-default"
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-lg bg-muted border overflow-hidden shrink-0 shadow-inner">
                                                                {product.image_url ? (
                                                                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center opacity-20"><FiPackage className="size-5" /></div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-foreground leading-tight">{product.name}</span>
                                                                <span className="text-[10px] text-muted-foreground font-mono uppercase font-black">{product.sku || 'No SKU'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="p-4 hidden xl:table-cell">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase text-primary/60 tracking-wider italic">{product.branch?.name || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="p-4 hidden lg:table-cell">
                                                        <Badge variant="outline" className="bg-primary/5 text-[10px] font-black uppercase tracking-tighter border-none px-2">{product.category?.name || 'GENERIC'}</Badge>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={cn(
                                                                "font-black text-xl italic tracking-tighter leading-none shadow-text",
                                                                product.stock <= 0 ? "text-destructive" : product.stock <= 5 ? "text-amber-600" : "text-primary"
                                                            )}>
                                                                {product.stock}
                                                            </span>
                                                            <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider mt-1">Servings Ready</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 hidden sm:table-cell">
                                                        <span className="text-sm font-black text-emerald-600">{formatCurrency(product.selling_price)}</span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {isAdmin && (
                                                                <Button variant="ghost" size="icon" onClick={() => openEditModal(product)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm">
                                                                    <FiEdit2 className="size-3.5" />
                                                                </Button>
                                                            )}
                                                            {isAdmin && (
                                                                <Button variant="ghost" size="icon" onClick={() => openDeleteModal(product)} className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg">
                                                                    <FiTrash2 className="size-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </Card>
                        ) : (
                            /* CARD VIEW */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {paginatedData.map((product) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ y: -8 }}
                                        className="group relative flex flex-col bg-card rounded-[40px] overflow-hidden border border-border/40 shadow-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500"
                                    >
                                        <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/5 opacity-20"><FiPackage className="size-20" /></div>
                                            )}
                                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                <Badge className={cn("rounded-full border-none shadow-xl font-black italic tracking-tighter text-[9px] px-3 py-1", getStatusColor(product.status))}>
                                                    {product.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-2xl shadow-2xl border border-white/20">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase leading-none pb-0.5">Price</p>
                                                <p className="text-sm font-black text-emerald-600 tracking-tighter">{formatCurrency(product.selling_price)}</p>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">{product.category?.name || 'GENERIC'}</p>
                                                    <Badge variant="outline" className="text-[8px] font-black text-muted-foreground p-0 uppercase">#{product.id}</Badge>
                                                </div>
                                                <h3 className="text-lg font-black tracking-tighter leading-tight group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-muted-foreground font-mono font-bold">{product.sku || 'N/A'}</p>
                                                    {isAdmin && product.branch && (
                                                        <>
                                                            <span className="text-[10px] text-muted-foreground/30">•</span>
                                                            <span className="text-[9px] font-black uppercase text-primary/60 tracking-wider italic">{product.branch.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 items-center pt-3 border-t border-muted/30 mt-auto">
                                                <div>
                                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Ready to serve</p>
                                                    <p className={cn(
                                                        "text-2xl font-black italic tracking-tighter leading-none mt-1 shadow-text",
                                                        product.stock <= 5 ? "text-amber-500" : "text-foreground"
                                                    )}>
                                                        {product.stock} <span className="text-[10px] font-black not-italic text-muted-foreground/40 ml-0.5">PCS</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                     {isAdmin && (
                                                        <div className="flex justify-end gap-1 px-1">
                                                            <Button
                                                                variant="secondary"
                                                                size="icon"
                                                                className="size-8 rounded-xl shadow-sm hover:translate-y-[-2px] transition-all"
                                                                onClick={() => openEditModal(product)}
                                                            >
                                                                <FiEdit2 className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 rounded-xl text-rose-500 hover:bg-rose-50 border border-muted/50"
                                                                onClick={() => openDeleteModal(product)}
                                                            >
                                                                <FiTrash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                     )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination Bottom Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-background border shadow-2xl rounded-[32px] gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">SHOW</span>
                                <Select value={String(itemsPerPage)} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-16 h-8 rounded-lg border-none bg-muted/30 font-black text-[10px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{[5, 10, 25, 50].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                Result {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)} OF {filteredData.length}
                            </p>
                        </div>

                        <div className="flex gap-1.5">
                            <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="rounded-xl size-9 shadow-sm"><FiChevronLeft className="size-4" /></Button>
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const p = i + 1;
                                    return (
                                        <Button key={p} variant={currentPage === p ? 'default' : 'ghost'} onClick={() => setCurrentPage(p)} className={cn("size-9 rounded-xl font-black text-[10px] transition-all", currentPage === p ? "bg-primary shadow-xl shadow-primary/20" : "")}>{p}</Button>
                                    );
                                })}
                            </div>
                            <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(c => c + 1)} className="rounded-xl size-9 shadow-sm"><FiChevronRight className="size-4" /></Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals Sub-Components */}
            <ResultModal open={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} type="success" title={successMessage.title} message={successMessage.message} />
            <ValidationErrorModal open={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)} title={errorInfo.title} message={errorInfo.message} />
            <StockInModal open={isStockInModalOpen} onOpenChange={setIsStockInModalOpen} item={selectedProduct} type="product" />

            {/* Add/Edit/Delete dialogs */}
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
                                        maxLength={80}
                                        value={data.name} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setData('name', val);
                                            validateField('name', val);
                                        }} 
                                        onBlur={() => validateField('name', data.name)}
                                        placeholder="e.g. Chicken Burger Deluxe" 
                                        className={cn(
                                            "h-10 rounded-lg transition-all",
                                            localErrors.name ? "border-destructive ring-1 ring-destructive" : ""
                                        )} 
                                    />
                                    {localErrors.name && (
                                        <div className="flex items-center gap-1 mt-1 animate-in slide-in-from-top-1 fade-in">
                                            <FiAlertTriangle className="size-3 text-destructive" />
                                            <p className="text-[10px] text-destructive font-bold">{localErrors.name}</p>
                                        </div>
                                    )}
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
                                                    onChange={(e) => {
                                                        setData(d => ({ ...d, branch_id: e.target.value }));
                                                        validateField('branch_id', e.target.value);
                                                    }}
                                                    className={cn(
                                                        "w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none appearance-none font-bold shadow-sm transition-all",
                                                        localErrors.branch_id ? "border-destructive ring-1 ring-destructive" : "border-input focus:ring-2 focus:ring-primary/20"
                                                    )}
                                                >
                                                    <option value="">-- Choose Branch --</option>
                                                    {branches?.map((b: any) => (
                                                        <option key={b.id} value={b.id}>{b.name}</option>
                                                    ))}
                                                </select>
                                                {localErrors.branch_id && <p className="text-[10px] text-destructive font-bold mt-1">{localErrors.branch_id}</p>}
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
                                {/* LIVE RECIPE COST PANEL */}
                                <div className="col-span-2 space-y-3 mt-4">
                                    <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl shadow-inner space-y-3">
                                        <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                                            <FiZap className="size-4 text-emerald-500" />
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">Live Recipe Cost Panel</h4>
                                        </div>
                                        
                                        {data.recipe.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-border/30 rounded-xl bg-background/40">
                                                <FiPackage className="size-6 text-muted-foreground/30 mb-2" />
                                                <p className="text-[10px] italic font-bold text-muted-foreground/60 text-center">Add ingredients to build your recipe.</p>
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
                                                        const baseQty = convertToBaseQuantityWithIngredient(qty, u, ing.unit, Number(ing.avg_weight_per_piece || 0));
                                                        const itemTotalCost = baseQty * cpu;
                                                        return (
                                                            <div key={idx} className="flex justify-between items-center p-2 rounded-lg border border-border/40 bg-background/60">
                                                                <span className="text-[11px] font-bold">{ing.name} ({qty}{u})</span>
                                                                <span className="text-[11px] font-black text-emerald-600">₱{itemTotalCost.toFixed(2)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="pt-4 border-t border-dashed flex justify-between items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Cost</span>
                                                    <span className="text-xl font-black text-emerald-600">₱{calculateComputedCost().toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Selling Price (₱) <span className="text-destructive">*</span></label>
                                    <Input 
                                        type="number" step="0.01" 
                                        value={data.selling_price} 
                                        onChange={(e) => {
                                            setData('selling_price', e.target.value);
                                            validateField('selling_price', e.target.value);
                                        }} 
                                        onBlur={() => validateField('selling_price', data.selling_price)}
                                        className={cn(
                                            "h-10 rounded-lg",
                                            localErrors.selling_price ? "border-destructive ring-1 ring-destructive" : ""
                                        )}
                                    />
                                    {localErrors.selling_price && <p className="text-[10px] text-destructive font-bold">{localErrors.selling_price}</p>}
                                    {costWarning && <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1 mt-1 italic"><FiAlertTriangle className="size-3" /> {costWarning}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Unit Label</label>
                                    <select
                                        value={data.unit}
                                        onChange={(e) => setData('unit', e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm appearance-none font-bold"
                                    >
                                        {allowedUnits?.map((u: string) => (
                                            <option key={u} value={u}>{u.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea 
                                        value={data.description} 
                                        onChange={(e) => setData('description', e.target.value)} 
                                        placeholder="Enter product description..." 
                                        className="min-h-[80px] rounded-lg"
                                    />
                                    {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-medium">Product Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setImageFile(file);
                                            setData('image', file); // Sync with useForm data
                                            if (file) {
                                                setImagePreview(URL.createObjectURL(file));
                                                validateField('image', file);
                                            }
                                        }}
                                        className="w-full text-xs"
                                    />
                                    {localErrors.image && <p className="text-[10px] text-destructive font-bold">{localErrors.image}</p>}
                                </div>
                                <div className="col-span-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Ingredients Recipe</label>
                                        <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} className="h-7 text-[9px] gap-1.5 font-bold uppercase border-muted-foreground/20 hover:bg-muted transition-all">
                                            <FiPlus className="size-3" /> Add Material
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {data.recipe.map((item, idx) => {
                                            const selectedIng = ingredients.find(ing => ing.id.toString() === item.ingredient_id);
                                            const units = getAvailableUnits(selectedIng);
                                            return (
                                                <div key={idx} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <select
                                                        value={item.ingredient_id}
                                                        onChange={(e) => {
                                                            const newId = e.target.value;
                                                            const ing = ingredients.find(i => i.id.toString() === newId);
                                                            updateRecipeItem(idx, 'ingredient_id', newId);
                                                            if (ing) updateRecipeItem(idx, 'unit', (ing.unit || 'pcs').toLowerCase());
                                                            validateField('recipe', data.recipe);
                                                        }}
                                                        className="flex-1 h-9 px-3 rounded-lg border border-input bg-muted/10 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                    >
                                                        <option value="">Choose Material</option>
                                                        {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                                                    </select>
                                                    <div className="flex items-center gap-1 bg-muted/5 border rounded-lg px-2 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                                                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase">Qty:</span>
                                                        <Input 
                                                            type="number" step="0.001" 
                                                            value={item.quantity_required} 
                                                            onChange={(e) => {
                                                                updateRecipeItem(idx, 'quantity_required', e.target.value);
                                                                validateField('recipe', data.recipe);
                                                            }} 
                                                            className="w-16 h-8 border-none bg-transparent text-center text-[11px] font-black focus-visible:ring-0 px-1"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-muted/5 border rounded-lg px-2 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                                                         <span className="text-[9px] font-black text-muted-foreground/40 uppercase">Unit:</span>
                                                         <select
                                                            value={item.unit}
                                                            onChange={(e) => {
                                                                updateRecipeItem(idx, 'unit', e.target.value);
                                                                validateField('recipe', data.recipe);
                                                            }}
                                                            className="w-16 h-8 border-none bg-transparent text-[10px] font-black uppercase text-center focus:outline-none"
                                                        >
                                                            {units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRecipeItem(idx)} className="size-8 text-destructive/40 hover:text-destructive hover:bg-destructive/5"><FiTrash2 className="size-3.5" /></Button>
                                                </div>
                                            );
                                        })}
                                        {localErrors.recipe && <p className="text-[10px] text-destructive font-bold italic mt-1">{localErrors.recipe}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t bg-muted/10">
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing} className="bg-primary font-bold">Register Product</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Product Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                    <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                        <DialogTitle className="text-xl font-bold italic tracking-tighter uppercase">Modify Product</DialogTitle>
                        <DialogDescription className="text-sm">Update pricing and recipe composition.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic ml-1">Product Details</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <FiPackage className="size-4" />
                                        </div>
                                        <Input 
                                            value={data.name} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData('name', val);
                                                validateField('name', val);
                                            }} 
                                            className="h-11 pl-10 rounded-xl border-input/50 bg-muted/5 font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
                                            placeholder="Product Name"
                                        />
                                    </div>
                                    {localErrors.name && <p className="text-[10px] text-destructive font-bold uppercase tracking-wide ml-1">{localErrors.name}</p>}
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic ml-1">Selling Price</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground group-focus-within:text-primary">₱</span>
                                        <Input 
                                            type="number" step="0.01" 
                                            value={data.selling_price} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData('selling_price', val);
                                                validateField('selling_price', val);
                                            }} 
                                            className="h-11 pl-8 rounded-xl bg-muted/5 font-black text-lg tracking-tighter" 
                                        />
                                    </div>
                                    {localErrors.selling_price && <p className="text-[10px] text-destructive font-bold uppercase tracking-wide ml-1">{localErrors.selling_price}</p>}
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic ml-1">Sales Unit</label>
                                    <select 
                                        value={data.unit} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setData('unit', val);
                                            validateField('unit', val);
                                        }} 
                                        className="w-full h-11 px-4 rounded-xl border border-input/50 bg-muted/5 text-sm font-black uppercase appearance-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        {allowedUnits?.map((u: string) => (<option key={u} value={u}>{u.toUpperCase()}</option>))}
                                    </select>
                                    {localErrors.unit && <p className="text-[10px] text-destructive font-bold uppercase tracking-wide ml-1">{localErrors.unit}</p>}
                                </div>

                                <div className="col-span-2 space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic ml-1">Description</label>
                                    <Textarea 
                                        value={data.description} 
                                        onChange={(e) => setData('description', e.target.value)} 
                                        placeholder="Enter product description..." 
                                        className="min-h-[80px] rounded-xl border-input/50 bg-muted/5 font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                    {errors.description && <p className="text-[10px] text-destructive font-bold uppercase tracking-wide ml-1">{errors.description}</p>}
                                </div>
                                {/* Financial Insights Panel */}
                                <div className="col-span-2 p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-primary/60">Live Financial Insight</span>
                                        <Badge variant="outline" className="bg-background/50 border-primary/20 text-[9px] font-black uppercase tracking-widest">MARKUP %</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Computed Cost</p>
                                            <p className="text-lg font-black tracking-tighter">₱{Number(computedCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Profit Margin</p>
                                            <p className={cn(
                                                "text-lg font-black tracking-tighter",
                                                Number(data.selling_price) - computedCost > 0 ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                ₱{(Number(data.selling_price) - computedCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Rate (%)</p>
                                            <p className={cn(
                                                "text-lg font-black tracking-tighter",
                                                ((Number(data.selling_price) - computedCost) / (Number(data.selling_price) || 1) * 100) > 20 ? "text-emerald-600" : "text-amber-600"
                                            )}>
                                                {((Number(data.selling_price) - computedCost) / (Number(data.selling_price) || 1) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 border-t pt-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic ml-1">Recipe Construction</label>
                                        <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} className="h-7 text-[9px] gap-1.5 font-bold uppercase border-primary/20 hover:bg-primary/5 transition-all">
                                            <FiPlus className="size-3" /> Add Material
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {data.recipe.map((item, idx) => {
                                            const selectedIng = ingredients.find(ing => ing.id.toString() === item.ingredient_id);
                                            const units = getAvailableUnits(selectedIng);

                                            return (
                                                <div key={idx} className="flex gap-2 items-center group animate-in fade-in slide-in-from-top-1">
                                                    <select
                                                        value={item.ingredient_id}
                                                        onChange={(e) => {
                                                            const newId = e.target.value;
                                                            const ing = ingredients.find(i => i.id.toString() === newId);
                                                            updateRecipeItem(idx, 'ingredient_id', newId);
                                                            if (ing) updateRecipeItem(idx, 'unit', (ing.unit || 'pcs').toLowerCase());
                                                            validateField('recipe', data.recipe);
                                                        }}
                                                        className="flex-1 h-10 px-3 rounded-xl border border-input/50 bg-muted/5 text-[11px] font-black focus:ring-2 focus:ring-primary/20"
                                                    >
                                                        <option value="">-- Choose Material --</option>
                                                        {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                                                    </select>
                                                    <div className="flex items-center gap-1 bg-muted/10 border rounded-xl px-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase">Qty:</span>
                                                        <Input 
                                                            type="number" step="0.001" 
                                                            value={item.quantity_required} 
                                                            onChange={(e) => {
                                                                updateRecipeItem(idx, 'quantity_required', e.target.value);
                                                                validateField('recipe', data.recipe);
                                                            }} 
                                                            className="w-16 h-10 border-none bg-transparent text-center text-[11px] font-black focus-visible:ring-0 px-1"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-muted/10 border rounded-xl px-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                                         <span className="text-[9px] font-black text-muted-foreground/40 uppercase">Unit:</span>
                                                         <select
                                                            value={item.unit}
                                                            onChange={(e) => {
                                                                updateRecipeItem(idx, 'unit', e.target.value);
                                                                validateField('recipe', data.recipe);
                                                            }}
                                                            className="w-16 h-10 border-none bg-transparent text-[10px] font-black uppercase text-center focus:outline-none"
                                                        >
                                                            {units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRecipeItem(idx)} className="size-10 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-xl"><FiTrash2 className="size-4" /></Button>
                                                </div>
                                            );
                                        })}
                                        {localErrors.recipe && <p className="text-[10px] text-destructive font-bold italic ml-1">{localErrors.recipe}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-6 border-t bg-muted/5 gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="rounded-xl font-bold">Discard</Button>
                            <Button type="submit" disabled={processing} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter rounded-xl px-8 shadow-lg shadow-primary/20 transition-all active:scale-95">
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        SAVING...
                                    </div>
                                ) : 'Update Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8">
                    <DialogHeader className="p-0 space-y-4">
                        <div className="size-16 rounded-[24px] bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                            <FiTrash2 className="size-8 text-destructive animate-pulse" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center italic tracking-tighter uppercase">De-register Product?</DialogTitle>
                        <DialogDescription className="text-center font-medium leading-relaxed">
                            This will permanently remove <span className="font-bold text-foreground">"{selectedProduct?.name}"</span> from your catalog. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-col gap-3 mt-8 border-none p-0">
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSubmit}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] italic transition-all active:scale-95 shadow-xl shadow-destructive/20"
                        >
                            Confirm De-registration
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] text-muted-foreground hover:bg-muted"
                        >
                            Keep Product
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}


// ... (Rest of components like Modals could be here but for file size limits, I keep logic intact)
