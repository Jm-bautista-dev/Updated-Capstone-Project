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
    FiLayers,
    FiChevronLeft,
    FiChevronRight,
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

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">

                {/* ── Page header ─────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b bg-background flex-shrink-0">
                    <div>
                        <h1 className="text-base font-semibold text-foreground">Categories</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Unified product labels shared across all branches.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search categories..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="pl-8 h-8 w-56 text-sm"
                            />
                        </div>
                        {isAdmin && (
                            <Button size="sm" onClick={openAddModal} className="h-8 gap-1.5 text-sm">
                                <FiPlus className="size-3.5" />
                                Add Category
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Summary strip ───────────────────────────────────────── */}
                <div className="flex items-center gap-6 px-6 py-3 border-b bg-background flex-shrink-0">
                    <div className="flex items-center gap-2 text-sm">
                        <FiLayers className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{summary?.total_categories ?? categories.length}</span>
                        <span className="text-muted-foreground">total categories</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {filteredData.length !== categories.length && (
                            <span>{filteredData.length} matching search</span>
                        )}
                    </div>
                </div>

                {/* ── Table ───────────────────────────────────────────────── */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-background border-b">
                            <tr>
                                <th className="h-10 px-6 text-left text-xs font-medium text-muted-foreground">Category</th>
                                <th className="h-10 px-6 text-left text-xs font-medium text-muted-foreground">Products</th>
                                {isAdmin && (
                                    <th className="h-10 px-6 text-right text-xs font-medium text-muted-foreground">Actions</th>
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
                                <tr key={category.id} className="hover:bg-muted/40 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            {/* Thumbnail */}
                                            <div className="size-8 rounded-md bg-muted border overflow-hidden flex-shrink-0">
                                                {category.image_url ? (
                                                    <img src={category.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FiLayers className="size-3.5 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{category.name}</p>
                                                {category.description && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                                                        {category.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="text-sm text-foreground">{category.products_count}</span>
                                        <span className="text-xs text-muted-foreground ml-1">
                                            {category.products_count === 1 ? 'product' : 'products'}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 text-muted-foreground hover:text-foreground"
                                                    onClick={() => openEditModal(category)}
                                                    title="Edit"
                                                >
                                                    <FiEdit2 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => openDeleteModal(category)}
                                                    title="Delete"
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

                {/* ── Pagination ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-3 border-t bg-background flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                        {filteredData.length === 0
                            ? 'No results'
                            : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredData.length)} of ${filteredData.length}`}
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-7"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <FiChevronLeft className="size-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-7"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            <FiChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Modal: Add ──────────────────────────────────────────────── */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>New category</DialogTitle>
                        <DialogDescription>
                            This category will be available globally across all branches.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Name</label>
                            <Input
                                required
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. Beverages"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">
                                Description <span className="text-muted-foreground font-normal">(optional)</span>
                            </label>
                            <Input
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Short description"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">
                                Image <span className="text-muted-foreground font-normal">(optional)</span>
                            </label>
                            {imagePreview && (
                                <div className="relative w-full h-28 rounded-md overflow-hidden border">
                                    <img src={imagePreview} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                                        className="absolute top-1.5 right-1.5 bg-background border rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                            <Input type="file" accept="image/*" onChange={handleImageChange} className="h-9 text-sm" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={processing}>
                                {processing ? 'Creating…' : 'Create category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Modal: Edit ─────────────────────────────────────────────── */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Edit category</DialogTitle>
                        <DialogDescription>
                            Changes apply across all branches immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Name</label>
                            <Input
                                required
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Description</label>
                            <Input
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Image</label>
                            <div className="relative w-full h-28 rounded-md overflow-hidden border bg-muted">
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                        No image
                                    </div>
                                )}
                            </div>
                            <Input type="file" accept="image/*" onChange={handleImageChange} className="h-9 text-sm" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={processing}>
                                {processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Modal: Delete ───────────────────────────────────────────── */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete category?</DialogTitle>
                        <DialogDescription>
                            <strong className="text-foreground">"{selectedCategory?.name}"</strong> will be removed from all branches.
                            Products in this category will become uncategorized.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDeleteSubmit} disabled={processing}>
                            {processing ? 'Deleting…' : 'Delete'}
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
