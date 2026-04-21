import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    FiSearch,
    FiFilter,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiXCircle,
    FiMoreHorizontal,
    FiShoppingCart,
    FiPrinter,
    FiEye,
    FiHash,
    FiUserCheck,
    FiShieldOff,
    FiAlertTriangle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import AppLogo from '@/components/app-logo';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    branch?: {
        name: string;
    };
};

export default function SalesIndex() {
    const { sales: paginatedSales, filters, stats, branches, isAdmin } = usePage().props as any;
    const sales: Sale[] = paginatedSales.data;

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || 'all');

    // Modal States
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null);
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

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
                <div className="h-16 border-b dark:border-zinc-800 bg-background/50 dark:bg-zinc-900/50 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-foreground dark:text-white">
                            <FiShoppingCart className="text-primary dark:text-primary-foreground" />
                            Sales & Orders
                        </h1>
                        <div className="flex items-center bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-1">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statusFilter === 'all' ? "bg-background dark:bg-zinc-800 shadow-sm text-foreground dark:text-white" : "text-muted-foreground dark:text-zinc-500 hover:text-foreground")}
                            >All</button>
                            <button
                                onClick={() => handleFilterChange('pending')}
                                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statusFilter === 'pending' ? "bg-background dark:bg-zinc-800 shadow-sm text-foreground dark:text-white" : "text-muted-foreground dark:text-zinc-500 hover:text-foreground")}
                            >Pending</button>
                            <button
                                onClick={() => handleFilterChange('preparing')}
                                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statusFilter === 'preparing' ? "bg-background dark:bg-zinc-800 shadow-sm text-foreground dark:text-white" : "text-muted-foreground dark:text-zinc-500 hover:text-foreground")}
                            >Preparing</button>
                            <button
                                onClick={() => handleFilterChange('completed')}
                                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statusFilter === 'completed' ? "bg-background dark:bg-zinc-800 shadow-sm text-foreground dark:text-white" : "text-muted-foreground dark:text-zinc-500 hover:text-foreground")}
                            >Completed</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <Select value={branchFilter} onValueChange={handleBranchFilter}>
                                <SelectTrigger className="w-44 h-9 bg-background/50 dark:bg-zinc-800/50 border-none ring-1 ring-black/5 dark:ring-white/10 dark:text-zinc-300">
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
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-zinc-500 size-4" />
                            <Input
                                placeholder="Search order ID..."
                                className="pl-9 w-64 h-9 bg-background/50 dark:bg-zinc-800/50 border-none ring-1 ring-black/5 dark:ring-white/10 text-foreground dark:text-zinc-200"
                                value={search}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                            <FiFilter className="size-4" /> Filter
                        </Button>
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
                                        {isAdmin && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 text-center">Actions</th>}
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
                                                {isAdmin && (
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {/* Primary Action: Status Progression */}
                                                            {sale.status === 'pending' && (
                                                                <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest px-4 shadow-md shadow-primary/20" onClick={() => updateStatus(sale.id, 'preparing')}>
                                                                    Prepare Order
                                                                </Button>
                                                            )}
                                                            {sale.status === 'preparing' && (
                                                                <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest px-4 bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20" onClick={() => updateStatus(sale.id, 'completed')}>
                                                                    Complete
                                                                </Button>
                                                            )}

                                                            {/* Secondary Actions: Professional Suite */}
                                                            {/* Secondary Actions: Professional Suite */}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-muted dark:hover:bg-zinc-800">
                                                                        <FiMoreHorizontal className="size-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56 rounded-xl border-none shadow-2xl ring-1 ring-black/5 dark:ring-white/10 p-1.5">
                                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 py-2">Administrative Suite</DropdownMenuLabel>
                                                                    <DropdownMenuItem 
                                                                        className="rounded-lg h-10 gap-3 px-2 cursor-pointer font-bold text-xs" 
                                                                        onClick={() => {
                                                                            setSelectedSale(sale);
                                                                            setIsDetailsModalOpen(true);
                                                                            // Small delay to ensure modal is open before printing
                                                                            setTimeout(() => window.print(), 500);
                                                                        }}
                                                                    >
                                                                        <div className="size-7 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                                            <FiPrinter className="size-3.5" />
                                                                        </div>
                                                                        Print PDF Receipt
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        className="rounded-lg h-10 gap-3 px-2 cursor-pointer font-bold text-xs"
                                                                        onClick={() => {
                                                                            setSelectedSale(sale);
                                                                            setIsDetailsModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                                                            <FiEye className="size-3.5" />
                                                                        </div>
                                                                        Full Profit Audit
                                                                    </DropdownMenuItem>
                                                                    
                                                                    <DropdownMenuSeparator className="my-1.5 opacity-50" />
                                                                    
                                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 py-2">Correction Tools</DropdownMenuLabel>
                                                                    {sale.status !== 'cancelled' && (
                                                                        <DropdownMenuItem 
                                                                            className="rounded-lg h-10 gap-3 px-2 cursor-pointer font-bold text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                                            onClick={() => {
                                                                                setSaleToVoid(sale);
                                                                                setIsVoidModalOpen(true);
                                                                            }}
                                                                        >
                                                                            <div className="size-7 rounded-md bg-destructive/10 flex items-center justify-center">
                                                                                <FiXCircle className="size-3.5" />
                                                                            </div>
                                                                            Void Transaction
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </td>
                                                )}
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

            {/* Sale Details & Receipt Modal */}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
                    <DialogTitle className="sr-only">Sale Receipt for Order #{selectedSale?.order_number}</DialogTitle>
                    <DialogDescription className="sr-only">Detailed breakdown of sale items, financial totals, and transaction audit data.</DialogDescription>
                    <div className="relative mx-auto w-[400px] print:w-full print-receipt-body">
                        {/* Zigzag Top Edge */}
                        <div className="h-4 w-full bg-background dark:bg-zinc-900 overflow-hidden print:hidden" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }} />
                        
                        <div className="bg-background dark:bg-zinc-900 shadow-2xl print:shadow-none p-0 relative overflow-hidden group">
                            {/* Brand Header */}
                            <div className="bg-primary/5 dark:bg-primary/20 p-10 border-b border-dashed dark:border-zinc-800 text-center space-y-4 relative overflow-hidden">
                                <div className="absolute -top-4 -right-4 size-32 bg-primary/10 rounded-full blur-3xl opacity-50" />
                                <div className="flex justify-center">
                                    <div className="p-4 bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl shadow-primary/10 ring-1 ring-black/5 flex items-center justify-center">
                                        <div className="h-16">
                                            <AppLogo />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-2 pt-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Terminal ID</span>
                                        <span className="text-[10px] font-black text-primary">#TRS-09</span>
                                    </div>
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{selectedSale?.branch?.name || 'Maki Desu Victoria'}</p>
                                </div>
                            </div>

                            {/* Ticket Core Info */}
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start border-b border-dashed dark:border-zinc-800 pb-6">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Sales Document</p>
                                        <p className="text-lg font-black tracking-tighter text-foreground dark:text-white">#{selectedSale?.order_number}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className="bg-primary text-white text-[9px] font-black uppercase tracking-widest h-5">{selectedSale?.type}</Badge>
                                            {selectedSale && getStatusBadge(selectedSale.status)}
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Temporal Intel</p>
                                        <p className="text-xs font-black text-foreground dark:text-zinc-200">
                                            {selectedSale && format(new Date(selectedSale.created_at), 'MMM dd, yyyy')}
                                        </p>
                                        <p className="text-xs font-bold text-muted-foreground">
                                            {selectedSale && format(new Date(selectedSale.created_at), 'HH:mm:ss')}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Container */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            <FiHash className="size-2.5" /> Item Specification
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Value</div>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedSale?.items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-end group hover:bg-muted/30 dark:hover:bg-zinc-800/30 p-2 rounded-xl transition-all">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-foreground dark:text-zinc-200">{item.product.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                                                </div>
                                                <p className="font-black tabular-nums text-sm">{formatCurrency(item.subtotal)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mathematical Breakdown */}
                                <div className="pt-6 border-t-2 border-dashed dark:border-zinc-800 space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2">
                                        <span>Merchandise Subtotal</span>
                                        <span className="tabular-nums">{selectedSale && formatCurrency(selectedSale.total)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2">
                                        <span>Inventory Adjustment Fee</span>
                                        <span className="tabular-nums">₱0.00</span>
                                    </div>
                                    <div className="bg-primary p-4 rounded-2xl flex justify-between items-center shadow-xl shadow-primary/30">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Grand Total</p>
                                            <p className="text-xs font-bold text-white/40 italic">VAT Exclusive</p>
                                        </div>
                                        <p className="text-3xl font-black text-white tabular-nums drop-shadow-md">{selectedSale && formatCurrency(selectedSale.total)}</p>
                                    </div>
                                </div>

                                {/* Financial Settlement */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/50 dark:bg-zinc-800/50 p-4 rounded-2xl border dark:border-zinc-800 space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Input Method</p>
                                        <p className="text-sm font-black uppercase tracking-tighter text-foreground dark:text-white">{selectedSale?.payment_method}</p>
                                    </div>
                                    <div className="bg-muted/50 dark:bg-zinc-800/50 p-4 rounded-2xl border dark:border-zinc-800 space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Change Settled</p>
                                        <p className="text-sm font-black text-amber-600">{selectedSale && formatCurrency(selectedSale.change_amount)}</p>
                                    </div>
                                </div>

                                {/* Audit & Security Footer */}
                                <div className="pt-6 border-t border-dashed dark:border-zinc-800 flex flex-col items-center gap-6 text-center">
                                    <div className="flex items-center gap-4 bg-primary/5 p-3 rounded-2xl w-full">
                                        <div className="size-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                                            <FiUserCheck className="size-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Served By</p>
                                            <p className="text-sm font-black uppercase italic tracking-tighter text-primary">{selectedSale?.cashier.name}</p>
                                        </div>
                                    </div>

                                    {/* Verification QR (Placeholder style) */}
                                    <div className="space-y-3">
                                        <div className="size-24 bg-white p-2 rounded-xl border group-hover:scale-110 transition-transform duration-500 mx-auto">
                                            <div className="w-full h-full bg-zinc-200 animate-pulse rounded border-2 border-dashed border-zinc-300 flex items-center justify-center">
                                                <div className="size-10 border-4 border-zinc-100 rounded-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest italic text-muted-foreground/40">Secure Transaction Verified</p>
                                            <p className="text-[8px] font-bold text-muted-foreground/30 uppercase mt-1">Order Index: {selectedSale?.id.toString().padStart(8, '0')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Zigzag Bottom Edge */}
                        <div className="h-4 w-full bg-background dark:bg-zinc-900 overflow-hidden print:hidden" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }} />
                        
                        {/* Print Quick Controls Floating */}
                        <div className="absolute bottom-8 right-[-100px] group-hover:right-8 transition-all duration-500 print:hidden flex flex-col gap-2">
                             <Button size="icon" className="size-12 rounded-2xl shadow-2xl" onClick={() => window.print()}>
                                <FiPrinter className="size-5" />
                             </Button>
                             <Button variant="outline" size="icon" className="size-12 rounded-2xl bg-background shadow-2xl" onClick={() => setIsDetailsModalOpen(false)}>
                                <FiXCircle className="size-5" />
                             </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Void Transaction Confirmation Modal */}
            <Dialog open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                        <div className="p-8 text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="size-20 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive animate-pulse">
                                    <FiShieldOff className="size-10" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <DialogTitle className="text-2xl font-black tracking-tight text-foreground dark:text-white">Void Transaction?</DialogTitle>
                                <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                                    You are about to nullify <span className="font-black text-foreground dark:text-white">Order #{saleToVoid?.order_number}</span>. This will reverse all financial gains and restore ingredient stocks across the branch.
                                </DialogDescription>
                            </div>

                            <div className="flex items-center gap-2 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-600 dark:text-amber-500 text-left">
                                <FiAlertTriangle className="size-5 shrink-0" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
                                    Inventory truth will be restored. This action is permanently logged in the audit trail.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button 
                                    variant="destructive" 
                                    className="h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-destructive/20"
                                    onClick={() => {
                                        if(saleToVoid) {
                                            updateStatus(saleToVoid.id, 'cancelled');
                                            setIsVoidModalOpen(false);
                                        }
                                    }}
                                >
                                    Confirm Global Void
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="h-12 rounded-xl font-black uppercase tracking-widest text-xs text-muted-foreground"
                                    onClick={() => setIsVoidModalOpen(false)}
                                >
                                    Abort Operation
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <style>{`
                @media print {
                    /* Reset everything */
                    html, body {
                        height: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden;
                    }

                    /* Hide ALL items in the main application tree */
                    #app, [data-sidebar-root], header, nav, main, footer {
                        display: none !important;
                    }

                    /* 
                       Isolate the Radix Portal layer. 
                       Radix usually renders dialogs here.
                    */
                    div[data-radix-portal] {
                        display: block !important;
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        z-index: 9999999 !important;
                        background: white !important;
                    }

                    /* The actual Receipt Container */
                    .print-receipt-body {
                        visibility: visible !important;
                        display: block !important;
                        width: 80mm !important;
                        margin: 0 auto !important;
                        position: relative !important;
                        left: 0 !important;
                        transform: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Force all children of the receipt to be visible and colored */
                    .print-receipt-body * {
                        visibility: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Hide interactive UI elements inside the modal */
                    .print\\:hidden, button, [role="button"] {
                        display: none !important;
                    }

                    /* Preserve the zigzag designs explicitly */
                    div[style*="clipPath"] {
                        display: block !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    @page {
                        margin: 0;
                        size: auto;
                    }
                }
            `}</style>
        </AppLayout>
    );
}
