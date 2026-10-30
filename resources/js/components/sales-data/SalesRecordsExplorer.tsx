import { router } from '@inertiajs/react';
import {
    Search,
    Filter,
    Calendar,
    Download,
    RefreshCw,
    X,
    Eye,
    Store,
    ShoppingBag,
    FileSpreadsheet,
    Receipt,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SaleItemProduct {
    id: number;
    name: string;
    sku?: string | null;
}

export interface SaleItemRecord {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product?: SaleItemProduct | null;
}

export interface SaleRecord {
    id: number;
    order_number: string;
    created_at: string;
    branch_id: number;
    branch?: { id: number; name: string } | null;
    user_id?: number | null;
    cashier?: { id: number; name: string } | null;
    cashier_name?: string;
    customer_name?: string;
    status: string;
    payment_method: string;
    subtotal?: number | null;
    discount?: number | null;
    delivery_fee?: number | null;
    total: number;
    paid_amount?: number | null;
    change_amount?: number | null;
    source?: string | null;
    source_system?: string | null;
    sales_import_id?: number | null;
    sales_import?: { id: number; file_name: string } | null;
    items?: SaleItemRecord[];
    order_id?: number | null;
}

export interface PaginatedSalesResponse {
    data: SaleRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface SalesRecordsExplorerProps {
    sales: PaginatedSalesResponse;
    filters: {
        search: string;
        branch_id: string;
        date_from: string;
        date_to: string;
        status: string;
        source: string;
        sort_by: string;
        sort_dir: string;
        per_page: number;
    };
    filteredSummary: {
        total_revenue: number;
        orders_count: number;
    };
    branches: Array<{ id: number; name: string }>;
}

export function SalesRecordsExplorer({
    sales,
    filters,
    filteredSummary,
    branches,
}: SalesRecordsExplorerProps) {
    // Local filter form state
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedSource, setSelectedSource] = useState(filters.source || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    // Detail modal state
    const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Apply filters via Inertia visit
    const applyFilters = (overrides: Record<string, string | number | undefined> = {}) => {
        const queryParams = {
            search: searchTerm.trim() || undefined,
            branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            source: selectedSource !== 'all' ? selectedSource : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            per_page: filters.per_page,
            page: 1,
            ...overrides,
        };

        router.get('/admin/sales-data', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedBranch('all');
        setSelectedStatus('all');
        setSelectedSource('all');
        setDateFrom('');
        setDateTo('');

        router.get(
            '/admin/sales-data',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handlePresetDate = (type: 'today' | '7days' | 'month' | 'all') => {
        const today = new Date().toISOString().slice(0, 10);
        let from = '';
        let to = today;

        if (type === 'today') {
            from = today;
        } else if (type === '7days') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            from = d.toISOString().slice(0, 10);
        } else if (type === 'month') {
            const d = new Date();
            d.setDate(1);
            from = d.toISOString().slice(0, 10);
        } else if (type === 'all') {
            from = '';
            to = '';
        }

        setDateFrom(from);
        setDateTo(to);
        applyFilters({ date_from: from || undefined, date_to: to || undefined });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.append('search', searchTerm.trim());
        if (selectedBranch !== 'all') params.append('branch_id', selectedBranch);
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        if (selectedSource !== 'all') params.append('source', selectedSource);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);

        window.location.href = `/admin/sales-data/export?${params.toString()}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return 'N/A';
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return isoString;
        }
    };

    const getSourceBadge = (sale: SaleRecord) => {
        if (sale.sales_import_id || sale.source === 'historical_import') {
            return (
                <Badge
                    variant="outline"
                    className="border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold"
                >
                    <FileSpreadsheet className="size-2.5 mr-1" />
                    <span>Loyverse Import</span>
                </Badge>
            );
        }

        if (sale.order_id || sale.source === 'online') {
            return (
                <Badge
                    variant="outline"
                    className="border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold"
                >
                    <ShoppingBag className="size-2.5 mr-1" />
                    <span>Online Order</span>
                </Badge>
            );
        }

        return (
            <Badge
                variant="outline"
                className="border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
            >
                <Store className="size-2.5 mr-1" />
                <span>POS Counter</span>
            </Badge>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-extrabold uppercase">
                        Completed
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] font-extrabold uppercase">
                        Pending
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="bg-rose-600 text-white hover:bg-rose-700 text-[10px] font-extrabold uppercase">
                        Cancelled
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-[10px] font-extrabold uppercase">
                        {status || 'Unknown'}
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter & Metric Header Toolbar */}
            <div className="p-6 rounded-4xl bg-white/90 dark:bg-[#14141E]/90 border border-[#F8C8DC]/60 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-4">
                {/* Search & Actions Bar */}
                <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8B8E] dark:text-[#64748B]" />
                        <Input
                            placeholder="Search Order #, Customer, Cashier, or Product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 pl-10 pr-9 rounded-xl border-[#F8C8DC] dark:border-white/10 bg-white dark:bg-[#181824] text-xs font-medium"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    applyFilters({ search: undefined });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8B8E] hover:text-[#E75480]"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            type="submit"
                            size="sm"
                            className="h-9 px-4 rounded-xl bg-[#E75480] hover:bg-[#D43F6B] text-white text-xs font-bold gap-1.5 shadow-xs"
                        >
                            <Filter className="size-3.5" />
                            <span>Filter Records</span>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="h-9 px-4 rounded-xl border-[#F8C8DC] text-xs font-bold text-[#E75480] hover:bg-[#FFF0F4] dark:border-white/10 gap-1.5 shadow-xs"
                        >
                            <Download className="size-3.5" />
                            <span>Export CSV</span>
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-9 px-3 rounded-xl text-xs font-semibold text-[#9E8B8E] hover:text-[#3D2C2E]"
                        >
                            <RefreshCw className="size-3 mr-1" />
                            <span>Reset</span>
                        </Button>
                    </div>
                </form>

                {/* Filter Dropdowns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#F8C8DC]/30 dark:border-white/5">
                    {/* Branch Filter */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1">
                            <Store className="size-3 text-[#E75480]" />
                            <span>Branch</span>
                        </Label>
                        <Select
                            value={selectedBranch}
                            onValueChange={(val) => {
                                setSelectedBranch(val);
                                applyFilters({ branch_id: val !== 'all' ? val : undefined });
                            }}
                        >
                            <SelectTrigger className="h-9 rounded-xl border-[#F8C8DC]/70 dark:border-white/10 text-xs font-semibold">
                                <SelectValue placeholder="All Branches" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-[#F8C8DC] dark:border-white/10">
                                <SelectItem value="all" className="text-xs">All Branches</SelectItem>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Channel / Source Filter */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1">
                            <ShoppingBag className="size-3 text-[#E75480]" />
                            <span>Sales Source / Channel</span>
                        </Label>
                        <Select
                            value={selectedSource}
                            onValueChange={(val) => {
                                setSelectedSource(val);
                                applyFilters({ source: val !== 'all' ? val : undefined });
                            }}
                        >
                            <SelectTrigger className="h-9 rounded-xl border-[#F8C8DC]/70 dark:border-white/10 text-xs font-semibold">
                                <SelectValue placeholder="All Sources" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-[#F8C8DC] dark:border-white/10">
                                <SelectItem value="all" className="text-xs">All Sources</SelectItem>
                                <SelectItem value="pos" className="text-xs">POS Counter</SelectItem>
                                <SelectItem value="online" className="text-xs">Online Delivery / Pickup</SelectItem>
                                <SelectItem value="historical_import" className="text-xs">Loyverse Historical Import</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-[#E75480]" />
                            <span>Transaction Status</span>
                        </Label>
                        <Select
                            value={selectedStatus}
                            onValueChange={(val) => {
                                setSelectedStatus(val);
                                applyFilters({ status: val !== 'all' ? val : undefined });
                            }}
                        >
                            <SelectTrigger className="h-9 rounded-xl border-[#F8C8DC]/70 dark:border-white/10 text-xs font-semibold">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-[#F8C8DC] dark:border-white/10">
                                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                                <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                                <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                                <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Inputs */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1">
                            <Calendar className="size-3 text-[#E75480]" />
                            <span>Date Range</span>
                        </Label>
                        <div className="flex items-center gap-1.5">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-9 text-[11px] rounded-xl border-[#F8C8DC]/70 px-2 font-mono"
                                title="Start Date"
                            />
                            <span className="text-[#9E8B8E] text-xs">–</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-9 text-[11px] rounded-xl border-[#F8C8DC]/70 px-2 font-mono"
                                title="End Date"
                            />
                        </div>
                    </div>
                </div>

                {/* Quick Date Range Shortcuts & Filtered Totals Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F8C8DC]/30 dark:border-white/5 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-[#9E8B8E] mr-1">Presets:</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePresetDate('today')}
                            className="h-6 px-2 text-[11px] font-bold text-[#7D6B6E] hover:bg-[#FFF0F4] rounded-lg"
                        >
                            Today
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePresetDate('7days')}
                            className="h-6 px-2 text-[11px] font-bold text-[#7D6B6E] hover:bg-[#FFF0F4] rounded-lg"
                        >
                            Last 7 Days
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePresetDate('month')}
                            className="h-6 px-2 text-[11px] font-bold text-[#7D6B6E] hover:bg-[#FFF0F4] rounded-lg"
                        >
                            This Month
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePresetDate('all')}
                            className="h-6 px-2 text-[11px] font-bold text-[#7D6B6E] hover:bg-[#FFF0F4] rounded-lg"
                        >
                            All Time
                        </Button>
                    </div>

                    {/* Filter Summary Metric Pill */}
                    <div className="inline-flex items-center gap-3 p-1.5 px-3.5 rounded-xl bg-linear-to-r from-[#FFF5F7] via-white to-[#FFF5F7] dark:from-[#1A1A26] dark:to-[#14141E] border border-[#F8C8DC]/80 dark:border-white/10 shadow-2xs self-start sm:self-auto font-bold">
                        <div className="flex items-center gap-1.5 text-[#7D6B6E] dark:text-[#94A3B8]">
                            <Receipt className="size-3.5 text-[#E75480]" />
                            <span>Showing <strong>{filteredSummary.orders_count}</strong> Orders</span>
                        </div>
                        <div className="h-3 w-px bg-[#F8C8DC]" />
                        <div className="flex items-center gap-1 text-[#E75480] dark:text-[#FF4F81] font-mono">
                            <span>Total:</span>
                            <span className="text-sm font-black">{formatCurrency(filteredSummary.total_revenue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales Data Table */}
            <div className="rounded-4xl bg-white/90 dark:bg-[#14141E]/90 border border-[#F8C8DC]/60 dark:border-white/10 shadow-sm backdrop-blur-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#FFF5F7] dark:bg-white/5 border-b border-[#F8C8DC]/50 dark:border-white/10 text-[#5D4A4D] dark:text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-4 pl-6">Order & Date</th>
                                <th className="p-4">Branch</th>
                                <th className="p-4">Source / Channel</th>
                                <th className="p-4">Customer & Cashier</th>
                                <th className="p-4">Line Items</th>
                                <th className="p-4">Total Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5 font-medium text-[#3D2C2E] dark:text-[#F8FAFC]">
                            {sales.data && sales.data.length > 0 ? (
                                sales.data.map((sale) => {
                                    const itemCount = sale.items?.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0) || 0;
                                    const itemsPreview = sale.items
                                        ? sale.items
                                              .map((it) => `${it.quantity}x ${it.product?.name || 'Item'}`)
                                              .slice(0, 2)
                                              .join(', ') + (sale.items.length > 2 ? ` +${sale.items.length - 2} more` : '')
                                        : 'No item records';

                                    return (
                                        <tr key={sale.id} className="hover:bg-[#FFF9FB]/60 dark:hover:bg-white/2 transition-colors">
                                            {/* Order Number & Timestamp */}
                                            <td className="p-4 pl-6">
                                                <div className="font-mono font-bold text-xs text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                    {sale.order_number}
                                                </div>
                                                <div className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1 mt-0.5 font-mono">
                                                    <Clock className="size-3" />
                                                    <span>{formatDate(sale.created_at)}</span>
                                                </div>
                                            </td>

                                            {/* Branch */}
                                            <td className="p-4">
                                                <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                    {sale.branch?.name || 'All Branches'}
                                                </span>
                                            </td>

                                            {/* Channel / Source */}
                                            <td className="p-4">
                                                {getSourceBadge(sale)}
                                            </td>

                                            {/* Customer & Cashier */}
                                            <td className="p-4">
                                                <div className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                    {sale.customer_name || 'Walk-in Customer'}
                                                </div>
                                                <div className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">
                                                    Staff: {sale.cashier_name || sale.cashier?.name || 'System / Auto'}
                                                </div>
                                            </td>

                                            {/* Line Items */}
                                            <td className="p-4 max-w-xs">
                                                <span className="text-[11px] text-[#5D4A4D] dark:text-[#CBD5E1] line-clamp-1" title={itemsPreview}>
                                                    {itemsPreview}
                                                </span>
                                                <span className="text-[10px] text-[#9E8B8E] font-bold block">
                                                    {itemCount} total unit{itemCount === 1 ? '' : 's'}
                                                </span>
                                            </td>

                                            {/* Total Amount & Payment Method */}
                                            <td className="p-4 font-mono">
                                                <div className="font-black text-sm text-[#E75480] dark:text-[#FF4F81]">
                                                    {formatCurrency(Number(sale.total))}
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-[#9E8B8E]">
                                                    {sale.payment_method || 'CASH'}
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-4">
                                                {getStatusBadge(sale.status)}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 pr-6 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedSale(sale);
                                                        setIsDetailOpen(true);
                                                    }}
                                                    className="h-8 px-2.5 rounded-xl text-xs font-bold text-[#E75480] hover:bg-[#FFF0F4] dark:hover:bg-white/5 gap-1"
                                                >
                                                    <Eye className="size-3.5" />
                                                    <span>Details</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-[#9E8B8E]">
                                        <AlertCircle className="size-8 mx-auto mb-2 text-[#E75480]" />
                                        <div className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            No sales records found matching the active criteria.
                                        </div>
                                        <p className="text-xs text-[#7D6B6E] mt-1">
                                            Try adjusting your search terms, date range, branch, or channel filter.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {sales.links && sales.links.length > 3 && (
                    <div className="p-4 px-6 border-t border-[#F8C8DC]/40 dark:border-white/10 bg-[#FFFDFE] dark:bg-[#14141E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                            Showing <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{sales.from || 0}</span> to{' '}
                            <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{sales.to || 0}</span> of{' '}
                            <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{sales.total || 0}</span> records
                        </div>

                        <div className="flex items-center gap-1.5">
                            {sales.links.map((link, i) => {
                                const isPrev = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');

                                if (isPrev) {
                                    return (
                                        <Button
                                            key={i}
                                            size="sm"
                                            variant="outline"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                                            className="h-8 px-2.5 rounded-xl border-[#F8C8DC] text-xs font-bold gap-1"
                                        >
                                            <ChevronLeft className="size-3.5" />
                                            <span>Prev</span>
                                        </Button>
                                    );
                                }

                                if (isNext) {
                                    return (
                                        <Button
                                            key={i}
                                            size="sm"
                                            variant="outline"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                                            className="h-8 px-2.5 rounded-xl border-[#F8C8DC] text-xs font-bold gap-1"
                                        >
                                            <span>Next</span>
                                            <ChevronRight className="size-3.5" />
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={i}
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                                        className={cn(
                                            "size-8 p-0 rounded-xl text-xs font-bold font-mono",
                                            link.active
                                                ? "bg-[#E75480] hover:bg-[#D43F6B] text-white shadow-2xs"
                                                : "border-[#F8C8DC] text-[#7D6B6E] hover:bg-[#FFF0F4]"
                                        )}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-3xl border-[#F8C8DC]/60 bg-white dark:bg-[#121218] shadow-2xl">
                    {selectedSale && (
                        <div>
                            {/* Modal Header */}
                            <div className="p-6 pb-4 border-b border-[#F8C8DC]/40 bg-linear-to-r from-[#FFF5F7] via-white to-[#FFF5F7] dark:from-[#1A1A26] dark:to-[#14141E]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E]">
                                            Transaction Overview
                                        </span>
                                        <DialogTitle className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5">
                                            {selectedSale.order_number}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                            Recorded {formatDate(selectedSale.created_at)} • {selectedSale.branch?.name || 'All Branches'}
                                        </DialogDescription>
                                    </div>
                                    <div>{getStatusBadge(selectedSale.status)}</div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
                                {/* Meta Information Cards */}
                                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-[#9E8B8E] block">Customer</span>
                                        <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {selectedSale.customer_name || 'Walk-in Customer'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-[#9E8B8E] block">Staff / Cashier</span>
                                        <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {selectedSale.cashier_name || selectedSale.cashier?.name || 'System / Auto'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-[#9E8B8E] block">Channel</span>
                                        <div className="mt-0.5">{getSourceBadge(selectedSale)}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-[#9E8B8E] block">Payment Method</span>
                                        <span className="font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC] uppercase">
                                            {selectedSale.payment_method || 'CASH'}
                                        </span>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D6B6E]">
                                        Purchased Line Items
                                    </span>
                                    <div className="border border-[#F8C8DC]/60 dark:border-white/10 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-[#FFF5F7] dark:bg-white/5 border-b border-[#F8C8DC]/40 text-[#5D4A4D] font-bold">
                                                <tr>
                                                    <th className="p-2.5 pl-3">Item</th>
                                                    <th className="p-2.5 text-center">Qty</th>
                                                    <th className="p-2.5 text-right">Price</th>
                                                    <th className="p-2.5 pr-3 text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F8C8DC]/30">
                                                {selectedSale.items && selectedSale.items.length > 0 ? (
                                                    selectedSale.items.map((it, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="p-2.5 pl-3 font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                                {it.product?.name || 'Raw Item'}
                                                            </td>
                                                            <td className="p-2.5 text-center font-mono">
                                                                {it.quantity}
                                                            </td>
                                                            <td className="p-2.5 text-right font-mono text-[#7D6B6E]">
                                                                {formatCurrency(Number(it.unit_price))}
                                                            </td>
                                                            <td className="p-2.5 pr-3 text-right font-mono font-bold text-[#E75480]">
                                                                {formatCurrency(Number(it.subtotal || it.quantity * it.unit_price))}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="p-4 text-center text-[#9E8B8E]">
                                                            No specific line items recorded.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Financial Breakdown Summary */}
                                <div className="p-3.5 rounded-xl bg-[#FFF9FA] dark:bg-white/2 border border-[#F8C8DC]/40 space-y-1.5 font-mono">
                                    <div className="flex justify-between text-[#7D6B6E]">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(Number(selectedSale.subtotal ?? selectedSale.total))}</span>
                                    </div>
                                    {Number(selectedSale.discount || 0) > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Discount:</span>
                                            <span>-{formatCurrency(Number(selectedSale.discount))}</span>
                                        </div>
                                    )}
                                    {Number(selectedSale.delivery_fee || 0) > 0 && (
                                        <div className="flex justify-between text-[#7D6B6E]">
                                            <span>Delivery Fee:</span>
                                            <span>+{formatCurrency(Number(selectedSale.delivery_fee))}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-[#F8C8DC]/60 pt-1" />
                                    <div className="flex justify-between text-sm font-black text-[#E75480] dark:text-[#FF4F81]">
                                        <span>Total Amount:</span>
                                        <span>{formatCurrency(Number(selectedSale.total))}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <DialogFooter className="p-4 px-6 border-t border-[#F8C8DC]/40 bg-slate-50/50 dark:bg-white/2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDetailOpen(false)}
                                    className="rounded-xl border-[#F8C8DC] text-xs font-bold"
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
