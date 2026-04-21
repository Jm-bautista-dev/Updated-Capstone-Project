import { Head, usePage, useForm } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ResultModal } from '@/components/result-modal';
import {
    FiEdit2, FiTrash2, FiPlus, FiSearch, FiLayers, FiChevronLeft, FiChevronRight,
    FiGrid, FiList 
} from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Category = {
    id: number;
    name: string;
    description: string;
    image_path: string | null;
    image_url: string | null;
    products_count: number;
    created_at: string;
};

export default function CategoriesIndex() {
    const { categories: rawCategories, summary, filters, isAdmin } = usePage().props as any;
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

    const openAddModal = () => {
        reset();
        setImageFile(null);
        setImagePreview(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setSelectedCategory(category);
        setData({ name: category.name, description: category.description || '' });
        setImageFile(null);
        setImagePreview(category.image_url || null);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteModalOpen(true);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/categories', { name: data.name, description: data.description, image: imageFile } as any, {
            forceFormData: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
                setImageFile(null);
                setImagePreview(null);
                stateChannel.postMessage({ type: 'categories-updated' });
                setResultModal({ type: 'success', title: 'Category created', message: 'The new category has been added successfully.' });
                setIsResultModalOpen(true);
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;
        router.post(`/categories/${selectedCategory.id}`, { _method: 'PUT', name: data.name, description: data.description, image: imageFile } as any, {
            forceFormData: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                setImageFile(null);
                setImagePreview(null);
                stateChannel.postMessage({ type: 'categories-updated' });
                setResultModal({ type: 'success', title: 'Category updated', message: 'Changes have been applied across all branches.' });
                setIsResultModalOpen(true);
            },
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
        if (file) setImagePreview(URL.createObjectURL(file));
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Categories', href: '/categories' }]}>
            <Head title="Categories" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
                {/* ── Page header ─────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b bg-background flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-base font-semibold text-foreground">Categories</h1>
                            <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
                                Unified product labels.
                            </p>
                        </div>
                        
                        {/* View Switcher */}
                        <div className="hidden sm:flex border rounded-lg p-0.5 bg-muted/30 ml-2">
                             <Button 
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-7 px-3 rounded-md gap-1.5 text-[10px] font-black uppercase transition-all shadow-sm"
                                onClick={() => toggleViewMode('table')}
                             >
                                <FiList className="size-3" />
                                Table
                             </Button>
                             <Button 
                                variant={viewMode === 'card' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-7 px-3 rounded-md gap-1.5 text-[10px] font-black uppercase transition-all shadow-sm"
                                onClick={() => toggleViewMode('card')}
                             >
                                <FiGrid className="size-3" />
                                Cards
                             </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="pl-8 h-9 w-40 sm:w-56 text-sm bg-muted/20"
                            />
                        </div>
                        {isAdmin && (
                            <Button size="sm" onClick={openAddModal} className="h-9 gap-1.5 text-sm font-bold shadow-lg shadow-primary/20">
                                <FiPlus className="size-3.5" />
                                <span className="hidden sm:inline">Add Category</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Summary strip ───────────────────────────────────────── */}
                <div className="flex items-center gap-6 px-6 py-2.5 border-b bg-muted/5 flex-shrink-0">
                    <div className="flex items-center gap-2 text-sm">
                        <FiLayers className="size-3.5 text-muted-foreground" />
                        <span className="font-bold text-foreground">{summary?.total_categories ?? categories.length}</span>
                        <span className="text-muted-foreground text-[11px] uppercase font-black tracking-wider">categories</span>
                    </div>
                    <div className="text-[11px] uppercase font-black text-muted-foreground tracking-wider">
                        {filteredData.length !== categories.length && (
                            <span>{filteredData.length} matches found</span>
                        )}
                    </div>
                </div>

                {/* ── Content View ────────────────────────────────────────── */}
                <div className="flex-1 overflow-auto bg-muted/5 p-6 custom-scrollbar">
                    {viewMode === 'table' ? (
                        /* TABLE VIEW (Unchanged design, wrapped in overflow container) */
                        <div className="bg-background border rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="h-10 px-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</th>
                                        <th className="h-10 px-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Products</th>
                                        {isAdmin && (
                                            <th className="h-10 px-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-sm text-muted-foreground">
                                                {search ? `No categories match "${search}".` : 'No categories yet.'}
                                            </td>
                                        </tr>
                                    ) : paginatedData.map((category) => (
                                        <tr key={category.id} className="hover:bg-muted/40 transition-colors group">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-lg bg-muted border overflow-hidden flex-shrink-0 shadow-inner">
                                                        {category.image_url ? (
                                                            <img src={category.image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <FiLayers className="size-4 text-muted-foreground/40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">{category.name}</p>
                                                        {category.description && (
                                                            <p className="text-[11px] text-muted-foreground truncate max-w-xs leading-none mt-1">
                                                                {category.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-sm font-bold text-foreground">{category.products_count}</span>
                                                <span className="text-xs text-muted-foreground ml-1 font-medium">
                                                    {category.products_count === 1 ? 'product' : 'products'}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                                                            onClick={() => openEditModal(category)}
                                                        >
                                                            <FiEdit2 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg"
                                                            onClick={() => openDeleteModal(category)}
                                                        >
                                                            <FiTrash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* CARD VIEW (New modern layout) */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                            {paginatedData.length === 0 ? (
                                <div className="col-span-full h-40 flex items-center justify-center border-2 border-dashed rounded-3xl text-muted-foreground italic">
                                    No categories found.
                                </div>
                            ) : paginatedData.map((category) => (
                                <div 
                                    key={category.id}
                                    className="group relative flex flex-col bg-card border rounded-[32px] p-5 shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="size-14 rounded-2xl bg-muted border-2 border-background overflow-hidden flex-shrink-0 shadow-lg">
                                            {category.image_url ? (
                                                <img src={category.image_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                    <FiLayers className="size-6 text-primary/30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                            {category.products_count} Items
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <h3 className="font-black text-foreground text-lg tracking-tight group-hover:text-primary transition-colors">{category.name}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
                                            {category.description || 'Global product classification.'}
                                        </p>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex gap-2 mt-5 pt-4 border-t border-muted/50 opacity-0 group-hover:opacity-100 transition-all translate-y-3 group-hover:translate-y-0 duration-300">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm"
                                                onClick={() => openEditModal(category)}
                                            >
                                                <FiEdit2 className="size-3" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-muted/30"
                                                onClick={() => openDeleteModal(category)}
                                            >
                                                <FiTrash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Pagination ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-3 border-t bg-background flex-shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {filteredData.length === 0
                            ? '0 RESULTS'
                            : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredData.length)} of ${filteredData.length}`}
                    </p>
                    <div className="flex gap-1.5">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-lg shadow-sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <FiChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-lg shadow-sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            <FiChevronRight className="size-4" />
                        </Button>
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
                                required
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. Beverages"
                                className="h-11 rounded-xl bg-muted/20 border-none ring-1 ring-border focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                            <Input
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Short description"
                                className="h-11 rounded-xl bg-muted/20 border-none ring-1 ring-border focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Thumbnail</label>
                            {imagePreview && (
                                <div className="relative w-full h-28 rounded-2xl overflow-hidden border-2 border-muted bg-muted p-1">
                                    <img src={imagePreview} className="w-full h-full object-cover rounded-xl" />
                                    <button
                                        type="button"
                                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                                        className="absolute top-2 right-2 bg-background shadow-lg rounded-full h-6 w-6 flex items-center justify-center text-xs text-muted-foreground hover:text-rose-600 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <Input type="file" accept="image/*" onChange={handleImageChange} className="h-11 rounded-xl text-xs py-2.5" />
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
                <DialogContent className="max-w-sm rounded-[32px] p-8 border-none shadow-2xl">
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
                <DialogContent className="max-w-sm rounded-[32px] p-8 border-none shadow-2xl">
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
