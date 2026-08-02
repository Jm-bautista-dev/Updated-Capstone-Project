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
  FiShoppingCart,
  FiPrinter,
  FiEye,
  FiHash,
  FiUserCheck,
  FiShieldOff,
  FiAlertTriangle,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiMinimize2,
  FiMaximize2
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
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

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
      pending: "bg-amber-500/5 text-amber-500 border-amber-500/10",
      preparing: "bg-blue-500/5 text-blue-400 border-blue-500/10",
      completed: "bg-emerald-500/5 text-emerald-500 border-emerald-500/10",
      cancelled: "bg-rose-500/5 text-rose-500 border-rose-500/10"
    };
    return (
      <Badge className={cn("px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-[6px] shrink-0", styles[status])}>
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

      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background font-sans">
        
        {/* ── Header Area ── */}
        <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-[var(--ops-surface-sunken)] border-b border-[var(--ops-border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <FiShoppingCart className="text-primary size-6 animate-pulse" />
            <div>
              <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">Orders & Sales</h1>
              <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                Monitor transactions and manage shop order flows
              </p>
            </div>
          </div>
        </div>

        {/* ── Content Layout ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">
          
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/70">Orders Waiting</p>
                <FiClock className="size-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{stats.pending}</h3>
                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Awaiting preparation</p>
              </div>
            </div>
            
            <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/70">In Kitchen</p>
                <FiActivity className="size-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{stats.preparing}</h3>
                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Actively being prepared</p>
              </div>
            </div>

            <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Completed Today</p>
                <FiCheckCircle className="size-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{stats.completed_today}</h3>
                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Transactions processed today</p>
              </div>
            </div>
          </div>

          {/* STICKY TOOLBAR FILTERS */}
          <div className="sticky top-0 z-30 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md pb-4 pt-1 space-y-4 border-b border-[var(--ops-border-subtle)]">
            
            {/* Quick Status Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'pending', label: 'Pending', icon: FiClock, color: 'text-amber-500' },
                { id: 'preparing', label: 'Preparing', icon: FiActivity, color: 'text-blue-400' },
                { id: 'completed', label: 'Completed', icon: FiCheckCircle, color: 'text-emerald-500' }
              ].map(chip => {
                const isActive = statusFilter === chip.id;
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.id}
                    onClick={() => handleFilterChange(chip.id)}
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

            {/* Advanced Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                
                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--ops-text-muted)]" />
                  <Input
                    placeholder="Search order ID..."
                    value={search}
                    onChange={handleSearchChange}
                    className="pl-9 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] focus:ring-primary/45 text-[10px] font-bold uppercase tracking-tight text-foreground placeholder-zinc-500"
                  />
                </div>

                {/* Branch Selector */}
                {isAdmin && (
                  <Select value={branchFilter} onValueChange={handleBranchFilter}>
                    <SelectTrigger className="w-full sm:w-44 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px] text-foreground">
                      <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Branches</SelectItem>
                      {branches?.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Density Toggle */}
              <div className="flex items-center border border-[var(--ops-border)] rounded-[10px] p-0.5 bg-[var(--ops-surface-sunken)] self-end">
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
            </div>
          </div>

          {/* ORDERS TABLE */}
          <div className="border border-[var(--ops-border)] rounded-[14px] bg-[var(--ops-surface-sunken)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto text-[var(--ops-text-secondary)]">
                <thead className="bg-[var(--ops-thead-bg)] border-b border-[var(--ops-border)] text-[9px] font-black uppercase tracking-[0.15em] text-[var(--ops-text-secondary)] select-none">
                  <tr>
                    <th className="px-5 py-3.5">Order Info</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Items</th>
                    <th className="px-5 py-3.5 text-right">Total</th>
                    {isAdmin && <th className="px-5 py-3.5 w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ops-border-subtle)]">
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FiShoppingCart className="size-10 text-[var(--ops-text-faint)] animate-bounce" />
                          <p className="text-base font-bold italic uppercase tracking-tighter text-[var(--ops-text-muted)]">No orders found</p>
                          <p className="text-[10px] text-[var(--ops-text-faint)] font-bold uppercase tracking-widest">No transaction records match the query</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="hover:bg-[var(--ops-surface-sunken)]/50 transition-colors duration-150 relative"
                      >
                        {/* Order Info */}
                        <td className={cn(
                          "px-5 transition-all",
                          density === 'compact' ? "py-2" : "py-4"
                        )}>
                          <div className="font-bold text-foreground text-sm">#{sale.order_number}</div>
                          <div className="text-[10px] text-[var(--ops-text-muted)] font-bold uppercase tracking-tight mt-1 flex items-center gap-1.5 flex-wrap">
                            <span>{format(new Date(sale.created_at), 'MMM dd, HH:mm')}</span>
                            <span>•</span>
                            <span className="text-primary italic">{sale.cashier.name}</span>
                            {sale.branch && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1"><FiMapPin className="size-3 text-[var(--ops-text-faint)]" />{sale.branch.name}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5">
                          <Badge variant="outline" className="capitalize text-[8px] font-black tracking-widest rounded-lg bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] text-[var(--ops-text-secondary)]">
                            {sale.type}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="px-5">
                          {getStatusBadge(sale.status)}
                        </td>

                        {/* Items */}
                        <td className="px-5 text-right font-mono font-bold text-xs text-[var(--ops-text-secondary)]">
                          {sale.items.reduce((sum, i) => sum + i.quantity, 0)} items
                        </td>

                        {/* Total */}
                        <td className="px-5 text-right">
                          <div className="font-black text-primary text-sm">{formatCurrency(sale.total)}</div>
                          <div className="text-[8px] uppercase font-black text-[var(--ops-text-faint)] tracking-wider mt-0.5">{sale.payment_method}</div>
                        </td>

                        {/* Action overflow */}
                        {isAdmin && (
                          <td className="px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Workflow buttons */}
                              {sale.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  className="h-7.5 text-[9px] font-black uppercase tracking-wider px-3 bg-primary hover:bg-primary/90 text-foreground rounded-[8px]"
                                  onClick={() => updateStatus(sale.id, 'preparing')}
                                >
                                  Start Order
                                </Button>
                              )}
                              {sale.status === 'preparing' && (
                                <Button 
                                  size="sm" 
                                  className="h-7.5 text-[9px] font-black uppercase tracking-wider px-3 bg-emerald-600 hover:bg-emerald-500 text-foreground rounded-[8px]"
                                  onClick={() => updateStatus(sale.id, 'completed')}
                                >
                                  Complete
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 rounded hover:bg-[var(--ops-chip-active-bg)] text-[var(--ops-text-muted)] hover:text-foreground transition-colors">
                                    <span className="text-base font-bold">⋮</span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px] p-1.5 shadow-2xl text-[var(--ops-text-secondary)]">
                                  <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)] px-2.5 py-1.5 font-sans">Options</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-chip-active-bg)] hover:text-foreground"
                                    onClick={() => {
                                      setSelectedSale(sale);
                                      setIsDetailsModalOpen(true);
                                      setTimeout(() => window.print(), 500);
                                    }}
                                  >
                                    <FiPrinter className="size-3.5 text-indigo-400" />
                                    <span>Print Receipt</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-chip-active-bg)] hover:text-foreground"
                                    onClick={() => {
                                      setSelectedSale(sale);
                                      setIsDetailsModalOpen(true);
                                    }}
                                  >
                                    <FiEye className="size-3.5 text-primary" />
                                    <span>Order Details</span>
                                  </DropdownMenuItem>

                                  {sale.status !== 'cancelled' && (
                                    <>
                                      <DropdownMenuSeparator className="bg-[var(--ops-chip-active-bg)] my-1.5" />
                                      <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)] px-2.5 py-1.5">Correction Tools</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-hover)] hover:text-rose-400 text-rose-500"
                                        onClick={() => {
                                          setSaleToVoid(sale);
                                          setIsVoidModalOpen(true);
                                        }}
                                      >
                                        <FiXCircle className="size-3.5" />
                                        <span>Cancel Order</span>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          {paginatedSales.total > paginatedSales.per_page && (
            <div className="p-5 bg-[var(--ops-surface-sunken)]/30 border border-[var(--ops-border)] rounded-[14px] flex flex-col md:flex-row justify-between items-center gap-4">
              <span className="text-[9px] font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                <div className="size-1 rounded-full bg-primary animate-pulse" />
                Showing {paginatedSales.from}–{paginatedSales.to} of {paginatedSales.total} orders
              </span>
              
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  disabled={!paginatedSales.prev_page_url} 
                  onClick={() => router.get(paginatedSales.prev_page_url)} 
                  className="rounded-[8px] h-8 px-2 bg-[var(--ops-surface-sunken)] border border-[var(--ops-border)] text-[var(--ops-text-secondary)] hover:text-foreground"
                >
                  <FiChevronLeft className="size-4" />
                </Button>
                
                <div className="flex items-center gap-1 mx-1.5">
                  {paginatedSales.links?.filter((l: any) => !isNaN(Number(l.label))).map((link: any) => (
                    <Button
                      key={link.label}
                      variant={link.active ? 'default' : 'ghost'}
                      onClick={() => link.url && router.get(link.url)}
                      className={cn(
                        'h-8 w-8 rounded-[8px] font-bold text-xs transition-all',
                        link.active 
                          ? 'bg-primary text-foreground scale-105 shadow-sm' 
                          : 'hover:bg-[var(--ops-chip-active-bg)] text-[var(--ops-text-secondary)]'
                      )}
                    >
                      {link.label}
                    </Button>
                  ))}
                </div>
                
                <Button 
                  variant="ghost" 
                  disabled={!paginatedSales.next_page_url} 
                  onClick={() => router.get(paginatedSales.next_page_url)} 
                  className="rounded-[8px] h-8 px-2 bg-[var(--ops-surface-sunken)] border border-[var(--ops-border)] text-[var(--ops-text-secondary)] hover:text-foreground"
                >
                  <FiChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sale Details Receipt Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
          <DialogTitle className="sr-only">Sale Receipt for Order #{selectedSale?.order_number}</DialogTitle>
          <DialogDescription className="sr-only">Detailed breakdown of sale items, financial totals, and transaction audit data.</DialogDescription>
          <div className="relative mx-auto w-[400px] print:w-full print-receipt-body">
            {/* Zigzag Top Edge */}
            <div className="h-4 w-full bg-[var(--ops-surface-sunken)] overflow-hidden print:hidden" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }} />

            <div className="bg-zinc-950 border border-[var(--ops-border)] rounded-[14px] shadow-2xl p-0 relative overflow-hidden group text-foreground">
              {/* Brand Header */}
              <div className="bg-[var(--ops-surface-raised)] p-8 border-b border-[var(--ops-border-subtle)] border-dashed text-center space-y-4 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 size-32 bg-primary/10 rounded-full blur-3xl opacity-50" />
                <div className="flex justify-center">
                  <div className="p-3 bg-[var(--ops-surface-sunken)] rounded-3xl shadow-2xl ring-1 ring-zinc-800 flex items-center justify-center">
                    <div className="h-12 w-auto">
                      <AppLogo />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 pt-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-[var(--ops-chip-active-bg)] rounded-full text-[var(--ops-text-secondary)]">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Terminal ID</span>
                    <span className="text-[9px] font-black text-primary">#TRS-09</span>
                  </div>
                  <p className="text-[10px] font-black text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">{selectedSale?.branch?.name || 'Maki Desu Victoria'}</p>
                </div>
              </div>

              {/* Ticket Core Info */}
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start border-b border-[var(--ops-border-subtle)] border-dashed pb-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-muted)]">Receipt Number</p>
                    <p className="text-base font-black tracking-tighter text-foreground">#{selectedSale?.order_number}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-primary text-foreground text-[8px] font-black uppercase tracking-widest h-5 rounded-[6px]">{selectedSale?.type}</Badge>
                      {selectedSale && getStatusBadge(selectedSale.status)}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-muted)]">Date & Time</p>
                    <p className="text-xs font-black text-foreground">
                      {selectedSale && format(new Date(selectedSale.created_at), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs font-bold text-[var(--ops-text-muted)]">
                      {selectedSale && format(new Date(selectedSale.created_at), 'HH:mm:ss')}
                    </p>
                  </div>
                </div>

                {/* Items Container */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-muted)]">
                      <FiHash className="size-2.5" /> Items
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-muted)]">Value</div>
                  </div>
                  <div className="space-y-2.5">
                    {selectedSale?.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-end p-2 rounded-xl hover:bg-[var(--ops-surface-sunken)] transition-all">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-foreground">{item.product.name}</p>
                          <p className="text-[10px] font-bold text-[var(--ops-text-muted)]">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                        </div>
                        <p className="font-black tabular-nums text-xs">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total breakdown */}
                <div className="pt-6 border-t-2 border-[var(--ops-border-subtle)] border-dashed space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)] px-2">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-mono">{selectedSale && formatCurrency(selectedSale.total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--ops-text-secondary)] px-2">
                    <span>Service Fee</span>
                    <span className="tabular-nums font-mono">₱0.00</span>
                  </div>
                  <div className="bg-primary p-4 rounded-2xl flex justify-between items-center shadow-xl shadow-primary/30 text-foreground">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Grand Total</p>
                      <p className="text-[9px] font-bold text-foreground/40 italic">VAT Exclusive</p>
                    </div>
                    <p className="text-2xl font-black text-foreground tabular-nums drop-shadow-md">{selectedSale && formatCurrency(selectedSale.total)}</p>
                  </div>
                </div>

                {/* Financial Settlement */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--ops-surface-sunken)]/30 p-3.5 rounded-2xl border border-[var(--ops-border-subtle)] space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-muted)]">Paid via</p>
                    <p className="text-xs font-black uppercase tracking-tighter text-foreground">{selectedSale?.payment_method}</p>
                  </div>
                  <div className="bg-[var(--ops-surface-sunken)]/30 p-3.5 rounded-2xl border border-[var(--ops-border-subtle)] space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-muted)]">Change Given</p>
                    <p className="text-xs font-black text-amber-500 font-mono">{selectedSale && formatCurrency(selectedSale.change_amount)}</p>
                  </div>
                </div>

                {/* Audit & Security Footer */}
                <div className="pt-6 border-t border-[var(--ops-border-subtle)] border-dashed flex flex-col items-center gap-6 text-center">
                  <div className="flex items-center gap-4 bg-[var(--ops-surface-sunken)]/30 border border-[var(--ops-border-subtle)] p-3.5 rounded-2xl w-full">
                    <div className="size-10 rounded-xl bg-[var(--ops-surface-sunken)] flex items-center justify-center shadow-sm">
                      <FiUserCheck className="size-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--ops-text-muted)]">Served By</p>
                      <p className="text-xs font-black uppercase italic tracking-tighter text-primary">{selectedSale?.cashier.name}</p>
                    </div>
                  </div>

                  {/* Verification QR */}
                  <div className="space-y-3">
                    <div className="size-20 bg-[var(--ops-surface-sunken)] p-2 rounded-xl border border-[var(--ops-border)] mx-auto">
                      <div className="w-full h-full bg-zinc-950 rounded border border-dashed border-[var(--ops-border)] flex items-center justify-center">
                        <div className="size-6 border-2 border-[var(--ops-border)] rounded-sm" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest italic text-[var(--ops-text-faint)]">Secure Transaction Verified</p>
                      <p className="text-[7px] font-bold text-[var(--ops-text-faint)] uppercase mt-0.5 font-mono">Order Index: {selectedSale?.id.toString().padStart(8, '0')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zigzag Bottom Edge */}
            <div className="h-4 w-full bg-[var(--ops-surface-sunken)] overflow-hidden print:hidden" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }} />

            {/* Print Quick Controls Floating */}
            <div className="absolute bottom-8 right-[-100px] group-hover:right-8 transition-all duration-500 print:hidden flex flex-col gap-2">
              <Button size="icon" className="size-10 rounded-2xl shadow-2xl bg-primary text-foreground" onClick={() => window.print()}>
                <FiPrinter className="size-4.5" />
              </Button>
              <Button variant="outline" size="icon" className="size-10 rounded-2xl bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] text-[var(--ops-text-secondary)] hover:text-foreground" onClick={() => setIsDetailsModalOpen(false)}>
                <FiXCircle className="size-4.5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Void Transaction Confirmation Modal */}
      <Dialog open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
          <div className="bg-zinc-950 border border-[var(--ops-border)] rounded-[20px] overflow-hidden shadow-2xl text-foreground">
            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="size-16 rounded-[14px] bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <FiShieldOff className="size-8" />
                </div>
              </div>

              <div className="space-y-2">
                <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-rose-500">Cancel Order?</DialogTitle>
                <DialogDescription className="text-xs font-semibold text-[var(--ops-text-secondary)] leading-normal">
                  You are about to cancel <span className="font-black text-foreground">Order #{saleToVoid?.order_number}</span>. This will reverse the payment and return the items to stock.
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/15 text-rose-500 text-left text-xs font-bold leading-normal">
                <FiAlertTriangle className="size-4 shrink-0 text-rose-500" />
                <p>
                  Inventory truth will be restored. This action is permanently logged in the audit trail.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="destructive"
                  className="h-10 rounded-[10px] font-black uppercase tracking-wider text-[10px] bg-rose-600 hover:bg-rose-500 text-foreground italic"
                  onClick={() => {
                    if (saleToVoid) {
                      updateStatus(saleToVoid.id, 'cancelled');
                      setIsVoidModalOpen(false);
                    }
                  }}
                >
                  Confirm Cancellation
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 rounded-[10px] font-black uppercase tracking-wider text-[10px] text-[var(--ops-text-secondary)] hover:bg-[var(--ops-surface-sunken)]"
                  onClick={() => setIsVoidModalOpen(false)}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden;
          }
          #app, [data-sidebar-root], header, nav, main, footer {
            display: none !important;
          }
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
          .print-receipt-body * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden, button, [role="button"] {
            display: none !important;
          }
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
