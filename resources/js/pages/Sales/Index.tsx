import { Head, usePage, router } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';

import { SalesCardGrid } from '@/components/sales/SalesCardGrid';
import { SalesDrawer } from '@/components/sales/SalesDrawer';
import { SalesExportModal } from '@/components/sales/SalesExportModal';
import { SalesFilterToolbar } from '@/components/sales/SalesFilterToolbar';
import { SalesHero, type Sale } from '@/components/sales/SalesHero';
import { SalesTable } from '@/components/sales/SalesTable';
import { SalesTimeline } from '@/components/sales/SalesTimeline';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';

interface BranchInfo {
    id: number;
    name: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedSales {
    data: Sale[];
    total?: number;
    per_page?: number;
    from?: number;
    to?: number;
    prev_page_url?: string | null;
    next_page_url?: string | null;
    links?: PaginationLink[];
}

interface SalesStats {
    pending?: number | string;
    preparing?: number | string;
    completed_today?: number | string;
    [key: string]: unknown;
}

interface SalesPageProps {
    sales?: PaginatedSales;
    filters?: { search?: string; status?: string; branch_id?: string };
    stats?: SalesStats;
    branches?: BranchInfo[];
    isAdmin?: boolean;
    [key: string]: unknown;
}

export default function SalesIndex() {
    const rawProps = usePage().props;
    const pageProps = rawProps as unknown as SalesPageProps;
    const { sales: paginatedSales = { data: [] }, filters = {}, stats = {}, branches = [], isAdmin = false } = pageProps;
    const salesList: Sale[] = useMemo(() => paginatedSales.data || [], [paginatedSales]);
    const branchList: BranchInfo[] = useMemo(() => branches || [], [branches]);

    // Filters & View States
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || 'all');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

    // Drawer & Modal States
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null);
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);

    // BroadcastChannel real-time sync
    const stateChannel = useMemo(() => new BroadcastChannel('app-state-sync'), []);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'sales-updated' || e.data.type === 'inventory-updated') {
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

    // Handlers
    const handleSearchChange = (val: string) => {
        setSearch(val);
        router.get('/sales', { search: val, status: statusFilter === 'all' ? '' : statusFilter, branch_id: branchFilter === 'all' ? '' : branchFilter }, { preserveState: true, preserveScroll: true });
    };

    const handleStatusChange = (val: string) => {
        setStatusFilter(val);
        router.get('/sales', { search, status: val === 'all' ? '' : val, branch_id: branchFilter === 'all' ? '' : branchFilter }, { preserveState: true, preserveScroll: true });
    };

    const handleBranchChange = (val: string) => {
        setBranchFilter(val);
        router.get('/sales', { search, status: statusFilter === 'all' ? '' : statusFilter, branch_id: val === 'all' ? '' : val }, { preserveState: true, preserveScroll: true });
    };

    const updateStatus = (id: number, status: string) => {
        setIsUpdatingStatus(id);
        router.put(`/sales/${id}/status`, { status }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsUpdatingStatus(null);
                setIsVoidModalOpen(false);
                stateChannel.postMessage({ type: 'sales-updated' });
                stateChannel.postMessage({ type: 'inventory-updated' });
                router.reload();
                toast.success(status === 'cancelled' 
                    ? 'Transaction voided and stock restored successfully.' 
                    : `Order status updated to ${status}.`
                );
            },
            onError: (errs) => {
                setIsUpdatingStatus(null);
                const errMsg = errs.error || Object.values(errs)[0] || 'Failed to update order status.';
                toast.error(String(errMsg));
            },
            onFinish: () => {
                setIsUpdatingStatus(null);
            }
        });
    };

    const openDrawer = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDrawerOpen(true);
    };

    const openVoidModal = (sale: Sale) => {
        setSaleToVoid(sale);
        setIsVoidModalOpen(true);
    };

    // Filtered Local View Data
    const filteredSales = useMemo(() => {
        return salesList.filter(s => {
            const matchesSearch = 
                s.order_number.toLowerCase().includes(search.toLowerCase()) ||
                (s.cashier?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (s.branch?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (s.payment_method ?? '').toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
            const saleBranchId = s.branch_id ?? s.branch?.id;
            const matchesBranch = !branchFilter || branchFilter === 'all' || (saleBranchId !== undefined && String(saleBranchId) === String(branchFilter));
            return matchesSearch && matchesStatus && matchesBranch;
        });
    }, [salesList, search, statusFilter, branchFilter]);

    // Active Branch Name
    const activeBranchName = useMemo(() => {
        if (!branchFilter || branchFilter === 'all') return 'All Branches';
        const b = branchList.find(item => String(item.id) === String(branchFilter));
        return b ? b.name : 'All Branches';
    }, [branchFilter, branchList]);



    // Print Sales Summary Report
    const handlePrintReport = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Sales', href: '/sales' }]}>
            <Head title="Sales Command Center" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                
                {/* ── ZONE 1: HERO & SALES REVENUE TELEMETRY ── */}
                <SalesHero
                    sales={salesList}
                    stats={stats}
                    activeBranchName={activeBranchName}
                />

                {/* ── ZONE 2: SEARCH & FILTER TOOLBAR ── */}
                <SalesFilterToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    statusFilter={statusFilter}
                    onStatusChange={handleStatusChange}
                    branchFilter={branchFilter}
                    onBranchChange={handleBranchChange}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    density={density}
                    onDensityChange={setDensity}
                    branches={branchList}
                    isAdmin={isAdmin}
                    onExportSales={() => setIsExportModalOpen(true)}
                    onPrintReport={handlePrintReport}
                />

                {/* ── ZONE 3: MAIN VIEW (TABLE VS CARDS GRID) ── */}
                <div className="space-y-8">
                    {viewMode === 'table' ? (
                        <SalesTable
                            sales={filteredSales}
                            isAdmin={isAdmin}
                            density={density}
                            onSelectSale={openDrawer}
                            onOpenVoidModal={openVoidModal}
                        />
                    ) : (
                        <SalesCardGrid
                            sales={filteredSales}
                            isAdmin={isAdmin}
                            onSelectSale={openDrawer}
                            onOpenVoidModal={openVoidModal}
                        />
                    )}

                    {/* ── ZONE 4: TRANSACTION TIMELINE FEED ── */}
                    <SalesTimeline
                        sales={salesList}
                        onSelectSale={openDrawer}
                    />
                </div>

            </div>

            {/* Slide-over Sale Details Drawer */}
            <SalesDrawer
                sale={selectedSale}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                isAdmin={isAdmin}
                onOpenVoidModal={(sale) => {
                    setIsDrawerOpen(false);
                    openVoidModal(sale);
                }}
            />

            {/* Confirm Void Dialog */}
            <Dialog open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
                <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#121218] p-6 font-['Outfit'] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-2 text-xl font-bold">
                            <ShieldAlert className="size-5 text-rose-600 dark:text-rose-400" /> Void Transaction #{saleToVoid?.order_number}
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                            Are you sure you want to void this sale? Voided transactions cannot be processed again and will restore inventory levels in the database.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10">
                        <Button
                            variant="outline"
                            disabled={isUpdatingStatus === saleToVoid?.id}
                            onClick={() => setIsVoidModalOpen(false)}
                            className="rounded-xl text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isUpdatingStatus === saleToVoid?.id}
                            onClick={() => {
                                if (saleToVoid) {
                                    updateStatus(saleToVoid.id, 'cancelled');
                                }
                            }}
                            className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                        >
                            {isUpdatingStatus === saleToVoid?.id ? 'Voiding...' : 'Confirm Void'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sales Export Configuration Modal */}
            <SalesExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                activeStatus={statusFilter}
                activeBranch={branchFilter}
                activeSearch={search}
                branches={branchList}
                isAdmin={isAdmin}
            />

        </AppLayout>
    );
}
