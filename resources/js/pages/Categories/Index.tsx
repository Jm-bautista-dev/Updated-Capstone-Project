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
  FiInfo
} from 'react-icons/fi';
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

export default function CategoriesIndex() {
  const { categories: rawCategories, summary, filters, isAdmin } = usePage().props as any;
  const categories: Category[] = rawCategories || [];

  const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'categories-updated' || e.data.type === 'products-updated') {
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

  const [search, setSearch] = useState(filters.search || '');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
    type: 'success', title: '', message: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data, setData, processing, errors, reset } = useForm({
    name: '',
    description: '',
  });

  // Derived Paginated Data
  const filteredData = useMemo(() => {
    return categories.filter(category =>
      (category.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (category.description?.toLowerCase() || '').includes(search.toLowerCase())
    );
  }, [categories, search]);

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

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setData({
      name: category.name,
      description: category.description || '',
    });
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
    router.post('/categories', {
      name: data.name,
      description: data.description,
      image: imageFile,
    } as any, {
      forceFormData: true,
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
        setImageFile(null);
        setImagePreview(null);
        stateChannel.postMessage({ type: 'categories-updated' });
        setResultModal({ type: 'success', title: 'Category Created', message: 'The new global category has been added successfully.' });
        setIsResultModalOpen(true);
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      router.post(`/categories/${selectedCategory.id}`, {
        _method: 'PUT',
        name: data.name,
        description: data.description,
        image: imageFile,
      } as any, {
        forceFormData: true,
        onSuccess: () => {
          setIsEditModalOpen(false);
          reset();
          setImageFile(null);
          setImagePreview(null);
          stateChannel.postMessage({ type: 'categories-updated' });
          setResultModal({ type: 'success', title: 'Category Updated', message: 'Group details updated successfully across all branches.' });
          setIsResultModalOpen(true);
        },
      });
    }
  };

  const handleDeleteSubmit = () => {
    if (selectedCategory) {
      router.delete(`/categories/${selectedCategory.id}`, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
          stateChannel.postMessage({ type: 'categories-updated' });
          setResultModal({ type: 'success', title: 'Category Deleted', message: 'The global category has been removed.' });
          setIsResultModalOpen(true);
        },
      });
    }
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Categories', href: '/categories' }]}>
      <Head title="Global Categories" />

      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-muted/20">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-background border-b flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Global Categories</h1>
            <p className="text-sm text-muted-foreground">Unified product classification shared across all branches.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search global categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-muted/50 focus:bg-background transition-all border-none ring-1 ring-black/5"
              />
            </div>
            {isAdmin && (
              <Button onClick={openAddModal} className="h-10 gap-2 shadow-lg shadow-primary/20">
                <FiPlus className="size-4" /> <span className="hidden sm:inline">Add Category</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-4 flex-shrink-0">
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Labels</p>
                  <p className="text-2xl font-black">{summary.total_categories}</p>
                </div>
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                   <FiLayers className="text-primary size-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-none ring-1 ring-black/5 min-h-0">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-background border-b shadow-sm">
                  <tr className="bg-muted/30">
                    <th className="h-12 px-6 text-left align-middle font-black text-muted-foreground uppercase tracking-widest text-[10px]">Category / Label</th>
                    <th className="h-12 px-6 text-center align-middle font-black text-muted-foreground uppercase tracking-widest text-[10px]">Global Product Count</th>
                    <th className="h-12 px-6 text-right align-middle font-black text-muted-foreground uppercase tracking-widest text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  <AnimatePresence mode="popLayout">
                    {paginatedData.map((category: Category) => (
                      <motion.tr key={category.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-muted/30 transition-colors group">
                        <td className="p-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-muted overflow-hidden border">
                              {category.image_url ? (
                                <img src={category.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FiLayers className="size-4 text-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-black text-foreground uppercase tracking-tight">{category.name}</div>
                              {category.description && <div className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[200px]">{category.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 px-6 text-center">
                          <Badge variant="outline" className="font-black text-[10px] bg-slate-100 border-none px-3">
                            {category.products_count} items
                          </Badge>
                        </td>
                        <td className="p-4 px-6 text-right">
                          {isAdmin && (
                            <div className="flex justify-end gap-2">
                               <Button variant="ghost" size="icon" onClick={() => openEditModal(category)} className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                                  <FiEdit2 className="size-4" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => openDeleteModal(category)} className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                  <FiTrash2 className="size-4" />
                               </Button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
             <div className="p-4 border-t flex justify-between items-center bg-muted/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Page {currentPage} of {totalPages || 1}</p>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="h-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FiChevronLeft /></Button>
                   <Button variant="outline" size="sm" className="h-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}><FiChevronRight /></Button>
                </div>
             </div>
          </Card>
        </div>

        {/* Modal: Add Category */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Create Global Category</DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase">Define a labels shared by all branches.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category Name</label>
                  <Input required value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Beverages, Pastries" className="h-11 font-bold rounded-xl" />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description (Optional)</label>
                  <Input value={data.description} onChange={e => setData('description', e.target.value)} className="h-11 text-xs font-medium rounded-xl" />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Display Image</label>
                  {imagePreview && (
                    <div className="relative w-full h-32 rounded-2xl overflow-hidden border shadow-inner">
                      <img src={imagePreview} className="w-full h-full object-cover" />
                      <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 size-6 rounded-full" onClick={() => { setImageFile(null); setImagePreview(null); }}>✕</Button>
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    if (file) setImagePreview(URL.createObjectURL(file));
                  }} className="h-11 file:font-bold file:text-[10px] file:uppercase file:bg-primary/10 file:text-primary file:border-none cursor-pointer rounded-xl" />
               </div>

               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={processing} className="font-black uppercase tracking-widest px-8 h-11 rounded-xl">Create Global Label</Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Edit Category */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Modify Category</DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase">Updates will apply system-wide across all branches.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category Name</label>
                  <Input required value={data.name} onChange={e => setData('name', e.target.value)} className="h-11 font-bold rounded-xl" />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                  <Input value={data.description} onChange={e => setData('description', e.target.value)} className="h-11 text-xs font-medium rounded-xl" />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Display Image</label>
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/30 font-black uppercase text-[10px]">No Image</div>
                    )}
                  </div>
                  <Input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    if (file) setImagePreview(URL.createObjectURL(file));
                  }} className="h-11 file:font-bold file:text-[10px] file:uppercase font-medium rounded-xl" />
               </div>

               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={processing} className="font-black uppercase tracking-widest px-8 h-11 rounded-xl">Update System-Wide</Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Delete */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
           <DialogContent>
              <DialogHeader>
                 <DialogTitle className="text-xl font-black uppercase tracking-tight text-destructive">Global Delete Protection</DialogTitle>
                 <DialogDescription className="text-sm font-bold text-muted-foreground leading-relaxed">
                   Are you sure you want to remove <span className="text-foreground font-black">"{selectedCategory?.name}"</span>? 
                   This will affect ALL products across ALL branches using this category. Items will become uncategorized.
                 </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-4">
                 <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>No, Keep it</Button>
                 <Button variant="destructive" onClick={handleDeleteSubmit} disabled={processing} className="font-black uppercase tracking-widest rounded-xl h-11">Yes, Delete Globally</Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>

        <ResultModal open={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} type={resultModal.type} title={resultModal.title} message={resultModal.message} />
      </div>
    </AppLayout>
  );
}
