import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format, subDays, parseISO } from 'date-fns';
import {
    BarChart3,
    DollarSign,
    TrendingUp,
    ShoppingBag,
    AlertTriangle,
    Download,
    Search,
    FileText,
    Database,
    Zap,
    Calendar,
    RefreshCw,
    Activity,
    Building2,
    Receipt
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

import { KPICard } from '@/components/dashboard/KPICard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
};

export interface ExportOptions {
    format: 'pdf' | 'excel';
    scope: 'view' | 'all';
    orientation: 'portrait' | 'landscape';
    paperSize: 'A4' | 'Letter' | 'Legal';
    includedData: {
        kpis: boolean;
        table: boolean;
        charts: boolean;
    };
}

interface PresetOption {
    label: string;
    getValue: () => { from: string; to: string };
}

// ── DATE RANGE PICKER COMPONENT ──
const DateRangePicker = ({ from, to, onUpdate }: { from: string; to: string; onUpdate: (from: string, to: string) => void }) => {
    const [open, setOpen] = useState(false);

    const presets: PresetOption[] = [
        { label: 'Today', getValue: () => ({ from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
        { label: 'Yesterday', getValue: () => ({ from: format(subDays(new Date(), 1), 'yyyy-MM-dd'), to: format(subDays(new Date(), 1), 'yyyy-MM-dd') }) },
        { label: 'Last 7 Days', getValue: () => ({ from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
        { label: 'Last 30 Days', getValue: () => ({ from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
    ];

    const currentLabel = useMemo(() => {
        if (!from || !to) return 'Select Date Range';
        const fromDate = parseISO(from);
        const toDate = parseISO(to);
        const formatStr = 'MMM d, yyyy';
        if (from === to) return format(fromDate, formatStr);
        return `${format(fromDate, 'MMM d')} – ${format(toDate, formatStr)}`;
    }, [from, to]);

    const handlePreset = (preset: PresetOption) => {
        const { from, to } = preset.getValue();
        onUpdate(from, to);
        setOpen(false);
    };

    const handleReset = () => {
        onUpdate('', '');
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 px-4 rounded-2xl font-bold text-xs justify-start gap-2.5 border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] hover:bg-[#FFF5F7] text-[#3D2C2E] dark:text-[#E2E8F0] shadow-2xs transition-all cursor-pointer">
                    <Calendar className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                    <span className="truncate">{currentLabel}</span>
                    {from && <div className="size-2 rounded-full bg-emerald-500 animate-pulse ml-auto" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 rounded-3xl border-[#F8C8DC]/60 dark:border-white/10 bg-white/95 dark:bg-[#121218]/95 shadow-2xl overflow-hidden backdrop-blur-2xl font-['Outfit']" align="end">
                <div className="flex flex-col">
                    <div className="p-4 border-b border-[#F8C8DC]/40 dark:border-white/10 bg-[#FFF5F7]/50 dark:bg-[#181824]/50">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] mb-3">Predefined Intervals</p>
                        <div className="grid grid-cols-2 gap-2">
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    onClick={() => handlePreset(preset)}
                                    className="h-9 justify-start px-3 rounded-xl text-xs font-bold text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-5 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Custom Date Range</p>
                        <div className="space-y-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] px-1">Start Date</label>
                                <Input 
                                    type="date" 
                                    value={from} 
                                    onChange={(e) => onUpdate(e.target.value, to)} 
                                    className="h-10 rounded-xl bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 font-bold text-xs text-[#3D2C2E] dark:text-[#F8FAFC]" 
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] px-1">End Date</label>
                                <Input 
                                    type="date" 
                                    value={to} 
                                    min={from}
                                    onChange={(e) => onUpdate(from, e.target.value)} 
                                    className="h-10 rounded-xl bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 font-bold text-xs text-[#3D2C2E] dark:text-[#F8FAFC]" 
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <Button variant="ghost" onClick={handleReset} className="flex-1 h-9 rounded-xl text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] cursor-pointer">
                                Reset
                            </Button>
                            <Button onClick={() => setOpen(false)} className="flex-1 h-9 rounded-xl text-xs font-bold bg-[#E75480] dark:bg-[#E1062C] text-white hover:bg-[#D43F6B] cursor-pointer shadow-xs">
                                Apply Range
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

interface CustomTooltipItem {
    name: string;
    value: number;
    color: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: CustomTooltipItem[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#121218]/90 border border-white/10 shadow-2xl rounded-2xl p-3 text-white backdrop-blur-xl font-['Outfit'] space-y-1">
                <p className="text-[10px] font-mono font-bold uppercase text-slate-400">{label}</p>
                {payload.map((entry: CustomTooltipItem, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}</span>
                        </div>
                        <span className="font-mono">
                            {entry.name === 'Revenue' || entry.name === 'Profit' ? formatCurrency(entry.value) : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

function getPeriodLabel(filters: { date_from?: string; date_to?: string }, type: 'Sales' | 'Orders') {
    if (filters.date_from && filters.date_to) {
        if (filters.date_from === filters.date_to && filters.date_from === format(new Date(), 'yyyy-MM-dd')) {
            return `${type} Today`;
        }
        return `${type} (Selected Dates)`;
    }
    return `All-Time ${type}`;
}

// ── DYNAMIC EXPORT MODAL ──
function ExportModal({ isOpen, onClose, onExport, activeTab }: { isOpen: boolean; onClose: () => void; onExport: (options: ExportOptions) => void; activeTab: 'sales' | 'shifts' }) {
    const [formatOption, setFormatOption] = useState<'pdf' | 'excel'>('pdf');
    const [scope, setScope] = useState<'view' | 'all'>('view');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
    const [includedData, setIncludedData] = useState({
        kpis: true,
        table: true,
        charts: true,
    });

    const handleExport = () => {
        onExport({
            format: formatOption,
            scope,
            orientation,
            paperSize,
            includedData
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] p-6 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit'] shadow-2xl">
                <DialogHeader className="pb-4 border-b border-[#F8C8DC]/40 dark:border-white/10">
                    <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                        <Download className="size-5 text-[#E75480] dark:text-[#FF4F81]" /> Configure Export Parameters
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                        Select document format, orientation boundaries, and included dataset sections
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                    {/* Target Format */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Target Format</label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                type="button"
                                variant={formatOption === 'pdf' ? 'default' : 'outline'}
                                onClick={() => setFormatOption('pdf')}
                                className={cn(
                                    'h-11 rounded-2xl text-xs font-bold cursor-pointer transition-all gap-2',
                                    formatOption === 'pdf' ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs' : 'border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]'
                                )}
                            >
                                <FileText className="size-4" /> PDF Document
                            </Button>
                            <Button 
                                type="button"
                                variant={formatOption === 'excel' ? 'default' : 'outline'}
                                onClick={() => setFormatOption('excel')}
                                className={cn(
                                    'h-11 rounded-2xl text-xs font-bold cursor-pointer transition-all gap-2',
                                    formatOption === 'excel' ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs' : 'border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]'
                                )}
                            >
                                <Database className="size-4" /> Excel (.xlsx)
                            </Button>
                        </div>
                    </div>

                    {/* Data Scope */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Data Scope</label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                type="button"
                                variant={scope === 'view' ? 'secondary' : 'ghost'}
                                onClick={() => setScope('view')}
                                className={cn(
                                    'h-10 rounded-2xl text-xs font-bold cursor-pointer border',
                                    scope === 'view' ? 'bg-[#FFF5F7] dark:bg-[#181824] border-[#E75480]/40 text-[#E75480] dark:text-[#FF4F81]' : 'border-transparent text-[#7D6B6E] dark:text-[#94A3B8]'
                                )}
                            >
                                Current Page ({activeTab.toUpperCase()})
                            </Button>
                            <Button 
                                type="button"
                                variant={scope === 'all' ? 'secondary' : 'ghost'}
                                onClick={() => setScope('all')}
                                className={cn(
                                    'h-10 rounded-2xl text-xs font-bold cursor-pointer border',
                                    scope === 'all' ? 'bg-[#FFF5F7] dark:bg-[#181824] border-[#E75480]/40 text-[#E75480] dark:text-[#FF4F81]' : 'border-transparent text-[#7D6B6E] dark:text-[#94A3B8]'
                                )}
                            >
                                Full Filtered Dataset
                            </Button>
                        </div>
                    </div>

                    {/* Content Inclusions */}
                    <div className="space-y-2 pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] block">Content Inclusions</label>
                        <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[#3D2C2E] dark:text-[#F8FAFC]">
                                <input 
                                    type="checkbox" 
                                    checked={includedData.kpis} 
                                    onChange={() => setIncludedData(p => ({ ...p, kpis: !p.kpis }))}
                                    className="size-4 rounded-md accent-[#E75480]" 
                                />
                                KPIs
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[#3D2C2E] dark:text-[#F8FAFC]">
                                <input 
                                    type="checkbox" 
                                    checked={includedData.table} 
                                    onChange={() => setIncludedData(p => ({ ...p, table: !p.table }))}
                                    className="size-4 rounded-md accent-[#E75480]" 
                                />
                                Data Grid
                            </label>
                            {formatOption === 'pdf' && (
                                <label className="flex items-center gap-2 cursor-pointer select-none text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    <input 
                                        type="checkbox" 
                                        checked={includedData.charts} 
                                        onChange={() => setIncludedData(p => ({ ...p, charts: !p.charts }))}
                                        className="size-4 rounded-md accent-[#E75480]" 
                                    />
                                    Charts
                                </label>
                            )}
                        </div>
                    </div>

                    {formatOption === 'pdf' && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Orientation</label>
                                <Select value={orientation} onValueChange={(v: 'portrait' | 'landscape') => setOrientation(v)}>
                                    <SelectTrigger className="h-10 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                                        <SelectItem value="portrait">Portrait</SelectItem>
                                        <SelectItem value="landscape">Landscape</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Paper Size</label>
                                <Select value={paperSize} onValueChange={(v: 'A4' | 'Letter' | 'Legal') => setPaperSize(v)}>
                                    <SelectTrigger className="h-10 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                                        <SelectItem value="A4">A4</SelectItem>
                                        <SelectItem value="Letter">Letter</SelectItem>
                                        <SelectItem value="Legal">Legal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-end gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="h-10 px-4 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] text-xs font-bold cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        onClick={handleExport}
                        className="h-10 px-4 rounded-2xl bg-[#E75480] dark:bg-[#E1062C] text-white hover:bg-[#D43F6B] text-xs font-bold cursor-pointer shadow-xs"
                    >
                        Generate Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface SaleItem {
    id: number;
    order_number: string;
    created_at: string;
    cashier?: { name: string };
    branch?: { name: string };
    status: string;
    total: number;
    profit: number;
}

interface ShiftItem {
    id: number;
    cashier?: { name: string };
    opened_at?: string;
    closed_at?: string;
    opening_cash?: number;
    expected_cash?: number;
    actual_cash?: number | null;
    opening_balance?: number;
    closing_balance?: number | null;
    expected_balance?: number;
    total_cash_sales?: number;
    cash_in?: number;
    cash_out?: number;
    variance?: number | null;
    difference?: number | null;
    status?: 'open' | 'closed';
    notes?: string;
}

interface PaginatedData<T> {
    data: T[];
    from?: number;
    to?: number;
    total?: number;
    links: Array<{ url?: string; label: string; active: boolean }>;
}

interface MetricDelta {
    current_value?: number;
    previous_value?: number;
    difference?: number;
    delta_percentage?: number | null;
    formatted_delta?: string;
    trend?: 'up' | 'down' | 'neutral';
    comparison_label?: string;
    state?: string;
    badge_text?: string;
}

interface BranchItem {
    id: number;
    name: string;
}

interface AdminReportsProps {
    sales: PaginatedData<SaleItem>;
    shifts: PaginatedData<ShiftItem>;
    filters: { date_from?: string; date_to?: string; branch_id?: string };
    branches?: BranchItem[];
    trend_data?: Array<{ date: string; revenue: number; profit: number }>;
    category_data?: Array<{ name: string; value: number }>;
    total_revenue: number;
    total_expenses: number;
    total_profit: number;
    total_orders: number;
    cancelled_count: number;
    today_sales: number;
    isAdmin?: boolean;
    revenue_delta?: MetricDelta;
    orders_delta?: MetricDelta;
    expenses_delta?: MetricDelta;
    profit_delta?: MetricDelta;
    today_revenue_delta?: MetricDelta;
    today_orders_delta?: MetricDelta;
}

// ── ADMIN REPORTS DASHBOARD ──
function AdminReports({ 
    sales, 
    shifts, 
    filters, 
    branches = [], 
    trend_data, 
    category_data, 
    total_revenue, 
    total_expenses, 
    total_profit, 
    total_orders, 
    cancelled_count, 
    today_sales, 
    isAdmin = false,
    revenue_delta,
    orders_delta,
    expenses_delta,
    profit_delta,
    today_revenue_delta,
    today_orders_delta
}: AdminReportsProps) {
    const pageAuth = (usePage().props as unknown as { auth?: { user?: { role?: string } } })?.auth?.user;
    const isAdminUser = isAdmin || pageAuth?.role === 'admin' || pageAuth?.role === 'super_admin';

    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || 'all');
    const [activeTab, setActiveTab] = useState<'sales' | 'shifts'>('sales');
    const [isExportOpen, setIsExportOpen] = useState(false);

    const updateRange = (from: string, to: string) => {
        setDateFrom(from);
        setDateTo(to);
        if (from !== dateFrom || to !== dateTo) {
             router.get('/reports', { date_from: from, date_to: to, branch_id: selectedBranch }, { preserveState: true });
        }
    };

    const handleBranchChange = (value: string) => {
        setSelectedBranch(value);
        router.get('/reports', { date_from: dateFrom, date_to: dateTo, branch_id: value }, { preserveState: true });
    };

    const triggerExport = async (options: ExportOptions) => {
        const kpis = [];
        if (options.includedData.kpis) {
            if (activeTab === 'sales') {
                kpis.push({ title: "Today's Sales", value: formatCurrency(today_sales ?? 0) });
                kpis.push({ title: "Total Revenue", value: formatCurrency(total_revenue ?? 0) });
                kpis.push({ title: "Total Orders", value: (total_orders ?? 0).toLocaleString() });
                if (isAdminUser) {
                    kpis.push({ title: "Net Profit", value: formatCurrency(total_profit ?? 0) });
                }
                kpis.push({ title: "Cancelled Orders", value: (cancelled_count ?? 0).toLocaleString() });
            } else {
                kpis.push({ title: "Total Shift Transactions", value: shifts.total?.toString() || '0' });
            }
        }

        const columns = [];
        if (activeTab === 'sales') {
            columns.push({ title: 'Order #', key: 'order_number', align: 'text-left' });
            columns.push({ title: 'Date', key: 'date', align: 'text-left' });
            columns.push({ title: 'Cashier', key: 'cashier', align: 'text-left' });
            columns.push({ title: 'Branch', key: 'branch', align: 'text-left' });
            columns.push({ title: 'Status', key: 'status', align: 'text-left' });
            columns.push({ title: 'Total Sales', key: 'total', align: 'text-right' });
            if (isAdminUser) {
                columns.push({ title: 'Net Profit', key: 'profit', align: 'text-right' });
            }
        } else {
            columns.push({ title: 'Cashier', key: 'cashier', align: 'text-left' });
            columns.push({ title: 'Opened At', key: 'opened_at', align: 'text-left' });
            columns.push({ title: 'Closed At', key: 'closed_at', align: 'text-left' });
            columns.push({ title: 'Opening Balance', key: 'opening', align: 'text-right' });
            columns.push({ title: 'Ending Balance', key: 'ending', align: 'text-right' });
            columns.push({ title: 'Actual Cash', key: 'actual', align: 'text-right' });
            columns.push({ title: 'Difference', key: 'diff', align: 'text-right' });
        }

        let rows: Record<string, string>[] = [];
        if (options.scope === 'view') {
            if (activeTab === 'sales') {
                rows = (sales.data || []).map((sale: SaleItem) => {
                    const row: Record<string, string> = {
                        order_number: sale.order_number,
                        date: format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm'),
                        cashier: sale.cashier?.name ?? 'N/A',
                        branch: sale.branch?.name ?? 'N/A',
                        status: sale.status,
                        total: formatCurrency(sale.total),
                    };
                    if (isAdminUser) {
                        row.profit = formatCurrency(sale.profit);
                    }
                    return row;
                });
            } else {
                rows = (shifts.data || []).map((s: ShiftItem) => {
                    const opening = Number(s.opening_cash ?? s.opening_balance ?? 0);
                    const expected = Number(s.expected_cash ?? s.expected_balance ?? 0);
                    const actual = s.actual_cash !== null && s.actual_cash !== undefined 
                        ? Number(s.actual_cash) 
                        : (s.closing_balance !== null && s.closing_balance !== undefined ? Number(s.closing_balance) : null);
                    const diff = s.difference !== null && s.difference !== undefined 
                        ? Number(s.difference) 
                        : (s.variance !== null && s.variance !== undefined ? Number(s.variance) : (actual !== null ? actual - expected : null));

                    return {
                        cashier: s.cashier?.name ?? 'N/A',
                        opened_at: s.opened_at ? format(new Date(s.opened_at), 'MMM dd, yyyy HH:mm') : 'N/A',
                        closed_at: s.closed_at ? format(new Date(s.closed_at), 'MMM dd, yyyy HH:mm') : 'Active',
                        opening: formatCurrency(opening),
                        ending: formatCurrency(expected),
                        actual: actual !== null ? formatCurrency(actual) : 'Active',
                        diff: diff !== null ? formatCurrency(diff) : '—',
                    };
                });
            }
        }

        let chartImage = null;
        if (options.includedData.charts && activeTab === 'sales') {
            const svgEl = document.querySelector('.recharts-responsive-container svg');
            if (svgEl) {
                const svgString = new XMLSerializer().serializeToString(svgEl);
                chartImage = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
            }
        }

        try {
            const res = await axios.post('/reports/export/prepare', {
                reportName: activeTab === 'sales' ? 'Sales Performance Report' : 'Cash Drawer Shifts Log',
                branch: 'All Branches',
                dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time',
                generatedBy: 'System Administrator',
                kpis,
                columns,
                rows,
                chartImage,
                options
            });
            
            if (res.data?.token) {
                window.open(`/reports/${options.format}?token=${res.data.token}`, '_blank');
            }
        } catch (err) {
            console.error('Prepared dynamic export failed:', err);
        }
    };

    const TREND_DATA = trend_data || [];
    const CAT_DATA = category_data || [];

    return (
        <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
            
            {/* ── ZONE 1: EXECUTIVE HERO BANNER ── */}
            <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-white via-[#FFF5F7]/80 to-[#FADADD]/40 dark:from-[#121218] dark:via-[#161622]/90 dark:to-[#0A0A10] p-6 sm:p-8 lg:p-10 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors duration-300">
                <div className="absolute -top-24 -right-24 size-96 rounded-full bg-linear-to-br from-[#E75480]/20 to-transparent dark:from-[#E1062C]/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-linear-to-tr from-[#F8C8DC]/30 to-transparent dark:from-[#FF4F81]/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs">
                                    <BarChart3 className="size-3.5" />
                                    Business Intelligence Center
                                </span>
                                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Live Telemetry</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                Executive Reports & Intelligence
                            </h1>
                            <p className="text-xs sm:text-sm font-medium text-[#7D6B6E] dark:text-[#94A3B8] max-w-xl">
                                Real-time revenue trajectories, inventory asset valuation, store performance telemetry, and automated AI demand forecasts.
                            </p>
                        </div>

                        {/* Top Controls: Export & Date Picker */}
                        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
                            {branches.length > 0 && (
                                <Select value={selectedBranch} onValueChange={handleBranchChange}>
                                    <SelectTrigger className="h-10 px-4 rounded-2xl font-bold text-xs gap-2 border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] shadow-2xs cursor-pointer">
                                        <Building2 className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                        <SelectValue placeholder="All Branches" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                                        <SelectItem value="all" className="rounded-xl py-2 cursor-pointer">All Branches</SelectItem>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id.toString()} className="rounded-xl py-2 cursor-pointer">
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            <Button 
                                onClick={() => setIsExportOpen(true)}
                                className="h-10 px-4 rounded-2xl bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                            >
                                <Download className="size-4" />
                                <span>Configure Export</span>
                            </Button>

                            <DateRangePicker from={dateFrom} to={dateTo} onUpdate={updateRange} />
                        </div>
                    </div>

                    {/* Dashboard Reused KPI Cards Strip */}
                    <div className={cn("grid gap-4 pt-2", isAdminUser ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
                        <KPICard
                            title="Today's Revenue"
                            value={formatCurrency(today_sales ?? 0)}
                            icon={Zap}
                            trend={today_revenue_delta?.trend || 'up'}
                            trendValue={today_revenue_delta?.formatted_delta || (today_sales > 0 ? '+0.0%' : '0.0%')}
                            comparison={today_revenue_delta?.comparison_label || 'vs yesterday'}
                            sparklineData={[{ value: 45 }, { value: 65 }, { value: 80 }, { value: 95 }]}
                            badgeText="Live Today"
                            index={0}
                        />
                        <KPICard
                            title={getPeriodLabel(filters, 'Sales')}
                            value={formatCurrency(total_revenue ?? 0)}
                            icon={TrendingUp}
                            trend={revenue_delta?.trend || 'up'}
                            trendValue={revenue_delta?.formatted_delta || (total_revenue > 0 ? '+0.0%' : '0.0%')}
                            comparison={revenue_delta?.comparison_label || 'vs previous timeframe'}
                            sparklineData={[{ value: 30 }, { value: 45 }, { value: 60 }, { value: 80 }]}
                            badgeText="Total Revenue"
                            index={1}
                        />
                        <KPICard
                            title={getPeriodLabel(filters, 'Orders')}
                            value={(total_orders ?? 0).toLocaleString()}
                            icon={ShoppingBag}
                            trend={orders_delta?.trend || 'neutral'}
                            trendValue={orders_delta?.formatted_delta || '0.0%'}
                            comparison={orders_delta?.comparison_label || 'completed volume'}
                            sparklineData={[{ value: 40 }, { value: 60 }, { value: 70 }, { value: 85 }]}
                            badgeText="Fulfillment"
                            index={2}
                        />
                        {isAdminUser && (
                            <KPICard
                                title="Operating Expenses"
                                value={formatCurrency(total_expenses ?? 0)}
                                icon={Receipt}
                                trend={expenses_delta?.trend || 'down'}
                                trendValue={expenses_delta?.formatted_delta || 'COGS'}
                                comparison={expenses_delta?.comparison_label || 'cost of goods sold'}
                                sparklineData={[{ value: 25 }, { value: 40 }, { value: 55 }, { value: 70 }]}
                                badgeText="Expenses"
                                index={3}
                            />
                        )}
                        {isAdminUser && (
                            <KPICard
                                title="Net Profit"
                                value={formatCurrency(total_profit ?? 0)}
                                icon={TrendingUp}
                                trend={profit_delta?.trend || 'up'}
                                trendValue={profit_delta?.formatted_delta || 'Margin'}
                                comparison={profit_delta?.comparison_label || 'revenue minus expenses'}
                                sparklineData={[{ value: 20 }, { value: 50 }, { value: 65 }, { value: 88 }]}
                                badgeText="Margin"
                                index={4}
                            />
                        )}
                        <KPICard
                            title="Cancelled Orders"
                            value={(cancelled_count ?? 0).toLocaleString()}
                            icon={AlertTriangle}
                            trend={(cancelled_count ?? 0) > 5 ? 'down' : 'up'}
                            trendValue={(cancelled_count ?? 0) > 5 ? 'High' : 'Low'}
                            comparison="void count"
                            sparklineData={[{ value: 5 }, { value: 3 }, { value: 8 }, { value: 2 }]}
                            badgeText="Audited"
                            index={5}
                        />
                    </div>
                </div>
            </div>

            {/* ── ZONE 2: TAB NAVIGATION ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center p-1 rounded-2xl bg-white/80 dark:bg-[#121218]/80 border border-[#F8C8DC]/60 dark:border-white/10 shadow-xs backdrop-blur-xl">
                    <button
                        type="button"
                        onClick={() => setActiveTab('sales')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                            activeTab === 'sales'
                                ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs'
                                : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-white'
                        )}
                    >
                        <ShoppingBag className="size-3.5" />
                        <span>Sales Performance</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('shifts')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                            activeTab === 'shifts'
                                ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs'
                                : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-white'
                        )}
                    >
                        <DollarSign className="size-3.5" />
                        <span>Cash Drawer Shifts</span>
                    </button>
                </div>
            </div>

            {activeTab === 'sales' ? (
                <>
                    {/* ── ZONE 3: RECHARTS ANALYTICS ── */}
                    {TREND_DATA.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                            <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {isAdminUser ? 'Revenue & Net Profit Trajectory' : 'Revenue Trajectory'}
                                            </h3>
                                        </div>
                                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                            Performance mapping over selected date interval
                                        </p>
                                    </div>
                                </div>

                                 <div className="h-72 w-full min-h-72 min-w-0 pt-2">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200} initialDimension={{ width: 500, height: 250 }}>
                                        <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#E75480" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#E75480" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                            <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v}`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="Revenue" stroke="#E75480" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                            {isAdminUser && <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} fill="none" />}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                        <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            Category Volume Distribution
                                        </h3>
                                    </div>
                                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                        Share of gross sales by menu category
                                    </p>
                                </div>

                                <div className="h-52 w-full min-h-52 min-w-0 flex items-center justify-center relative">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={180} initialDimension={{ width: 300, height: 200 }}>
                                        <PieChart>
                                            <Pie data={CAT_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                                {CAT_DATA.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#E75480', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][index % 6]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10 text-xs font-bold">
                                    {CAT_DATA.map((entry, index) => (
                                        <div key={entry.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="size-2.5 rounded-full" style={{ backgroundColor: ['#E75480', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][index % 6] }} />
                                                <span className="text-[#3D2C2E] dark:text-[#F8FAFC]">{entry.name}</span>
                                            </div>
                                            <span className="font-mono text-[#7D6B6E] dark:text-[#94A3B8]">{entry.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ZONE 4: TRANSACTION REGISTRY GLASS TABLE ── */}
                    <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 p-6 sm:p-7 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-2xs">
                                    <Activity className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        Transaction Performance Registry
                                    </h3>
                                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                        Filtered order logs and net revenue calculation
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 backdrop-blur-md font-black uppercase text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                        <th className="py-3.5 px-5">Order #</th>
                                        <th className="py-3.5 px-5">Timestamp</th>
                                        <th className="py-3.5 px-5">Cashier</th>
                                        <th className="py-3.5 px-5">Status</th>
                                        <th className="py-3.5 px-5 text-right">Total Sales</th>
                                        {isAdminUser && <th className="py-3.5 px-5 text-right">Net Profit</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                                    {sales.data.map((sale: SaleItem) => (
                                        <tr key={sale.id} className="hover:bg-[#FFF5F7]/40 dark:hover:bg-white/5 transition-colors">
                                            <td className="py-3.5 px-5 font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {sale.order_number}
                                            </td>
                                            <td className="py-3.5 px-5 font-mono text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                                {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                                            </td>
                                            <td className="py-3.5 px-5 font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {sale.cashier?.name || 'N/A'}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <Badge className={cn(
                                                    'capitalize font-extrabold text-[10px]',
                                                    sale.status === 'completed' && 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
                                                    sale.status === 'cancelled' && 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50',
                                                    sale.status === 'pending' && 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                                                )}>
                                                    {sale.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3.5 px-5 text-right font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {formatCurrency(sale.total)}
                                            </td>
                                            {isAdminUser && (
                                                <td className="py-3.5 px-5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(sale.profit)}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] font-mono pt-1">
                            <span>Showing {sales.from || 0} to {sales.to || 0} of {sales.total || 0} results</span>
                            <div className="flex items-center gap-1">
                                {sales.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={cn('h-8 min-w-8 px-2 text-[10px] rounded-xl border-[#F8C8DC]/60 dark:border-white/10 cursor-pointer', link.active && 'bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent')}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* ── SHIFT DRAWER HISTORY TABLE ── */
                <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 p-6 sm:p-7 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-2xs">
                                <DollarSign className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    Cash Drawer Shifts Telemetry
                                </h3>
                                <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Cashier shift openings, closing balances, and variance logs
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 backdrop-blur-md font-black uppercase text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                    <th className="py-3.5 px-5">Cashier</th>
                                    <th className="py-3.5 px-5">Opened</th>
                                    <th className="py-3.5 px-5">Closed</th>
                                    <th className="py-3.5 px-5 text-right">Opening Cash</th>
                                    <th className="py-3.5 px-5 text-right">Expected Cash</th>
                                    <th className="py-3.5 px-5 text-right">Actual Cash</th>
                                    <th className="py-3.5 px-5 text-right">Difference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                                {shifts.data.map((s: ShiftItem) => {
                                    const opening = Number(s.opening_cash ?? s.opening_balance ?? 0);
                                    const expected = Number(s.expected_cash ?? s.expected_balance ?? 0);
                                    const actual = s.actual_cash !== null && s.actual_cash !== undefined 
                                        ? Number(s.actual_cash) 
                                        : (s.closing_balance !== null && s.closing_balance !== undefined ? Number(s.closing_balance) : null);
                                    const diff = s.difference !== null && s.difference !== undefined 
                                        ? Number(s.difference) 
                                        : (s.variance !== null && s.variance !== undefined 
                                            ? Number(s.variance) 
                                            : (actual !== null ? actual - expected : null));
                                    const isOpen = s.status === 'open' || !s.closed_at;

                                    return (
                                        <tr key={s.id} className="hover:bg-[#FFF5F7]/40 dark:hover:bg-white/5 transition-colors">
                                            <td className="py-3.5 px-5 font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{s.cashier?.name ?? 'Staff'}</td>
                                            <td className="py-3.5 px-5 font-mono text-[#7D6B6E] dark:text-[#94A3B8]">{s.opened_at ? format(new Date(s.opened_at), 'MMM dd, HH:mm') : 'N/A'}</td>
                                            <td className="py-3.5 px-5 font-mono text-[#7D6B6E] dark:text-[#94A3B8]">
                                                {isOpen ? (
                                                    <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 font-bold text-[10px]">Active Shift</Badge>
                                                ) : (
                                                    s.closed_at ? format(new Date(s.closed_at), 'MMM dd, HH:mm') : 'Closed'
                                                )}
                                            </td>
                                            <td className="py-3.5 px-5 text-right font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(opening)}</td>
                                            <td className="py-3.5 px-5 text-right font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(expected)}</td>
                                            <td className="py-3.5 px-5 text-right font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {actual !== null ? formatCurrency(actual) : <span className="text-zinc-400 text-[11px] italic">In Progress</span>}
                                            </td>
                                            <td className={cn(
                                                'py-3.5 px-5 text-right font-mono font-black',
                                                diff === null
                                                    ? 'text-[#7D6B6E] dark:text-[#94A3B8]'
                                                    : diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                            )}>
                                                {diff !== null ? `${diff >= 0 ? '+' : ''}${formatCurrency(diff)}` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] font-mono pt-1">
                        <span>Showing {shifts.from || 0} to {shifts.to || 0} of {shifts.total || 0} results</span>
                        <div className="flex items-center gap-1">
                            {shifts.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={cn('h-8 min-w-8 px-2 text-[10px] rounded-xl border-[#F8C8DC]/60 dark:border-white/10 cursor-pointer', link.active && 'bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent')}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <ExportModal 
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                onExport={triggerExport}
                activeTab={activeTab}
            />
        </div>
    );
}

interface CashierReportsProps {
    sales: PaginatedData<SaleItem>;
    shifts: PaginatedData<ShiftItem>;
    cashiers?: Array<{ id: number; name: string }>;
    filters: { date_from?: string; date_to?: string; cashier_id?: string; status?: string };
    today_sales: number;
    total_revenue: number;
    total_orders: number;
    revenue_delta?: MetricDelta;
    orders_delta?: MetricDelta;
    today_revenue_delta?: MetricDelta;
    today_orders_delta?: MetricDelta;
}

// ── CASHIER REPORTS ──
function CashierReports({
    sales,
    shifts,
    cashiers = [],
    filters,
    today_sales,
    total_revenue,
    total_orders,
    revenue_delta,
    orders_delta,
    today_revenue_delta,
    today_orders_delta
}: CashierReportsProps) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [cashierId, setCashierId] = useState(filters.cashier_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [activeTab, setActiveTab] = useState<'sales' | 'shifts'>('sales');
    const [isExportOpen, setIsExportOpen] = useState(false);

    const handleReset = () => {
        setDateFrom('');
        setDateTo('');
        setCashierId('all');
        setStatus('all');
        router.get('/reports');
    };

    const triggerExport = async (options: ExportOptions) => {
        const kpis = [
            { title: "Sales Today", value: formatCurrency(today_sales ?? 0) },
            { title: "Total Revenue", value: formatCurrency(total_revenue ?? 0) },
            { title: "Total Orders", value: (total_orders ?? 0).toLocaleString() }
        ];

        const columns = [];
        if (activeTab === 'sales') {
            columns.push({ title: 'Order #', key: 'order_number', align: 'text-left' });
            columns.push({ title: 'Date', key: 'date', align: 'text-left' });
            columns.push({ title: 'Cashier', key: 'cashier', align: 'text-left' });
            columns.push({ title: 'Status', key: 'status', align: 'text-left' });
            columns.push({ title: 'Total Sales', key: 'total', align: 'text-right' });
        } else {
            columns.push({ title: 'Cashier', key: 'cashier', align: 'text-left' });
            columns.push({ title: 'Opened At', key: 'opened_at', align: 'text-left' });
            columns.push({ title: 'Closed At', key: 'closed_at', align: 'text-left' });
            columns.push({ title: 'Opening Balance', key: 'opening', align: 'text-right' });
            columns.push({ title: 'Ending Balance', key: 'ending', align: 'text-right' });
            columns.push({ title: 'Actual Cash', key: 'actual', align: 'text-right' });
            columns.push({ title: 'Difference', key: 'diff', align: 'text-right' });
        }

        let rows: Record<string, string>[] = [];
        if (options.scope === 'view') {
            if (activeTab === 'sales') {
                rows = (sales.data || []).map((sale: SaleItem) => ({
                    order_number: sale.order_number,
                    date: format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm'),
                    cashier: sale.cashier?.name ?? 'N/A',
                    status: sale.status,
                    total: formatCurrency(sale.total)
                }));
            } else {
                rows = (shifts.data || []).map((s: ShiftItem) => {
                    const opening = Number(s.opening_cash ?? s.opening_balance ?? 0);
                    const expected = Number(s.expected_cash ?? s.expected_balance ?? 0);
                    const actual = s.actual_cash !== null && s.actual_cash !== undefined 
                        ? Number(s.actual_cash) 
                        : (s.closing_balance !== null && s.closing_balance !== undefined ? Number(s.closing_balance) : null);
                    const diff = s.difference !== null && s.difference !== undefined 
                        ? Number(s.difference) 
                        : (s.variance !== null && s.variance !== undefined ? Number(s.variance) : (actual !== null ? actual - expected : null));

                    return {
                        cashier: s.cashier?.name ?? 'N/A',
                        opened_at: s.opened_at ? format(new Date(s.opened_at), 'MMM dd, yyyy HH:mm') : 'N/A',
                        closed_at: s.closed_at ? format(new Date(s.closed_at), 'MMM dd, yyyy HH:mm') : 'Active',
                        opening: formatCurrency(opening),
                        ending: formatCurrency(expected),
                        actual: actual !== null ? formatCurrency(actual) : 'Active',
                        diff: diff !== null ? formatCurrency(diff) : '—',
                    };
                });
            }
        }

        try {
            const res = await axios.post('/reports/export/prepare', {
                reportName: activeTab === 'sales' ? 'Order History Report' : 'My Cash Drawer Report',
                branch: 'Assigned Branch',
                dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'Current Period',
                generatedBy: 'Cashier Member',
                kpis,
                columns,
                rows,
                scope: options.scope,
                orientation: options.orientation,
                paperSize: options.paperSize,
                includeCharts: false,
                chartImage: null,
                activeTab,
                filters: { date_from: dateFrom, date_to: dateTo, cashier_id: cashierId, status }
            });
            
            if (res.data?.token) {
                window.open(`/reports/${options.format}?token=${res.data.token}`, '_blank');
            }
        } catch (err) {
            console.error('Prepared dynamic export failed:', err);
        }
    };

    return (
        <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
            
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-white via-[#FFF5F7]/80 to-[#FADADD]/40 dark:from-[#121218] dark:via-[#161622]/90 dark:to-[#0A0A10] p-6 sm:p-8 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors duration-300 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs">
                                <BarChart3 className="size-3.5" />
                                Cashier Workspace
                            </span>
                            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Live Telemetry</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                            Personalized Register Reports
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Personal sales performance logs and cash drawer shift summaries
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Button 
                            onClick={() => setIsExportOpen(true)}
                            className="h-10 px-4 rounded-2xl bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                        >
                            <Download className="size-4" />
                            <span>Export PDF / Excel</span>
                        </Button>

                        <DateRangePicker from={dateFrom} to={dateTo} onUpdate={(from, to) => {
                            setDateFrom(from);
                            setDateTo(to);
                            router.get('/reports', { 
                                date_from: from, 
                                date_to: to, 
                                cashier_id: cashierId === 'all' ? '' : cashierId,
                                status: status === 'all' ? '' : status 
                            }, { preserveState: true });
                        }} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <KPICard
                        title="Sales Today"
                        value={formatCurrency(today_sales ?? 0)}
                        icon={Zap}
                        trend={today_revenue_delta?.trend || 'up'}
                        trendValue={today_revenue_delta?.formatted_delta || (today_sales > 0 ? '+0.0%' : '0.0%')}
                        comparison={today_revenue_delta?.comparison_label || 'vs yesterday'}
                        sparklineData={[{ value: 40 }, { value: 60 }, { value: 85 }]}
                        badgeText="Live Shift"
                        index={0}
                    />
                    <KPICard
                        title={getPeriodLabel(filters, 'Sales')}
                        value={formatCurrency(total_revenue ?? 0)}
                        icon={DollarSign}
                        trend={revenue_delta?.trend || 'up'}
                        trendValue={revenue_delta?.formatted_delta || (total_revenue > 0 ? '+0.0%' : '0.0%')}
                        comparison={revenue_delta?.comparison_label || 'period total'}
                        sparklineData={[{ value: 30 }, { value: 65 }, { value: 90 }]}
                        badgeText="Gross Sales"
                        index={1}
                    />
                    <KPICard
                        title={getPeriodLabel(filters, 'Orders')}
                        value={(total_orders ?? 0).toLocaleString()}
                        icon={ShoppingBag}
                        trend={orders_delta?.trend || 'neutral'}
                        trendValue={orders_delta?.formatted_delta || '0.0%'}
                        comparison={orders_delta?.comparison_label || 'completed receipts'}
                        sparklineData={[{ value: 20 }, { value: 55 }, { value: 80 }]}
                        badgeText="Fulfillment"
                        index={2}
                    />
                </div>
            </div>

            {/* Controls & Tab Switcher */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-[#121218]/80 p-4 rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    <div className="flex items-center p-1 rounded-2xl bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setActiveTab('sales')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                activeTab === 'sales'
                                    ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E]'
                            )}
                        >
                            <ShoppingBag className="size-3.5" />
                            <span>Order History</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('shifts')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                activeTab === 'shifts'
                                    ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E]'
                            )}
                        >
                            <DollarSign className="size-3.5" />
                            <span>My Cash Drawer</span>
                        </button>
                    </div>

                    <Select value={cashierId} onValueChange={(v) => {
                        setCashierId(v);
                        router.get('/reports', { date_from: dateFrom, date_to: dateTo, cashier_id: v === 'all' ? '' : v, status: v === 'all' ? '' : status }, { preserveState: true });
                    }}>
                        <SelectTrigger className="h-10 w-full lg:w-44 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                            <SelectValue placeholder="Cashier" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                            <SelectItem value="all">All Cashiers</SelectItem>
                            {cashiers.map((c: { id: number; name: string }) => (
                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={status} onValueChange={(v) => {
                        setStatus(v);
                        router.get('/reports', { date_from: dateFrom, date_to: dateTo, cashier_id: cashierId === 'all' ? '' : cashierId, status: v === 'all' ? '' : status }, { preserveState: true });
                    }}>
                        <SelectTrigger className="h-10 w-full lg:w-40 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" onClick={handleReset} className="h-10 px-4 rounded-2xl text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#E75480] dark:hover:text-[#FF4F81] cursor-pointer">
                        <RefreshCw className="size-3.5 mr-1.5" /> Reset Filters
                    </Button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                    <Search className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                    {activeTab === 'sales' ? (
                        <span>Analyzing <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{sales.total || 0}</strong> Orders</span>
                    ) : (
                        <span>Analyzing <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{shifts.total || 0}</strong> Shifts</span>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 p-6 sm:p-7 space-y-5">
                {activeTab === 'sales' ? (
                    <div className="rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 backdrop-blur-md font-black uppercase text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                    <th className="py-3.5 px-5">Order #</th>
                                    <th className="py-3.5 px-5">Date</th>
                                    <th className="py-3.5 px-5">Cashier</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5 text-right">Total Sales</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                                {(sales.data || []).map((sale: SaleItem) => (
                                    <tr key={sale.id} className="hover:bg-[#FFF5F7]/40 dark:hover:bg-white/5 transition-colors">
                                        <td className="py-3.5 px-5 font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">{sale.order_number}</td>
                                        <td className="py-3.5 px-5 font-mono text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">{format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}</td>
                                        <td className="py-3.5 px-5 font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{sale.cashier?.name || 'N/A'}</td>
                                        <td className="py-3.5 px-5">
                                            <Badge className={cn(
                                                'capitalize font-extrabold text-[10px]',
                                                sale.status === 'completed' && 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
                                                sale.status === 'cancelled' && 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50',
                                                sale.status === 'pending' && 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                                            )}>
                                                {sale.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 px-5 text-right font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(sale.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 backdrop-blur-md font-black uppercase text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                    <th className="py-3.5 px-5">Shift ID</th>
                                    <th className="py-3.5 px-5">Opened</th>
                                    <th className="py-3.5 px-5">Closed</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5 text-right">Opening Cash</th>
                                    <th className="py-3.5 px-5 text-right">Cash Sales</th>
                                    <th className="py-3.5 px-5 text-right">Expected Cash</th>
                                    <th className="py-3.5 px-5 text-right">Actual Cash</th>
                                    <th className="py-3.5 px-5 text-right">Variance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                                {(shifts.data || []).map((s: ShiftItem) => {
                                    const opening = Number(s.opening_cash ?? s.opening_balance ?? 0);
                                    const cashSales = Number(s.total_cash_sales ?? 0);
                                    const expected = Number(s.expected_cash ?? s.expected_balance ?? 0);
                                    const actual = s.actual_cash !== null && s.actual_cash !== undefined 
                                        ? Number(s.actual_cash) 
                                        : (s.closing_balance !== null && s.closing_balance !== undefined ? Number(s.closing_balance) : null);
                                    const diff = s.difference !== null && s.difference !== undefined 
                                        ? Number(s.difference) 
                                        : (s.variance !== null && s.variance !== undefined 
                                            ? Number(s.variance) 
                                            : (actual !== null ? actual - expected : null));
                                    const isOpen = s.status === 'open' || !s.closed_at;

                                    return (
                                        <tr key={s.id} className="hover:bg-[#FFF5F7]/40 dark:hover:bg-white/5 transition-colors">
                                            <td className="py-3.5 px-5 font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">#{s.id}</td>
                                            <td className="py-3.5 px-5 font-mono text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">{s.opened_at ? format(new Date(s.opened_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</td>
                                            <td className="py-3.5 px-5 font-mono text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                                {s.closed_at ? format(new Date(s.closed_at), 'MMM dd, yyyy HH:mm') : '—'}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <Badge className={cn(
                                                    'font-bold text-[10px] uppercase',
                                                    isOpen
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                                                )}>
                                                    {isOpen ? 'Active Shift' : 'Closed'}
                                                </Badge>
                                            </td>
                                            <td className="py-3.5 px-5 text-right font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(opening)}</td>
                                            <td className="py-3.5 px-5 text-right font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(cashSales)}</td>
                                            <td className="py-3.5 px-5 text-right font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(expected)}</td>
                                            <td className="py-3.5 px-5 text-right font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {actual !== null ? formatCurrency(actual) : <span className="text-zinc-400 text-[11px] italic">In Progress</span>}
                                            </td>
                                            <td className={cn(
                                                'py-3.5 px-5 text-right font-mono font-black',
                                                diff === null 
                                                    ? 'text-[#7D6B6E] dark:text-[#94A3B8]' 
                                                    : diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                            )}>
                                                {diff !== null ? `${diff >= 0 ? '+' : ''}${formatCurrency(diff)}` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {(() => {
                    const currentPagination = activeTab === 'sales' ? sales : shifts;
                    return (
                        <div className="flex items-center justify-between text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] font-mono pt-1">
                            <span>Showing {currentPagination.from || 0} to {currentPagination.to || 0} of {currentPagination.total || 0} results</span>
                            <div className="flex items-center gap-1">
                                {currentPagination.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={cn('h-8 min-w-8 px-2 text-[10px] rounded-xl border-[#F8C8DC]/60 dark:border-white/10 cursor-pointer', link.active && 'bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent')}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>

            <ExportModal 
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                onExport={triggerExport}
                activeTab={activeTab}
            />
        </div>
    );
}

// ── MAIN EXPORT COMPONENT ──
export default function ReportsIndex(props: AdminReportsProps & CashierReportsProps) {
    const { auth } = usePage().props as unknown as { auth: { user: { role: string } } };
    const isAdmin = auth.user.role === 'admin';

    return (
        <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }]}>
            <Head title="Business Intelligence Reports" />

            {isAdmin ? (
                <AdminReports {...props} />
            ) : (
                <CashierReports {...props} />
            )}
        </AppLayout>
    );
}
