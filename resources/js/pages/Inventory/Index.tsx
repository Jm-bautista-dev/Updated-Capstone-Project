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
  FiRefreshCw,
  FiMapPin,
  FiGrid,
  FiMaximize2,
  FiMinimize2,
  FiZap
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
  Tooltip,
  TooltipTrigger,
  TooltipContent
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
  const [expandedBranches, setExpandedBranches] = useState<string[]>([]);

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

  // --- Grouped Data by Branch ---
  const groupedData = useMemo(() => {
    const groups: Record<string, InventoryRow[]> = {};
    filteredData.forEach(item => {
      const bName = item.branch_name || 'Unassigned';
      if (!groups[bName]) groups[bName] = [];
      groups[bName].push(item);
    });
    return groups;
  }, [filteredData]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Group paginated data for display
  const paginatedGroups = useMemo(() => {
    const groups: Record<string, InventoryRow[]> = {};
    paginatedData.forEach(item => {
      const bName = item.branch_name || 'Unassigned';
      if (!groups[bName]) groups[bName] = [];
      groups[bName].push(item);
    });
    return groups;
  }, [paginatedData]);

  // Auto-expand logic: Expand branch with lowest stock health
  useEffect(() => {
    if (Object.keys(paginatedGroups).length > 0 && expandedBranches.length === 0) {
      const branchesWithScores = Object.entries(paginatedGroups).map(([name, rows]) => {
        const lowCount = rows.filter(r => r.is_low_stock || r.is_out_of_stock).length;
        return { name, score: lowCount };
      });
      const topPriority = branchesWithScores.sort((a, b) => b.score - a.score)[0];
      if (topPriority) setExpandedBranches([topPriority.name]);
    }
  }, [paginatedGroups]);

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

  const toggleBranch = (branchName: string) => {
    setExpandedBranches(prev => 
      prev.includes(branchName) 
        ? prev.filter(b => b !== branchName) 
        : [...prev, branchName]
    );
  };

  const rowKey = (row: InventoryRow) => `${row.id}-${row.branch_id}`;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Maki Desu Inventory Intelligence" />
      <TooltipProvider>
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background dark:bg-zinc-950">

          {/* ── Header Layer ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 sm:px-8 bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FiPackage className="text-primary size-5" />
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-foreground dark:text-white">Inventory Catalog</h1>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-zinc-500 tracking-widest">
                Global Network Intelligence & Per-Branch Asset Management
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <Select
                  value={currentBranchId ? String(currentBranchId) : 'all'}
                  onValueChange={handleBranchFilter}
                >
                  <SelectTrigger className="w-full sm:w-48 h-11 bg-card dark:bg-zinc-800/50 border-none ring-1 ring-border shadow-sm font-black text-[10px] uppercase tracking-widest italic">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border shadow-2xl">
                    <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest py-3">Global View</SelectItem>
                    {branchList.map(b => (
                      <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase tracking-widest py-3">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground dark:text-zinc-500" />
                <Input
                  placeholder="Search item or location..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-11 bg-card dark:bg-zinc-800/50 focus:bg-background dark:focus:bg-zinc-900 transition-all border-none ring-1 ring-border group-hover:ring-primary/40 text-[11px] font-bold uppercase tracking-tight"
                />
              </div>
              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="w-full sm:w-32 h-11 bg-card dark:bg-zinc-800/50 border-none ring-1 ring-border shadow-sm font-black text-[10px] uppercase tracking-widest italic">
                  <SelectValue placeholder="Scale" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border shadow-2xl">
                  <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest py-3">All Scales</SelectItem>
                  <SelectItem value="g" className="text-[10px] font-bold uppercase tracking-widest py-3">g (Mass)</SelectItem>
                  <SelectItem value="ml" className="text-[10px] font-bold uppercase tracking-widest py-3">ml (Volume)</SelectItem>
                  <SelectItem value="pcs" className="text-[10px] font-bold uppercase tracking-widest py-3">pcs (Count)</SelectItem>
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button onClick={handleAdd} className="h-11 gap-2 shadow-lg shadow-primary/20 rounded-xl px-5 font-black uppercase text-[10px] tracking-widest italic">
                  <FiPlus className="size-4" /> <span className="hidden sm:inline">Initialize Asset</span>
                </Button>
              )}
            </div>
          </div>

          {/* ── Content Layer ── */}
          <div className="flex-1 overflow-auto p-6 sm:p-8 space-y-8 scroll-smooth no-scrollbar">
            
            {/* Global Stats Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30 p-6 rounded-3xl border shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 size-24 bg-primary blur-3xl opacity-10" />
                                <div className="flex items-center justify-between mb-4">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Unique Assets</p>
                                     <FiGrid className="size-5 text-primary" />
                                </div>
                                <h3 className="text-3xl font-black text-foreground dark:text-white tabular-nums">{stats.total}</h3>
                                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase mt-2 tracking-widest">Cross-Network Ingredients</p>
                 </div>
                 <div className="bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30 p-6 rounded-3xl border shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 size-24 bg-amber-500 blur-3xl opacity-10" />
                                <div className="flex items-center justify-between mb-4">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-500/70">Threshold Warning</p>
                                     <FiAlertTriangle className="size-5 text-amber-500" />
                                </div>
                                <h3 className="text-3xl font-black text-amber-600 dark:text-amber-500 tabular-nums">{stats.low_stock}</h3>
                                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase mt-2 tracking-widest">Rows requiring restocking</p>
                 </div>
                 <div className="bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 dark:border-rose-500/30 p-6 rounded-3xl border shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 size-24 bg-rose-500 blur-3xl opacity-10" />
                                <div className="flex items-center justify-between mb-4">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600/70 dark:text-rose-500/70">Critical Depletion</p>
                                     <FiSlash className="size-5 text-rose-500" />
                                </div>
                                <h3 className="text-3xl font-black text-rose-600 dark:text-rose-500 tabular-nums">{stats.out_of_stock}</h3>
                                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase mt-2 tracking-widest">Items currently inaccessible</p>
                 </div>
            </div>

            {/* Grouped Branch View */}
            <div className="space-y-6">
              {paginatedData.length === 0 ? (
                <Card className="p-20 text-center border-dashed border-2 bg-card/50">
                   <div className="flex flex-col items-center gap-4">
                      <FiSearch className="size-12 text-muted-foreground opacity-20" />
                      <div>
                        <p className="text-xl font-black italic uppercase tracking-tighter text-muted-foreground">No matching intelligence found</p>
                        <p className="text-xs font-bold text-muted-foreground/60 uppercase mt-1">Adjust filters or refine your search query</p>
                      </div>
                      <Button variant="outline" onClick={() => {setSearch(''); setFilterUnit('all');}} className="mt-4 font-black uppercase text-[10px] tracking-widest italic">Clear Spectrum Filters</Button>
                   </div>
                </Card>
              ) : (
                Object.entries(paginatedGroups).map(([branchName, items]) => (
                  <Card key={branchName} className={cn(
                    "border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/40 overflow-hidden transition-all duration-500",
                    expandedBranches.includes(branchName) ? "ring-primary/40 shadow-xl" : "hover:ring-border/80"
                  )}>
                    <CardHeader 
                      className="p-6 cursor-pointer select-none relative group"
                      onClick={() => toggleBranch(branchName)}
                    >
                      <div className="absolute top-0 left-0 h-full w-1 bg-primary transform origin-bottom transition-transform duration-500" style={{ transform: expandedBranches.includes(branchName) ? 'scaleY(1)' : 'scaleY(0)' }} />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                           <div className={cn(
                             "size-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                             expandedBranches.includes(branchName) ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted/50 dark:bg-zinc-800 text-muted-foreground"
                           )}>
                              <FiMapPin className="size-5" />
                           </div>
                           <div>
                              <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                                {branchName}
                                {items.some(i => i.is_out_of_stock) && <Badge className="bg-rose-500 text-white border-none font-black text-[9px] uppercase tracking-widest shadow-lg shadow-rose-500/30 ring-1 ring-rose-500/20">Critical</Badge>}
                              </h2>
                              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mt-0.5">Location ID Asset Stream</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-8 px-8 border-x border-border/40">
                                <div className="text-center">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Total</p>
                                    <p className="text-sm font-black italic text-foreground dark:text-white tabular-nums leading-none">{items.length}</p> 
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black uppercase text-amber-600/70 tracking-widest leading-none mb-1">Low</p>
                                    <p className="text-sm font-black italic text-amber-600 tabular-nums leading-none">{items.filter(i => i.is_low_stock && !i.is_out_of_stock).length}</p> 
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black uppercase text-rose-600/70 tracking-widest leading-none mb-1">Out</p>
                                    <p className="text-sm font-black italic text-rose-600 tabular-nums leading-none">{items.filter(i => i.is_out_of_stock).length}</p> 
                                </div>
                           </div>

                           <div className="flex items-center gap-3">
                              {items.some(i => i.is_low_stock || i.is_out_of_stock) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest italic gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary transition-all"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const firstCritical = items.find(i => i.is_out_of_stock) || items.find(i => i.is_low_stock);
                                        if (firstCritical) openStockInModal(firstCritical);
                                      }}
                                    >
                                      <FiRefreshCw className="size-3 animate-spin-slow" /> Quick Restock
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-primary text-white border-none font-bold text-[10px] uppercase">Initialize restock for most critical item</TooltipContent>
                                </Tooltip>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("size-9 rounded-xl transition-all duration-300", expandedBranches.includes(branchName) ? "bg-primary/10 text-primary rotate-180" : "bg-muted/30")}
                              >
                                <FiChevronDown className="size-4" />
                              </Button>
                           </div>
                        </div>
                      </div>
                    </CardHeader>

                    <AnimatePresence>
                      {expandedBranches.includes(branchName) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        >
                          <CardContent className="p-0 border-t border-border/40">
                             <div className="overflow-x-auto overflow-y-hidden">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-border/40 bg-muted/20 dark:bg-black/20">
                                      <th className="h-12 w-14"></th>
                                      {[
                                        { label: 'Asset Entity', key: 'name' },
                                        { label: 'Scale', key: 'unit' },
                                        { label: 'In-Hand Stock', key: 'stock' },
                                        { label: 'Status Matrix', key: null },
                                        { label: 'Operations', key: null },
                                      ].map((col, idx) => (
                                        <th key={idx} className="h-12 px-6 text-left align-middle">
                                          {col.key ? (
                                            <button
                                              onClick={() => toggleSort(col.key!)}
                                              className="flex items-center gap-2 group"
                                            >
                                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary transition-colors">{col.label}</span>
                                              {sortBy === col.key
                                                ? sortOrder === 'asc'
                                                  ? <FiArrowUp className="text-primary size-3" />
                                                  : <FiArrowDown className="text-primary size-3" />
                                                : <FiArrowUp className="opacity-0 group-hover:opacity-30 size-3 text-muted-foreground" />
                                              }
                                            </button>
                                          ) : <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{col.label}</span>}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/20">
                                      {items.map(item => {
                                          const key = rowKey(item);
                                          const isExpanded = expandedRowKey === key;
                                          const isCritical = item.is_low_stock || item.is_out_of_stock;

                                          return (
                                            <React.Fragment key={key}>
                                              <tr 
                                                className={cn(
                                                  'group hover:bg-muted/30 dark:hover:bg-primary/[0.02] cursor-pointer transition-all duration-200 h-16',
                                                  isExpanded && 'bg-primary/[0.04]',
                                                  isCritical && 'bg-amber-500/[0.02] dark:bg-amber-500/[0.01]'
                                                )}
                                                onClick={() => setExpandedRowKey(isExpanded ? null : key)}
                                              >
                                                <td className="w-14 text-center">
                                                   <div className={cn(
                                                     "size-6 mx-auto rounded-lg flex items-center justify-center transition-all",
                                                     isExpanded ? "bg-primary text-white" : "bg-muted text-muted-foreground/40 group-hover:bg-primary/20 group-hover:text-primary"
                                                   )}>
                                                      {isExpanded ? <FiMaximize2 className="size-3" /> : <FiChevronRight className="size-3" />}
                                                   </div>
                                                </td>
                                                <td className="px-6 align-middle">
                                                   <div className="flex flex-col">
                                                      <span className={cn("text-sm font-black italic uppercase tracking-tighter tracking-tight transition-colors tabular-nums", isExpanded ? "text-primary" : "text-foreground group-hover:text-primary")}>{item.name}</span>
                                                      <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">#ING-{item.id.toString().padStart(4, '0')}</span>
                                                   </div>
                                                </td>
                                                <td className="px-6 align-middle">
                                                  <Badge variant="outline" className="bg-muted/50 dark:bg-zinc-800 border-none px-2 rounded-lg font-black text-[9px] uppercase tabular-nums tracking-widest italic">{item.unit}</Badge>
                                                </td>
                                                <td className="px-6 align-middle">
                                                   <div className="flex items-baseline gap-1.5">
                                                      <span className={cn("font-black text-lg italic tracking-tighter tabular-nums", isCritical ? "text-rose-600 dark:text-rose-500" : "text-foreground")}>
                                                        {Number(item.stock).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                                                      </span>
                                                      <span className="text-[9px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">{item.unit}</span>
                                                   </div>
                                                </td>
                                                <td className="px-6 align-middle">
                                                   <div className="flex">
                                                      {item.is_out_of_stock ? (
                                                        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full ring-1 ring-rose-500/20">Depleted</Badge>
                                                      ) : item.is_low_stock ? (
                                                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full ring-1 ring-amber-500/20">Critical Alert</Badge>
                                                      ) : (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full ring-1 ring-emerald-500/20">Optimal</Badge>
                                                      )}
                                                   </div>
                                                </td>
                                                <td className="px-6 align-middle text-right">
                                                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 duration-200" onClick={e => e.stopPropagation()}>
                                                      <Button variant="outline" size="icon" className="size-9 rounded-xl border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={() => openStockInModal(item)}>
                                                          <FiRefreshCw className="size-4" />
                                                      </Button>
                                                      {isAdmin && (
                                                        <Button variant="outline" size="icon" className="size-9 rounded-xl border-border/40 hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500/30" onClick={() => handleEdit(item)}>
                                                            <FiEdit2 className="size-4" />
                                                        </Button>
                                                      )}
                                                      {isAdmin && (
                                                        <Button variant="outline" size="icon" className="size-9 rounded-xl border-border/40 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30" onClick={() => handleDelete(item)}>
                                                            <FiTrash2 className="size-4" />
                                                        </Button>
                                                      )}
                                                   </div>
                                                </td>
                                              </tr>
                                              <AnimatePresence>
                                                {isExpanded && (
                                                  <motion.tr
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="bg-muted/10 dark:bg-black/20"
                                                  >
                                                     <td colSpan={6} className="p-0 border-b border-border/40 border-dashed">
                                                        <div className="px-14 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                                                            <div className="absolute top-0 left-[2.4rem] h-full w-0.5 bg-primary/20" />
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Global Asset Metadata</span>
                                                                    <div className="flex items-center gap-3">
                                                                       <Badge variant="outline" className="font-mono text-xs font-black bg-background dark:bg-zinc-800/80 px-2 py-1 rounded-lg border-primary/20 text-primary">#ING-{item.id.toString().padStart(4, '0')}</Badge>
                                                                       <span className="text-[11px] font-bold text-muted-foreground">{item.name} General Specs</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Safety Variance</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-black italic uppercase tracking-tighter">{item.low_stock_level} {item.unit}</span>
                                                                        <span className="text-[9px] font-bold text-muted-foreground/60 leading-none lowercase">threshold per node</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-end items-center">
                                                                <Button variant="default" className="shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest italic rounded-xl px-6 h-10 gap-2" onClick={() => openStockInModal(item)}>
                                                                   <FiPackage className="size-4" /> Stock Control
                                                                </Button>
                                                            </div>
                                                        </div>
                                                     </td>
                                                  </motion.tr>
                                                )}
                                              </AnimatePresence>
                                            </React.Fragment>
                                          );
                                      })}
                                  </tbody>
                                </table>
                             </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination Zone */}
            <div className="p-8 bg-card dark:bg-zinc-900 border border-border shadow-xl rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black italic uppercase text-muted-foreground/60 tracking-widest">Density Control</span>
                    <Select value={String(itemsPerPage)} onValueChange={val => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[80px] h-10 rounded-xl border-none bg-muted/50 dark:bg-zinc-800 shadow-inner font-black text-xs ring-1 ring-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 25, 50].map(val => (
                          <SelectItem key={val} value={String(val)} className="text-xs font-bold">{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-[10px] font-black italic uppercase text-primary tracking-widest flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                    Viewing {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}–{Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} records
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl h-11 w-11 ring-1 ring-border bg-muted/20 hover:bg-primary/10 transition-all">
                    <FiChevronLeft className="size-5" />
                  </Button>
                  <div className="flex items-center gap-1 mx-2">
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
                            'h-11 w-11 rounded-xl font-black italic text-[11px] transition-all transform duration-300',
                            currentPage === pageNum ? 'bg-primary shadow-[0_8px_20px_rgba(99,102,241,0.4)] scale-110 text-white' : 'hover:bg-muted text-muted-foreground'
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="ghost" size="icon" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl h-11 w-11 ring-1 ring-border bg-muted/20 hover:bg-primary/10 transition-all">
                    <FiChevronRight className="size-5" />
                  </Button>
                </div>
            </div>
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
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
               <FiPackage className="text-primary size-5" /> {isEditModalOpen ? 'Asset Modification' : 'Initialize Global Asset'}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
              {isEditModalOpen
                ? 'Update the architectural specifications for this global entity.'
                : 'Define a new global inventory entity. Stock logic is distributed per node.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={isEditModalOpen ? submitEdit : submitAdd} className="space-y-6 pt-6">
            <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <div className="size-1 rounded-full bg-primary" /> Entity Designation
                </label>
                <Input
                    required
                    maxLength={50}
                    value={data.name}
                    onChange={e => {
                    const cleaned = e.target.value.replace(/[^A-Za-z0-9\s]/g, '');
                    setData('name', cleaned);
                    }}
                    placeholder="e.g. Premium Ramen Flour"
                    className={cn("h-11 bg-muted/50 rounded-xl border-none ring-1 ring-border focus:ring-primary/50 font-bold", errors.name && "ring-destructive/50")}
                />
                {errors.name && <p className="text-[9px] text-destructive font-bold uppercase tracking-widest mt-1 ml-1">{errors.name}</p>}
                </div>

                {/* Unit */}
                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <div className="size-1 rounded-full bg-primary" /> Measurement Scale
                </label>
                <Select value={data.unit} onValueChange={val => setData('unit', val)}>
                    <SelectTrigger className={cn("w-full h-11 bg-muted/50 rounded-xl border-none ring-1 ring-border shadow-none font-bold", errors.unit && "ring-destructive/50")}>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl">
                    <SelectItem value="g" className="text-xs font-bold py-2.5">g (Gram Unit)</SelectItem>
                    <SelectItem value="ml" className="text-xs font-bold py-2.5">ml (Milliliter Unit)</SelectItem>
                    <SelectItem value="pcs" className="text-xs font-bold py-2.5">pcs (Discrete Count)</SelectItem>
                    <SelectItem value="kg" className="text-xs font-bold py-2.5">kg (Auto-normalized to g)</SelectItem>
                    <SelectItem value="liters" className="text-xs font-bold py-2.5">liters (Auto-normalized to ml)</SelectItem>
                    </SelectContent>
                </Select>
                </div>

                {/* Initial Stock Matrix */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <div className="size-1 rounded-full bg-primary" /> {isEditModalOpen ? 'Vector Adjust' : 'Baseline Stock'}
                        </label>
                        <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1000000"
                        required
                        value={data.stock}
                        onChange={e => setData('stock', e.target.value)}
                        className={cn("h-11 bg-muted/50 rounded-xl border-none ring-1 ring-border font-bold tabular-nums")}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <div className="size-1 rounded-full bg-rose-500" /> Variance Trigger
                        </label>
                        <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10000"
                        required
                        value={data.low_stock_level}
                        onChange={e => setData('low_stock_level', e.target.value)}
                        placeholder="e.g. 500"
                        className={cn("h-11 bg-muted/50 rounded-xl border-none ring-1 ring-border font-bold tabular-nums")}
                        />
                    </div>
                </div>

                {/* Distribution (add mode) */}
                {isAdmin && !isEditModalOpen && (
                <div className="space-y-4 border-t border-border/40 pt-6">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-primary" /> Hub Distribution Strategy
                        </label>
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest ml-3">
                            Define which network nodes will host this asset.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                    {branchList.map(branch => {
                        const isSelected = data.branch_ids.includes(branch.id.toString());
                        return (
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
                                    'cursor-pointer px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-3',
                                    isSelected
                                    ? 'bg-primary/10 border-primary/50 text-foreground ring-4 ring-primary/5'
                                    : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60 opacity-60'
                                )}
                            >
                                <div className={cn(
                                    'size-2 rounded-full shadow-inner',
                                    isSelected ? 'bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-muted-foreground/30'
                                )} />
                                <span className={cn("text-[10px] font-black italic uppercase tracking-tighter", isSelected && "text-primary")}>{branch.name}</span>
                            </div>
                        );
                    })}
                    {data.branch_ids.length === 0 && (
                        <div className="w-full flex items-center gap-2 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                            <FiCheckCircle className="size-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">Global Strategy: Deployed to all nodes</span>
                        </div>
                    )}
                    </div>
                </div>
                )}

                {/* Node selection (edit mode) */}
                {isAdmin && isEditModalOpen && (
                <div className="space-y-2 border-t border-border/40 pt-6">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <div className="size-1 rounded-full bg-primary" /> Targeted Asset Override
                    </label>
                    <Select value={data.branch_id} onValueChange={val => setData('branch_id', val)}>
                    <SelectTrigger className="w-full h-11 bg-muted/50 rounded-xl border-none ring-1 ring-border font-bold">
                        <SelectValue placeholder="Select target hub..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        {branchList.map(b => (
                        <SelectItem key={b.id} value={String(b.id)} className="text-xs font-bold py-2.5">{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                )}
            </div>

            <DialogFooter className="pt-6 border-t border-border/40 gap-3">
              <Button type="button" variant="ghost" className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest hover:bg-muted/80 underline underline-offset-4 decoration-border" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); reset(); }}>
                Abort
              </Button>
              <Button 
                type="submit" 
                disabled={processing || !data.name || !data.stock || !data.low_stock_level || !!errors.name || !!errors.stock || !!errors.low_stock_level || !!(errors as any).initial_stock}
                className="rounded-xl h-11 px-8 gap-3 shadow-[0_10px_25px_-5px_rgba(99,102,241,0.4)] font-black uppercase text-[10px] tracking-widest italic"
              >
                {processing ? <FiRefreshCw className="size-4 animate-spin" /> : <FiZap className="size-4" />}
                {isEditModalOpen ? 'Commit Changes' : 'Initialize Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8">
          <DialogHeader className="items-center text-center">
            <div className="size-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6 group">
                 <div className="size-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <FiTrash2 className="size-10" />
                 </div>
            </div>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-rose-600">
              Terminate Entity?
            </DialogTitle>
            <DialogDescription className="pt-4 text-sm font-medium text-muted-foreground/80 leading-relaxed max-w-[300px]">
              Confirm decommissioning for <span className="font-black italic text-foreground uppercase tracking-tight">"{selectedRow?.name}"</span>? 
              This will irreversibly purge the global architectural specification and all distributed node stock.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-10 flex flex-col sm:flex-row gap-3">
            <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-muted/50" onClick={() => setIsDeleteModalOpen(false)}>Abort Purge</Button>
            <Button variant="destructive" className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-rose-500/30" onClick={submitDelete} disabled={processing}>Confirm Deletion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Add simple icons for the intelligence cards
function FiCheckCircle(props: any) {
  return (
    <svg 
      stroke="currentColor" 
      fill="none" 
      strokeWidth="2" 
      viewBox="0 0 24 24" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      height="1em" 
      width="1em" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}

// Add CSS to hide scrollbar but allow functional scrolling
const scrollbarHideStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(scrollbarHideStyles));
  document.head.appendChild(style);
}
