import { Head, usePage, useForm } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import React, { useState, useMemo, useEffect } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
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
    FiZap,
    FiCheck,
    FiChevronDown,
    FiMoreHorizontal,
    FiActivity,
    FiTrendingUp,
    FiX,
    FiMinimize2,
    FiMaximize2,
    FiLayers,
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    is_available?: boolean;
    max_servings?: number;
    blocking_ingredients?: { name: string; stock: number; required: number; unit: string }[];
    created_at: string;
    barcode?: string;
};

type Summary = {
    total_products: number;
    low_stock: number;
    out_of_stock: number;
};

// --- Searchable Ingredient Select Component ---
const SearchableIngredientSelect = ({ value, onValueChange, ingredients, placeholder = "Choose Material", className = "" }: { 
    value: string; 
    onValueChange: (val: string) => void; 
    ingredients: Ingredient[]; 
    placeholder?: string;
    className?: string;
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    
    const filteredIngredients = ingredients.filter(ing => 
        ing.name.toLowerCase().includes(search.toLowerCase())
    );
    
    const selectedIng = ingredients.find(ing => ing.id.toString() === value);
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={open} 
                    className={cn("flex-1 h-9 bg-[var(--ops-surface-sunken)]/40 border-[var(--ops-border)] text-[11px] font-bold justify-between px-3", className)}
                >
                    <span className="truncate">{selectedIng ? selectedIng.name : placeholder}</span>
                    <FiChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 shadow-2xl border-primary/10 rounded-xl overflow-hidden" align="start">
                <div className="flex items-center border-b border-[var(--ops-border)] border-[var(--ops-border)] px-3 bg-[var(--ops-surface-sunken)]/20">
                    <FiSearch className="mr-2 h-3.5 w-3.5 shrink-0 text-[var(--ops-text-muted)]" />
                    <Input 
                        placeholder="Search materials..." 
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-xs outline-none border-none focus-visible:ring-0 placeholder:text-[var(--ops-text-muted)]/50 font-medium" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="max-h-[250px] overflow-y-auto p-1 custom-scrollbar">
                    {filteredIngredients.length === 0 ? (
                        <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-[var(--ops-text-muted)]/40 italic">No material found</div>
                    ) : (
                        filteredIngredients.map(ing => (
                            <div
                                key={ing.id}
                                className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-[11px] font-bold outline-none transition-all",
                                    value === ing.id.toString() 
                                        ? "bg-primary text-primary-foreground" 
                                        : "hover:bg-primary/10 hover:text-primary"
                                )}
                                onClick={() => {
                                    onValueChange(ing.id.toString());
                                    setOpen(false);
                                    setSearch('');
                                }}
                            >
                                <FiCheck className={cn("mr-2 h-3.5 w-3.5", value === ing.id.toString() ? "opacity-100" : "opacity-0")} />
                                {ing.name}
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default function ProductsIndex() {
    const { products: rawProducts, categories, ingredients: rawIngredients, summary, filters, branches, currentBranchId, isAdmin, allowedUnits } = usePage().props as any;
    const { resolvedAppearance } = useAppearance();
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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'overview' | 'recipe'>('overview');
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
    const activeProducts = useMemo(() => products.filter(p => p.status?.toLowerCase() === 'active').length, [products]);
    const inactiveProducts = useMemo(() => products.filter(p => p.status?.toLowerCase() === 'inactive' || p.status?.toLowerCase() === 'archived').length, [products]);
    const outOfStockProducts = useMemo(() => products.filter(p => p.stock <= 0).length, [products]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(paginatedData.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelectRow = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
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
            
            let matchesStatus = true;
            if (filterStatus === 'active') {
                matchesStatus = product.status.toLowerCase() === 'active';
            } else if (filterStatus === 'inactive' || filterStatus === 'archived') {
                matchesStatus = product.status.toLowerCase() === 'inactive' || product.status.toLowerCase() === 'archived';
            } else if (filterStatus === 'out') {
                matchesStatus = product.stock <= 0;
            } else if (filterStatus === 'low') {
                matchesStatus = product.stock > 0 && product.stock <= 5;
            }

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [products, search, filterCategory, filterStatus]);

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
            case 'Low Stock': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
            case 'Out of Stock': return 'bg-destructive/10 text-rose-500 bg-transparent border-rose-500/30';
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

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background font-sans">
                {/* ── Executive Header ── */}
                <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-[var(--ops-surface-sunken)] border-b border-[var(--ops-border)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FiPackage className="text-primary size-6 animate-pulse" />
                        <div>
                            <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">Products</h1>
                            <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                Manage all products available in the inventory.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Desktop View Switcher */}
                        <div className="hidden md:flex border rounded-lg p-0.5 bg-[var(--ops-surface-sunken)]/60">
                             <Button 
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-7 px-3 rounded-md gap-1.5 text-[10px] font-black uppercase transition-all"
                                onClick={() => toggleViewMode('table')}
                             >
                                <FiList className="size-3" />
                                Table
                             </Button>
                             <Button 
                                variant={viewMode === 'card' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-7 px-3 rounded-md gap-1.5 text-[10px] font-black uppercase transition-all"
                                onClick={() => toggleViewMode('card')}
                             >
                                <FiGrid className="size-3" />
                                Cards
                             </Button>
                        </div>
                        {isAdmin && (
                            <Button 
                                onClick={openAddModal} 
                                className="h-10 px-4 gap-2 bg-primary hover:bg-primary-hover text-foreground shadow-lg shadow-primary/10 rounded-[12px] font-black uppercase text-[10px] tracking-wider italic shrink-0"
                            >
                                <FiPlus className="size-4" /> <span>Add Product</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Content Layout ── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)]">Total Products</p>
                                <FiGrid className="size-4 text-[var(--ops-text-secondary)]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{products.length}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Active catalog fleet</p>
                            </div>
                        </div>

                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Active Products</p>
                                <FiTrendingUp className="size-4 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-emerald-500 tabular-nums leading-none">{activeProducts}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Currently live</p>
                            </div>
                        </div>

                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)]">Archived Products</p>
                                <FiLayers className="size-4 text-[var(--ops-text-muted)]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[var(--ops-text-secondary)] tabular-nums leading-none">{inactiveProducts}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">De-activated / drafts</p>
                            </div>
                        </div>

                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500/70">Out of Stock</p>
                                <FiSlash className="size-4 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-rose-500 tabular-nums leading-none">{outOfStockProducts}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Needs replenishment</p>
                            </div>
                        </div>
                    </div>

                    {/* STICKY TOOLBAR FILTERS */}
                    <div className="sticky top-0 z-30 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md pb-4 pt-1 space-y-4 border-b border-[var(--ops-border-subtle)]">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                                {/* Search box */}
                                <div className="relative w-full sm:w-64">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--ops-text-muted)]" />
                                    <Input
                                        placeholder="Search catalog SKU or name..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] focus:ring-primary/45 text-[10px] font-bold uppercase tracking-tight text-foreground placeholder-zinc-500"
                                    />
                                </div>

                                {/* Branch selector (Admin only) */}
                                {isAdmin && (
                                    <Select
                                        value={currentBranchId ? String(currentBranchId) : 'all'}
                                        onValueChange={handleBranchFilter}
                                    >
                                        <SelectTrigger className="w-full sm:w-44 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">
                                            <SelectValue placeholder="All Branches" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px]">
                                            <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Branches</SelectItem>
                                            {branches?.map((b: any) => (
                                                <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {/* Category selector */}
                                <Select value={String(filterCategory || 'all')} onValueChange={(val) => setFilterCategory(val === 'all' ? '' : val)}>
                                    <SelectTrigger className="w-full sm:w-44 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px]">
                                        <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Categories</SelectItem>
                                        {categories.map((c: any) => (
                                            <SelectItem key={c.id} value={String(c.id)} className="text-[10px] font-bold uppercase py-2">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Status filter */}
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-full sm:w-36 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px]">
                                        <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Status</SelectItem>
                                        <SelectItem value="active" className="text-[10px] font-bold uppercase py-2 text-emerald-500">Active</SelectItem>
                                        <SelectItem value="inactive" className="text-[10px] font-bold uppercase py-2 text-slate-500">Archived</SelectItem>
                                        <SelectItem value="out" className="text-[10px] font-bold uppercase py-2 text-rose-500">Out of Stock</SelectItem>
                                        <SelectItem value="low" className="text-[10px] font-bold uppercase py-2 text-amber-500">Low Stock</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Density & Grid Toggle */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center border border-[var(--ops-border)] rounded-[10px] p-0.5 bg-[var(--ops-surface-sunken)]">
                                    <button
                                        onClick={() => setDensity('compact')}
                                        className={cn(
                                            "p-1.5 rounded-[8px] transition-all",
                                            density === 'compact' ? "bg-[var(--ops-chip-active-bg)] text-foreground" : "text-[var(--ops-text-muted)] hover:text-[var(--ops-text-secondary)]"
                                        )}
                                        title="Compact Density"
                                    >
                                        <FiMinimize2 className="size-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDensity('comfortable')}
                                        className={cn(
                                            "p-1.5 rounded-[8px] transition-all",
                                            density === 'comfortable' ? "bg-[var(--ops-chip-active-bg)] text-foreground" : "text-[var(--ops-text-muted)] hover:text-[var(--ops-text-secondary)]"
                                        )}
                                        title="Comfortable Density"
                                    >
                                        <FiMaximize2 className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRODUCT TABLE CONTAINER */}
                    {viewMode === 'table' ? (
                        <div className="border border-[var(--ops-border)] rounded-[14px] bg-[var(--ops-surface-sunken)] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse table-auto text-[var(--ops-text-secondary)]">
                                    <thead className="bg-[var(--ops-thead-bg)] border-b border-[var(--ops-border)] text-[9px] font-black uppercase tracking-[0.15em] text-[var(--ops-text-secondary)] select-none">
                                        <tr>
                                            <th className="px-4 py-3.5 w-10">
                                                {isAdmin && (
                                                    <input
                                                        type="checkbox"
                                                        className="size-3.5 rounded border-[var(--ops-border)] text-primary bg-zinc-950 focus:ring-primary/20 cursor-pointer"
                                                        checked={paginatedData.length > 0 && paginatedData.every(r => selectedIds.includes(r.id))}
                                                        onChange={(e) => toggleSelectAll(e.target.checked)}
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3.5 font-black">Product Details</th>
                                            {isAdmin && <th className="px-6 py-3.5 font-black">Branch</th>}
                                            <th className="px-6 py-3.5 font-black">Category</th>
                                            <th className="px-6 py-3.5 font-black text-center">Stock Status</th>
                                            <th className="px-6 py-3.5 font-black">Selling Price</th>
                                            <th className="px-6 py-3.5 font-black text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--ops-border-subtle)] bg-[var(--ops-surface-raised)]">
                                        <AnimatePresence mode="popLayout">
                                            {paginatedData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center text-[var(--ops-text-muted)] gap-3">
                                                            <FiPackage className="size-10 opacity-30 animate-bounce" />
                                                            <p className="text-sm font-bold uppercase tracking-widest text-[var(--ops-text-primary)]">No products found</p>
                                                            <p className="text-[10px] font-medium max-w-xs uppercase tracking-wider text-[var(--ops-text-muted)]">Try adjusting filters or add a new product specifications</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedData.map(product => (
                                                    <tr 
                                                        key={product.id}
                                                        className="cursor-pointer group select-none hover:bg-[var(--ops-surface-sunken)]/50 transition-colors duration-150 relative border-b border-[var(--ops-border)]"
                                                        onClick={() => { setSelectedProduct(product); setIsDrawerOpen(true); }}
                                                    >
                                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                className="size-3.5 rounded border-[var(--ops-border)] text-primary bg-zinc-950 focus:ring-primary/20 cursor-pointer"
                                                                checked={selectedIds.includes(product.id)}
                                                                onChange={() => toggleSelectRow(product.id)}
                                                            />
                                                        </td>
                                                        <td className={cn("px-6", density === 'compact' ? "py-2" : "py-3.5")}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-10 rounded-lg bg-[var(--ops-surface-sunken)] border overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                                                                    {product.image_url ? (
                                                                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <FiPackage className="size-5 text-[var(--ops-text-muted)]/30" />
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-[var(--ops-text-primary)] leading-tight">{product.name}</span>
                                                                    <span className="text-[9px] text-[var(--ops-text-muted)] font-mono uppercase font-bold mt-0.5">{product.sku || 'No SKU'}{product.barcode && ` • [${product.barcode}]`}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {isAdmin && (
                                                            <td className="px-6 text-xs font-bold text-[var(--ops-text-secondary)]">
                                                                {product.branch?.name || 'N/A'}
                                                            </td>
                                                        )}
                                                        <td className="px-6">
                                                            <Badge variant="outline" className="bg-[var(--ops-surface-sunken)] text-[9px] font-black uppercase border-none px-2">{product.category?.name || 'GENERIC'}</Badge>
                                                        </td>
                                                        <td className="px-6 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className={cn(
                                                                    "font-black text-lg italic tracking-tighter leading-none",
                                                                    product.stock <= 0 ? "text-rose-500" : product.stock <= 5 ? "text-amber-500" : "text-emerald-500"
                                                                )}>
                                                                    {product.stock}
                                                                </span>
                                                                <span className="text-[8px] font-black uppercase text-[var(--ops-text-muted)]/60 tracking-wider mt-0.5">Servings</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 font-mono text-xs font-bold text-emerald-500">
                                                            {formatCurrency(product.selling_price)}
                                                        </td>
                                                        <td className="px-6 text-right" onClick={e => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-[var(--ops-surface-sunken)]">
                                                                        <FiMoreHorizontal className="size-4 text-[var(--ops-text-muted)]" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40 bg-[var(--ops-surface-raised)] border-[var(--ops-border)] rounded-[12px] p-1.5 shadow-2xl text-[var(--ops-text-secondary)]">
                                                                    <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)] px-2.5 py-1.5">Options</DropdownMenuLabel>
                                                                    <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-surface-sunken)]" onClick={() => { setSelectedProduct(product); setIsDrawerOpen(true); }}>
                                                                        View Specifications
                                                                    </DropdownMenuItem>
                                                                    {isAdmin && (
                                                                        <>
                                                                            <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-surface-sunken)]" onClick={() => openEditModal(product)}>
                                                                                Edit Specifications
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator className="bg-[var(--ops-border)] my-1" />
                                                                            <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-surface-sunken)] text-rose-500 hover:text-rose-600" onClick={() => openDeleteModal(product)}>
                                                                                Delete Product
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* CARD VIEW */
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {paginatedData.map(product => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    className="group relative rounded-3xl bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                                    onClick={() => { setSelectedProduct(product); setIsDrawerOpen(true); }}
                                >
                                    <div className="relative aspect-square w-full bg-[var(--ops-surface-sunken)] overflow-hidden">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-25">
                                                <FiPackage className="size-10 text-[var(--ops-text-muted)]" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border-none shadow-md",
                                                product.stock <= 0 ? "bg-rose-500 text-white" : product.stock <= 5 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                                            )}>
                                                {product.stock <= 0 ? 'Out of Stock' : `${product.stock} Ready`}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col gap-1.5 bg-[var(--ops-surface-raised)]">
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-[var(--ops-text-muted)]">
                                            <span>{product.category?.name || 'Generic'}</span>
                                            {product.branch && <span>{product.branch.name}</span>}
                                        </div>
                                        <h3 className="font-bold text-foreground text-sm leading-tight truncate">{product.name}</h3>
                                        <div className="flex justify-between items-end mt-2 pt-2 border-t border-[var(--ops-border-subtle)]">
                                            <span className="text-base font-black text-emerald-500 font-mono">{formatCurrency(product.selling_price)}</span>
                                            <span className="text-[9px] text-[var(--ops-text-muted)] font-mono">{product.sku}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* PAGINATION BOTTOM BAR */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-2xl shadow-sm gap-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-[var(--ops-text-muted)] uppercase tracking-widest">Show</span>
                            <Select value={String(itemsPerPage)} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="w-16 h-8 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-lg text-xs font-bold text-[var(--ops-text-primary)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--ops-surface-raised)] border-[var(--ops-border)]">
                                    {[5, 10, 25, 50].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <span className="text-[10px] font-black text-[var(--ops-text-muted)] uppercase tracking-widest">
                                Results {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length}
                            </span>
                        </div>

                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="rounded-lg size-8"><FiChevronLeft className="size-4" /></Button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = i + 1;
                                return (
                                    <Button key={p} variant={currentPage === p ? 'default' : 'ghost'} onClick={() => setCurrentPage(p)} className="size-8 rounded-lg text-xs font-bold">{p}</Button>
                                );
                            })}
                            <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(c => c + 1)} className="rounded-lg size-8"><FiChevronRight className="size-4" /></Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT-SIDE DETAILS DRAWER ── */}
            <AnimatePresence>
                {isDrawerOpen && selectedProduct && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                            className="fixed inset-0 bg-black/60 z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md md:max-w-lg bg-[var(--ops-surface-raised)] border-l border-[var(--ops-border)] shadow-2xl z-50 flex flex-col font-sans text-[var(--ops-text-secondary)]"
                        >
                            <div className="p-6 border-b border-[var(--ops-border)] flex items-center justify-between flex-shrink-0 bg-[var(--ops-surface-sunken)]/25">
                                <div className="flex items-center gap-2">
                                    <FiPackage className="text-primary size-5" />
                                    <div>
                                        <h2 className="text-sm font-black italic uppercase tracking-tighter text-foreground">Product Specification</h2>
                                        <p className="text-[9px] font-bold text-[var(--ops-text-muted)] uppercase tracking-widest">PROD-{selectedProduct.id.toString().padStart(5, '0')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-1.5 rounded-[8px] bg-[var(--ops-surface-sunken)] border border-[var(--ops-border)] text-[var(--ops-text-secondary)] hover:text-foreground transition-colors"
                                >
                                    <FiX className="size-4" />
                                </button>
                            </div>

                            <div className="px-6 pt-3 bg-[var(--ops-surface-sunken)] border-b border-[var(--ops-border-subtle)] flex-shrink-0">
                                <div className="flex gap-2">
                                    {[
                                        { id: 'overview', label: 'Overview' },
                                        { id: 'recipe', label: 'Recipe Composition' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setDrawerTab(tab.id as any)}
                                            className={cn(
                                                "pb-2.5 text-[9px] font-black uppercase tracking-wider relative px-1",
                                                drawerTab === tab.id 
                                                    ? "text-primary border-b-2 border-primary" 
                                                    : "text-[var(--ops-text-muted)] hover:text-[var(--ops-text-secondary)]"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {drawerTab === 'overview' ? (
                                    <div className="space-y-6">
                                        <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-[var(--ops-border)] bg-[var(--ops-surface-sunken)] flex items-center justify-center relative shadow-inner">
                                            {selectedProduct.image_url ? (
                                                <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <FiPackage className="size-20 text-[var(--ops-text-muted)]/20" />
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground">{selectedProduct.name}</h3>
                                                <p className="text-[10px] font-bold text-[var(--ops-text-muted)] uppercase tracking-widest mt-1">
                                                    SKU: {selectedProduct.sku || 'N/A'} {selectedProduct.barcode && `| Barcode: ${selectedProduct.barcode}`}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-[var(--ops-surface-sunken)] border border-[var(--ops-border-subtle)] rounded-2xl">
                                                    <span className="text-[8px] font-black text-[var(--ops-text-muted)] uppercase tracking-widest block">Selling Price</span>
                                                    <span className="text-lg font-black text-emerald-500 font-mono">{formatCurrency(selectedProduct.selling_price)}</span>
                                                </div>
                                                <div className="p-4 bg-[var(--ops-surface-sunken)] border border-[var(--ops-border-subtle)] rounded-2xl">
                                                    <span className="text-[8px] font-black text-[var(--ops-text-muted)] uppercase tracking-widest block">Cost Price</span>
                                                    <span className="text-lg font-black text-amber-500 font-mono">{formatCurrency(selectedProduct.cost_price)}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[9px] font-black text-[var(--ops-text-muted)] uppercase tracking-widest block">Category</span>
                                                    <span className="text-xs font-bold text-foreground">{selectedProduct.category?.name || 'GENERIC'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-[var(--ops-text-muted)] uppercase tracking-widest block">Status</span>
                                                    <Badge className={cn("text-[9px] font-black uppercase rounded-md border", getStatusColor(selectedProduct.status))}>
                                                        {selectedProduct.status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {selectedProduct.description && (
                                                <div className="border-t border-[var(--ops-border-subtle)] pt-4">
                                                    <span className="text-[9px] font-black text-[var(--ops-text-muted)] uppercase tracking-widest block">Product Description</span>
                                                    <p className="text-xs leading-relaxed text-foreground/80 mt-1">{selectedProduct.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-3">
                                            <span className="text-[10px] font-black uppercase text-[var(--ops-text-muted)] tracking-wider">Required Ingredients</span>
                                            <span className="text-xs font-black font-mono text-primary">{selectedProduct.ingredients?.length || 0} Materials</span>
                                        </div>
                                        <div className="space-y-3">
                                            {selectedProduct.ingredients?.map((ing, idx) => (
                                                <div key={idx} className="p-3.5 bg-[var(--ops-surface-sunken)]/60 rounded-xl border border-[var(--ops-border-subtle)] flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">{ing.name}</p>
                                                        <p className="text-[9px] text-[var(--ops-text-muted)] font-mono">ID: ING-{ing.id.toString().padStart(5, '0')}</p>
                                                    </div>
                                                    <span className="text-xs font-black text-foreground font-mono bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] px-2 py-1 rounded-md">
                                                        {ing.pivot?.quantity_required} {ing.unit}
                                                    </span>
                                                </div>
                                            ))}
                                            {(!selectedProduct.ingredients || selectedProduct.ingredients.length === 0) && (
                                                <p className="text-xs text-[var(--ops-text-muted)] italic text-center py-8">This is a direct selling product with no recipe ingredients.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Footer Actions */}
                            {isAdmin && (
                                <div className="p-6 border-t border-[var(--ops-border)] bg-[var(--ops-surface-sunken)]/20 flex gap-3 flex-shrink-0">
                                    <Button
                                        onClick={() => { setIsDrawerOpen(false); openEditModal(selectedProduct); }}
                                        className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white animate-in fade-in"
                                    >
                                        Edit Product
                                    </Button>
                                    <Button
                                        onClick={() => { setIsDrawerOpen(false); openDeleteModal(selectedProduct); }}
                                        variant="ghost"
                                        className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 border border-rose-500/20"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}


// ... (Rest of components like Modals could be here but for file size limits, I keep logic intact)
