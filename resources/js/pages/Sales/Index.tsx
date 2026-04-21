import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { FiSearch, FiFilter, FiClock, FiCheckCircle, FiAlertCircle, FiXCircle, FiMoreHorizontal, FiShoppingCart, FiPrinter, FiEye } from 'react-icons/fi';
import { MobileFilter } from '@/components/shared/mobile-filter';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type SaleItem = {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product: {
        name: string;
    };
};

type Sale = {
    id: number;
    order_number: string;
    type: 'dine-in' | 'take-out' | 'delivery';
    total: number;
    paid_amount: number;
    change_amount: number;
    payment_method: string;
    status: 'pending' | 'preparing' | 'completed' | 'cancelled';
    created_at: string;
    items: SaleItem[];
    cashier: {
        name: string;
    };
};

export default function SalesIndex() {
    const { sales: paginatedSales, filters, stats, branches, isAdmin } = usePage().props as any;
    const sales: Sale[] = paginatedSales.data;

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || 'all');

    // --- Sync Logic ---
    const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'sales-updated' || e.data.type === 'inventory-updated') {
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

    const handleFilterChange = (value: string) => {
        setStatusFilter(value);
        router.get('/sales', { status: value, search, branch_id: branchFilter !== 'all' ? branchFilter : '' }, { preserveState: true, replace: true });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        router.get('/sales', { status: statusFilter, search: val, branch_id: branchFilter !== 'all' ? branchFilter : '' }, { preserveState: true, replace: true, preserveScroll: true });
    };

    const handleBranchFilter = (value: string) => {
        setBranchFilter(value);
        router.get('/sales', { status: statusFilter, search, branch_id: value !== 'all' ? value : '' }, { preserveState: true, replace: true });
    };

    const updateStatus = (saleId: number, newStatus: string) => {
        router.put(`/sales/${saleId}/status`, { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                stateChannel.postMessage({ type: 'sales-updated' });
            }
        });
    };

    const getStatusBadge = (status: Sale['status']) => {
        const styles = {
            pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            preparing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            completed: "bg-green-500/10 text-green-600 border-green-500/20",
            cancelled: "bg-destructive/10 text-destructive border-destructive/20"
        };
        return (
            <Badge className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border", styles[status])}>
                {status}
            </Badge>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Sales & Orders', href: '/sales' }]}>
            <Head title="Sales & Orders" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background dark:bg-zinc-950">
                {/* Header Bar */}
                <div className="h-auto min-h-16 border-b dark:border-zinc-800 bg-background/50 dark:bg-zinc-900/50 backdrop-blur-md px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex items-center justify-between w-full md:w-auto gap-4">
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-foreground dark:text-white">
                            <FiShoppingCart className="text-primary dark:text-primary-foreground" />
                            Sales
                        </h1>
                        <div className="hidden md:flex items-center bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-1">
                            {['all', 'pending', 'preparing', 'completed'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleFilterChange(s)}
                                    className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all capitalize", statusFilter === s ? "bg-background dark:bg-zinc-800 shadow-sm text-foreground dark:text-white" : "text-muted-foreground dark:text-zinc-500 hover:text-foreground")}
                                >{s}</button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-zinc-500 size-4" />
                            <Input
                                placeholder="Search orders..."
                                className="pl-9 h-10 bg-background/50 dark:bg-zinc-800/50 border-none ring-1 ring-black/5 dark:ring-white/10 text-foreground dark:text-zinc-200"
                                value={search}
                                onChange={handleSearchChange}
                            />
                        </div>
                        
                        <MobileFilter
                            title="Sales Filters"
                            activeFilterCount={(statusFilter !== 'all' ? 1 : 0) + (branchFilter !== 'all' ? 1 : 0)}
                            activeFilterSummary={`${statusFilter.toUpperCase()} • ${branchFilter !== 'all' ? (branches?.find((b: any) => String(b.id) === branchFilter)?.name || 'Selected Branch') : 'All Branches'}`}
                            onClear={() => {
                                setStatusFilter('all');
                                setBranchFilter('all');
                                router.get('/sales', { status: 'all', search, branch_id: '' }, { preserveState: true, replace: true });
                            }}
                        >
                            <div className="flex flex-col gap-6 w-full">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Order Status</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['all', 'pending', 'preparing', 'completed', 'cancelled'].map((s) => (
                                            <Button
                                                key={s}
                                                variant={statusFilter === s ? "default" : "outline"}
                                                onClick={() => handleFilterChange(s)}
                                                className={cn("h-12 justify-start font-bold uppercase text-[10px] tracking-widest px-4 rounded-xl transition-all", statusFilter === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "")}
                                            >
                                                {s}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Branch Location</span>
                                        <Select value={branchFilter} onValueChange={handleBranchFilter}>
                                            <SelectTrigger className="w-full h-12 bg-background/50 dark:bg-zinc-800/50 border-none ring-1 ring-black/5 dark:ring-white/10 text-foreground dark:text-zinc-200 font-bold">
                                                <SelectValue placeholder="All Branches" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="all" className="font-bold py-3">All Branches</SelectItem>
                                                {branches?.map((b: any) => (
                                                    <SelectItem key={b.id} value={String(b.id)} className="font-bold py-3">{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </MobileFilter>
                    </div>
                </div>


                {/* Content Area */}
                <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                        <Card className="bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="size-10 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                                    <FiClock className="text-amber-600 dark:text-amber-500 size-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400 tracking-widest">Pending Orders</p>
                                    <p className="text-xl font-black text-foreground dark:text-white">{stats.pending}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 dark:border-blue-500/30 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="size-10 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                    <FiAlertCircle className="text-blue-600 dark:text-blue-500 size-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400 tracking-widest">In Preparation</p>
                                    <p className="text-xl font-black text-foreground dark:text-white">{stats.preparing}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-500/5 dark:bg-green-500/10 border-green-500/20 dark:border-green-500/30 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="size-10 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                                    <FiCheckCircle className="text-green-600 dark:text-green-500 size-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400 tracking-widest">Completed Today</p>
                                    <p className="text-xl font-black text-foreground dark:text-white">{stats.completed_today}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Orders Table */}
                    <Card className="flex-1 overflow-hidden border-none shadow-xl ring-1 ring-black/5 dark:ring-white/5 bg-card dark:bg-zinc-900/50 flex flex-col">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="sticky top-0 bg-background/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 border-b dark:border-zinc-800">
                                    <tr className="bg-muted/30 dark:bg-zinc-800/50">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500">Order Info</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500">Type</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 text-right">Items</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 text-right" >Total</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <AnimatePresence mode="popLayout">
                                        {sales.map((sale) => (
                                            <motion.tr
                                                key={sale.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group hover:bg-muted/20 dark:hover:bg-zinc-800/30 transition-colors border-b dark:border-zinc-800"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-foreground dark:text-white">#{sale.order_number}</div>
                                                    <div className="text-[11px] text-muted-foreground dark:text-zinc-500 font-medium uppercase mt-1">
                                                        {format(new Date(sale.created_at), 'MMM dd, HH:mm')} • {sale.cashier.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="capitalize text-[10px]">{sale.type}</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(sale.status)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-medium">
                                                    {sale.items.reduce((sum, i) => sum + i.quantity, 0)} items
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-black text-primary dark:text-primary-foreground">{formatCurrency(sale.total)}</div>
                                                    <div className="text-[9px] uppercase font-bold text-muted-foreground dark:text-zinc-500">{sale.payment_method}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {sale.status === 'pending' && (
                                                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider" onClick={() => updateStatus(sale.id, 'preparing')}>
                                                                Prepare
                                                            </Button>
                                                        )}
                                                        {sale.status === 'preparing' && (
                                                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider bg-green-500/5 dark:bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20 dark:border-green-500/30 hover:bg-green-500/10 dark:hover:bg-green-500/20" onClick={() => updateStatus(sale.id, 'completed')}>
                                                                Complete
                                                            </Button>
                                                        )}
                                                        <Button size="icon" variant="ghost" className="size-8">
                                                            <FiEye className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Placeholder */}
                        {paginatedSales.total > paginatedSales.per_page && (
                            <div className="p-4 border-t dark:border-zinc-800 flex justify-between items-center bg-muted/10 dark:bg-zinc-800/10">
                                <p className="text-xs text-muted-foreground font-medium">Showing {paginatedSales.from} to {paginatedSales.to} of {paginatedSales.total} orders</p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!paginatedSales.prev_page_url}
                                        onClick={() => router.get(paginatedSales.prev_page_url)}
                                    >Prev</Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!paginatedSales.next_page_url}
                                        onClick={() => router.get(paginatedSales.next_page_url)}
                                    >Next</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
