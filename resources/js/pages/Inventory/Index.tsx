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
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiRefreshCw,
  FiMapPin,
  FiGrid,
  FiMaximize2,
  FiMinimize2,
  FiZap,
  FiFileText,
  FiX,
  FiDownload,
  FiTrendingUp,
  FiActivity
} from 'react-icons/fi';
import { toast } from 'sonner';
import axios from 'axios';
import { ReceiptScannerModal } from '@/components/receipt-scanner-modal';
import { MobileFilter } from '@/components/shared/mobile-filter';
import { StockInModal } from '@/components/stock-in-modal';
import { WastageModal } from '@/components/wastage-modal';
import { MassRestockModal } from '@/components/mass-restock-modal';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory', href: '/dashboard' },
];

/** One row in the inventory table = one ingredient × one branch */
type InventoryRow = {
  id: number;              // ingredient.id (global)
  stock_id: number | null; // ingredient_stocks.id
  name: string;
  unit: string;
  branch_id: number;
  branch_name: string | null;
  stock: number;
  low_stock_level: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  avg_weight_per_piece: number | null;
  cost_per_unit: number;
  display_unit?: string;
  display_stock?: number;
  display_price?: number;
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'low' | 'out' | 'updated' | 'restocked'>('all');
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
    type: 'success', title: '', message: '',
  });
  const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null);
  const [isMassRestockModalOpen, setIsMassRestockModalOpen] = useState(false);

  // Receipt Scanner States
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);
  const [activeRestockBranch, setActiveRestockBranch] = useState<{ id: number; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState('');
  const [bulkRestockQuantities, setBulkRestockQuantities] = useState<Record<number, { quantity: string, unit: string }> | undefined>(undefined);

  // Dynamic logs state for Dynamic Timestamps & Detail Drawer History
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [lastUpdatedMap, setLastUpdatedMap] = useState<Record<string, any>>({});
  const [updatedTodayCount, setUpdatedTodayCount] = useState(0);
  const [drawerLogs, setDrawerLogs] = useState<any[]>([]);
  const [loadingDrawerLogs, setLoadingDrawerLogs] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'history' | 'procurement'>('overview');

  // Load activity logs on page mount (without changing backend logic)
  const fetchActivityLogs = async () => {
    try {
      const response = await axios.get('/inventory/activity', {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Inertia': 'true',
          'X-Inertia-Partial-Component': 'Inventory/Activity',
          'X-Inertia-Partial-Data': 'logs'
        }
      });
      if (response.data?.props?.logs?.data) {
        const logs = response.data.props.logs.data;
        setRecentLogs(logs);
        
        // Build last updated lookup
        const map: Record<string, any> = {};
        let todayCount = 0;
        const todayStr = new Date().toDateString();
        
        logs.forEach((log: any) => {
          const key = `${log.ingredient_id}-${log.branch_id}`;
          if (!map[key]) {
            map[key] = log;
          }
          
          const logDate = new Date(log.created_at);
          if (logDate.toDateString() === todayStr) {
            todayCount++;
          }
        });
        
        setLastUpdatedMap(map);
        setUpdatedTodayCount(todayCount);
      }
    } catch (err) {
      console.error("Failed to load activity logs on mount:", err);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
    const handleFocus = () => fetchActivityLogs();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Fetch detailed logs when drawer opens
  useEffect(() => {
    if (isDrawerOpen && selectedRow) {
      const loadDrawerLogs = async () => {
        setLoadingDrawerLogs(true);
        try {
          const response = await axios.get('/inventory/activity', {
            params: {
              ingredient_id: selectedRow.id,
              branch_id: selectedRow.branch_id
            },
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'X-Inertia': 'true',
              'X-Inertia-Partial-Component': 'Inventory/Activity',
              'X-Inertia-Partial-Data': 'logs'
            }
          });
          if (response.data?.props?.logs?.data) {
            setDrawerLogs(response.data.props.logs.data);
          } else {
            setDrawerLogs([]);
          }
        } catch (err) {
          console.error("Failed to load drawer logs:", err);
        } finally {
          setLoadingDrawerLogs(false);
        }
      };
      loadDrawerLogs();
    } else {
      setDrawerLogs([]);
    }
  }, [isDrawerOpen, selectedRow]);

  const openStockInModal = (row: InventoryRow) => {
    setSelectedRow(row);
    setIsStockInModalOpen(true);
  };

  const openWastageModal = (row: InventoryRow) => {
    setSelectedRow(row);
    setIsWastageModalOpen(true);
  };

  const openMassRestockModal = (branchId: number, branchName: string) => {
    setActiveRestockBranch({ id: branchId, name: branchName });
    setIsMassRestockModalOpen(true);
  };

  const handleRowClick = (row: InventoryRow) => {
    setSelectedRow(row);
    setDrawerTab('overview');
    setIsDrawerOpen(true);
  };

  const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
    name: '',
    unit: 'g',
    stock: '0',
    low_stock_level: '5',
    avg_weight_per_piece: '',
    cost_per_base_unit: '0',
    cost_per_unit: '0',
    branch_id: currentBranchId ? String(currentBranchId) : '',
    branch_ids: [] as string[],
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value || String(value).trim().length === 0) error = 'Item name is required';
        else if (String(value).trim().length < 2) error = 'Item name must be at least 2 characters';
        else if (/^\d+$/.test(String(value).trim())) error = 'Invalid item name (cannot be only numbers)';
        break;
      case 'unit':
        if (!value) error = 'Please select a unit';
        break;
      case 'stock':
        if (value === '' || value === undefined) error = 'Stock is required';
        else if (isNaN(Number(value))) error = 'Stock must be a valid number';
        else if (Number(value) < 0) error = 'Stock cannot be negative';
        break;
      case 'low_stock_level':
        if (value === '' || value === undefined) error = 'Low stock mark is required';
        else if (isNaN(Number(value))) error = 'Must be a valid number';
        else if (Number(value) < 0) error = 'Cannot be negative';
        break;
      case 'cost_per_base_unit':
        if (value === '' || value === undefined) error = 'Total cost is required';
        else if (isNaN(Number(value))) error = 'Invalid amount';
        else if (Number(value) <= 0) error = 'Must be greater than 0';
        break;
      case 'branch_ids':
        if (!isEditModalOpen && value.length === 0 && isAdmin) {
          error = 'Select at least one branch';
        }
        break;
      case 'avg_weight_per_piece':
        if (data.unit === 'pcs') {
          if (!value) error = 'Avg weight is required for piece measurements';
          else if (Number(value) <= 0) error = 'Must be greater than 0';
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

  const costPerUnitPreview = useMemo(() => {
    const totalCost = Number(data.cost_per_base_unit);
    const totalStock = Number(data.stock);
    if (totalStock > 0 && totalCost > 0) {
      return (totalCost / totalStock).toFixed(4);
    }
    return '0.00';
  }, [data.cost_per_base_unit, data.stock]);

  // --- Stats ---
  const stats = useMemo(() => {
    if (serverStats) return { ...serverStats, updates: updatedTodayCount };
    const total = [...new Set(inventory.map(i => i.id))].length;
    const low   = inventory.filter(i => i.is_low_stock).length;
    const out   = inventory.filter(i => i.is_out_of_stock).length;
    return { total, low_stock: low, out_of_stock: out, updates: updatedTodayCount };
  }, [inventory, serverStats, updatedTodayCount]);

  // --- Filtered & Sorted Flat Data ---
  const filteredData = useMemo(() => {
    return inventory
      .filter(item => {
        // Search matches ingredient name, SKU, branch name, unit
        const skuString = `ING-${item.id.toString().padStart(5, '0')}`;
        const matchesSearch = 
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          skuString.toLowerCase().includes(search.toLowerCase()) ||
          (item.branch_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          item.unit.toLowerCase().includes(search.toLowerCase());

        const matchesUnit = filterUnit === 'all' || item.unit === filterUnit;

        // Custom status filter (optimal, low, out, overstocked)
        let matchesStatus = true;
        if (filterStatus === 'optimal') {
          matchesStatus = !item.is_low_stock && !item.is_out_of_stock;
        } else if (filterStatus === 'low') {
          matchesStatus = item.is_low_stock && !item.is_out_of_stock;
        } else if (filterStatus === 'out') {
          matchesStatus = item.is_out_of_stock;
        } else if (filterStatus === 'overstocked') {
          matchesStatus = item.stock > item.low_stock_level * 4;
        }

        // Quick chips filter
        let matchesQuick = true;
        const key = `${item.id}-${item.branch_id}`;
        const lastLog = lastUpdatedMap[key];

        if (quickFilter === 'low') {
          matchesQuick = item.is_low_stock || item.is_out_of_stock;
        } else if (quickFilter === 'out') {
          matchesQuick = item.is_out_of_stock;
        } else if (quickFilter === 'updated') {
          matchesQuick = !!lastLog;
        } else if (quickFilter === 'restocked') {
          if (lastLog) {
            const logDate = new Date(lastLog.created_at);
            const isToday = logDate.toDateString() === new Date().toDateString();
            const isPositive = Number(lastLog.change_qty) > 0;
            matchesQuick = isToday && isPositive;
          } else {
            matchesQuick = false;
          }
        }

        return matchesSearch && matchesUnit && matchesStatus && matchesQuick;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy as keyof InventoryRow];
        let valB: any = b[sortBy as keyof InventoryRow];

        if (sortBy === 'last_updated') {
          const logA = lastUpdatedMap[`${a.id}-${a.branch_id}`];
          const logB = lastUpdatedMap[`${b.id}-${b.branch_id}`];
          const timeA = logA ? new Date(logA.created_at).getTime() : 0;
          const timeB = logB ? new Date(logB.created_at).getTime() : 0;
          return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [inventory, search, filterUnit, filterStatus, quickFilter, sortBy, sortOrder, lastUpdatedMap]);

  // Active Branch Stats computed for current filter
  const activeBranchName = useMemo(() => {
    if (!currentBranchId || currentBranchId === 'all') return 'All Branches';
    const branch = branchList.find(b => String(b.id) === String(currentBranchId));
    return branch ? branch.name : 'All Branches';
  }, [currentBranchId, branchList]);

  const activeBranchStats = useMemo(() => {
    const branchRows = inventory.filter(item => {
      if (!currentBranchId || currentBranchId === 'all') return true;
      return String(item.branch_id) === String(currentBranchId);
    });
    const total = [...new Set(branchRows.map(i => i.id))].length;
    const low = branchRows.filter(i => i.is_low_stock && !i.is_out_of_stock).length;
    const out = branchRows.filter(i => i.is_out_of_stock).length;
    return { total, low, out };
  }, [inventory, currentBranchId]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [search, filterUnit, filterStatus, quickFilter]);

  // --- Handlers ---
  const handleAdd = () => { reset(); setIsAddModalOpen(true); };

  const handleEdit = (row: InventoryRow) => {
    setSelectedRow(row);
    setData({
      name: row.name,
      unit: row.unit,
      stock: String(row.stock),
      low_stock_level: String(row.low_stock_level ?? 5),
      avg_weight_per_piece: row.avg_weight_per_piece ? String(row.avg_weight_per_piece) : '',
      cost_per_base_unit: String(row.cost_per_unit ?? 0),
      cost_per_unit: String(row.cost_per_unit ?? 0),
      branch_id: row.branch_id ? String(row.branch_id) : '',
      branch_ids: [],
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (row: InventoryRow) => { setSelectedRow(row); setIsDeleteModalOpen(true); };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();

    const fields = ['name', 'unit', 'stock', 'low_stock_level', 'cost_per_base_unit', 'branch_ids'];
    if (data.unit === 'pcs') fields.push('avg_weight_per_piece');
    
    let hasError = false;
    fields.forEach(f => {
      const err = validateField(f, (data as any)[f]);
      if (err) hasError = true;
    });

    if (hasError) return;

    const calculatedCostPerUnit = Number(data.stock) > 0 
      ? Number(data.cost_per_base_unit) / Number(data.stock)
      : Number(data.cost_per_base_unit);

    router.post('/inventory', {
      name: data.name,
      unit: data.unit,
      initial_stock: Number(data.stock),
      low_stock_level: Number(data.low_stock_level),
      avg_weight_per_piece: data.avg_weight_per_piece ? Number(data.avg_weight_per_piece) : undefined,
      cost_per_base_unit: Number(data.cost_per_base_unit),
      cost_per_unit: calculatedCostPerUnit,
      branch_id: data.branch_id ? Number(data.branch_id) : undefined,
      branch_ids: data.branch_ids.map(Number),
    }, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
        setLocalErrors({});
        stateChannel.postMessage({ type: 'inventory-updated' });
        router.reload({ only: ['inventory', 'stats'] });
        fetchActivityLogs();
        setResultModal({ type: 'success', title: 'Ingredient Added', message: 'The global ingredient and its branch stock have been created.' });
        setIsResultModalOpen(true);
      },
      onError: (errs) => {
        setLocalErrors(prev => ({ ...prev, ...errs }));
      }
    });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();

    const fields = ['name', 'unit', 'stock', 'low_stock_level', 'cost_per_unit'];
    if (data.unit === 'pcs') fields.push('avg_weight_per_piece');
    
    let hasError = false;
    fields.forEach(f => {
      const err = validateField(f, (data as any)[f]);
      if (err) hasError = true;
    });

    if (hasError) return;

    router.put(`/inventory/${selectedRow?.id}`, {
      name: data.name,
      unit: data.unit,
      branch_id: data.branch_id ? Number(data.branch_id) : undefined,
      stock: Number(data.stock),
      low_stock_level: Number(data.low_stock_level),
      avg_weight_per_piece: data.avg_weight_per_piece ? Number(data.avg_weight_per_piece) : undefined,
      cost_per_unit: Number(data.cost_per_unit),
    }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setIsDrawerOpen(false);
        reset();
        setLocalErrors({});
        stateChannel.postMessage({ type: 'inventory-updated' });
        router.reload({ only: ['inventory', 'stats'] });
        fetchActivityLogs();
        setResultModal({ type: 'success', title: 'Ingredient Updated', message: 'Ingredient and stock record have been updated.' });
        setIsResultModalOpen(true);
      },
      onError: (errs) => {
        setLocalErrors(prev => ({ ...prev, ...errs }));
      }
    });
  };

  const submitDelete = () => {
    router.delete(`/inventory/${selectedRow?.id}?branch_id=${selectedRow?.branch_id}`, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setIsDrawerOpen(false);
        stateChannel.postMessage({ type: 'inventory-updated' });
        router.reload({ only: ['inventory', 'stats'] });
        fetchActivityLogs();
        setResultModal({ type: 'success', title: 'Inventory Updated', message: `Ingredient removed from ${selectedRow?.branch_name}.` });
        setIsResultModalOpen(true);
      },
    });
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
  };

  const toggleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const pageIds = paginatedData.map(r => r.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIdsSet = new Set(paginatedData.map(r => r.id));
      setSelectedIds(prev => prev.filter(id => !pageIdsSet.has(id)));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const submitBulkDelete = () => {
    if (bulkDeleteConfirmation !== 'DELETE') return;

    router.delete('/inventory/bulk-delete', {
      data: { ids: selectedIds },
      onSuccess: () => {
        setIsBulkDeleteModalOpen(false);
        setSelectedIds([]);
        setBulkDeleteConfirmation('');
        stateChannel.postMessage({ type: 'inventory-updated' });
        router.reload({ only: ['inventory', 'stats'] });
        fetchActivityLogs();
        setResultModal({ 
          type: 'success', 
          title: 'Bulk Delete Successful', 
          message: `${selectedIds.length} ingredients have been moved to trash.` 
        });
        setIsResultModalOpen(true);
      },
      onError: (errs) => {
        setIsBulkDeleteModalOpen(false);
        setResultModal({
          type: 'error',
          title: 'Bulk Delete Failed',
          message: errs.ids || 'An error occurred during bulk delete.',
        });
        setIsResultModalOpen(true);
      }
    });
  };

  // Bulk operation actions
  const handleBulkRestock = () => {
    if (selectedIds.length === 0) return;
    const selectedRows = inventory.filter(r => selectedIds.includes(r.id));
    const firstRow = selectedRows[0];
    if (!firstRow) return;

    // Check if multiple branches selected
    const uniqueBranches = Array.from(new Set(selectedRows.map(r => r.branch_id)));
    if (uniqueBranches.length > 1) {
      toast.error("Please select ingredients from the same branch for bulk restocking.");
      return;
    }

    const prefilled: Record<number, { quantity: string, unit: string }> = {};
    selectedRows.forEach(row => {
      prefilled[row.id] = { quantity: '', unit: row.unit };
    });

    setBulkRestockQuantities(prefilled);
    openMassRestockModal(firstRow.branch_id, firstRow.branch_name || 'Selected Branch');
  };

  const handleExportCSV = () => {
    const rowsToExport = selectedIds.length > 0 
      ? inventory.filter(r => selectedIds.includes(r.id))
      : filteredData;
      
    const csvContent = [
      ["Ingredient Name", "SKU", "Branch", "Current Stock", "Minimum Stock", "Unit", "Procurement Cost (PHP)", "Status"],
      ...rowsToExport.map(r => [
        r.name,
        `ING-${r.id.toString().padStart(5, '0')}`,
        r.branch_name || "Unassigned",
        r.stock,
        r.low_stock_level,
        r.unit,
        r.cost_per_unit.toFixed(2),
        r.is_out_of_stock ? "Out of Stock" : r.is_low_stock ? "Low Stock" : "Optimal"
      ])
    ]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `maki_desu_inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully!");
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterUnit('all');
    setFilterStatus('all');
    setQuickFilter('all');
  };

  // Get status color string for styling logic
  const getItemStatus = (row: InventoryRow) => {
    if (row.is_out_of_stock) return 'out';
    if (row.is_low_stock) return 'low';
    if (row.stock > row.low_stock_level * 4) return 'overstocked';
    return 'optimal';
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Maki Desu Inventory control console" />
      <TooltipProvider>
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background font-sans">

          {/* ── Header Area ── */}
          <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-[var(--ops-surface-sunken)] border-b border-[var(--ops-border)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <FiPackage className="text-primary size-6 animate-pulse" />
              <div>
                <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">Inventory</h1>
                <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                  Manage ingredient inventory across all branches
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="h-10 px-3.5 rounded-[12px] bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] hover:bg-[var(--ops-chip-active-bg)] text-muted-foreground hover:text-foreground transition-all shadow-sm shrink-0 gap-2 text-[10px] font-black uppercase tracking-wider"
                onClick={() => setIsReceiptScannerOpen(true)}
                title="Scan Receipt"
              >
                <FiFileText className="size-4 text-primary" />
                <span className="hidden md:inline">Scan Receipt</span>
              </Button>
              {isAdmin && (
                <Button 
                  onClick={handleAdd} 
                  className="h-10 px-4 gap-2 bg-primary hover:bg-primary-hover text-foreground shadow-lg shadow-primary/10 rounded-[12px] font-black uppercase text-[10px] tracking-wider italic shrink-0"
                >
                  <FiPlus className="size-4" /> <span>Add Ingredient</span>
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
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)]">Total Ingredients</p>
                  <FiGrid className="size-4 text-[var(--ops-text-secondary)]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{stats.total}</h3>
                  <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Across all branches</p>
                </div>
              </div>
              
              <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/70">Low Stock</p>
                  <FiAlertTriangle className="size-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-amber-500 tabular-nums leading-none">{stats.low_stock}</h3>
                  <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Needs Restocking</p>
                </div>
              </div>

              <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500/70">Out of Stock</p>
                  <FiSlash className="size-4 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-rose-500 tabular-nums leading-none">{stats.out_of_stock}</h3>
                  <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Critical Alert</p>
                </div>
              </div>

              <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Stock Updates</p>
                  <FiRefreshCw className="size-4 text-primary group-hover:rotate-180 transition-transform duration-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{stats.updates}</h3>
                  <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Updated Today</p>
                </div>
              </div>
            </div>

            {/* Branch Header (Context Statistics) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--ops-surface-sunken)]/20 border border-[var(--ops-border)] px-4 py-2.5 rounded-[12px] text-xs font-black uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2 text-[var(--ops-text-secondary)]">
                <FiMapPin className="text-primary size-4" />
                <span>{activeBranchName}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--ops-text-muted)]">
                <span>{activeBranchStats.total} Ingredients</span>
                {activeBranchStats.low > 0 && <span className="text-amber-500">{activeBranchStats.low} Low Stock</span>}
                {activeBranchStats.out > 0 && <span className="text-rose-500">{activeBranchStats.out} Out of Stock</span>}
              </div>
            </div>

            {/* STICKY TOOLBAR FILTERS */}
            <div className="sticky top-0 z-30 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md pb-4 pt-1 space-y-4 border-b border-[var(--ops-border-subtle)]">
              
              {/* Quick Chips Row */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Ingredients' },
                  { id: 'low', label: 'Low Stock', icon: FiAlertTriangle, color: 'text-amber-500' },
                  { id: 'out', label: 'Out of Stock', icon: FiSlash, color: 'text-rose-500' },
                  { id: 'updated', label: 'Recently Updated', icon: FiActivity, color: 'text-[var(--ops-text-secondary)]' },
                  { id: 'restocked', label: 'Restocked Today', icon: FiTrendingUp, color: 'text-emerald-500' }
                ].map(chip => {
                  const isActive = quickFilter === chip.id;
                  const Icon = chip.icon;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => setQuickFilter(chip.id as any)}
                      className={cn(
                        "h-8 px-3 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 border",
                        isActive
                          ? "bg-primary border-primary text-foreground shadow-sm"
                          : "bg-[var(--ops-thead-bg)] border-[var(--ops-border)] text-[var(--ops-text-secondary)] hover:text-foreground hover:bg-[var(--ops-chip-active-bg)]"
                      )}
                    >
                      {Icon && <Icon className={cn("size-3", chip.color)} />}
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Advanced Toolbar Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                  
                  {/* Search box */}
                  <div className="relative w-full sm:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--ops-text-muted)]" />
                    <Input
                      placeholder="Search ingredient or SKU..."
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
                        {branchList.map(b => (
                          <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Unit filter */}
                  <Select value={filterUnit} onValueChange={setFilterUnit}>
                    <SelectTrigger className="w-full sm:w-32 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">
                      <SelectValue placeholder="All Units" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px]">
                      <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Units</SelectItem>
                      <SelectItem value="g" className="text-[10px] font-bold uppercase py-2">g (Grams)</SelectItem>
                      <SelectItem value="ml" className="text-[10px] font-bold uppercase py-2">ml (Milliliters)</SelectItem>
                      <SelectItem value="pcs" className="text-[10px] font-bold uppercase py-2">pcs (Pieces)</SelectItem>
                      <SelectItem value="kg" className="text-[10px] font-bold uppercase py-2">kg (Kilograms)</SelectItem>
                      <SelectItem value="liters" className="text-[10px] font-bold uppercase py-2">liters (Liters)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status filter */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-36 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px]">
                      <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Status</SelectItem>
                      <SelectItem value="optimal" className="text-[10px] font-bold uppercase py-2 text-emerald-500">Optimal</SelectItem>
                      <SelectItem value="low" className="text-[10px] font-bold uppercase py-2 text-amber-500">Low Stock</SelectItem>
                      <SelectItem value="out" className="text-[10px] font-bold uppercase py-2 text-rose-500">Out of Stock</SelectItem>
                      <SelectItem value="overstocked" className="text-[10px] font-bold uppercase py-2 text-blue-400">Overstocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Density Toggle Controls */}
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

                  {/* Mass Restock shortcut */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const activeId = currentBranchId && currentBranchId !== 'all' ? Number(currentBranchId) : branchList[0]?.id;
                      const activeName = branchList.find(b => b.id === activeId)?.name || 'Victoria';
                      if (activeId) openMassRestockModal(activeId, activeName);
                    }}
                    className="h-9.5 rounded-[10px] bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] hover:bg-[var(--ops-chip-active-bg)] text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5 shrink-0"
                  >
                    <FiZap className="size-3.5" />
                    <span>Mass Restock</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* INGREDIENT INVENTORY TABLE ZONE */}
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
                      <th className="px-4 py-3.5 cursor-pointer hover:text-foreground" onClick={() => toggleSort('name')}>
                        <span className="flex items-center gap-1">
                          Ingredient
                          {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </th>
                      <th className="px-4 py-3.5 cursor-pointer hover:text-foreground hidden sm:table-cell" onClick={() => toggleSort('id')}>
                        <span className="flex items-center gap-1">
                          SKU
                          {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </th>
                      <th className="px-4 py-3.5 cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => toggleSort('branch_name')}>
                        <span className="flex items-center gap-1">
                          Branch
                          {sortBy === 'branch_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </th>
                      <th className="px-4 py-3.5 cursor-pointer hover:text-foreground text-right" onClick={() => toggleSort('stock')}>
                        <span className="flex items-center justify-end gap-1">
                          Stock
                          {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </th>
                      <th className="px-4 py-3.5 text-right hidden sm:table-cell">
                        Min. Stock
                      </th>
                      <th className="px-4 py-3.5 hidden md:table-cell text-center">
                        Unit
                      </th>
                      <th className="px-4 py-3.5 cursor-pointer hover:text-foreground text-center" onClick={() => toggleSort('is_low_stock')}>
                        <span className="flex items-center justify-center gap-1">
                          Status
                          {sortBy === 'is_low_stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </th>
                      <th className="px-4 py-3.5 cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => toggleSort('last_updated')}>
                        <span className="flex items-center gap-1">
                          Last Updated
                          {sortBy === 'last_updated' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </th>
                      <th className="px-4 py-3.5 w-12 text-right"></th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-[var(--ops-border-subtle)]">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <FiPackage className="size-10 text-[var(--ops-text-faint)] animate-bounce" />
                            <p className="text-base font-bold italic uppercase tracking-tighter text-[var(--ops-text-muted)]">No ingredients found</p>
                            <p className="text-[10px] text-[var(--ops-text-faint)] font-bold uppercase tracking-widest">Try adjusting filters or reset the view</p>
                            <Button 
                              onClick={handleResetFilters}
                              className="mt-2 h-8 px-4 rounded-[8px] bg-[var(--ops-surface-sunken)] border border-[var(--ops-border)] text-[9px] font-black uppercase tracking-wider text-foreground hover:bg-[var(--ops-chip-active-bg)]"
                            >
                              Reset Filters
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map(item => {
                        const isChecked = selectedIds.includes(item.id);
                        const statusType = getItemStatus(item);
                        const key = `${item.id}-${item.branch_id}`;
                        const lastLog = lastUpdatedMap[key];
                        
                        const activeSegments = Math.min(10, Math.ceil((item.stock / (item.low_stock_level * 2 || 10)) * 10));

                        return (
                          <tr
                            key={key}
                            onClick={() => handleRowClick(item)}
                            className={cn(
                              "cursor-pointer group select-none hover:bg-[var(--ops-surface-sunken)]/50 transition-colors duration-150 relative",
                              isChecked && "bg-primary/[0.015]",
                              (item.is_low_stock || item.is_out_of_stock) && "hover:bg-rose-950/5"
                            )}
                          >
                            {/* Checkbox select */}
                            <td className={cn(
                              "px-4 transition-all",
                              density === 'compact' ? "py-1.5" : "py-3"
                            )} onClick={e => e.stopPropagation()}>
                              {isAdmin && (
                                <input
                                  type="checkbox"
                                  className="size-3.5 rounded border-[var(--ops-border)] text-primary bg-zinc-950 focus:ring-primary/20 cursor-pointer"
                                  checked={isChecked}
                                  onChange={() => toggleSelectRow(item.id)}
                                />
                              )}
                            </td>

                            {/* Name */}
                            <td className="px-4">
                              <div className="flex flex-col">
                                <span className={cn(
                                  "font-bold uppercase tracking-tight text-foreground",
                                  density === 'compact' ? "text-xs" : "text-sm"
                                )}>
                                  {item.name}
                                </span>
                                <span className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase tracking-widest sm:hidden">
                                  ING-{item.id.toString().padStart(5, '0')}
                                </span>
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="px-4 hidden sm:table-cell text-[var(--ops-text-muted)] font-bold font-mono text-[10px]">
                              ING-{item.id.toString().padStart(5, '0')}
                            </td>

                            {/* Branch */}
                            <td className="px-4 hidden md:table-cell">
                              <div className="flex items-center gap-1.5 text-[var(--ops-text-secondary)] text-xs font-bold uppercase tracking-tight">
                                <FiMapPin className="size-3 text-[var(--ops-text-faint)]" />
                                <span>{item.branch_name || 'N/A'}</span>
                              </div>
                            </td>

                            {/* Stock */}
                            <td className="px-4 text-right">
                              <div className="flex flex-col items-end gap-1.5">
                                <div className="flex items-baseline gap-1">
                                  <span className={cn(
                                    "font-black font-mono leading-none tracking-tight",
                                    density === 'compact' ? "text-xs" : "text-sm",
                                    item.is_out_of_stock ? "text-rose-500" : item.is_low_stock ? "text-amber-500" : "text-foreground"
                                  )}>
                                    {Number(item.display_stock ?? item.stock).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[8px] font-black uppercase text-[var(--ops-text-faint)]">
                                    {item.display_unit || item.unit}
                                  </span>
                                </div>
                                
                                {/* Micro segmented bar */}
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 10 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "w-1 h-2 rounded-[0.5px]",
                                        i < activeSegments
                                          ? (item.is_out_of_stock ? "bg-rose-500" : item.is_low_stock ? "bg-amber-500" : "bg-emerald-500")
                                          : "bg-[var(--ops-chip-active-bg)]"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                            </td>

                            {/* Minimum stock */}
                            <td className="px-4 text-right hidden sm:table-cell text-[var(--ops-text-muted)] font-bold font-mono text-[10px]">
                              {item.low_stock_level} {item.unit}
                            </td>

                            {/* Unit */}
                            <td className="px-4 hidden md:table-cell text-center text-[var(--ops-text-muted)] font-black uppercase text-[10px] tracking-widest">
                              {item.unit}
                            </td>

                            {/* Status Badge */}
                            <td className="px-4 text-center">
                              <div className="flex justify-center">
                                {statusType === 'out' ? (
                                  <Badge className="bg-rose-500/5 text-rose-500 border border-rose-500/10 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[6px] shrink-0">
                                    Depleted
                                  </Badge>
                                ) : statusType === 'low' ? (
                                  <Badge className="bg-amber-500/5 text-amber-500 border border-amber-500/10 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[6px] shrink-0">
                                    Low Stock
                                  </Badge>
                                ) : statusType === 'overstocked' ? (
                                  <Badge className="bg-blue-500/5 text-blue-400 border border-blue-500/10 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[6px] shrink-0">
                                    Overstocked
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[6px] shrink-0">
                                    Optimal
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* Dynamic update timestamp */}
                            <td className="px-4 hidden lg:table-cell text-[10px] font-bold text-[var(--ops-text-muted)]">
                              {lastLog ? lastLog.time_ago : 'System Sync'}
                            </td>

                            {/* Action overflow menu */}
                            <td className="px-4 text-right" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 rounded hover:bg-[var(--ops-chip-active-bg)] text-[var(--ops-text-muted)] hover:text-foreground transition-colors">
                                    <span className="text-base font-bold">⋮</span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px] p-1.5 shadow-2xl text-[var(--ops-text-secondary)]">
                                  <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)] px-2.5 py-1.5">Stock Controls</DropdownMenuLabel>
                                  <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-chip-active-bg)] hover:text-foreground" onClick={() => openStockInModal(item)}>
                                    <FiZap className="size-3.5 text-emerald-500" />
                                    <span>Restock (Stock In)</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-chip-active-bg)] hover:text-foreground" onClick={() => openWastageModal(item)}>
                                    <FiSlash className="size-3.5 text-rose-500" />
                                    <span>Report Wastage</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-chip-active-bg)] hover:text-foreground" onClick={() => handleRowClick(item)}>
                                    <FiFileText className="size-3.5 text-indigo-400" />
                                    <span>View Audit History</span>
                                  </DropdownMenuItem>
                                  
                                  {isAdmin && (
                                    <>
                                      <DropdownMenuSeparator className="bg-[var(--ops-chip-active-bg)] my-1.5" />
                                      <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)] px-2.5 py-1.5">Administration</DropdownMenuLabel>
                                      <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-chip-active-bg)] hover:text-foreground" onClick={() => handleEdit(item)}>
                                        <FiEdit2 className="size-3.5 text-amber-500" />
                                        <span>Adjust Stock Limits</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-chip-active-bg)] hover:text-foreground text-rose-500 hover:text-rose-400" onClick={() => handleDelete(item)}>
                                        <FiTrash2 className="size-3.5" />
                                        <span>Delete from Branch</span>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="p-5 bg-[var(--ops-surface-sunken)]/30 border border-[var(--ops-border)] rounded-[14px] flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-[var(--ops-text-muted)] tracking-wider">Rows per page</span>
                  <Select value={String(itemsPerPage)} onValueChange={val => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[70px] h-8.5 rounded-[8px] border-[var(--ops-border)] bg-[var(--ops-surface-sunken)] font-bold text-xs ring-1 ring-zinc-800 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)]">
                      {[10, 25, 50, 100].map(val => (
                        <SelectItem key={val} value={String(val)} className="text-xs font-bold">{val}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-[9px] font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <div className="size-1 rounded-full bg-primary animate-pulse" />
                  Showing {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}–{Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} entries
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  className="rounded-[8px] h-8 px-2 bg-[var(--ops-surface-sunken)] border border-[var(--ops-border)] text-[var(--ops-text-secondary)] hover:text-foreground"
                >
                  <FiChevronLeft className="size-4" />
                </Button>
                
                <div className="flex items-center gap-1 mx-1.5">
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
                          'h-8 w-8 rounded-[8px] font-bold text-xs transition-all',
                          currentPage === pageNum 
                            ? 'bg-primary text-foreground scale-105 shadow-sm' 
                            : 'hover:bg-[var(--ops-chip-active-bg)] text-[var(--ops-text-secondary)]'
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button 
                  variant="ghost" 
                  disabled={currentPage === totalPages || totalPages === 0} 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  className="rounded-[8px] h-8 px-2 bg-[var(--ops-surface-sunken)] border border-[var(--ops-border)] text-[var(--ops-text-secondary)] hover:text-foreground"
                >
                  <FiChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* ── BULK OPERATIONS FLOATING TOOLBAR ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 80, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950/95 border border-[var(--ops-border)] shadow-2xl px-5 py-3 rounded-[14px] flex items-center gap-4 sm:gap-6 z-40 backdrop-blur-md"
          >
            <div className="flex items-center gap-2 pr-4 border-r border-[var(--ops-border)] text-xs text-[var(--ops-text-secondary)]">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="font-bold font-mono text-foreground">{selectedIds.length}</span>
              <span className="font-black uppercase tracking-wider text-[9px]">Selected</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRestock}
                className="h-8.5 px-3 rounded-[10px] bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] text-emerald-500 hover:bg-[var(--ops-chip-active-bg)] hover:text-emerald-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5"
              >
                <FiZap className="size-3.5" />
                <span>Restock</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8.5 px-3 rounded-[10px] bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] text-[var(--ops-text-secondary)] hover:bg-[var(--ops-chip-active-bg)] hover:text-foreground text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5"
              >
                <FiDownload className="size-3.5" />
                <span>Export</span>
              </Button>
              
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="h-8.5 px-3 rounded-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-foreground text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <FiTrash2 className="size-3.5" />
                  <span>Delete</span>
                </Button>
              )}
            </div>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1 rounded hover:bg-[var(--ops-chip-active-bg)] text-[var(--ops-text-muted)] hover:text-foreground transition-colors"
            >
              <FiX className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RIGHT-SIDE DETAILS DRAWER ── */}
      <AnimatePresence>
        {isDrawerOpen && selectedRow && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-md md:max-w-lg bg-zinc-950 border-l border-[var(--ops-border)] shadow-2xl z-50 flex flex-col font-sans"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[var(--ops-border)] flex items-center justify-between flex-shrink-0 bg-[var(--ops-surface-sunken)]/20">
                <div className="flex items-center gap-2">
                  <FiPackage className="text-primary size-5" />
                  <div>
                    <h2 className="text-sm font-black italic uppercase tracking-tighter text-foreground">Ingredient Details</h2>
                    <p className="text-[9px] font-bold text-[var(--ops-text-muted)] uppercase tracking-widest">ING-{selectedRow.id.toString().padStart(5, '0')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-[8px] bg-[var(--ops-surface-sunken)] border border-[var(--ops-border)] text-[var(--ops-text-secondary)] hover:text-foreground transition-colors"
                >
                  <FiX className="size-4" />
                </button>
              </div>

              {/* Drawer Body Tabs */}
              <div className="px-6 pt-3 bg-[var(--ops-surface-sunken)] border-b border-[var(--ops-border-subtle)] flex-shrink-0">
                <div className="flex gap-2">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'history', label: 'Audit History' },
                    { id: 'procurement', label: 'Procurement' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDrawerTab(tab.id as any)}
                      className={cn(
                        "pb-2.5 text-[9px] font-black uppercase tracking-wider relative px-1",
                        drawerTab === tab.id 
                          ? "text-primary" 
                          : "text-[var(--ops-text-muted)] hover:text-[var(--ops-text-secondary)]"
                      )}
                    >
                      <span>{tab.label}</span>
                      {drawerTab === tab.id && (
                        <motion.div layoutId="drawerTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* ── TAB 1: OVERVIEW ── */}
                {drawerTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Visual Card */}
                    <div className="bg-[var(--ops-surface-sunken)]/30 border border-[var(--ops-border)] rounded-[14px] p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm text-center">
                      <div className="absolute top-0 right-0 size-24 bg-primary blur-3xl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500" />
                      <div className="size-16 rounded-[14px] bg-gradient-to-br from-zinc-800 to-zinc-900/80 border border-zinc-700/50 flex items-center justify-center text-xl font-black italic uppercase tracking-tighter text-primary mb-3.5 shadow-inner select-none">
                        {selectedRow.name.slice(0, 2)}
                      </div>
                      <h3 className="text-lg font-black uppercase italic tracking-tighter text-foreground">{selectedRow.name}</h3>
                      <p className="text-[9px] font-bold text-[var(--ops-text-muted)] uppercase tracking-widest mt-1">Global ID: ING-{selectedRow.id.toString().padStart(5, '0')}</p>

                      <div className="mt-4 flex items-center gap-1.5">
                        {selectedRow.is_out_of_stock ? (
                          <Badge className="bg-rose-500/5 text-rose-500 border border-rose-500/10 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[6px]">Depleted</Badge>
                        ) : selectedRow.is_low_stock ? (
                          <Badge className="bg-amber-500/5 text-amber-500 border border-amber-500/10 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[6px]">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[6px]">Optimal</Badge>
                        )}
                      </div>
                    </div>

                    {/* Stock matrix */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[var(--ops-surface-sunken)]/20 border border-[var(--ops-border)] p-4 rounded-[12px]">
                        <p className="text-[9px] font-black uppercase text-[var(--ops-text-muted)] tracking-wider">Current Stock</p>
                        <p className="text-xl font-black italic tracking-tighter text-foreground mt-1 tabular-nums">
                          {Number(selectedRow.display_stock ?? selectedRow.stock).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          <span className="text-[10px] font-normal uppercase text-[var(--ops-text-secondary)] ml-1 tracking-wider">{selectedRow.display_unit || selectedRow.unit}</span>
                        </p>
                      </div>
                      <div className="bg-[var(--ops-surface-sunken)]/20 border border-[var(--ops-border)] p-4 rounded-[12px]">
                        <p className="text-[9px] font-black uppercase text-[var(--ops-text-muted)] tracking-wider">Minimum Level</p>
                        <p className="text-xl font-black italic tracking-tighter text-foreground mt-1 tabular-nums">
                          {selectedRow.low_stock_level}
                          <span className="text-[10px] font-normal uppercase text-[var(--ops-text-secondary)] ml-1 tracking-wider">{selectedRow.unit}</span>
                        </p>
                      </div>
                    </div>

                    {/* Details Lists */}
                    <div className="border border-[var(--ops-border)] rounded-[12px] bg-[var(--ops-surface-sunken)] divide-y divide-zinc-900">
                      {[
                        { label: 'Assigned Branch', value: selectedRow.branch_name || 'N/A' },
                        { label: 'Purchase Unit', value: selectedRow.unit },
                        { label: 'Cost Per Unit', value: `₱ ${selectedRow.cost_per_unit.toFixed(2)}` },
                        { label: 'Total Stock Value', value: `₱ ${(selectedRow.stock * selectedRow.cost_per_unit).toFixed(2)}` },
                        { label: 'Piece Weight', value: selectedRow.avg_weight_per_piece ? `${selectedRow.avg_weight_per_piece} g / piece` : 'N/A' }
                      ].map((info, idx) => (
                        <div key={idx} className="flex justify-between items-center px-4 py-3 text-xs">
                          <span className="font-bold text-[var(--ops-text-muted)] uppercase tracking-wider text-[9px]">{info.label}</span>
                          <span className="font-black text-foreground uppercase tracking-tight">{info.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Operations Button Matrix */}
                    <div className="space-y-2.5 pt-4 border-t border-[var(--ops-border-subtle)]">
                      <div className="grid grid-cols-2 gap-2.5">
                        <Button
                          onClick={() => openStockInModal(selectedRow)}
                          className="h-10 rounded-[10px] bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-foreground border border-emerald-500/20 font-black uppercase text-[10px] tracking-wider transition-all gap-2"
                        >
                          <FiZap className="size-4" />
                          <span>Restock (Stock In)</span>
                        </Button>
                        <Button
                          onClick={() => openWastageModal(selectedRow)}
                          className="h-10 rounded-[10px] bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-foreground border border-rose-500/20 font-black uppercase text-[10px] tracking-wider transition-all gap-2"
                        >
                          <FiSlash className="size-4" />
                          <span>Report Wastage</span>
                        </Button>
                      </div>

                      {isAdmin && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <Button
                            onClick={() => handleEdit(selectedRow)}
                            className="h-10 rounded-[10px] bg-[var(--ops-surface-sunken)] hover:bg-[var(--ops-chip-active-bg)] text-[var(--ops-text-secondary)] border border-[var(--ops-border)] font-black uppercase text-[10px] tracking-wider gap-2"
                          >
                            <FiEdit2 className="size-3.5 text-amber-500" />
                            <span>Edit Thresholds</span>
                          </Button>
                          <Button
                            onClick={() => handleDelete(selectedRow)}
                            className="h-10 rounded-[10px] bg-[var(--ops-surface-sunken)] hover:bg-rose-600 hover:text-foreground text-[var(--ops-text-secondary)] border border-[var(--ops-border)] hover:border-transparent font-black uppercase text-[10px] tracking-wider gap-2"
                          >
                            <FiTrash2 className="size-3.5 text-[var(--ops-text-muted)] hover:text-foreground" />
                            <span>Delete Item</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB 2: AUDIT HISTORY ── */}
                {drawerTab === 'history' && (
                  <div className="space-y-4">
                    {loadingDrawerLogs ? (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="animate-pulse border border-[var(--ops-border)] rounded-[12px] p-4 flex flex-col gap-2 bg-[var(--ops-surface-sunken)]">
                            <div className="h-4 w-28 bg-[var(--ops-chip-active-bg)] rounded" />
                            <div className="h-3 w-16 bg-[var(--ops-chip-active-bg)] rounded" />
                            <div className="h-3 w-20 bg-[var(--ops-chip-active-bg)] rounded" />
                          </div>
                        ))}
                      </div>
                    ) : drawerLogs.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-[var(--ops-border)] rounded-[14px]">
                        <FiFileText className="size-8 text-[var(--ops-text-faint)] mx-auto mb-2 animate-bounce" />
                        <p className="text-xs font-bold text-[var(--ops-text-muted)] uppercase tracking-wider">No audit history found</p>
                        <p className="text-[9px] text-[var(--ops-text-faint)] font-bold uppercase mt-1">Actions on this item will be logged here</p>
                      </div>
                    ) : (
                      <div className="relative border-l border-[var(--ops-border)] pl-4.5 space-y-5 py-2">
                        {drawerLogs.map((log: any) => {
                          const isPositive = Number(log.change_qty) > 0;
                          const changeVal = Number(log.change_qty);
                          
                          return (
                            <div key={log.id} className="relative text-xs">
                              {/* Dot marker */}
                              <div className={cn(
                                "absolute -left-[24.5px] top-0.5 size-2 rounded-full border border-zinc-950",
                                isPositive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                              )} />
                              
                              <div className="bg-[var(--ops-surface-sunken)]/30 border border-[var(--ops-border)] p-3.5 rounded-[12px] space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className={cn(
                                    "font-black font-mono tracking-tight",
                                    isPositive ? "text-emerald-500" : "text-rose-500"
                                  )}>
                                    {isPositive ? '+' : ''}{changeVal.toFixed(2)} {selectedRow.unit}
                                  </span>
                                  <span className="text-[8px] text-[var(--ops-text-muted)] font-bold uppercase tracking-widest">
                                    {log.time_ago || 'recent'}
                                  </span>
                                </div>
                                
                                <p className="text-foreground font-bold uppercase tracking-tight text-[10px]">
                                  Reason: {log.source || log.reason || 'manual adjustment'}
                                </p>
                                
                                <div className="flex items-center justify-between text-[8px] font-bold text-[var(--ops-text-muted)] uppercase tracking-widest pt-1 border-t border-[var(--ops-border-subtle)]/60">
                                  <span>Handler: {log.employee_name || 'System'}</span>
                                  <span>Remaining: {log.remaining || `${selectedRow.stock} ${selectedRow.unit}`}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 3: PROCUREMENT ── */}
                {drawerTab === 'procurement' && (
                  <div className="space-y-6">
                    <div className="bg-[var(--ops-surface-sunken)]/20 border border-[var(--ops-border)] p-4.5 rounded-[12px] space-y-2">
                      <h4 className="text-[10px] font-black uppercase text-[var(--ops-text-secondary)] tracking-wider flex items-center gap-1.5">
                        <div className="size-1.5 rounded-full bg-emerald-500" />
                        Costing Summary
                      </h4>
                      <p className="text-[10px] text-[var(--ops-text-muted)] leading-relaxed">
                        Total investment calculations based on procurement records. Values represent current inventory unit rates mapped across branches.
                      </p>
                    </div>

                    <div className="border border-[var(--ops-border)] rounded-[12px] bg-[var(--ops-surface-sunken)] divide-y divide-zinc-900">
                      {[
                        { label: 'Current Base Price', value: `₱ ${selectedRow.cost_per_unit.toFixed(4)} / ${selectedRow.unit}` },
                        { label: 'Computed Volume Price', value: `₱ ${(selectedRow.display_price ?? selectedRow.cost_per_unit).toFixed(2)} / ${selectedRow.display_unit || selectedRow.unit}` },
                        { label: 'Average Piece Weight', value: selectedRow.avg_weight_per_piece ? `${selectedRow.avg_weight_per_piece} grams` : 'N/A' },
                        { label: 'Total Valuation', value: `₱ ${(selectedRow.stock * selectedRow.cost_per_unit).toFixed(2)}` }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center px-4 py-3 text-xs">
                          <span className="font-bold text-[var(--ops-text-muted)] uppercase tracking-wider text-[9px]">{item.label}</span>
                          <span className="font-black text-foreground uppercase tracking-tight">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border border-[var(--ops-border)]/50 p-4 rounded-[12px] bg-[var(--ops-surface-sunken)]/5 text-[9px] text-[var(--ops-text-muted)] leading-relaxed font-bold uppercase tracking-wider">
                      <p className="text-[var(--ops-text-secondary)] font-black mb-1">Procurement Rule Reminder:</p>
                      Procurement cost updates reflect dynamically under "Procurement Costing" when a stock adjustment is submitted. Formula: Total Cost / Batch volume in base units.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── EXISTING MODALS ────────────────────────────────────────── */}
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

      <WastageModal
        open={isWastageModalOpen}
        onOpenChange={setIsWastageModalOpen}
        item={selectedRow}
        type="ingredient"
      />

      <MassRestockModal
        open={isMassRestockModalOpen}
        onOpenChange={(isOpen) => {
          setIsMassRestockModalOpen(isOpen);
          if (!isOpen) setBulkRestockQuantities(undefined);
        }}
        branchName={activeRestockBranch?.name || ''}
        branchId={activeRestockBranch?.id || 0}
        inventory={inventory}
        initialQuantities={bulkRestockQuantities}
      />

      {/* Add / Edit Dialogs */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={open => {
        if (!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); reset(); setLocalErrors({}); }
      }}>
        <DialogContent className="sm:max-w-[500px] rounded-[16px] border border-[var(--ops-border)] bg-zinc-950 text-foreground shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-foreground">
              <FiPackage className="text-primary size-5" /> {isEditModalOpen ? 'Edit Limits' : 'Add Item'}
            </DialogTitle>
            <DialogDescription className="text-[9px] font-black uppercase text-[var(--ops-text-muted)] tracking-widest mt-1">
              {isEditModalOpen
                ? 'Update the details for this inventory item.'
                : 'Add a new inventory item that will be used across branches.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={isEditModalOpen ? submitEdit : submitAdd} className="space-y-5 pt-4">
            <div className="space-y-4">
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)] flex items-center gap-1.5">
                  <div className="size-1 rounded-full bg-primary" /> Item Name
                </label>
                <Input
                  maxLength={50}
                  value={data.name}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^A-Za-z0-9\s]/g, '');
                    setData('name', cleaned);
                    validateField('name', cleaned);
                  }}
                  onBlur={() => validateField('name', data.name)}
                  placeholder="e.g. Flour"
                  className={cn(
                    "h-10 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-foreground font-bold focus:ring-primary/45", 
                    localErrors.name ? "ring-destructive ring-1 border-transparent" : ""
                  )}
                />
                {localErrors.name && (
                  <p className="text-[8px] font-black uppercase tracking-wider text-rose-500 mt-1">{localErrors.name}</p>
                )}
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)] flex items-center gap-1.5">
                  <div className="size-1 rounded-full bg-primary" /> Purchase Unit
                </label>
                <Select value={data.unit} onValueChange={val => {
                  setData(prev => ({
                    ...prev, 
                    unit: val, 
                    avg_weight_per_piece: (val === 'pcs') ? prev.avg_weight_per_piece : ''
                  }));
                  validateField('unit', val);
                }}>
                  <SelectTrigger className={cn(
                    "w-full h-10 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-foreground font-bold", 
                    localErrors.unit ? "ring-destructive ring-1" : ""
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] text-foreground rounded-[12px]">
                    <SelectItem value="g" className="text-xs font-bold py-2">g (Gram)</SelectItem>
                    <SelectItem value="ml" className="text-xs font-bold py-2">ml (Milliliter)</SelectItem>
                    <SelectItem value="pcs" className="text-xs font-bold py-2">pcs (Pieces)</SelectItem>
                    <SelectItem value="kg" className="text-xs font-bold py-2">kg (Kilogram)</SelectItem>
                    <SelectItem value="liters" className="text-xs font-bold py-2">liters (Liters)</SelectItem>
                  </SelectContent>
                </Select>
                {localErrors.unit && (
                  <p className="text-[8px] font-black uppercase tracking-wider text-rose-500 mt-1">{localErrors.unit}</p>
                )}
              </div>

              {/* Stock and Low Stock Mark */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)] flex items-center gap-1.5">
                    <div className="size-1 rounded-full bg-primary" /> Current Stock
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.stock}
                    onChange={e => {
                      setData('stock', e.target.value);
                      validateField('stock', e.target.value);
                    }}
                    onBlur={() => validateField('stock', data.stock)}
                    className={cn(
                      "h-10 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-foreground font-bold font-mono",
                      localErrors.stock ? "ring-destructive ring-1" : ""
                    )}
                  />
                  {localErrors.stock && (
                    <p className="text-[8px] font-black uppercase tracking-wider text-rose-500 mt-1">{localErrors.stock}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)] flex items-center gap-1.5">
                    <div className="size-1 rounded-full bg-rose-500" /> Low Stock Mark
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.low_stock_level}
                    onChange={e => {
                      setData('low_stock_level', e.target.value);
                      validateField('low_stock_level', e.target.value);
                    }}
                    onBlur={() => validateField('low_stock_level', data.low_stock_level)}
                    placeholder="e.g. 50"
                    className={cn(
                      "h-10 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-foreground font-bold font-mono",
                      localErrors.low_stock_level ? "ring-destructive ring-1" : ""
                    )}
                  />
                  {localErrors.low_stock_level && (
                    <p className="text-[8px] font-black uppercase tracking-wider text-rose-500 mt-1">{localErrors.low_stock_level}</p>
                  )}
                </div>
              </div>

              {/* Procurement Pricing Costing */}
              <div className="pt-3 border-t border-[var(--ops-border-subtle)] space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)] flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-emerald-500" /> Procurement Costing
                  </label>
                  <p className="text-[8px] font-bold text-[var(--ops-text-muted)] uppercase tracking-widest leading-normal pl-3">
                    Enter the total cost. Formula: Cost / Batch stock = Per unit rate.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)]">Total Purchase Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-500 text-xs">₱</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.cost_per_base_unit}
                      onChange={e => {
                        const val = e.target.value;
                        setData(d => ({
                          ...d,
                          cost_per_base_unit: val,
                          cost_per_unit: val 
                        }));
                        validateField('cost_per_base_unit', val);
                      }}
                      onBlur={() => validateField('cost_per_base_unit', data.cost_per_base_unit)}
                      placeholder="0.00"
                      className={cn(
                        "h-10 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] pl-7 rounded-[10px] text-foreground font-bold font-mono",
                        localErrors.cost_per_base_unit ? "ring-destructive ring-1" : ""
                      )}
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    {localErrors.cost_per_base_unit ? (
                      <p className="text-[8px] text-rose-500 font-black uppercase tracking-widest mt-1">{localErrors.cost_per_base_unit}</p>
                    ) : (
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                        Auto-calculated rate: ₱{costPerUnitPreview} per {data.unit || 'unit'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Piece Weighing Settings */}
              {data.unit === 'pcs' && (
                <div className="pt-3 border-t border-[var(--ops-border-subtle)] space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)] flex items-center gap-1.5">
                    <div className="size-1 rounded-full bg-indigo-500" /> Avg Weight Per Piece (grams)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.avg_weight_per_piece}
                    onChange={e => {
                      setData('avg_weight_per_piece', e.target.value);
                      validateField('avg_weight_per_piece', e.target.value);
                    }}
                    onBlur={() => validateField('avg_weight_per_piece', data.avg_weight_per_piece)}
                    placeholder="e.g. 5"
                    className={cn(
                      "h-10 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-foreground font-bold font-mono",
                      localErrors.avg_weight_per_piece ? "ring-destructive ring-1" : ""
                    )}
                  />
                  {localErrors.avg_weight_per_piece && (
                    <p className="text-[8px] font-black uppercase tracking-wider text-rose-500 mt-1">{localErrors.avg_weight_per_piece}</p>
                  )}
                </div>
              )}

              {/* Branch Selection (add mode) */}
              {isAdmin && !isEditModalOpen && (
                <div className="space-y-3 border-t border-[var(--ops-border-subtle)] pt-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)] flex items-center gap-1.5">
                    <div className="size-1 rounded-full bg-primary" /> Store Selection
                  </label>
                  <div className="flex flex-wrap gap-2">
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
                            'cursor-pointer px-3 py-1.5 rounded-[8px] border-2 text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-2 select-none',
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] text-[var(--ops-text-muted)] hover:text-[var(--ops-text-secondary)]'
                          )}
                        >
                          <div className={cn(
                            'size-1.5 rounded-full',
                            isSelected ? 'bg-primary' : 'bg-zinc-700'
                          )} />
                          <span>{branch.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {localErrors.branch_ids && (
                    <p className="text-[8px] text-rose-500 font-black uppercase tracking-widest mt-1">{localErrors.branch_ids}</p>
                  )}
                </div>
              )}

              {/* Single Branch select (edit mode) */}
              {isAdmin && isEditModalOpen && (
                <div className="space-y-1.5 border-t border-[var(--ops-border-subtle)] pt-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)]">Branch Assignment</label>
                  <Select value={data.branch_id} onValueChange={val => setData('branch_id', val)}>
                    <SelectTrigger className="w-full h-10 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-foreground font-bold">
                      <SelectValue placeholder="Select branch..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] text-foreground rounded-[12px]">
                      {branchList.map(b => (
                        <SelectItem key={b.id} value={String(b.id)} className="text-xs font-bold py-2">{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            </div>

            <DialogFooter className="pt-4 border-t border-[var(--ops-border-subtle)] gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-[10px] h-10 px-4 font-black uppercase text-[10px] tracking-wider text-[var(--ops-text-secondary)] hover:bg-[var(--ops-surface-sunken)]" 
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); reset(); }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={processing}
                className="rounded-[10px] h-10 px-6 gap-2 bg-primary hover:bg-primary-hover text-foreground font-black uppercase text-[10px] tracking-wider italic shadow-sm"
              >
                {processing ? <FiRefreshCw className="size-4 animate-spin" /> : <FiZap className="size-4" />}
                <span>{isEditModalOpen ? 'Save Changes' : 'Add Item'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-[20px] border border-[var(--ops-border)] bg-zinc-950 text-foreground shadow-2xl p-6">
          <DialogHeader className="items-center text-center">
            <div className="size-16 rounded-[14px] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
              <FiTrash2 className="size-8" />
            </div>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-rose-500">
              Delete Ingredient?
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs font-semibold text-[var(--ops-text-secondary)] leading-normal">
              Confirm removal of <span className="font-black italic text-foreground uppercase tracking-tight">"{selectedRow?.name}"</span> from <span className="font-black text-rose-400">{selectedRow?.branch_name}</span>. 
              This will delete this branch stock record only. Other locations are unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6 flex flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="flex-1 h-10 rounded-[10px] font-black uppercase text-[10px] tracking-wider text-[var(--ops-text-secondary)] hover:bg-[var(--ops-surface-sunken)]" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 h-10 rounded-[10px] font-black uppercase text-[10px] tracking-wider bg-rose-600 hover:bg-rose-500 text-foreground italic" onClick={submitDelete} disabled={processing}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-[20px] border border-[var(--ops-border)] bg-zinc-950 text-foreground shadow-2xl p-6">
          <DialogHeader className="items-center text-center">
            <div className="size-16 rounded-[14px] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
              <FiTrash2 className="size-8" />
            </div>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-rose-500">
              Bulk Delete
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs font-semibold text-[var(--ops-text-secondary)] leading-normal">
              You are about to delete <span className="font-black text-rose-400">{selectedIds.length}</span> selected items.
              This will move them to the trash and hide them from active inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 text-center">
            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)]">
              Type <span className="text-rose-500 font-black italic">"DELETE"</span> to confirm action
            </label>
            <Input
              value={bulkDeleteConfirmation}
              onChange={e => setBulkDeleteConfirmation(e.target.value.toUpperCase())}
              placeholder="CONFIRMATION..."
              className="h-10 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-center font-black uppercase tracking-wider text-foreground"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="flex-1 h-10 rounded-[10px] font-black uppercase text-[10px] tracking-wider text-[var(--ops-text-secondary)] hover:bg-[var(--ops-surface-sunken)]" onClick={() => setIsBulkDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-10 rounded-[10px] font-black uppercase text-[10px] tracking-wider bg-rose-600 hover:bg-rose-500 italic" 
              onClick={submitBulkDelete} 
              disabled={bulkDeleteConfirmation !== 'DELETE' || processing}
            >
              Confirm Bulk Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptScannerModal
        open={isReceiptScannerOpen}
        onOpenChange={setIsReceiptScannerOpen}
        branchId={currentBranchId || branches?.[0]?.id || 1}
        inventory={inventory}
        onSuccess={() => {
          router.reload({ only: ['inventory'] });
          fetchActivityLogs();
        }}
      />
    </AppLayout>
  );
}
