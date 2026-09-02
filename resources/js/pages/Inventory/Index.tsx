import { router } from '@inertiajs/core';
import { Head, usePage, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    ChevronLeft,
    ChevronRight,
    Trash2,
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';

import AlertError from '@/components/alert-error';
import InputError from '@/components/input-error';
import { InventoryDrawer, type ActivityLog } from '@/components/inventory/InventoryDrawer';
import { InventoryFilterToolbar } from '@/components/inventory/InventoryFilterToolbar';
import { InventoryHero, type InventoryRow } from '@/components/inventory/InventoryHero';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { MassRestockModal } from '@/components/mass-restock-modal';
import { ReceiptScannerModal } from '@/components/receipt-scanner-modal';
import { ResultModal } from '@/components/result-modal';
import { StockInModal } from '@/components/stock-in-modal';
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
import { WastageModal } from '@/components/wastage-modal';
import AppLayout from '@/layouts/app-layout';
import { convertQuantity } from '@/lib/unit-converter';
import { cn } from '@/lib/utils';

type Branch = { id: number; name: string };

interface ServerStats {
    total_items?: number;
    low_stock_count?: number;
    out_of_stock_count?: number;
    total_valuation?: number;
}

interface InventoryPageProps {
    inventory?: InventoryRow[];
    branches?: Branch[];
    currentBranchId?: number | string;
    isAdmin?: boolean;
    stats?: ServerStats;
    [key: string]: unknown;
}

export default function InventoryIndex() {
    const rawProps = usePage().props;
    const pageProps = rawProps as unknown as InventoryPageProps;
    const { inventory: rawInventory, branches, currentBranchId, isAdmin = false, stats: serverStats } = pageProps;

    const inventory: InventoryRow[] = useMemo(() => rawInventory || [], [rawInventory]);
    const branchList: Branch[] = useMemo(() => branches || [], [branches]);

    // Branch filter handler
    const handleBranchFilter = (value: string) => {
        router.get('/inventory', { branch_id: value === 'all' ? '' : value }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // BroadcastChannel real-time sync
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

    // State
    const [search, setSearch] = useState('');
    const [filterUnit, setFilterUnit] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [quickFilter, setQuickFilter] = useState<'all' | 'low' | 'out' | 'updated' | 'restocked'>('all');
    const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
    const [sortBy] = useState<string>('name');
    const [sortOrder] = useState<'asc' | 'desc'>('asc');
    
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
    const [bulkRestockQuantities] = useState<Record<number, { quantity: string, unit: string }> | undefined>(undefined);
    
    // Dynamic logs state for Dynamic Timestamps & Detail Drawer History
    const [, setRecentLogs] = useState<Record<string, unknown>[]>([]);
    const [lastUpdatedMap, setLastUpdatedMap] = useState<Record<string, Record<string, unknown>>>({});
    const [, setUpdatedTodayCount] = useState(0);
    const [drawerLogs, setDrawerLogs] = useState<ActivityLog[]>([]);
    const [loadingDrawerLogs, setLoadingDrawerLogs] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'overview' | 'history' | 'procurement'>('overview');

    // Load activity logs on page mount
    const fetchActivityLogs = async () => {
        try {
            const response = await axios.get('/api/inventory/activity-logs', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (response.data?.logs) {
                const logs = response.data.logs;
                setRecentLogs(logs);
                
                const map: Record<string, Record<string, unknown>> = {};
                let todayCount = 0;
                const todayStr = new Date().toDateString();
                
                logs.forEach((log: Record<string, unknown>) => {
                    const key = `${log.ingredient_id}-${log.branch_id}`;
                    if (!map[key]) {
                        map[key] = log;
                    }
                    const logDate = new Date(String(log.created_at));
                    if (logDate.toDateString() === todayStr) {
                        todayCount++;
                    }
                });
                
                setLastUpdatedMap(map);
                setUpdatedTodayCount(todayCount);
            }
        } catch {
            // Fallback silently if logs endpoint fails
        }
    };

    useEffect(() => {
        fetchActivityLogs();
    }, []);

    // Sync drawer logs when selecting an item
    useEffect(() => {
        if (selectedRow) {
            setLoadingDrawerLogs(true);
            axios.get(`/api/inventory/activity-logs?ingredient_id=${selectedRow.id}&branch_id=${selectedRow.branch_id}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(res => {
                if (res.data?.logs) {
                    setDrawerLogs(res.data.logs);
                }
            })
            .catch(() => {})
            .finally(() => setLoadingDrawerLogs(false));
        }
    }, [selectedRow]);

    // Open Item Detail Drawer
    const openDetailDrawer = (row: InventoryRow) => {
        setSelectedRow(row);
        setDrawerTab('overview');
        setIsDrawerOpen(true);
    };

    const openStockInModal = (row: InventoryRow) => {
        setSelectedRow(row);
        setIsStockInModalOpen(true);
    };

    const openWastageModal = (row: InventoryRow) => {
        setSelectedRow(row);
        setIsWastageModalOpen(true);
    };

    const openMassRestockModal = () => {
        const branchId = currentBranchId ? Number(currentBranchId) : branchList[0]?.id || 1;
        const branchName = branchList.find(b => b.id === branchId)?.name || 'Default Branch';
        setActiveRestockBranch({ id: branchId, name: branchName });
        setIsMassRestockModalOpen(true);
    };

    const { data, setData, processing, reset } = useForm({
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
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [isAddSubmitting, setIsAddSubmitting] = useState(false);

    const validateField = (name: string, value: unknown) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value || String(value).trim().length === 0) error = 'Ingredient name is required';
                else if (String(value).trim().length < 2) error = 'Ingredient name must be at least 2 characters';
                else if (String(value).trim().length > 50) error = 'Ingredient name cannot exceed 50 characters';
                else if (!/^[A-Za-z\s]+$/.test(String(value).trim())) error = 'Ingredient name must only contain letters and spaces';
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
            case 'cost_per_unit':
                if (value === '' || value === undefined) error = 'Cost per unit is required';
                else if (isNaN(Number(value))) error = 'Invalid cost amount';
                else if (Number(value) < 0) error = 'Cost cannot be negative';
                break;
            case 'branch_ids':
                if (!isEditModalOpen && Array.isArray(value) && value.length === 0 && isAdmin) {
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

    // Active Branch Name
    const activeBranchName = useMemo(() => {
        if (!currentBranchId || currentBranchId === 'all') return 'All Branches';
        const branch = branchList.find(b => String(b.id) === String(currentBranchId));
        return branch ? branch.name : 'All Branches';
    }, [currentBranchId, branchList]);

    // Filtered & Sorted Flat Data
    const filteredData = useMemo(() => {
        return inventory
            .filter(item => {
                const skuString = `ING-${item.id.toString().padStart(5, '0')}`;
                const matchesSearch = 
                    item.name.toLowerCase().includes(search.toLowerCase()) ||
                    skuString.toLowerCase().includes(search.toLowerCase()) ||
                    (item.branch_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
                    (item.display_unit ?? item.unit).toLowerCase().includes(search.toLowerCase());

                const matchesUnit = filterUnit === 'all' || item.unit === filterUnit;
                
                let matchesStatus = true;
                if (filterStatus === 'optimal') {
                    matchesStatus = !item.is_low_stock && !item.is_out_of_stock;
                } else if (filterStatus === 'low') {
                    matchesStatus = item.is_low_stock && !item.is_out_of_stock;
                } else if (filterStatus === 'out') {
                    matchesStatus = item.is_out_of_stock;
                } else if (filterStatus === 'overstocked') {
                    matchesStatus = item.stock > (item.low_stock_level || 5) * 4;
                }
                
                let matchesQuick = true;
                if (quickFilter === 'low') matchesQuick = item.is_low_stock;
                else if (quickFilter === 'out') matchesQuick = item.is_out_of_stock;
                else if (quickFilter === 'updated') {
                    const log = lastUpdatedMap[`${item.id}-${item.branch_id}`];
                    if (log) {
                        const logDate = new Date(String(log.created_at));
                        matchesQuick = logDate.toDateString() === new Date().toDateString();
                    } else {
                        matchesQuick = false;
                    }
                }
                else if (quickFilter === 'restocked') {
                    const log = lastUpdatedMap[`${item.id}-${item.branch_id}`];
                    if (log && log.action_type === 'stock_in') {
                        const logDate = new Date(String(log.created_at));
                        matchesQuick = logDate.toDateString() === new Date().toDateString();
                    } else {
                        matchesQuick = false;
                    }
                }

                return matchesSearch && matchesUnit && matchesStatus && matchesQuick;
            })
            .sort((a, b) => {
                let comp = 0;
                if (sortBy === 'name') comp = a.name.localeCompare(b.name);
                else if (sortBy === 'stock') comp = a.stock - b.stock;
                else if (sortBy === 'price') comp = (a.display_price ?? a.cost_per_unit) - (b.display_price ?? b.cost_per_unit);
                else if (sortBy === 'updated') {
                    const logA = lastUpdatedMap[`${a.id}-${a.branch_id}`];
                    const logB = lastUpdatedMap[`${b.id}-${b.branch_id}`];
                    const dateA = logA ? new Date(String(logA.created_at)).getTime() : 0;
                    const dateB = logB ? new Date(String(logB.created_at)).getTime() : 0;
                    comp = dateA - dateB;
                }
                return sortOrder === 'asc' ? comp : -comp;
            });
    }, [inventory, search, filterUnit, filterStatus, quickFilter, sortBy, sortOrder, lastUpdatedMap]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const handleUnitFilterChange = (val: string) => {
        setFilterUnit(val);
        setCurrentPage(1);
    };

    const handleStatusChange = (val: string) => {
        setFilterStatus(val);
        setCurrentPage(1);
    };

    const handleQuickFilterChange = (val: 'all' | 'low' | 'out' | 'updated' | 'restocked') => {
        setQuickFilter(val);
        setCurrentPage(1);
    };

    // Handlers
    const handleAdd = () => {
        reset();
        setLocalErrors({});
        setIsAddModalOpen(true);
    };

    const handleUnitChange = (newUnit: string) => {
        const oldUnit = data.unit || 'g';
        if (oldUnit === newUnit) return;

        let newStock = data.stock;
        let newLowStock = data.low_stock_level;

        if (data.stock && !isNaN(Number(data.stock)) && Number(data.stock) > 0) {
            const converted = convertQuantity(Number(data.stock), oldUnit, newUnit);
            newStock = String(Number(converted.toFixed(4)));
        }
        if (data.low_stock_level && !isNaN(Number(data.low_stock_level)) && Number(data.low_stock_level) > 0) {
            const converted = convertQuantity(Number(data.low_stock_level), oldUnit, newUnit);
            newLowStock = String(Number(converted.toFixed(4)));
        }

        setData((prev) => ({
            ...prev,
            unit: newUnit,
            stock: newStock,
            low_stock_level: newLowStock,
        }));
    };

    const handleEdit = (row: InventoryRow) => {
        setSelectedRow(row);
        setLocalErrors({});
        setData({
            name: row.name,
            unit: row.display_unit || row.unit,
            stock: String(row.display_stock ?? row.stock),
            low_stock_level: String(row.low_stock_level ?? 5),
            avg_weight_per_piece: row.avg_weight_per_piece ? String(row.avg_weight_per_piece) : '',
            cost_per_base_unit: String(row.display_price ?? row.cost_per_unit ?? 0),
            cost_per_unit: String(row.display_price ?? row.cost_per_unit ?? 0),
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
            const err = validateField(f, (data as Record<string, unknown>)[f]);
            if (err) hasError = true;
        });

        if (hasError) {
            toast.error('Please resolve the validation errors before registering.');
            return;
        }

        const calculatedCostPerUnit = Number(data.stock) > 0 
            ? Number(data.cost_per_base_unit) / Number(data.stock)
            : Number(data.cost_per_base_unit);

        setIsAddSubmitting(true);

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
        } as Record<string, string | number | number[] | undefined>, {
            onSuccess: () => {
                setIsAddSubmitting(false);
                setIsAddModalOpen(false);
                reset();
                setLocalErrors({});
                stateChannel.postMessage({ type: 'inventory-updated' });
                router.reload({ only: ['inventory', 'stats'] });
                fetchActivityLogs();
                toast.success('Ingredient added successfully.');
            },
            onError: (errs) => {
                setIsAddSubmitting(false);
                setLocalErrors(prev => ({ ...prev, ...errs }));
                const firstErr = Object.values(errs)[0] || 'Unable to register ingredient.';
                toast.error(String(firstErr));
            }
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();

        const fields = ['name', 'unit', 'stock', 'low_stock_level', 'cost_per_unit'];
        if (data.unit === 'pcs') fields.push('avg_weight_per_piece');
        
        let hasError = false;
        fields.forEach(f => {
            const err = validateField(f, (data as Record<string, unknown>)[f]);
            if (err) hasError = true;
        });

        if (hasError) {
            toast.error('Please resolve the validation errors before pushing updates.');
            return;
        }

        setIsEditSubmitting(true);

        router.put(`/inventory/${selectedRow?.id}`, {
            name: data.name,
            unit: data.unit,
            branch_id: data.branch_id ? Number(data.branch_id) : undefined,
            stock: Number(data.stock),
            low_stock_level: Number(data.low_stock_level),
            avg_weight_per_piece: data.avg_weight_per_piece ? Number(data.avg_weight_per_piece) : undefined,
            cost_per_unit: Number(data.cost_per_unit),
        } as Record<string, string | number | undefined>, {
            onSuccess: () => {
                setIsEditSubmitting(false);
                setIsEditModalOpen(false);
                setIsDrawerOpen(false);
                reset();
                setLocalErrors({});
                stateChannel.postMessage({ type: 'inventory-updated' });
                router.reload({ only: ['inventory', 'stats'] });
                fetchActivityLogs();
                toast.success(`Ingredient "${data.name}" updated successfully.`);
            },
            onError: (errs) => {
                setIsEditSubmitting(false);
                setLocalErrors(prev => ({ ...prev, ...errs }));
                const firstErr = Object.values(errs)[0] || 'Unable to update ingredient specs.';
                toast.error(String(firstErr));
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

        router.post('/inventory/bulk-delete', {
            ids: selectedIds,
            ingredient_ids: selectedIds
        } as Record<string, number[]>, {
            onSuccess: () => {
                setIsBulkDeleteModalOpen(false);
                setSelectedIds([]);
                setBulkDeleteConfirmation('');
                stateChannel.postMessage({ type: 'inventory-updated' });
                router.reload({ only: ['inventory', 'stats'] });
                fetchActivityLogs();
                setResultModal({ type: 'success', title: 'Bulk Delete Complete', message: 'Selected ingredients have been removed.' });
                setIsResultModalOpen(true);
            }
        });
    };

    const toggleBranchInAddForm = (id: string) => {
        const current = [...data.branch_ids];
        const idx = current.indexOf(id);
        if (idx > -1) current.splice(idx, 1);
        else current.push(id);
        setData('branch_ids', current);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Inventory', href: '/inventory' }]}>
            <Head title="Inventory Command Center" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                
                {/* ── ZONE 1: HERO & VALUATION STATISTICS ── */}
                <InventoryHero
                    inventory={inventory}
                    stats={serverStats}
                    activeBranchName={activeBranchName}
                    isAdmin={isAdmin}
                />

                {/* ── ZONE 2: SEARCH & FILTER TOOLBAR ── */}
                <InventoryFilterToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    filterUnit={filterUnit}
                    onUnitChange={handleUnitFilterChange}
                    filterStatus={filterStatus}
                    onStatusChange={handleStatusChange}
                    quickFilter={quickFilter}
                    onQuickFilterChange={handleQuickFilterChange}
                    density={density}
                    onDensityChange={setDensity}
                    currentBranchId={currentBranchId}
                    branches={branchList}
                    isAdmin={isAdmin}
                    onBranchFilter={handleBranchFilter}
                    selectedIds={selectedIds}
                    onOpenAddModal={handleAdd}
                    onOpenMassRestockModal={openMassRestockModal}
                    onOpenReceiptScanner={() => setIsReceiptScannerOpen(true)}
                    onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
                />

                {/* ── ZONE 3: INVENTORY TABLE DISPLAY ── */}
                <div className="space-y-6">
                    <InventoryTable
                        inventory={paginatedData}
                        isAdmin={isAdmin}
                        density={density}
                        selectedIds={selectedIds}
                        onToggleSelectAll={toggleSelectAll}
                        onToggleSelectRow={toggleSelectRow}
                        onSelectRow={openDetailDrawer}
                        onOpenStockIn={openStockInModal}
                        onOpenWastage={openWastageModal}
                        onOpenEdit={handleEdit}
                        onOpenDelete={handleDelete}
                    />

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
                                            {[10, 25, 50, 100].map(val => (
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

            {/* Item Details Multi-Tab Drawer */}
            <InventoryDrawer
                row={selectedRow}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                isAdmin={isAdmin}
                drawerLogs={drawerLogs}
                loadingDrawerLogs={loadingDrawerLogs}
                drawerTab={drawerTab}
                onTabChange={setDrawerTab}
                onOpenStockIn={openStockInModal}
                onOpenWastage={openWastageModal}
                onOpenEdit={handleEdit}
                onOpenDelete={handleDelete}
            />

            {/* Preserved Action Modals */}
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

            {activeRestockBranch && (
                <MassRestockModal
                    open={isMassRestockModalOpen}
                    onOpenChange={setIsMassRestockModalOpen}
                    branchName={activeRestockBranch.name}
                    branchId={activeRestockBranch.id}
                    inventory={inventory}
                    initialQuantities={bulkRestockQuantities}
                />
            )}

            <ReceiptScannerModal
                open={isReceiptScannerOpen}
                onOpenChange={setIsReceiptScannerOpen}
                branchId={Number(currentBranchId || branchList[0]?.id || 1)}
                inventory={inventory}
                branches={branchList}
                isAdmin={isAdmin}
                onSuccess={() => {
                    fetchActivityLogs();
                    router.reload({ only: ['inventory', 'stats'] });
                }}
            />

            <ResultModal
                open={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                type={resultModal.type}
                title={resultModal.title}
                message={resultModal.message}
            />

            {/* Add Ingredient Dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-xl rounded-4xl bg-white dark:bg-[#121218] p-6 sm:p-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit']">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">Register New Ingredient</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Define global ingredient parameters, base pricing, and branch allocation.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitAdd} className="space-y-4 pt-2">
                        {(localErrors.general || localErrors.message || localErrors.error) && (
                            <AlertError errors={[localErrors.general || localErrors.message || localErrors.error]} />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Ingredient Name</label>
                                <Input required value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Premium White Rice" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]" />
                                <InputError message={localErrors.name} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Base Unit</label>
                                <select
                                    required
                                    value={data.unit}
                                    onChange={(e) => handleUnitChange(e.target.value)}
                                    className="w-full h-12 px-3 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-sm font-bold appearance-none"
                                >
                                    <option value="g">Grams (g)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="liters">Liters (L)</option>
                                    <option value="ml">Milliliters (ml)</option>
                                </select>
                                <InputError message={localErrors.unit} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Initial Stock</label>
                                <Input type="number" step="0.0001" required value={data.stock} onChange={(e) => setData('stock', e.target.value)} placeholder="0" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono font-bold" />
                                <InputError message={localErrors.stock} />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8]">Low Stock Mark</label>
                                    <span className="text-[10px] font-mono font-bold text-[#E75480] dark:text-[#FF4F81] uppercase">[{data.unit || 'pcs'}]</span>
                                </div>
                                <div className="relative">
                                    <Input type="number" step="0.0001" required value={data.low_stock_level} onChange={(e) => setData('low_stock_level', e.target.value)} placeholder="5" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono pr-12" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#9E8B8E] dark:text-[#64748B] pointer-events-none">{data.unit || 'pcs'}</span>
                                </div>
                                <InputError message={localErrors.low_stock_level} />
                            </div>

                            {isAdmin && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8]">Total Cost (PHP)</label>
                                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Unit Cost: ₱{costPerUnitPreview}/{data.unit || 'unit'}</span>
                                    </div>
                                    <Input type="number" step="0.0001" required value={data.cost_per_base_unit} onChange={(e) => setData('cost_per_base_unit', e.target.value)} placeholder="0.00" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-emerald-600 dark:text-emerald-400 font-mono font-bold" />
                                    <InputError message={localErrors.cost_per_base_unit} />
                                </div>
                            )}

                            {data.unit === 'pcs' && (
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Avg Weight / Piece (Grams)</label>
                                    <Input type="number" step="0.0001" value={data.avg_weight_per_piece} onChange={(e) => setData('avg_weight_per_piece', e.target.value)} placeholder="e.g. 50" className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono" />
                                    <InputError message={localErrors.avg_weight_per_piece} />
                                </div>
                            )}

                            {/* Branch Selection Chips */}
                            {isAdmin && branchList.length > 0 && (
                                <div className="col-span-2 space-y-2 border-t border-[#F8C8DC]/40 dark:border-white/10 pt-3">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Branch Assignment</label>
                                    <div className="flex flex-wrap gap-2">
                                        {branchList.map((b) => (
                                            <button
                                                type="button"
                                                key={b.id}
                                                onClick={() => toggleBranchInAddForm(b.id.toString())}
                                                className={cn(
                                                    "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
                                                    data.branch_ids.includes(b.id.toString())
                                                        ? "bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent shadow-xs"
                                                        : "bg-white dark:bg-[#181820] text-[#7D6B6E] dark:text-[#94A3B8] border-[#F8C8DC] dark:border-white/10 hover:border-[#E75480]"
                                                )}
                                            >
                                                <span>{b.name}</span>
                                            </button>
                                        ))}
                                        {branchList.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const allIds = branchList.map(b => b.id.toString());
                                                    const allSelected = branchList.every(b => data.branch_ids.includes(b.id.toString()));
                                                    setData('branch_ids', allSelected ? [] : allIds);
                                                }}
                                                className={cn(
                                                    "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
                                                    branchList.every(b => data.branch_ids.includes(b.id.toString()))
                                                        ? "bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent shadow-xs"
                                                        : "bg-white dark:bg-[#181820] text-[#7D6B6E] dark:text-[#94A3B8] border-[#F8C8DC] dark:border-white/10 hover:border-[#E75480]"
                                                )}
                                            >
                                                <span>Both Branches (Global)</span>
                                            </button>
                                        )}
                                    </div>
                                    <InputError message={localErrors.branch_ids} />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">Cancel</Button>
                            <Button type="submit" disabled={processing || isAddSubmitting} className="rounded-xl h-11 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white text-xs font-bold cursor-pointer">
                                {isAddSubmitting ? 'Registering...' : 'Confirm Registration'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Ingredient Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-xl rounded-4xl bg-white dark:bg-[#121218] p-6 sm:p-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit']">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">Revise Ingredient Specs</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Modify ingredient parameters, low stock thresholds, and unit costs.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitEdit} className="space-y-4 pt-2">
                        {(localErrors.general || localErrors.message || localErrors.error) && (
                            <AlertError errors={[localErrors.general || localErrors.message || localErrors.error]} />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Ingredient Name</label>
                                <Input required value={data.name} onChange={(e) => setData('name', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]" />
                                <InputError message={localErrors.name} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Base Unit</label>
                                <select
                                    required
                                    value={data.unit}
                                    onChange={(e) => handleUnitChange(e.target.value)}
                                    className="w-full h-12 px-3 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] text-sm font-bold appearance-none"
                                >
                                    <option value="g">Grams (g)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="liters">Liters (L)</option>
                                    <option value="ml">Milliliters (ml)</option>
                                </select>
                                <InputError message={localErrors.unit} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Current Stock</label>
                                <Input type="number" step="0.0001" required value={data.stock} onChange={(e) => setData('stock', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono font-bold" />
                                <InputError message={localErrors.stock} />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8]">Low Stock Mark</label>
                                    <span className="text-[10px] font-mono font-bold text-[#E75480] dark:text-[#FF4F81] uppercase">[{data.unit || 'pcs'}]</span>
                                </div>
                                <div className="relative">
                                    <Input type="number" step="0.0001" required value={data.low_stock_level} onChange={(e) => setData('low_stock_level', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono pr-12" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#9E8B8E] dark:text-[#64748B] pointer-events-none">{data.unit || 'pcs'}</span>
                                </div>
                                <InputError message={localErrors.low_stock_level} />
                            </div>

                            {isAdmin && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Cost Per Base Unit (PHP)</label>
                                    <Input type="number" step="0.0001" required value={data.cost_per_unit} onChange={(e) => setData('cost_per_unit', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-emerald-600 dark:text-emerald-400 font-mono font-bold" />
                                    <InputError message={localErrors.cost_per_unit} />
                                </div>
                            )}

                            {data.unit === 'pcs' && (
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">Avg Weight / Piece (Grams)</label>
                                    <Input type="number" step="0.0001" value={data.avg_weight_per_piece} onChange={(e) => setData('avg_weight_per_piece', e.target.value)} className="h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC] font-mono" />
                                    <InputError message={localErrors.avg_weight_per_piece} />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">Cancel</Button>
                            <Button type="submit" disabled={processing || isEditSubmitting} className="rounded-xl h-11 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] dark:hover:bg-[#C00525] text-white text-xs font-bold cursor-pointer">
                                {isEditSubmitting ? 'Updating...' : 'Push Updates'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Ingredient Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#121218] p-6 font-['Outfit'] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-2 text-xl font-bold">
                            <Trash2 className="size-5 text-rose-600 dark:text-rose-400" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                            Are you sure you want to delete <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">"{selectedRow?.name}"</strong> from <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{selectedRow?.branch_name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">Cancel</Button>
                        <Button variant="destructive" onClick={submitDelete} disabled={processing} className="rounded-xl text-xs font-bold bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-800">
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Dialog */}
            <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
                <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#121218] p-6 font-['Outfit'] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-2 text-xl font-bold">
                            <Trash2 className="size-5 text-rose-600 dark:text-rose-400" /> Bulk Delete Confirmation
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                            You are about to delete <strong className="text-rose-600 dark:text-rose-400">{selectedIds.length} ingredients</strong>. Type <strong className="font-mono">DELETE</strong> to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Input
                            value={bulkDeleteConfirmation}
                            onChange={(e) => setBulkDeleteConfirmation(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="h-11 rounded-xl font-mono text-xs border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#F8FAFC]"
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setIsBulkDeleteModalOpen(false)} className="rounded-xl text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">Cancel</Button>
                        <Button variant="destructive" onClick={submitBulkDelete} disabled={bulkDeleteConfirmation !== 'DELETE'} className="rounded-xl text-xs font-bold bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-800">
                            Confirm Bulk Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
