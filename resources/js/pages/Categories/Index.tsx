import { router } from '@inertiajs/core';
import { Head, usePage, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect } from 'react';
import {
    FiPlus, FiSearch, FiLayers, FiGrid, FiList, FiMinimize2, FiMaximize2, FiTrendingUp
} from 'react-icons/fi';
import { ResultModal } from '@/components/result-modal';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Category = {
    id: number;
    name: string;
    description: string;
    image_path: string | null;
    image_url: string | null;
    products_count: number;
    created_at: string;
};

interface CategorySummary {
    total_categories?: number;
    total_products?: number;
}

interface CategoriesPageProps {
    categories?: Category[];
    summary?: CategorySummary;
    filters?: { search?: string };
    isAdmin?: boolean;
    [key: string]: unknown;
}

export default function CategoriesIndex() {
    const { categories: rawCategories, filters = {}, isAdmin } = usePage().props as unknown as CategoriesPageProps;
    const categories: Category[] = rawCategories || [];

    // View mode (persisted in localStorage)
    const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('category-view-mode') as 'table' | 'card') || 'table';
        }
        return 'table';
    });

    const toggleViewMode = (mode: 'table' | 'card') => {
        setViewMode(mode);
        localStorage.setItem('category-view-mode', mode);
    };

    // BroadcastChannel: reload on remote state changes
    const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'categories-updated' || e.data.type === 'products-updated') {
                router.reload();
            }
        };
        stateChannel.addEventListener('message', handleMessage);
        window.addEventListener('focus', () => router.reload());
        return () => {
            stateChannel.removeEventListener('message', handleMessage);
            window.removeEventListener('focus', () => router.reload());
        };
    }, [stateChannel]);

    // Search & pagination
    const [search,      setSearch]      = useState(filters.search || '');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredData = useMemo(() =>
        categories.filter(c =>
            (c.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (c.description?.toLowerCase() || '').includes(search.toLowerCase())
        ), [categories, search]);

    const totalPages   = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);

    // Modal state
    const [isAddModalOpen,    setIsAddModalOpen]    = useState(false);
    const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
        type: 'success', title: '', message: '',
    });
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [imageFile,        setImageFile]        = useState<File | null>(null);
    const [imagePreview,     setImagePreview]     = useState<string | null>(null);

    const { data, setData, processing, reset } = useForm({ name: '', description: '' });

    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
    const activeCategories = useMemo(() => categories.filter(c => c.products_count > 0).length, [categories]);
    const totalProducts = useMemo(() => categories.reduce((sum, c) => sum + (c.products_count || 0), 0), [categories]);
    const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(paginatedData.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelectRow = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const validateField = (name: string, value: unknown) => {
        let error = '';

        switch (name) {
            case 'name': {
                const trimmed = String(value || '').trim();
                if (!trimmed) error = 'Category name is required';
                else if (trimmed.length < 2) error = 'Must be at least 2 characters';
                else if (trimmed.length > 50) error = 'Too long (max 50 characters)';
                else if (/^[^a-zA-Z]+$/.test(trimmed)) error = 'Invalid category name';
                break;
            }
            case 'description':
                if (value && String(value).length > 150) error = 'Description is too long (max 150 characters)';
                break;
            case 'image':
                if (value && typeof value === 'object' && 'type' in value) {
                    const fileObj = value as File;
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                    if (!allowedTypes.includes(fileObj.type)) error = 'Invalid file type (JPG, PNG, WEBP only)';
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const err = validateField('image', file);
        if (err) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const openAddModal = () => {
        reset();
        setImageFile(null);
        setImagePreview(null);
        setLocalErrors({});
        setIsAddModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setSelectedCategory(category);
        setData({ name: category.name, description: category.description || '' });
        setImageFile(null);
        setImagePreview(category.image_url);
        setLocalErrors({});
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteModalOpen(true);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Final Validation pass
        const nameErr = validateField('name', data.name);
        if (nameErr) return;

        router.post('/categories', { name: data.name, description: data.description, image: imageFile } as unknown as Record<string, unknown>, {
            forceFormData: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
                setLocalErrors({});
                setImageFile(null);
                setImagePreview(null);
                stateChannel.postMessage({ type: 'categories-updated' });
                setResultModal({ type: 'success', title: 'Category created', message: 'The new category has been added successfully.' });
                setIsResultModalOpen(true);
            },
            onError: (errs) => {
                setLocalErrors(prev => ({ ...prev, ...errs }));
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;

        // Final Validation pass
        const nameErr = validateField('name', data.name);
        if (nameErr) return;

        router.post(`/categories/${selectedCategory.id}`, { _method: 'PUT', name: data.name, description: data.description, image: imageFile } as unknown as Record<string, unknown>, {
            forceFormData: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                setLocalErrors({});
                setImageFile(null);
                setImagePreview(null);
                stateChannel.postMessage({ type: 'categories-updated' });
                setResultModal({ type: 'success', title: 'Category updated', message: 'Changes have been applied across all branches.' });
                setIsResultModalOpen(true);
            },
            onError: (errs) => {
                setLocalErrors(prev => ({ ...prev, ...errs }));
            }
        });
    };

    const handleDeleteSubmit = () => {
        if (!selectedCategory) return;
        router.delete(`/categories/${selectedCategory.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedCategory(null);
                stateChannel.postMessage({ type: 'categories-updated' });
                setResultModal({ type: 'success', title: 'Category removed', message: 'The category has been deleted.' });
                setIsResultModalOpen(true);
            },
        });
    };



    return (
        <AppLayout breadcrumbs={[{ title: 'Categories', href: '/categories' }]}>
            <Head title="Categories" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background font-sans">
                {/* ── Executive Header ── */}
                <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-(--ops-surface-sunken) border-b border-(--ops-border) shrink-0">
                    <div className="flex items-center gap-3">
                        <FiLayers className="text-primary size-6 animate-pulse" />
                        <div>
                            <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">Categories</h1>
                            <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                Manage all product categories and organization labels.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Desktop View Switcher */}
                        <div className="hidden md:flex border rounded-lg p-0.5 bg-(--ops-surface-sunken)/60">
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
                                className="h-10 px-4 gap-2 bg-primary hover:bg-primary-hover text-foreground shadow-lg shadow-primary/10 rounded-xl font-black uppercase text-[10px] tracking-wider italic shrink-0"
                            >
                                <FiPlus className="size-4" /> <span>Add Category</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Content Layout ── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                        <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Total Categories</p>
                                <FiGrid className="size-4 text-(--ops-text-secondary)" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{categories.length}</h3>
                                <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Active groups</p>
                            </div>
                        </div>

                        <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Active Categories</p>
                                <FiTrendingUp className="size-4 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-emerald-500 tabular-nums leading-none">{activeCategories}</h3>
                                <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Contains products</p>
                            </div>
                        </div>

                        <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Total Products</p>
                                <FiLayers className="size-4 text-(--ops-text-secondary)" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-(--ops-text-primary) tabular-nums leading-none">{totalProducts}</h3>
                                <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Across all categories</p>
                            </div>
                        </div>
                    </div>

                    {/* STICKY TOOLBAR FILTERS */}
                    <div className="sticky top-0 z-30 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md pb-4 pt-1 space-y-4 border-b border-(--ops-border-subtle)">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                                {/* Search box */}
                                <div className="relative w-full sm:w-64">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-(--ops-text-muted)" />
                                    <Input
                                        placeholder="Search categories..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9 h-9.5 bg-(--ops-surface-sunken) border-(--ops-border) rounded-[10px] focus:ring-primary/45 text-[10px] font-bold uppercase tracking-tight text-foreground placeholder-zinc-500"
                                    />
                                </div>
                            </div>

                            {/* Density & Grid Toggle */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center border border-(--ops-border) rounded-[10px] p-0.5 bg-(--ops-surface-sunken)">
                                    <button
                                        onClick={() => setDensity('compact')}
                                        className={cn(
                                            "p-1.5 rounded-[8px] transition-all",
                                            density === 'compact' ? "bg-(--ops-chip-active-bg) text-foreground" : "text-(--ops-text-muted) hover:text-(--ops-text-secondary)"
                                        )}
                                        title="Compact Density"
                                    >
                                        <FiMinimize2 className="size-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDensity('comfortable')}
                                        className={cn(
                                            "p-1.5 rounded-[8px] transition-all",
                                            density === 'comfortable' ? "bg-(--ops-chip-active-bg) text-foreground" : "text-(--ops-text-muted) hover:text-(--ops-text-secondary)"
                                        )}
                                        title="Comfortable Density"
                                    >
                                        <FiMaximize2 className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CATEGORY TABLE CONTAINER */}
                    {viewMode === 'table' ? (
                        <div className="border border-(--ops-border) rounded-[14px] bg-(--ops-surface-sunken) shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse table-auto text-(--ops-text-secondary)">
                                    <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary) select-none">
                                        <tr>
                                            <th className="px-4 py-3.5 w-10">
                                                {isAdmin && (
                                                    <input
                                                        type="checkbox"
                                                        className="size-3.5 rounded border-(--ops-border) text-primary bg-zinc-950 focus:ring-primary/20 cursor-pointer"
                                                        checked={paginatedData.length > 0 && paginatedData.every(r => selectedIds.includes(r.id))}
                                                        onChange={(e) => toggleSelectAll(e.target.checked)}
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3.5 font-black">Category details</th>
                                            <th className="px-6 py-3.5 font-black text-center">Products Count</th>
                                            <th className="px-6 py-3.5 font-black text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--ops-border-subtle) bg-(--ops-surface-raised)">
                                        <AnimatePresence mode="popLayout">
                                            {paginatedData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center text-(--ops-text-muted) gap-3">
                                                            <FiLayers className="size-10 opacity-30 animate-bounce" />
                                                            <p className="text-sm font-bold uppercase tracking-widest text-(--ops-text-primary)">No categories found</p>
                                                            <p className="text-[10px] font-medium max-w-xs uppercase tracking-wider text-(--ops-text-muted)">Try adjusting filters or add a new category label</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedData.map(category => (
                                                    <tr 
                                                        key={category.id}
                                                        className="cursor-pointer group select-none hover:bg-(--ops-surface-sunken)/50 transition-colors duration-150 relative border-b border-(--ops-border)"
                                                        onClick={() => openEditModal(category)}
                                                    >
                                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                className="size-3.5 rounded border-(--ops-border) text-primary bg-zinc-950 focus:ring-primary/20 cursor-pointer"
                                                                checked={selectedIds.includes(category.id)}
                                                                onChange={() => toggleSelectRow(category.id)}
                                                            />
                                                        </td>
                                                        <td className={cn("px-6", density === 'compact' ? "py-2" : "py-3.5")}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-10 rounded-lg bg-(--ops-surface-sunken) border overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                                                                    {category.image_url ? (
                                                                        <img src={category.image_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <FiLayers className="size-5 text-(--ops-text-muted)/30" />
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-(--ops-text-primary) leading-tight">{category.name}</span>
                                                                    {category.description && (
                                                                        <span className="text-[9px] text-(--ops-text-muted) mt-0.5 truncate max-w-xs">{category.description}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 text-center">
                                                            <span className="font-black text-lg italic tracking-tighter leading-none text-(--ops-text-primary)">
                                                                {category.products_count}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 text-right" onClick={e => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-(--ops-surface-sunken)">
                                                                        <FiMoreHorizontal className="size-4 text-(--ops-text-muted)" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40 bg-(--ops-surface-raised) border-(--ops-border) rounded-xl p-1.5 shadow-2xl text-(--ops-text-secondary)">
                                                                    <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted) px-2.5 py-1.5">Options</DropdownMenuLabel>
                                                                    <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-(--ops-surface-sunken)" onClick={() => openEditModal(category)}>
                                                                        Edit Category
                                                                    </DropdownMenuItem>
                                                                    {isAdmin && (
                                                                        <>
                                                                            <DropdownMenuSeparator className="bg-(--ops-border) my-1" />
                                                                            <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-(--ops-surface-sunken) text-rose-500 hover:text-rose-600" onClick={() => openDeleteModal(category)}>
                                                                                Delete Category
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
                            {paginatedData.map(category => (
                                <motion.div
                                    key={category.id}
                                    layout
                                    className="group relative rounded-3xl bg-(--ops-surface-raised) border border-(--ops-border) overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                                    onClick={() => openEditModal(category)}
                                >
                                    <div className="relative aspect-square w-full bg-(--ops-surface-sunken) overflow-hidden">
                                        {category.image_url ? (
                                            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-25">
                                                <FiLayers className="size-10 text-(--ops-text-muted)" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col gap-1.5 bg-(--ops-surface-raised)">
                                        <h3 className="font-bold text-foreground text-sm leading-tight truncate">{category.name}</h3>
                                        <div className="flex justify-between items-end mt-2 pt-2 border-t border-(--ops-border-subtle)">
                                            <span className="text-xs font-bold text-(--ops-text-primary)">{category.products_count} products</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* PAGINATION BOTTOM BAR */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-(--ops-surface-raised) border border-(--ops-border) rounded-2xl shadow-sm gap-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-(--ops-text-muted) uppercase tracking-widest">Show</span>
                            <Select value={String(itemsPerPage)} onValueChange={() => {}}>
                                <SelectTrigger className="w-16 h-8 bg-(--ops-surface-sunken) border-(--ops-border) rounded-lg text-xs font-bold text-(--ops-text-primary)">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent className="bg-(--ops-surface-raised) border-(--ops-border)">
                                    {[5, 10, 25, 50].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <span className="text-[10px] font-black text-(--ops-text-muted) uppercase tracking-widest">
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

            {/* ── Modal: Add ──────────────────────────────────────────────── */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-sm rounded-3xl p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black italic tracking-tighter uppercase">New category</DialogTitle>
                        <DialogDescription className="text-xs font-medium">
                            Global product classification.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Name</label>
                            <Input
                                value={data.name}
                                onChange={e => {
                                    setData('name', e.target.value);
                                    if (localErrors.name) validateField('name', e.target.value);
                                }}
                                onBlur={() => validateField('name', data.name)}
                                placeholder="e.g. Beverages"
                                className={cn(
                                    "h-11 rounded-xl bg-muted/20 border-none ring-1 transition-all",
                                    localErrors.name ? "ring-destructive" : "ring-border focus:ring-2 focus:ring-primary/20"
                                )}
                            />
                            {localErrors.name && <p className="text-[10px] text-destructive font-bold ml-1">{localErrors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                            <Input
                                value={data.description}
                                onChange={e => {
                                    setData('description', e.target.value);
                                    if (localErrors.description) validateField('description', e.target.value);
                                }}
                                onBlur={() => validateField('description', data.description)}
                                placeholder="Short description"
                                className={cn(
                                    "h-11 rounded-xl bg-muted/20 border-none ring-1 transition-all",
                                    localErrors.description ? "ring-destructive" : "ring-border focus:ring-2 focus:ring-primary/20"
                                )}
                            />
                            {localErrors.description && <p className="text-[10px] text-destructive font-bold ml-1">{localErrors.description}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Thumbnail</label>
                            {imagePreview && (
                                <div className="relative w-full h-28 rounded-2xl overflow-hidden border-2 border-muted bg-muted p-1">
                                    <img src={imagePreview} className="w-full h-full object-cover rounded-xl" />
                                    <button
                                        type="button"
                                        onClick={() => { setImageFile(null); setImagePreview(null); setLocalErrors(prev => { const n = {...prev}; delete n.image; return n; }); }}
                                        className="absolute top-2 right-2 bg-background shadow-lg rounded-full h-6 w-6 flex items-center justify-center text-xs text-muted-foreground hover:text-rose-600 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                                className={cn(
                                    "h-11 rounded-xl text-xs py-2.5 transition-all",
                                    localErrors.image ? "border-destructive ring-1 ring-destructive" : ""
                                )} 
                            />
                            {localErrors.image && <p className="text-[10px] text-destructive font-bold ml-1">{localErrors.image}</p>}
                        </div>
                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="outline" className="h-11 rounded-xl font-bold flex-1" onClick={() => setIsAddModalOpen(false)}>
                                CANCEL
                            </Button>
                            <Button type="submit" className="h-11 rounded-xl font-black uppercase italic tracking-tighter flex-1 shadow-lg shadow-primary/20" disabled={processing}>
                                {processing ? '...' : 'CREATE'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Modal: Edit ─────────────────────────────────────────────── */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-sm rounded-4xl p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black italic tracking-tighter uppercase">Edit Category</DialogTitle>
                        <DialogDescription className="text-xs font-medium">Global update applied across all branches.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Name</label>
                            <Input
                                required
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="h-11 rounded-xl bg-muted/20 border-none ring-1 ring-border"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                            <Input
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                className="h-11 rounded-xl bg-muted/20 border-none ring-1 ring-border"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Updated Thumbnail</label>
                            <div className="relative w-full h-28 rounded-2xl overflow-hidden border-2 border-muted bg-muted p-1 shadow-inner">
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase text-muted-foreground opacity-30">
                                        No image
                                    </div>
                                )}
                            </div>
                            <Input type="file" accept="image/*" onChange={handleImageChange} className="h-11 rounded-xl text-[10px] py-2.5" />
                        </div>
                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="outline" className="h-11 rounded-xl font-bold flex-1" onClick={() => setIsEditModalOpen(false)}>
                                BACK
                            </Button>
                            <Button type="submit" className="h-11 rounded-xl font-black uppercase italic tracking-tighter flex-1 shadow-lg shadow-primary/20" disabled={processing}>
                                {processing ? '...' : 'SAVE'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Modal: Delete ───────────────────────────────────────────── */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-sm rounded-4xl p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black italic tracking-tighter uppercase text-rose-600">Delete Category?</DialogTitle>
                        <DialogDescription className="text-xs font-semibold leading-relaxed">
                            <strong className="text-foreground">"{selectedCategory?.name}"</strong> removal is permanent. <br/>
                            Products will become uncategorized.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-6 gap-2">
                        <Button variant="outline" className="h-11 rounded-xl font-bold flex-1" onClick={() => setIsDeleteModalOpen(false)}>
                            CANCEL
                        </Button>
                        <Button variant="destructive" className="h-11 rounded-xl font-black uppercase italic tracking-tighter flex-1 shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700" onClick={handleDeleteSubmit} disabled={processing}>
                            {processing ? '...' : 'DELETE'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ResultModal
                open={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                type={resultModal.type}
                title={resultModal.title}
                message={resultModal.message}
            />
        </AppLayout>
    );
}
