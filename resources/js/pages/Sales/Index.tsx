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
import { cn } from '@/lib/utils';

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

    // Keep React filter states in 100% sync with server props
    useEffect(() => {
        if (filters.search !== undefined) setSearch(filters.search || '');
        if (filters.status !== undefined) setStatusFilter(filters.status || 'all');
        if (filters.branch_id !== undefined) setBranchFilter(filters.branch_id || 'all');
    }, [filters.search, filters.status, filters.branch_id]);

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

    // Standardized filter dispatch with page reset
    const applyFilters = (override: { search?: string; status?: string; branch_id?: string }) => {
        const s = override.search !== undefined ? override.search : search;
        const st = override.status !== undefined ? override.status : statusFilter;
        const b = override.branch_id !== undefined ? override.branch_id : branchFilter;

        const query: Record<string, string | number> = { page: 1 };
        if (s) query.search = s;
        if (st && st !== 'all') query.status = st;
        if (b && b !== 'all') query.branch_id = b;

        router.get('/sales', query, { preserveState: true, preserveScroll: true });
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        applyFilters({ search: val });
    };

    const handleStatusChange = (val: string) => {
        setStatusFilter(val);
        applyFilters({ status: val });
    };

    const handleBranchChange = (val: string) => {
        setBranchFilter(val);
        applyFilters({ branch_id: val });
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
                            sales={salesList}
                            isAdmin={isAdmin}
                            density={density}
                            onSelectSale={openDrawer}
                            onOpenVoidModal={openVoidModal}
                        />
                    ) : (
                        <SalesCardGrid
                            sales={salesList}
                            isAdmin={isAdmin}
                            onSelectSale={openDrawer}
                            onOpenVoidModal={openVoidModal}
                        />
                    )}

                    {/* Pagination Navigation Controls */}
                    {paginatedSales.links && paginatedSales.links.length > 3 && (
                        <div className="p-4 border border-[#F8C8DC]/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-[#121218]/80 backdrop-blur-2xl rounded-3xl shadow-sm">
                            <span className="text-xs font-semibold text-[#7D6B6E] dark:text-[#94A3B8]">
                                Showing {paginatedSales.from || 0} to {paginatedSales.to || 0} of {paginatedSales.total || 0} sales transactions
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {paginatedSales.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={cn(
                                            'h-8 text-xs font-bold rounded-xl border-[#F8C8DC]/60 dark:border-white/10',
                                            link.active
                                                ? 'bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent'
                                                : 'bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]'
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
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
