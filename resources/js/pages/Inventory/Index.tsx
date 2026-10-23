import { router } from '@inertiajs/core';
import { Head, usePage, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    ChevronLeft,
    ChevronRight,
    Trash2,
    Store,
    Search,
    RefreshCw,
    X,
    Columns,
    Layers,
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';

import AlertError from '@/components/alert-error';
import { BatchPrepareModal } from '@/components/batch-prepare-modal';
import { CompositeSubrecipeModal } from '@/components/composite-subrecipe-modal';
import InputError from '@/components/input-error';
import { InventoryDrawer, type ActivityLog } from '@/components/inventory/InventoryDrawer';
import { InventoryFilterToolbar } from '@/components/inventory/InventoryFilterToolbar';
import { InventoryHero, type InventoryRow } from '@/components/inventory/InventoryHero';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { MassRestockModal } from '@/components/mass-restock-modal';
import { ResultModal } from '@/components/result-modal';
import { StockInModal } from '@/components/stock-in-modal';
import { StockReductionModal } from '@/components/stock-reduction-modal';
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

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

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
    
    // Dual-Branch Layout & Independent Panel Controls
    const [searchVictoria, setSearchVictoria] = useState('');
    const [searchStaCruz, setSearchStaCruz] = useState('');
    const [viewMode, setViewMode] = useState<'split' | 'victoria' | 'stacruz' | 'stacked'>('split');
    const [currentPageVic, setCurrentPageVic] = useState(1);
    const [itemsPerPageVic, setItemsPerPageVic] = useState(25);
    const [currentPageSta, setCurrentPageSta] = useState(1);
    const [itemsPerPageSta, setItemsPerPageSta] = useState(25);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
    const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
    const [isStockReductionModalOpen, setIsStockReductionModalOpen] = useState(false);
    const [isSubrecipeModalOpen, setIsSubrecipeModalOpen] = useState(false);
    const [isBatchPrepareModalOpen, setIsBatchPrepareModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
        type: 'success', title: '', message: '',
    });
    const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null);
    const [isMassRestockModalOpen, setIsMassRestockModalOpen] = useState(false);
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
    const [drawerTab, setDrawerTab] = useState<'overview' | 'queue' | 'history' | 'procurement'>('overview');

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

    const openStockReductionModal = (row: InventoryRow) => {
        setSelectedRow(row);
        setIsStockReductionModalOpen(true);
    };

    const openSubrecipeModal = (row: InventoryRow) => {
        setSelectedRow(row);
        setIsSubrecipeModalOpen(true);
    };

    const openBatchPrepareModal = (row: InventoryRow) => {
        setSelectedRow(row);
        setIsBatchPrepareModalOpen(true);
    };

    const openMassRestockModal = (targetBranch?: Branch | null) => {
        const branch = targetBranch
            || (currentBranchId && currentBranchId !== 'all' ? branchList.find(b => String(b.id) === String(currentBranchId)) : null)
            || branchList[0]
            || { id: 1, name: 'Default Branch' };
        setActiveRestockBranch({ id: Number(branch.id), name: branch.name });
        setIsMassRestockModalOpen(true);
    };

    const { data, setData, processing, reset } = useForm({
        name: '',
        is_composite: false,
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

    // Identification of Branches
    const victoriaBranch = useMemo(() => {
        return branchList.find(b => b.name.toLowerCase().includes('victoria')) || branchList[0];
    }, [branchList]);

    const staCruzBranch = useMemo(() => {
        return branchList.find(b => b.name.toLowerCase().includes('cruz') || b.name.toLowerCase().includes('sta')) || branchList[1];
    }, [branchList]);

    // Independent Data Streams
    const victoriaData = useMemo(() => {
        if (!victoriaBranch) return [];
        return filteredData.filter(item => {
            if (Number(item.branch_id) !== Number(victoriaBranch.id)) return false;
            if (searchVictoria.trim()) {
                const q = searchVictoria.toLowerCase();
                const sku = `ING-${item.id.toString().padStart(5, '0')}`.toLowerCase();
                return item.name.toLowerCase().includes(q) || sku.includes(q);
            }
            return true;
        });
    }, [filteredData, victoriaBranch, searchVictoria]);

    const staCruzData = useMemo(() => {
        if (!staCruzBranch) return [];
        return filteredData.filter(item => {
            if (Number(item.branch_id) !== Number(staCruzBranch.id)) return false;
            if (searchStaCruz.trim()) {
                const q = searchStaCruz.toLowerCase();
                const sku = `ING-${item.id.toString().padStart(5, '0')}`.toLowerCase();
                return item.name.toLowerCase().includes(q) || sku.includes(q);
            }
            return true;
        });
    }, [filteredData, staCruzBranch, searchStaCruz]);

    // Victoria Pagination
    const totalPagesVic = Math.ceil(victoriaData.length / itemsPerPageVic);
    const paginatedVictoriaData = useMemo(() => {
        const start = (currentPageVic - 1) * itemsPerPageVic;
        return victoriaData.slice(start, start + itemsPerPageVic);
    }, [victoriaData, currentPageVic, itemsPerPageVic]);

    // Sta. Cruz Pagination
    const totalPagesSta = Math.ceil(staCruzData.length / itemsPerPageSta);
    const paginatedStaCruzData = useMemo(() => {
        const start = (currentPageSta - 1) * itemsPerPageSta;
        return staCruzData.slice(start, start + itemsPerPageSta);
    }, [staCruzData, currentPageSta, itemsPerPageSta]);

    // Branch Live Metrics
    const vicLowStock = useMemo(() => victoriaData.filter(i => i.is_low_stock && !i.is_out_of_stock).length, [victoriaData]);
    const vicOutOfStock = useMemo(() => victoriaData.filter(i => i.is_out_of_stock).length, [victoriaData]);
    const vicValuation = useMemo(() => victoriaData.reduce((acc, i) => acc + (i.stock * (i.cost_per_unit || 0)), 0), [victoriaData]);

    const staLowStock = useMemo(() => staCruzData.filter(i => i.is_low_stock && !i.is_out_of_stock).length, [staCruzData]);
    const staOutOfStock = useMemo(() => staCruzData.filter(i => i.is_out_of_stock).length, [staCruzData]);
    const staValuation = useMemo(() => staCruzData.reduce((acc, i) => acc + (i.stock * (i.cost_per_unit || 0)), 0), [staCruzData]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPageVic(1);
        setCurrentPageSta(1);
    };

    const handleUnitFilterChange = (val: string) => {
        setFilterUnit(val);
        setCurrentPageVic(1);
        setCurrentPageSta(1);
    };

    const handleStatusChange = (val: string) => {
        setFilterStatus(val);
        setCurrentPageVic(1);
        setCurrentPageSta(1);
    };

    const handleQuickFilterChange = (val: 'all' | 'low' | 'out' | 'updated' | 'restocked') => {
        setQuickFilter(val);
        setCurrentPageVic(1);
        setCurrentPageSta(1);
    };

    const toggleSelectAllBranch = (isChecked: boolean, branchRows: InventoryRow[]) => {
        const pageIds = branchRows.map(r => r.id);
        if (isChecked) {
            setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
        } else {
            const pageIdsSet = new Set(pageIds);
            setSelectedIds(prev => prev.filter(id => !pageIdsSet.has(id)));
        }
    };

    const renderBranchPagination = (
        page: number,
        setPage: React.Dispatch<React.SetStateAction<number>>,
        perPage: number,
        setPerPage: React.Dispatch<React.SetStateAction<number>>,
        totalCount: number,
        totalNumPages: number,
        accentColor: 'rose' | 'indigo' = 'rose'
    ) => {
        if (totalCount === 0) return null;

        const startItem = (page - 1) * perPage + 1;
        const endItem = Math.min(totalCount, page * perPage);

        return (
            <div className="rounded-2xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_25px_-5px_rgba(231,84,128,0.06)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] p-3.5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors duration-300">
                <div className="flex items-center gap-3 font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                    <div className="flex items-center gap-1.5">
                        <span className="uppercase tracking-wider text-[10px]">Per Page</span>
                        <Select
                            value={String(perPage)}
                            onValueChange={(val) => {
                                setPerPage(Number(val));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-18 h-8 rounded-lg border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] font-mono font-bold text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl min-w-18 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                {[10, 25, 50, 100].map((val) => (
                                    <SelectItem key={val} value={String(val)} className="text-xs font-mono font-bold dark:focus:bg-white/10">
                                        {val}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <span className="font-mono text-[11px]">
                        {startItem} - {endItem} of {totalCount} items
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={page === 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className="rounded-lg h-8 w-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer"
                    >
                        <ChevronLeft className="size-3.5" />
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalNumPages) }, (_, i) => {
                            let pageNum = i + 1;
                            if (totalNumPages > 5 && page > 3) {
                                pageNum = page - 3 + i + 1;
                                if (pageNum > totalNumPages) pageNum = totalNumPages - (4 - i);
                            }
                            if (pageNum <= 0) return null;

                            const isActive = page === pageNum;
                            return (
                                <Button
                                    key={pageNum}
                                    variant={isActive ? 'default' : 'outline'}
                                    onClick={() => setPage(pageNum)}
                                    className={cn(
                                        'h-8 w-8 rounded-lg font-bold text-xs font-mono transition-all cursor-pointer',
                                        isActive
                                            ? accentColor === 'rose'
                                                ? 'bg-rose-500 hover:bg-rose-600 text-white border-transparent shadow-xs'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-xs'
                                            : 'border-[#F8C8DC]/60 dark:border-white/10 text-[#5D4A4D] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10'
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
                        disabled={page === totalNumPages || totalNumPages === 0}
                        onClick={() => setPage((prev) => Math.min(totalNumPages, prev + 1))}
                        className="rounded-lg h-8 w-8 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer"
                    >
                        <ChevronRight className="size-3.5" />
                    </Button>
                </div>
            </div>
        );
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
            is_composite: Boolean(row.is_composite),
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
            is_composite: Boolean(data.is_composite),
            unit: data.unit,
            initial_stock: Number(data.stock),
            low_stock_level: Number(data.low_stock_level),
            avg_weight_per_piece: data.avg_weight_per_piece ? Number(data.avg_weight_per_piece) : undefined,
            cost_per_base_unit: Number(data.cost_per_base_unit),
            cost_per_unit: calculatedCostPerUnit,
            branch_id: data.branch_id ? Number(data.branch_id) : undefined,
            branch_ids: data.branch_ids.map(Number),
        } as Record<string, string | boolean | number | number[] | undefined>, {
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
            is_composite: Boolean(data.is_composite),
            unit: data.unit,
            branch_id: data.branch_id ? Number(data.branch_id) : undefined,
            stock: Number(data.stock),
            low_stock_level: Number(data.low_stock_level),
            avg_weight_per_piece: data.avg_weight_per_piece ? Number(data.avg_weight_per_piece) : undefined,
            cost_per_unit: Number(data.cost_per_unit),
        } as Record<string, string | boolean | number | undefined>, {
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
                    onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
                />

                {/* ── ZONE 3: DUAL-BRANCH SIDE-BY-SIDE INVENTORY DISPLAY ── */}
                <div className="space-y-6">
                    {/* Responsive View Mode Selector & Branch Quick Overview */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 bg-white/70 dark:bg-[#121218]/70 backdrop-blur-xl border border-white/90 dark:border-white/10 rounded-2xl shadow-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] px-2.5">
                                Branch Layout
                            </span>
                            <div className="inline-flex p-1 bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('split')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        viewMode === 'split'
                                            ? "bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs"
                                            : "text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]"
                                    )}
                                    title="View Victoria on Left and Sta. Cruz on Right simultaneously"
                                >
                                    <Columns className="size-3.5" />
                                    <span>Side-by-Side</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('victoria')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        viewMode === 'victoria'
                                            ? "bg-white dark:bg-[#252532] text-rose-600 dark:text-rose-400 shadow-xs"
                                            : "text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]"
                                    )}
                                    title="Focus on Victoria Inventory only"
                                >
                                    <Store className="size-3.5 text-rose-500" />
                                    <span>Victoria ({victoriaData.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('stacruz')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        viewMode === 'stacruz'
                                            ? "bg-white dark:bg-[#252532] text-indigo-600 dark:text-indigo-400 shadow-xs"
                                            : "text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]"
                                    )}
                                    title="Focus on Sta. Cruz Inventory only"
                                >
                                    <Store className="size-3.5 text-indigo-500" />
                                    <span>Sta. Cruz ({staCruzData.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('stacked')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        viewMode === 'stacked'
                                            ? "bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs"
                                            : "text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]"
                                    )}
                                    title="Stack Victoria and Sta. Cruz tables vertically"
                                >
                                    <Layers className="size-3.5" />
                                    <span>Stacked</span>
                                </button>
                            </div>
                        </div>

                        {/* Branch Metrics Pill */}
                        <div className="flex flex-wrap items-center gap-3 px-2 text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            <span className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-rose-500"></span>
                                Victoria: <strong className="font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">{victoriaData.length}</strong> items
                            </span>
                            <span className="text-stone-300 dark:text-stone-700">|</span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-indigo-500"></span>
                                Sta. Cruz: <strong className="font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">{staCruzData.length}</strong> items
                            </span>
                        </div>
                    </div>

                    {/* Dual Branch Grid: Left (Victoria) & Right (Sta. Cruz) */}
                    <div className={cn(
                        "grid gap-6 transition-all duration-300 items-start",
                        viewMode === 'split' ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
                    )}>
                        {/* ────────────────────────────────────────────────────────── */}
                        {/* ── LEFT PANEL: VICTORIA INVENTORY ── */}
                        {/* ────────────────────────────────────────────────────────── */}
                        {(viewMode === 'split' || viewMode === 'victoria' || viewMode === 'stacked') && (
                            <div className="flex flex-col space-y-4 min-w-0">
                                {/* Victoria Header Card */}
                                <div className="rounded-3xl bg-linear-to-r from-rose-500/10 via-rose-500/5 to-white/80 dark:from-rose-950/30 dark:via-rose-950/10 dark:to-[#121218]/80 border border-rose-200/80 dark:border-rose-900/30 p-5 backdrop-blur-xl shadow-xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
                                                <Store className="size-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                        VICTORIA INVENTORY
                                                    </h2>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                                                        {victoriaBranch?.name || 'Victoria'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#9E8B8E] dark:text-[#64748B] font-medium">
                                                    Independent branch stock, batches, and ingredient specifications
                                                </p>
                                            </div>
                                        </div>

                                        {/* Restock Victoria CTA */}
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => openMassRestockModal(victoriaBranch)}
                                            className="h-9 px-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs gap-1.5 shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
                                            title="Mass restock ingredients for Victoria"
                                        >
                                            <RefreshCw className="size-3.5" />
                                            <span>Restock Victoria</span>
                                        </Button>
                                    </div>

                                    {/* Victoria Metric Badges */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-100 dark:border-rose-950/40 text-xs">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-[#181820]/80 border border-rose-200/60 dark:border-white/10 font-bold text-[#3D2C2E] dark:text-[#E2E8F0]">
                                            <span>Items:</span>
                                            <span className="font-mono text-rose-600 dark:text-rose-400">{victoriaData.length}</span>
                                        </span>
                                        {vicLowStock > 0 && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 font-bold text-amber-700 dark:text-amber-400">
                                                <span>Low:</span>
                                                <span className="font-mono">{vicLowStock}</span>
                                            </span>
                                        )}
                                        {vicOutOfStock > 0 && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/40 font-bold text-rose-700 dark:text-rose-400">
                                                <span>Out:</span>
                                                <span className="font-mono">{vicOutOfStock}</span>
                                            </span>
                                        )}
                                        {isAdmin && vicValuation > 0 && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                                                <span>Val:</span>
                                                <span>{formatCurrency(vicValuation)}</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Victoria Dedicated Search Filter */}
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#A08E91] dark:text-[#64748B]" />
                                        <Input
                                            type="text"
                                            value={searchVictoria}
                                            onChange={(e) => {
                                                setSearchVictoria(e.target.value);
                                                setCurrentPageVic(1);
                                            }}
                                            placeholder="Search Victoria ingredients or SKU..."
                                            className="h-10 pl-10 pr-9 bg-white/90 dark:bg-[#181820]/90 border-rose-200/60 dark:border-white/10 rounded-xl text-xs font-medium placeholder:text-[#C5B8BA] dark:placeholder:text-[#64748B]"
                                        />
                                        {searchVictoria && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchVictoria('');
                                                    setCurrentPageVic(1);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Victoria Inventory Table */}
                                <InventoryTable
                                    inventory={paginatedVictoriaData}
                                    isAdmin={isAdmin}
                                    density={density}
                                    selectedIds={selectedIds}
                                    onToggleSelectAll={(checked) => toggleSelectAllBranch(checked, paginatedVictoriaData)}
                                    onToggleSelectRow={toggleSelectRow}
                                    onSelectRow={openDetailDrawer}
                                    onOpenStockIn={openStockInModal}
                                    onOpenWastage={openWastageModal}
                                    onOpenReduceStock={openStockReductionModal}
                                    onOpenEdit={handleEdit}
                                    onOpenDelete={handleDelete}
                                    branchName={victoriaBranch?.name || 'Victoria'}
                                    emptyMessage="No ingredients found in Victoria inventory"
                                />

                                {/* Victoria Independent Pagination */}
                                {renderBranchPagination(
                                    currentPageVic,
                                    setCurrentPageVic,
                                    itemsPerPageVic,
                                    setItemsPerPageVic,
                                    victoriaData.length,
                                    totalPagesVic,
                                    'rose'
                                )}
                            </div>
                        )}

                        {/* ────────────────────────────────────────────────────────── */}
                        {/* ── RIGHT PANEL: STA. CRUZ INVENTORY ── */}
                        {/* ────────────────────────────────────────────────────────── */}
                        {(viewMode === 'split' || viewMode === 'stacruz' || viewMode === 'stacked') && (
                            <div className="flex flex-col space-y-4 min-w-0">
                                {/* Sta. Cruz Header Card */}
                                <div className="rounded-3xl bg-linear-to-r from-indigo-500/10 via-indigo-500/5 to-white/80 dark:from-indigo-950/30 dark:via-indigo-950/10 dark:to-[#121218]/80 border border-indigo-200/80 dark:border-indigo-900/30 p-5 backdrop-blur-xl shadow-xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                                                <Store className="size-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                        STA. CRUZ INVENTORY
                                                    </h2>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                                                        {staCruzBranch?.name || 'Sta. Cruz'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#9E8B8E] dark:text-[#64748B] font-medium">
                                                    Independent branch stock, batches, and ingredient specifications
                                                </p>
                                            </div>
                                        </div>

                                        {/* Restock Sta. Cruz CTA */}
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => openMassRestockModal(staCruzBranch)}
                                            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs gap-1.5 shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
                                            title="Mass restock ingredients for Sta. Cruz"
                                        >
                                            <RefreshCw className="size-3.5" />
                                            <span>Restock Sta. Cruz</span>
                                        </Button>
                                    </div>

                                    {/* Sta. Cruz Metric Badges */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-100 dark:border-indigo-950/40 text-xs">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-[#181820]/80 border border-indigo-200/60 dark:border-white/10 font-bold text-[#3D2C2E] dark:text-[#E2E8F0]">
                                            <span>Items:</span>
                                            <span className="font-mono text-indigo-600 dark:text-indigo-400">{staCruzData.length}</span>
                                        </span>
                                        {staLowStock > 0 && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 font-bold text-amber-700 dark:text-amber-400">
                                                <span>Low:</span>
                                                <span className="font-mono">{staLowStock}</span>
                                            </span>
                                        )}
                                        {staOutOfStock > 0 && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/40 font-bold text-rose-700 dark:text-rose-400">
                                                <span>Out:</span>
                                                <span className="font-mono">{staOutOfStock}</span>
                                            </span>
                                        )}
                                        {isAdmin && staValuation > 0 && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                                                <span>Val:</span>
                                                <span>{formatCurrency(staValuation)}</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Sta. Cruz Dedicated Search Filter */}
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#A08E91] dark:text-[#64748B]" />
                                        <Input
                                            type="text"
                                            value={searchStaCruz}
                                            onChange={(e) => {
                                                setSearchStaCruz(e.target.value);
                                                setCurrentPageSta(1);
                                            }}
                                            placeholder="Search Sta. Cruz ingredients or SKU..."
                                            className="h-10 pl-10 pr-9 bg-white/90 dark:bg-[#181820]/90 border-indigo-200/60 dark:border-white/10 rounded-xl text-xs font-medium placeholder:text-[#C5B8BA] dark:placeholder:text-[#64748B]"
                                        />
                                        {searchStaCruz && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchStaCruz('');
                                                    setCurrentPageSta(1);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Sta. Cruz Inventory Table */}
                                <InventoryTable
                                    inventory={paginatedStaCruzData}
                                    isAdmin={isAdmin}
                                    density={density}
                                    selectedIds={selectedIds}
                                    onToggleSelectAll={(checked) => toggleSelectAllBranch(checked, paginatedStaCruzData)}
                                    onToggleSelectRow={toggleSelectRow}
                                    onSelectRow={openDetailDrawer}
                                    onOpenStockIn={openStockInModal}
                                    onOpenWastage={openWastageModal}
                                    onOpenReduceStock={openStockReductionModal}
                                    onOpenEdit={handleEdit}
                                    onOpenDelete={handleDelete}
                                    branchName={staCruzBranch?.name || 'Sta. Cruz'}
                                    emptyMessage="No ingredients found in Sta. Cruz inventory"
                                />

                                {/* Sta. Cruz Independent Pagination */}
                                {renderBranchPagination(
                                    currentPageSta,
                                    setCurrentPageSta,
                                    itemsPerPageSta,
                                    setItemsPerPageSta,
                                    staCruzData.length,
                                    totalPagesSta,
                                    'indigo'
                                )}
                            </div>
                        )}
                    </div>
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
                onOpenReduceStock={openStockReductionModal}
                onOpenSubrecipe={openSubrecipeModal}
                onOpenBatchPrepare={openBatchPrepareModal}
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

            <StockReductionModal
                open={isStockReductionModalOpen}
                onOpenChange={setIsStockReductionModalOpen}
                ingredient={selectedRow}
                onSuccess={() => {
                    fetchActivityLogs();
                    router.reload({ only: ['inventory', 'stats'] });
                }}
            />

            {isAdmin && (
                <CompositeSubrecipeModal
                    open={isSubrecipeModalOpen}
                    onOpenChange={setIsSubrecipeModalOpen}
                    ingredient={selectedRow}
                    allIngredients={inventory}
                    onSuccess={() => {
                        fetchActivityLogs();
                        router.reload({ only: ['inventory', 'stats'] });
                    }}
                />
            )}

            {isAdmin && (
                <BatchPrepareModal
                    open={isBatchPrepareModalOpen}
                    onOpenChange={setIsBatchPrepareModalOpen}
                    ingredient={selectedRow}
                    branches={branchList}
                    currentBranchId={currentBranchId}
                    allIngredients={inventory}
                    onSuccess={() => {
                        fetchActivityLogs();
                        router.reload({ only: ['inventory', 'stats'] });
                    }}
                />
            )}

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
                            {isAdmin && (
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">
                                        Ingredient Classification
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setData('is_composite', false)}
                                            className={cn(
                                                "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                                                !data.is_composite
                                                    ? "bg-[#FFF5F7] dark:bg-[#181820] border-[#E75480] dark:border-[#FF4F81] text-[#E75480] dark:text-[#FF4F81] shadow-2xs"
                                                    : "bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#7D6B6E] dark:text-[#94A3B8]"
                                            )}
                                        >
                                            <div className="font-extrabold text-xs">Standard Ingredient</div>
                                            <div className="text-[10px] opacity-80">Simple inventory tracking</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('is_composite', true)}
                                            className={cn(
                                                "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                                                data.is_composite
                                                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 shadow-2xs"
                                                    : "bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#7D6B6E] dark:text-[#94A3B8]"
                                            )}
                                        >
                                            <div className="font-extrabold text-xs">Composite Ingredient</div>
                                            <div className="text-[10px] opacity-80">Has confidential sub-recipe</div>
                                        </button>
                                    </div>
                                </div>
                            )}

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
                            {isAdmin && (
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#5D4A4D] dark:text-[#94A3B8] ml-1">
                                        Ingredient Classification
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setData('is_composite', false)}
                                            className={cn(
                                                "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                                                !data.is_composite
                                                    ? "bg-[#FFF5F7] dark:bg-[#181820] border-[#E75480] dark:border-[#FF4F81] text-[#E75480] dark:text-[#FF4F81] shadow-2xs"
                                                    : "bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#7D6B6E] dark:text-[#94A3B8]"
                                            )}
                                        >
                                            <div className="font-extrabold text-xs">Standard Ingredient</div>
                                            <div className="text-[10px] opacity-80">Simple inventory tracking</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('is_composite', true)}
                                            className={cn(
                                                "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                                                data.is_composite
                                                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 shadow-2xs"
                                                    : "bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#7D6B6E] dark:text-[#94A3B8]"
                                            )}
                                        >
                                            <div className="font-extrabold text-xs">Composite Ingredient</div>
                                            <div className="text-[10px] opacity-80">Has confidential sub-recipe</div>
                                        </button>
                                    </div>
                                </div>
                            )}

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
