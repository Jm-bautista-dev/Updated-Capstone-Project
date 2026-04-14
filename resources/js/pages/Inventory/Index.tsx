import { Head, usePage, useForm } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import React, { useState, useMemo, useEffect } from 'react';
import { ResultModal } from '@/components/result-modal';
import type { BreadcrumbItem } from '@/types';
import {
  FiPackage,
  FiAlertTriangle,
  FiSlash,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiRefreshCw
} from 'react-icons/fi';
import { StockInModal } from '@/components/stock-in-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory', href: '/dashboard' },
];

/** One row in the inventory table = one ingredient × one branch */
type InventoryRow = {
  id: number;        // ingredient.id (global)
  stock_id: number | null; // ingredient_stocks.id
  name: string;
  unit: string;
  branch_id: number;
  branch_name: string | null;
  stock: number;
  low_stock_level: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
};

type Branch = { id: number; name: string };

export default function InventoryIndex() {
  const { inventory: rawInventory, branches, currentBranchId, isAdmin, stats: serverStats } = usePage().props as any;
  const inventory: InventoryRow[] = rawInventory || [];
  const branchList: Branch[] = branches || [];

  // Branch filter handler
  const handleBranchFilter = (value: string) => {
    router.get('/inventory', { branch_id: value === 'all' ? '' : value }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // --- Sync Channel ---
  const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'inventory-updated' || e.data.type === 'products-updated') {
        router.reload({ only: ['inventory', 'stats'] });
      }
    };
    stateChannel.addEventListener('message', handleMessage);
    const handleFocus = () => router.reload({ only: ['inventory', 'stats'] });
    window.addEventListener('focus', handleFocus);
    return () => {
      stateChannel.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [stateChannel]);

  // --- State ---
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
    type: 'success', title: '', message: '',
  });
  const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null);

  const openStockInModal = (row: InventoryRow) => {
    setSelectedRow(row);
    setIsStockInModalOpen(true);
  };

  const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
    name: '',
    unit: 'g',
    stock: '0',
    low_stock_level: '5',
    branch_id: currentBranchId ? String(currentBranchId) : '',
    branch_ids: [] as string[],
  });

  // --- Stats ---
  const stats = useMemo(() => {
    if (serverStats) return serverStats;
    const total = [...new Set(inventory.map(i => i.id))].length;
    const low   = inventory.filter(i => i.is_low_stock).length;
    const out   = inventory.filter(i => i.is_out_of_stock).length;
    return { total, low_stock: low, out_of_stock: out };
  }, [inventory, serverStats]);

  // --- Filtered & Sorted ---
  const filteredData = useMemo(() => {
    return inventory
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.branch_name ?? '').toLowerCase().includes(search.toLowerCase());
        const matchesUnit   = filterUnit === 'all' || item.unit === filterUnit;
        return matchesSearch && matchesUnit;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy as keyof InventoryRow];
        let valB: any = b[sortBy as keyof InventoryRow];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [inventory, search, filterUnit, sortBy, sortOrder]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); setExpandedRowKey(null); }, [search, filterUnit]);

  // --- Handlers ---
  const handleAdd = () => { reset(); setIsAddModalOpen(true); };

  const handleEdit = (row: InventoryRow) => {
    setSelectedRow(row);
    setData({
      name: row.name,
      unit: row.unit,
      stock: String(row.stock),
      low_stock_level: String(row.low_stock_level ?? 5),
      branch_id: row.branch_id ? String(row.branch_id) : '',
      branch_ids: [],
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (row: InventoryRow) => { setSelectedRow(row); setIsDeleteModalOpen(true); };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    router.post('/inventory', {
      name: data.name,
      unit: data.unit,
      initial_stock: Number(data.stock),
      low_stock_level: Number(data.low_stock_level),
      branch_id: data.branch_id ? Number(data.branch_id) : undefined,
      branch_ids: data.branch_ids.length > 0 ? data.branch_ids.map(Number) : undefined,
    }, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
        stateChannel.postMessage({ type: 'inventory-updated' });
        setResultModal({ type: 'success', title: 'Ingredient Added', message: 'The global ingredient and its branch stock have been created.' });
        setIsResultModalOpen(true);
      },
    });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    router.put(`/inventory/${selectedRow?.id}`, {
      name: data.name,
      unit: data.unit,
      branch_id: data.branch_id ? Number(data.branch_id) : undefined,
      stock: Number(data.stock),
      low_stock_level: Number(data.low_stock_level),
    }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        reset();
        stateChannel.postMessage({ type: 'inventory-updated' });
        setResultModal({ type: 'success', title: 'Ingredient Updated', message: 'Ingredient and stock record have been updated.' });
        setIsResultModalOpen(true);
      },
    });
  };

  const submitDelete = () => {
    router.delete(`/inventory/${selectedRow?.id}`, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        stateChannel.postMessage({ type: 'inventory-updated' });
        setResultModal({ type: 'success', title: 'Ingredient Deleted', message: 'The ingredient and all its branch stock records have been removed.' });
        setIsResultModalOpen(true);
      },
    });
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
  };

  const rowKey = (row: InventoryRow) => `${row.id}-${row.branch_id}`;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory Catalog" />
      <TooltipProvider>
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-muted/20">

          {/* ── Header Bar ──────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-background border-b flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inventory Catalog</h1>
              <p className="text-sm text-muted-foreground">
                Global ingredients with per-branch stock levels. One ingredient = one record.
              </p>
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
                    {branchList.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search ingredient or branch..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors"
                />
              </div>
              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="w-full sm:w-32 h-10 bg-muted/50">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button onClick={handleAdd} className="h-10 gap-2 shadow-lg shadow-primary/20">
                  <FiPlus className="size-4" /> <span className="hidden sm:inline">Add Ingredient</span>
                </Button>
              )}
            </div>
          </div>

          {/* ── Content ─────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col gap-6">

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3 flex-shrink-0">
              <Card className="bg-primary/5 border-primary/20 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Global Ingredients
                  </CardTitle>
                  <FiPackage className="size-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{stats.total}</div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Unique ingredients</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock</CardTitle>
                  <FiAlertTriangle className="size-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-amber-600">{stats.low_stock}</div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Branch rows low</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Out of Stock</CardTitle>
                  <FiSlash className="size-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-destructive">{stats.out_of_stock}</div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Branch rows depleted</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Table — Option A: Ingredient | Branch | Stock ─────────── */}
            <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-none ring-1 ring-black/5 flex-shrink min-h-0">
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 w-10"></th>
                      {[
                        { label: 'Ingredient', key: 'name' },
                        { label: 'Unit', key: 'unit' },
                        { label: 'Branch', key: 'branch_name' },
                        { label: 'Stock', key: 'stock' },
                        { label: 'Status', key: null },
                        { label: 'Actions', key: null },
                      ].map((col, idx) => (
                        <th key={idx} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          {col.key ? (
                            <button
                              onClick={() => toggleSort(col.key!)}
                              className="flex items-center gap-2 hover:text-foreground transition-colors group"
                            >
                              {col.label}
                              {sortBy === col.key
                                ? sortOrder === 'asc'
                                  ? <FiArrowUp className="text-blue-500 size-3" />
                                  : <FiArrowDown className="text-blue-500 size-3" />
                                : <FiArrowUp className="opacity-0 group-hover:opacity-30 size-3" />
                              }
                            </button>
                          ) : col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/50">
                    <AnimatePresence>
                      {paginatedData.length === 0 ? (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan={7} className="p-20 text-center text-muted-foreground italic text-lg">
                            No items matching your criteria.
                          </td>
                        </motion.tr>
                      ) : (
                        paginatedData.flatMap(item => {
                          const key = rowKey(item);
                          const isExpanded = expandedRowKey === key;

                          const mainRow = (
                            <motion.tr
                              key={`row-${key}`}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={cn(
                                'border-b transition-colors hover:bg-muted/40 group cursor-pointer',
                                isExpanded ? 'bg-primary/5' : ''
                              )}
                              onClick={() => setExpandedRowKey(isExpanded ? null : key)}
                            >
                              <td className="p-4 align-middle text-center">
                                {isExpanded
                                  ? <FiChevronDown className="text-primary size-4" />
                                  : <FiChevronRight className="text-muted-foreground/30 size-4" />
                                }
                              </td>
                              {/* Ingredient name */}
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold text-xs shadow-inner">
                                    {item.name.charAt(0)}
                                  </div>
                                  <span className="font-semibold">{item.name}</span>
                                </div>
                              </td>
                              {/* Unit */}
                              <td className="p-4 align-middle">
                                <Badge variant="outline" className="bg-primary/5 border-primary/10 text-[10px] font-bold">
                                  {item.unit}
                                </Badge>
                              </td>
                              {/* Branch */}
                              <td className="p-4 align-middle">
                                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold dark:bg-slate-800 dark:text-slate-200">
                                  {item.branch_name || '—'}
                                </Badge>
                              </td>
                              {/* Stock */}
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm">
                                    {Number(item.stock).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium uppercase">{item.unit}</span>
                                </div>
                              </td>
                              {/* Status */}
                              <td className="p-4 align-middle">
                                {item.is_out_of_stock ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold">
                                    Out of Stock
                                  </Badge>
                                ) : item.is_low_stock ? (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">
                                    ⚠ Low Stock
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                                    In Stock
                                  </Badge>
                                )}
                              </td>
                              {/* Actions */}
                              <td className="p-4 align-middle text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => openStockInModal(item)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="Restock this branch"
                                  >
                                    <FiRefreshCw className="size-4" />
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <FiEdit2 className="size-4" />
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDelete(item)}
                                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                      <FiTrash2 className="size-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );

                          const expandedRow = isExpanded && (
                            <motion.tr
                              key={`expand-${key}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="bg-muted/30"
                            >
                              <td colSpan={7} className="p-0 overflow-hidden">
                                <div className="px-12 py-5 grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-dashed border-primary/20">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Ingredient ID</span>
                                    <span className="font-mono text-xs font-semibold bg-background px-2 py-1 rounded border w-fit">
                                      #ING-{item.id.toString().padStart(4, '0')}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Branch</span>
                                    <span className="text-xs font-semibold">{item.branch_name || '—'}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Low Stock Threshold</span>
                                    <span className="text-xs font-semibold">{item.low_stock_level} {item.unit}</span>
                                  </div>
                                  <div className="flex justify-end items-start">
                                    <Button variant="outline" size="sm" onClick={() => openStockInModal(item)} className="h-8 font-bold text-xs gap-2">
                                      <FiRefreshCw className="size-3" /> Restock Branch
                                    </Button>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          );

                          return [mainRow, expandedRow].filter(Boolean);
                        })
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 bg-muted/5 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Show</span>
                    <Select value={String(itemsPerPage)} onValueChange={val => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[70px] h-8 rounded-lg border-none bg-background shadow-sm font-bold text-xs ring-1 ring-muted">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 25, 50].map(val => (
                          <SelectItem key={val} value={String(val)} className="text-xs">{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}–{Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} rows
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-lg h-9 w-9 ring-1 ring-muted">
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
                            'h-9 w-9 rounded-lg font-bold text-[10px] transition-all',
                            currentPage === pageNum ? 'bg-primary shadow-lg shadow-primary/20 text-white' : 'hover:bg-muted'
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="ghost" size="icon" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="rounded-lg h-9 w-9 ring-1 ring-muted">
                    <FiChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </TooltipProvider>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <ResultModal
        open={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
      />

      <StockInModal
        open={isStockInModalOpen}
        onOpenChange={setIsStockInModalOpen}
        item={selectedRow}
        type="ingredient"
      />

      {/* ── Add/Edit Ingredient Modal ────────────────────────────────────── */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={open => {
        if (!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); reset(); }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? 'Edit Ingredient' : 'Add Global Ingredient'}</DialogTitle>
            <DialogDescription>
              {isEditModalOpen
                ? 'Update the global ingredient name/unit and optionally adjust its stock for this branch.'
                : 'Create a global ingredient. Stock is tracked separately per branch.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={isEditModalOpen ? submitEdit : submitAdd} className="space-y-4 pt-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ingredient Name <span className="text-destructive">*</span></label>
              <Input
                required
                maxLength={100}
                value={data.name}
                onChange={e => {
                  const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, '');
                  setData('name', cleaned);
                }}
                placeholder="e.g. Flour"
                className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.name ? (
                <p className="text-xs text-destructive font-medium">{errors.name}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">
                  Letters and spaces only. Max 100 chars.
                </p>
              )}
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Type <span className="text-destructive">*</span></label>
              <Select value={data.unit} onValueChange={val => setData('unit', val)}>
                <SelectTrigger className={cn("w-full h-9 border-muted-foreground/20", errors.unit && "border-destructive")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g (Gram)</SelectItem>
                  <SelectItem value="ml">ml (Milliliter)</SelectItem>
                  <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                  <SelectItem value="kg">kg (Kilogram — normalized to g)</SelectItem>
                  <SelectItem value="liters">liters — normalized to ml</SelectItem>
                </SelectContent>
              </Select>
              {errors.unit && <p className="text-xs text-destructive font-medium">{errors.unit}</p>}
            </div>

            {/* Initial Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isEditModalOpen ? 'Adjust Stock' : 'Initial Stock'} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10000"
                  required
                  value={data.stock}
                  onChange={e => setData('stock', e.target.value)}
                  className={cn(errors.stock || (errors as any).initial_stock ? "border-destructive focus-visible:ring-destructive" : "")}
                />
                {(errors.stock || (errors as any).initial_stock) && (
                  <p className="text-[10px] text-destructive font-medium">{errors.stock || (errors as any).initial_stock}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Low Stock Alert At <span className="text-destructive">*</span></label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10000"
                  required
                  value={data.low_stock_level}
                  onChange={e => setData('low_stock_level', e.target.value)}
                  placeholder="e.g. 500"
                  className={cn(errors.low_stock_level && "border-destructive focus-visible:ring-destructive")}
                />
                {errors.low_stock_level && (
                  <p className="text-[10px] text-destructive font-medium">{errors.low_stock_level}</p>
                )}
              </div>
            </div>

            {/* Branch assignment (add mode only) */}
            {isAdmin && !isEditModalOpen && (
              <div className="space-y-2 border-t pt-4">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">
                  Branch Stock Assignment
                </label>
                <p className="text-[10px] text-muted-foreground uppercase font-medium ml-1">
                  Select branches to create stock rows for. (Default: All)
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {branchList.map(branch => (
                    <div
                      key={branch.id}
                      onClick={() => {
                        const ids = [...data.branch_ids];
                        const idx = ids.indexOf(branch.id.toString());
                        if (idx > -1) ids.splice(idx, 1);
                        else ids.push(branch.id.toString());
                        setData('branch_ids', ids);
                      }}
                      className={cn(
                        'cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2',
                        data.branch_ids.includes(branch.id.toString())
                          ? 'bg-primary/10 border-primary text-primary shadow-sm'
                          : 'bg-muted/30 border-muted text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'size-2 rounded-full',
                        data.branch_ids.includes(branch.id.toString()) ? 'bg-primary' : 'bg-muted-foreground/30'
                      )} />
                      {branch.name}
                    </div>
                  ))}
                  {data.branch_ids.length === 0 && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                      STOCK WILL BE CREATED FOR ALL BRANCHES
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Branch selector for edit mode */}
            {isAdmin && isEditModalOpen && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjust Stock For Branch</label>
                <Select value={data.branch_id} onValueChange={val => setData('branch_id', val)}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select branch..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branchList.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); reset(); }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={processing || !data.name || !data.stock || !data.low_stock_level || !!errors.name || !!errors.stock || !!errors.low_stock_level || !!(errors as any).initial_stock}
                className="gap-2 shadow-lg shadow-primary/20"
              >
                {processing && <FiRefreshCw className="size-3 animate-spin" />}
                {isEditModalOpen ? 'Update Ingredient' : 'Add Ingredient'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <FiTrash2 className="size-5" /> Delete Ingredient
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Are you sure you want to delete <span className="font-bold text-foreground">"{selectedRow?.name}"</span>?
              This will remove the global ingredient AND all branch stock records for it.
              Recipes that use this ingredient will also be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>No, keep it</Button>
            <Button variant="destructive" onClick={submitDelete} disabled={processing}>Yes, delete ingredient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
