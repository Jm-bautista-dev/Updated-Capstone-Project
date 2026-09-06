import { router } from '@inertiajs/core';
import { Head, usePage, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Trash2,
    X,
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';

import { CategoriesHero, type Category } from '@/components/categories/CategoriesHero';
import { CategoryDrawer } from '@/components/categories/CategoryDrawer';
import { CategoryFilterToolbar } from '@/components/categories/CategoryFilterToolbar';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { CategoryTable } from '@/components/categories/CategoryTable';
import type { ViewMode } from '@/components/products/ViewSwitcher';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

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
    const rawProps = usePage().props;
    const pageProps = rawProps as unknown as CategoriesPageProps;
    const { categories: rawCategories = [], filters = {}, isAdmin = false } = pageProps;

    const categories: Category[] = useMemo(() => rawCategories || [], [rawCategories]);

    // View mode (persisted in localStorage)
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('category-view-mode');
            if (saved === 'grid' || saved === 'table' || saved === 'card') {
                return saved === 'card' ? 'grid' : (saved as ViewMode);
            }
        }
        return 'table';
    });

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('category-view-mode', mode);
        }
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
        const handleFocus = () => router.reload();
        window.addEventListener('focus', handleFocus);
        return () => {
            stateChannel.removeEventListener('message', handleMessage);
            window.removeEventListener('focus', handleFocus);
        };
    }, [stateChannel]);

    // Search & pagination
    const [search, setSearch] = useState(filters.search || '');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const filteredData = useMemo(() =>
        categories.filter(c =>
            (c.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (c.description?.toLowerCase() || '').includes(search.toLowerCase())
        ), [categories, search]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const paginatedData = useMemo(() => {
        const validPage = Math.max(1, Math.min(currentPage, totalPages));
        const start = (validPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage, totalPages]);

    // Selection logic
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

    // Modal & Drawer State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
        type: 'success', title: '', message: '',
    });
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeImage, setRemoveImage] = useState<boolean>(false);

    const { data, setData, processing, reset } = useForm({ name: '', description: '' });
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

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
        setRemoveImage(false);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const openAddModal = () => {
        reset();
        setImageFile(null);
        setImagePreview(null);
        setRemoveImage(false);
        setLocalErrors({});
        setIsAddModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setSelectedCategory(category);
        setData({ name: category.name, description: category.description || '' });
        setImageFile(null);
        setImagePreview(category.image_url);
        setRemoveImage(false);
        setLocalErrors({});
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteModalOpen(true);
    };

    const openDrawer = (category: Category) => {
        setSelectedCategory(category);
        setIsDrawerOpen(true);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const nameErr = validateField('name', data.name);
        if (nameErr) return;

        router.post('/categories', { name: data.name, description: data.description, image: imageFile }, {
            forceFormData: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
                setLocalErrors({});
                setImageFile(null);
                setImagePreview(null);
                stateChannel.postMessage({ type: 'categories-updated' });
                setResultModal({ type: 'success', title: 'Category Created!', message: 'The new category has been registered successfully.' });
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

        const nameErr = validateField('name', data.name);
        if (nameErr) return;

        router.post(`/categories/${selectedCategory.id}`, { _method: 'PUT', name: data.name, description: data.description, image: imageFile, remove_image: removeImage ? '1' : '0' }, {
            forceFormData: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                setLocalErrors({});
                setImageFile(null);
                setImagePreview(null);
                setRemoveImage(false);
                stateChannel.postMessage({ type: 'categories-updated' });
                setResultModal({ type: 'success', title: 'Category Updated!', message: 'Changes have been saved successfully.' });
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
                setResultModal({ type: 'success', title: 'Category Removed', message: 'The category has been deleted.' });
                setIsResultModalOpen(true);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Categories', href: '/categories' }]}>
            <Head title="Categories Management" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                
                {/* ── ZONE 1: HERO & STATISTICS ── */}
                <CategoriesHero categories={categories} />

                {/* ── ZONE 2: SEARCH & FILTER TOOLBAR ── */}
                <CategoryFilterToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    density={density}
                    onDensityChange={setDensity}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    isAdmin={isAdmin}
                    onOpenAddModal={openAddModal}
                />

                {/* ── ZONE 3: CATEGORIES DISPLAY (TABLE vs GRID) ── */}
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
                                <CategoryTable
                                    categories={paginatedData}
                                    isAdmin={isAdmin}
                                    density={density}
                                    onSelectCategory={openDrawer}
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
                                <CategoryGrid
                                    categories={paginatedData}
                                    isAdmin={isAdmin}
                                    onSelectCategory={openDrawer}
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
                                            {[5, 10, 25, 50].map(val => (
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

            {/* Category Side Drawer */}
            <CategoryDrawer
                category={selectedCategory}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                isAdmin={isAdmin}
                onOpenEdit={openEditModal}
                onOpenDelete={openDeleteModal}
            />

            {/* Result Modal */}
            <ResultModal
                open={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                type={resultModal.type}
                title={resultModal.title}
                message={resultModal.message}
            />

            {/* Add Category Dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-md rounded-4xl bg-white dark:bg-[#121218] p-6 sm:p-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit']">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">Register New Category</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Global product classification and catalog grouping.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Category Name</label>
                            <Input
                                required
                                value={data.name}
                                onChange={e => {
                                    setData('name', e.target.value);
                                    if (localErrors.name) validateField('name', e.target.value);
                                }}
                                onBlur={() => validateField('name', data.name)}
                                placeholder="e.g. Beverages"
                                className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]"
                            />
                            {localErrors.name && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold ml-1">{localErrors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Description</label>
                            <Input
                                value={data.description}
                                onChange={e => {
                                    setData('description', e.target.value);
                                    if (localErrors.description) validateField('description', e.target.value);
                                }}
                                onBlur={() => validateField('description', data.description)}
                                placeholder="Short category summary..."
                                className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]"
                            />
                            {localErrors.description && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold ml-1">{localErrors.description}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Category Thumbnail</label>
                            {imagePreview && (
                                <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7] dark:bg-[#181820] mb-2">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImageFile(null); setImagePreview(null); setLocalErrors(prev => { const n = {...prev}; delete n.image; return n; }); }}
                                        className="absolute top-2 right-2 bg-rose-600 text-white rounded-full size-6 flex items-center justify-center text-xs shadow-xs"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="w-full text-xs font-medium border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FADADD]/40 dark:file:bg-white/10 file:text-[#E75480] dark:file:text-[#FF4F81] cursor-pointer"
                            />
                            {localErrors.image && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold ml-1">{localErrors.image}</p>}
                        </div>

                        <DialogFooter className="pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">Cancel</Button>
                            <Button type="submit" disabled={processing} className="rounded-xl h-11 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white text-xs font-bold cursor-pointer">
                                {processing ? 'Registering...' : 'Confirm Registration'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Category Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-md rounded-4xl bg-white dark:bg-[#121218] p-6 sm:p-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit']">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">Revise Category Info</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Global update applied across all assigned products.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Category Name</label>
                            <Input
                                required
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Description</label>
                            <Input
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Category Thumbnail</label>
                            {imagePreview && (
                                <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7] dark:bg-[#181820] mb-2">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImageFile(null); setImagePreview(null); setRemoveImage(true); }}
                                        className="absolute top-2 right-2 bg-rose-600 text-white rounded-full size-6 flex items-center justify-center text-xs shadow-xs"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="w-full text-xs font-medium border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FADADD]/40 dark:file:bg-white/10 file:text-[#E75480] dark:file:text-[#FF4F81] cursor-pointer"
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">Cancel</Button>
                            <Button type="submit" disabled={processing} className="rounded-xl h-11 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white text-xs font-bold cursor-pointer">
                                {processing ? 'Updating...' : 'Push Updates'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Category Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#121218] p-6 font-['Outfit'] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-2 text-xl font-bold">
                            <Trash2 className="size-5 text-rose-600 dark:text-rose-400" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                            Are you sure you want to delete <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">"{selectedCategory?.name}"</strong>? Products in this category will become uncategorized.
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
