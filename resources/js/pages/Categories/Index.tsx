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
  FiPackage,
  FiInfo
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Category = {
  id: number;
  name: string;
  description: string;
  image_path: string | null;
  image_url: string | null;
  products_count: number;
  created_at: string;
  branch?: { id: number; name: string };
  branch_id?: number;
};

export default function CategoriesIndex() {
  const { categories: rawCategories, summary, filters, branches, currentBranchId, isAdmin } = usePage().props as any;
  const categories: Category[] = rawCategories || [];

  // --- Sync Logic ---
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
    branch_id: '',
    branch_option: 'single' as 'single' | 'both',
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
      branch_id: category.branch_id?.toString() || '',
      branch_option: 'single',
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
      branch_id: data.branch_id,
      branch_option: data.branch_option,
      image: imageFile,
    } as any, {
      forceFormData: true,
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
        setImageFile(null);
        setImagePreview(null);
        stateChannel.postMessage({ type: 'categories-updated' });
        setResultModal({ type: 'success', title: 'Category Created', message: 'The new category has been added successfully.' });
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
        branch_id: data.branch_id,
        image: imageFile,
      } as any, {
        forceFormData: true,
        onSuccess: () => {
          setIsEditModalOpen(false);
          reset();
          setImageFile(null);
          setImagePreview(null);
          stateChannel.postMessage({ type: 'categories-updated' });
          setResultModal({ type: 'success', title: 'Category Updated', message: 'Category details have been updated.' });
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
          setResultModal({ type: 'success', title: 'Category Deleted', message: 'The category has been removed.' });
          setIsResultModalOpen(true);
        },
      });
    }
  };

  const handleBranchFilter = (value: string) => {
    router.get('/categories', { branch_id: value === 'all' ? '' : value, search }, { preserveState: true });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Categories', href: '/categories' }]}>
      <Head title="Categories" />

      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-muted/20">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-background border-b flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
            <p className="text-sm text-muted-foreground">Branch-isolated product classification.</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Select value={currentBranchId ? String(currentBranchId) : 'all'} onValueChange={handleBranchFilter}>
                <SelectTrigger className="w-full sm:w-48 h-10 bg-muted/50 border-none ring-1 ring-black/5">
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
                placeholder="Search categories..."
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Categories</p>
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
                    <th className="h-12 px-6 text-left align-middle font-black text-muted-foreground uppercase tracking-widest text-[10px]">Category Info</th>
                    {isAdmin && <th className="h-12 px-6 text-left align-middle font-black text-muted-foreground uppercase tracking-widest text-[10px]">Branch</th>}
                    <th className="h-12 px-6 text-center align-middle font-black text-muted-foreground uppercase tracking-widest text-[10px]">Products</th>
                    <th className="h-12 px-6 text-right align-middle font-black text-muted-foreground uppercase tracking-widest text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
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
                        {isAdmin && (
                          <td className="p-4 px-6">
                            <Badge variant="outline" className="bg-white/50 font-black text-[10px] uppercase border-black/5 ring-1 ring-black/5">
                              {category.branch?.name || 'All'}
                            </Badge>
                          </td>
                        )}
                        <td className="p-4 px-6 text-center">
                          <span className="font-mono font-bold text-xs">{category.products_count} items</span>
                        </td>
                        <td className="p-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" onClick={() => openEditModal(category)} className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                                <FiEdit2 className="size-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => openDeleteModal(category)} className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                <FiTrash2 className="size-4" />
                             </Button>
                          </div>
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
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Create Category</DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase">Classify your products for specific branches.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category Name</label>
                  <Input required value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Beverages, Pastries" className="h-10 font-bold" />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description (Optional)</label>
                  <Input value={data.description} onChange={e => setData('description', e.target.value)} className="h-10 text-xs font-medium" />
               </div>

               {isAdmin && (
                  <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-black/5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary">Target Branch Configuration</label>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">Assign this category to a specific branch or all locations.</p>
                    </div>

                    <div className="flex gap-2">
                       <Button
                          type="button"
                          variant={data.branch_option === 'single' ? 'default' : 'outline'}
                          onClick={() => setData('branch_option', 'single')}
                          className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                       >
                          Single Branch
                       </Button>
                       <Button
                          type="button"
                          variant={data.branch_option === 'both' ? 'default' : 'outline'}
                          onClick={() => setData('branch_option', 'both')}
                          className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                       >
                          Both Branches
                       </Button>
                    </div>

                    {data.branch_option === 'single' && (
                      <Select value={String(data.branch_id)} onValueChange={val => setData('branch_id', val)}>
                         <SelectTrigger className="h-10 bg-background border-none ring-1 ring-black/5 rounded-xl font-bold">
                            <SelectValue placeholder="Select Branch" />
                         </SelectTrigger>
                         <SelectContent>
                            {branches.map((b: any) => (
                              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                    )}

                    {data.branch_option === 'both' && (
                       <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-xl border border-primary/20">
                          <FiInfo className="text-primary size-4" />
                          <span className="text-[9px] font-black text-primary uppercase leading-tight">System will create independent copies for ALL branches.</span>
                       </div>
                    )}
                  </div>
               )}

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
                  }} className="h-10 file:font-bold file:text-[10px] file:uppercase file:bg-primary/10 file:text-primary file:border-none cursor-pointer" />
               </div>

               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={processing} className="font-black uppercase tracking-widest px-8">Save Category</Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Edit Category */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Modify Category</DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase">Update details for this branch-specific category.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category Name</label>
                  <Input required value={data.name} onChange={e => setData('name', e.target.value)} className="h-10 font-bold" />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                  <Input value={data.description} onChange={e => setData('description', e.target.value)} className="h-10 text-xs font-medium" />
               </div>

               {isAdmin && (
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Owning Branch</label>
                     <Select value={String(data.branch_id)} onValueChange={val => setData('branch_id', val)}>
                        <SelectTrigger className="h-10 bg-muted/50 border-none ring-1 ring-black/5 font-bold">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {branches.map((b: any) => (
                              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               )}

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
                  }} className="h-10 file:font-bold file:text-[10px] file:uppercase font-medium" />
               </div>

               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={processing} className="font-black uppercase tracking-widest px-8">Update Details</Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Delete */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
           <DialogContent>
              <DialogHeader>
                 <DialogTitle className="text-xl font-black uppercase tracking-tight text-destructive">Delete Confirmation</DialogTitle>
                 <DialogDescription className="text-sm font-bold text-muted-foreground leading-relaxed">
                   Are you sure you want to remove <span className="text-foreground font-black">"{selectedCategory?.name}"</span>? 
                   This will NOT delete the products inside, but they will be left without a category.
                 </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-4">
                 <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>No, Keep it</Button>
                 <Button variant="destructive" onClick={handleDeleteSubmit} disabled={processing} className="font-black uppercase tracking-widest">Yes, Delete Forever</Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>

        <ResultModal open={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} type={resultModal.type} title={resultModal.title} message={resultModal.message} />
      </div>
    </AppLayout>
  );
}
