import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format, subDays, parseISO } from 'date-fns';
import { useState, useMemo } from 'react';
import { FiDownload, FiSearch, FiFileText, FiDatabase, FiTrendingUp, FiDollarSign, FiShoppingBag, FiActivity, FiRefreshCw, FiAlertTriangle, FiZap, FiCalendar } from 'react-icons/fi';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
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
const DateRangePicker = ({ from, to, onUpdate }: { from: string, to: string, onUpdate: (from: string, to: string) => void }) => {
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
                <Button variant="outline" className="h-10 px-4 rounded-xl font-bold text-[11px] justify-start gap-3 border-(--ops-border) bg-(--ops-surface-raised) hover:bg-(--ops-hover) min-w-60 text-(--ops-text-secondary) transition-all">
                    <FiCalendar className="size-4 text-primary" />
                    <span className="truncate">{currentLabel}</span>
                    <div className="ml-auto flex items-center gap-2">
                        {from && (
                            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 rounded-2xl border-(--ops-border) bg-(--ops-surface-raised) shadow-2xl overflow-hidden backdrop-blur-xl" align="end">
                <div className="flex flex-col">
                    <div className="p-4 border-b border-(--ops-border-subtle) bg-(--ops-surface-sunken)/20">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted) mb-3">Predefined Periods</p>
                        <div className="grid grid-cols-2 gap-2">
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    onClick={() => handlePreset(preset)}
                                    className="h-9 justify-start px-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-(--ops-hover) text-(--ops-text-secondary) transition-all"
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-5 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Custom Analytics Interval</p>
                        <div className="space-y-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black uppercase text-(--ops-text-muted) px-1">Start Point</label>
                                <Input 
                                    type="date" 
                                    value={from} 
                                    onChange={(e) => onUpdate(e.target.value, to)} 
                                    className="h-10 rounded-xl bg-(--ops-surface-sunken)/40 border-none font-bold text-xs" 
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black uppercase text-(--ops-text-muted) px-1">End Point</label>
                                <Input 
                                    type="date" 
                                    value={to} 
                                    min={from}
                                    onChange={(e) => onUpdate(from, e.target.value)} 
                                    className="h-10 rounded-xl bg-(--ops-surface-sunken)/40 border-none font-bold text-xs" 
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                            <Button variant="ghost" onClick={handleReset} className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-(--ops-text-muted)">
                                Reset
                            </Button>
                            <Button onClick={() => setOpen(false)} className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                Apply
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

// ── CUSTOM RECHARTS TOOLTIP ──
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/90 backdrop-blur-md border border-(--ops-border) shadow-xl rounded-xl p-3 ring-1 ring-black/5 text-(--ops-text-secondary)">
                <p className="text-[10px] font-black uppercase text-(--ops-text-muted) mb-2">{label}</p>
                {payload.map((entry: CustomTooltipItem, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 mt-1">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[11px] font-bold">{entry.name}</span>
                        </div>
                        <span className="text-[11px] font-black tabular-nums">
                            {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
    trendValue?: string;
    colorClass?: string;
}

// ── ADMIN UI STAT CARD ──
function StatCard({ title, value, icon: Icon, trend, trendValue }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden group border border-(--ops-border) bg-(--ops-surface-raised) shadow-lg ring-1 ring-primary/5 hover:ring-primary/40 transition-all duration-300">
            <div className="absolute -top-4 -right-4 size-24 blur-3xl opacity-10" />
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-(--ops-surface-sunken) transition-all duration-300 group-hover:scale-110">
                        <Icon className="size-5 text-primary" />
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter",
                            trend === 'up' ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                        )}>
                            {trend === 'up' ? '↗' : '↘'} {trendValue}
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-(--ops-text-muted) tracking-widest">{title}</p>
                    <h3 className="text-2xl font-black tracking-tight text-foreground tabular-nums">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );
}

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
function ExportModal({ isOpen, onClose, onExport, activeTab }: { isOpen: boolean, onClose: () => void, onExport: (options: ExportOptions) => void, activeTab: 'sales' | 'shifts' }) {
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
            <DialogContent className="sm:max-w-120 rounded-2xl border border-(--ops-border) shadow-2xl overflow-hidden bg-(--ops-surface-raised) text-(--ops-text-secondary)">
                <DialogHeader className="p-6 bg-(--ops-surface-sunken)/40 border-b border-(--ops-border-subtle) pb-4">
                    <DialogTitle className="text-base font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                        <FiDownload className="text-primary size-5 animate-pulse" /> Export Configuration
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-black uppercase text-(--ops-text-muted) tracking-wider">
                        Configure layout boundaries, formatting targets, and data scoping
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    {/* Format */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-(--ops-text-muted) tracking-wider">Target Format</label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                type="button"
                                variant={formatOption === 'pdf' ? 'default' : 'outline'}
                                onClick={() => setFormatOption('pdf')}
                                className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                                <FiFileText className="size-4 mr-2" /> PDF Document
                            </Button>
                            <Button 
                                type="button"
                                variant={formatOption === 'excel' ? 'default' : 'outline'}
                                onClick={() => setFormatOption('excel')}
                                className="h-11 rounded-xl text-xs font-bold gap-2 justify-center"
                            >
                                <FiDatabase className="size-4" /> Excel Sheet (.csv)
                            </Button>
                        </div>
                    </div>

                    {/* Data Scope */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-(--ops-text-muted) tracking-wider">Data Scope</label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                type="button"
                                variant={scope === 'view' ? 'secondary' : 'ghost'}
                                onClick={() => setScope('view')}
                                className="h-9 rounded-xl text-[10px] font-black uppercase tracking-wider"
                            >
                                Current Page ({activeTab === 'sales' ? 'Sales' : 'Shifts'})
                            </Button>
                            <Button 
                                type="button"
                                variant={scope === 'all' ? 'secondary' : 'ghost'}
                                onClick={() => setScope('all')}
                                className="h-9 rounded-xl text-[10px] font-black uppercase tracking-wider"
                            >
                                Full Dataset (Filtered)
                            </Button>
                        </div>
                    </div>

                    {formatOption === 'pdf' && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Orientation */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-(--ops-text-muted) tracking-wider">Orientation</label>
                                <Select value={orientation} onValueChange={(v: 'portrait' | 'landscape') => setOrientation(v)}>
                                    <SelectTrigger className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-(--ops-surface-raised) border border-(--ops-border) text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-(--ops-border) shadow-2xl bg-(--ops-surface-raised) text-foreground">
                                        <SelectItem value="portrait">Portrait</SelectItem>
                                        <SelectItem value="landscape">Landscape</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Paper Size */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-(--ops-text-muted) tracking-wider">Paper Size</label>
                                <Select value={paperSize} onValueChange={(v: 'A4' | 'Letter' | 'Legal') => setPaperSize(v)}>
                                    <SelectTrigger className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-(--ops-surface-raised) border border-(--ops-border) text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-(--ops-border) shadow-2xl bg-(--ops-surface-raised) text-foreground">
                                        <SelectItem value="A4">A4</SelectItem>
                                        <SelectItem value="Letter">Letter</SelectItem>
                                        <SelectItem value="Legal">Legal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Content inclusions */}
                    <div className="space-y-2.5 pt-2 border-t border-(--ops-border-subtle)">
                        <label className="text-[10px] font-black uppercase text-(--ops-text-muted) tracking-wider block">Content Inclusions</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-(--ops-text-secondary) hover:text-foreground">
                                <input 
                                    type="checkbox" 
                                    checked={includedData.kpis} 
                                    onChange={() => setIncludedData(p => ({ ...p, kpis: !p.kpis }))}
                                    className="size-4.5 rounded-lg accent-primary" 
                                />
                                KPI Summaries
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-(--ops-text-secondary) hover:text-foreground">
                                <input 
                                    type="checkbox" 
                                    checked={includedData.table} 
                                    onChange={() => setIncludedData(p => ({ ...p, table: !p.table }))}
                                    className="size-4.5 rounded-lg accent-primary" 
                                />
                                Data Grid
                            </label>
                            {formatOption === 'pdf' && activeTab === 'sales' && (
                                <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-(--ops-text-secondary) hover:text-foreground">
                                    <input 
                                        type="checkbox" 
                                        checked={includedData.charts} 
                                        onChange={() => setIncludedData(p => ({ ...p, charts: !p.charts }))}
                                        className="size-4.5 rounded-lg accent-primary" 
                                    />
                                    Include Charts
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-(--ops-surface-sunken)/40 border-t border-(--ops-border-subtle) flex justify-between gap-3">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={onClose}
                        className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-(--ops-text-muted)"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        onClick={handleExport}
                        className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        Export Now
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
    status: string;
    total: number;
    profit: number;
}

interface ShiftItem {
    id: number;
    cashier?: { name: string };
    opened_at?: string;
    closed_at?: string;
    opening_cash: number;
    expected_cash: number;
    actual_cash: number;
}

interface PaginatedData<T> {
    data: T[];
    from?: number;
    to?: number;
    total?: number;
    links: Array<{ url?: string; label: string; active: boolean }>;
}

interface AdminReportsProps {
    sales: PaginatedData<SaleItem>;
    shifts: PaginatedData<ShiftItem>;
    filters: { date_from?: string; date_to?: string };
    trend_data?: Array<{ date: string; revenue: number; profit: number }>;
    category_data?: Array<{ name: string; value: number }>;
    total_revenue: number;
    total_profit: number;
    total_orders: number;
    cancelled_count: number;
    today_sales: number;
}

// ── ADMIN REPORTS DASHBOARD ──
function AdminReports({ sales, shifts, filters, trend_data, category_data, total_revenue, total_profit, total_orders, cancelled_count, today_sales }: AdminReportsProps) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo,   setDateTo]   = useState(filters.date_to   || '');
    const [activeTab, setActiveTab] = useState<'sales' | 'shifts'>('sales');
    const [isExportOpen, setIsExportOpen] = useState(false);

    const updateRange = (from: string, to: string) => {
        setDateFrom(from);
        setDateTo(to);
        if (from !== dateFrom || to !== dateTo) {
             router.get('/reports', { date_from: from, date_to: to }, { preserveState: true });
        }
    };

    const triggerExport = async (options: ExportOptions) => {
        const kpis = [];
        if (options.includedData.kpis) {
            if (activeTab === 'sales') {
                kpis.push({ title: "Today's Sales", value: formatCurrency(today_sales ?? 0) });
                kpis.push({ title: "Total Revenue", value: formatCurrency(total_revenue ?? 0) });
                kpis.push({ title: "Total Orders", value: (total_orders ?? 0).toLocaleString() });
                kpis.push({ title: "Net Profit", value: formatCurrency(total_profit ?? 0) });
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
            columns.push({ title: 'Status', key: 'status', align: 'text-left' });
            columns.push({ title: 'Total Sales', key: 'total', align: 'text-right' });
            columns.push({ title: 'Net Profit', key: 'profit', align: 'text-right' });
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
                    total: formatCurrency(sale.total),
                    profit: formatCurrency(sale.profit)
                }));
            } else {
                rows = (shifts.data || []).map((s: ShiftItem) => ({
                    cashier: s.cashier?.name ?? 'N/A',
                    opened_at: s.opened_at ? format(new Date(s.opened_at), 'MMM dd, yyyy HH:mm') : 'N/A',
                    closed_at: s.closed_at ? format(new Date(s.closed_at), 'MMM dd, yyyy HH:mm') : 'Active',
                    opening: formatCurrency(s.opening_cash),
                    ending: formatCurrency(s.expected_cash),
                    actual: formatCurrency(s.actual_cash),
                    diff: formatCurrency(s.actual_cash - s.expected_cash)
                }));
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

    const TREND_DATA = trend_data    || [];
    const CAT_DATA   = category_data || [];
    const hasChart = TREND_DATA.length > 0;

    return (
        <div className="p-6 lg:p-8 space-y-10 bg-background min-h-[calc(100vh-64px)] text-(--ops-text-secondary)">
            {/* 1. INSIGHT HEADER */}
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 border-b border-(--ops-border) pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <FiActivity className="size-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter italic uppercase text-foreground">Business Overview</h1>
                    </div>
                    <p className="text-(--ops-text-muted) font-bold uppercase text-[10px] tracking-[0.3em] mt-3">
                        {filters.date_from && filters.date_to
                            ? `${filters.date_from} → ${filters.date_to}`
                            : 'Real-time performance summary'}
                    </p>
                </div>

                <div className="flex flex-col items-center xl:items-end gap-3 w-full xl:w-auto">
                    <div className="flex flex-wrap items-center justify-center xl:justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsExportOpen(true)} className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest border-(--ops-border) bg-(--ops-surface-raised) hover:bg-(--ops-hover) text-(--ops-text-secondary)">
                            <FiDownload className="size-3.5 mr-2 text-primary" /> Configure Export
                        </Button>
                        <div className="h-4 w-px bg-border/45 mx-1 hidden sm:block" />
                        <DateRangePicker from={dateFrom} to={dateTo} onUpdate={updateRange} />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1 bg-(--ops-surface-sunken) rounded-2xl border border-(--ops-border-subtle) w-fit">
                <Button 
                    variant={activeTab === 'sales' ? 'default' : 'ghost'} 
                    onClick={() => setActiveTab('sales')}
                    className="h-10 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest transition-all"
                >
                    <FiShoppingBag className="size-3.5 mr-2" /> Sales Performance
                </Button>
                <Button 
                    variant={activeTab === 'shifts' ? 'default' : 'ghost'} 
                    onClick={() => setActiveTab('shifts')}
                    className="h-10 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest transition-all"
                >
                    <FiDollarSign className="size-3.5 mr-2" /> Cash Drawer Log
                </Button>
            </div>

            {activeTab === 'sales' ? (
                <>
                {/* 2. PERFORMANCE OVERVIEW — real KPIs */}
                <div className="space-y-5">
                    <h2 className="text-lg font-black italic uppercase tracking-tighter text-foreground/80 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" /> Performance Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <StatCard
                            title="Today's Sales"
                            value={formatCurrency(today_sales ?? 0)}
                            icon={FiZap}
                            colorClass="bg-primary"
                        />
                        <StatCard
                            title={getPeriodLabel(filters, 'Sales')}
                            value={formatCurrency(total_revenue ?? 0)}
                            icon={FiDollarSign}
                            colorClass="bg-indigo-500"
                        />
                        <StatCard
                            title={getPeriodLabel(filters, 'Orders')}
                            value={(total_orders ?? 0).toLocaleString()}
                            icon={FiShoppingBag}
                            colorClass="bg-emerald-500"
                        />
                        <StatCard
                            title="Net Profit"
                            value={formatCurrency(total_profit ?? 0)}
                            icon={FiTrendingUp}
                            colorClass="bg-amber-500"
                        />
                        <StatCard
                            title="Cancelled"
                            value={(cancelled_count ?? 0).toLocaleString()}
                            icon={FiAlertTriangle}
                            trend={(cancelled_count ?? 0) > 5 ? 'down' : 'up'}
                            trendValue={(cancelled_count ?? 0) > 5 ? 'High' : 'Low'}
                            colorClass="bg-rose-500"
                        />
                    </div>
                </div>

                {/* 3. CHARTS GRID */}
                {hasChart ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-2 border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl shadow-lg">
                            <CardHeader className="border-b border-(--ops-border-subtle) pb-4">
                                <CardTitle className="text-base font-black uppercase text-foreground">Revenue & Profit Trajectory</CardTitle>
                                <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted)">Walk-forward performance trajectory mapping</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#E1062C" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#E1062C" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                                            <XAxis dataKey="date" fontSize={9} stroke="currentColor" className="text-(--ops-text-muted) font-black" axisLine={false} tickLine={false} />
                                            <YAxis fontSize={9} stroke="currentColor" className="text-(--ops-text-muted) font-black font-mono" axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v}`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="Revenue" stroke="#E1062C" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                            <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} fill="none" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl shadow-lg">
                            <CardHeader className="border-b border-(--ops-border-subtle) pb-4">
                                <CardTitle className="text-base font-black uppercase text-foreground">Category Proportions</CardTitle>
                                <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted)">Sales volume distribution by item type</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 flex flex-col items-center justify-center">
                                <div className="h-50 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={CAT_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                                                {CAT_DATA.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#E1062C', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][index % 6]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full mt-4 text-[10px] font-bold">
                                    {CAT_DATA.map((entry, index) => (
                                        <div key={entry.name} className="flex items-center gap-1.5 truncate">
                                            <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: ['#E1062C', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][index % 6] }} />
                                            <span className="truncate text-foreground/80">{entry.name} ({entry.value}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                {/* 4. SALES DATA TABLE */}
                <div className="space-y-4">
                    <h2 className="text-lg font-black italic uppercase tracking-tighter text-foreground/80 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" /> Transaction Registry
                    </h2>
                    <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-lg">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-(--ops-border-subtle) bg-(--ops-thead-bg)">
                                            <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Order #</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Date</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Cashier</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Status</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted) text-right">Total Sales</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted) text-right">Net Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--ops-border-subtle)">
                                        {sales.data.map((sale: SaleItem) => (
                                            <tr key={sale.id} className="hover:bg-(--ops-surface-sunken)/20 transition-colors">
                                                <td className="p-4 font-bold text-sm text-foreground">{sale.order_number}</td>
                                                <td className="p-4 text-xs text-(--ops-text-muted)">
                                                    {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                                            {sale.cashier?.name?.charAt(0)}
                                                        </div>
                                                        <span>{sale.cashier?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className={cn(
                                                        "capitalize text-[9px] font-black tracking-wider rounded-md",
                                                        sale.status === 'completed' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                        sale.status === 'cancelled' && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                                                        sale.status === 'pending' && "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    )}>
                                                        {sale.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right font-black font-mono text-sm text-foreground">
                                                    {formatCurrency(sale.total)}
                                                </td>
                                                <td className="p-4 text-right font-black font-mono text-sm text-emerald-500">
                                                    {formatCurrency(sale.profit)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-(--ops-border-subtle) bg-(--ops-surface-sunken)/30 flex justify-between items-center flex-wrap gap-3">
                                <p className="text-[10px] font-bold text-(--ops-text-muted)">Showing {sales.from} to {sales.to} of {sales.total} results</p>
                                <div className="flex gap-1">
                                    {sales.links.map((link: { url?: string; label: string; active: boolean }, i: number) => (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className="h-8 min-w-8 px-2 text-[10px]"
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                </>
            ) : (
                <ShiftHistory shifts={shifts} />
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

// ── ADMIN SHIFTS GRID COMPONENT ──
function ShiftHistory({ shifts }: { shifts: PaginatedData<ShiftItem> }) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-black italic uppercase tracking-tighter text-foreground/80 flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary" /> Drawer Log History
            </h2>
            <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-(--ops-border-subtle) bg-(--ops-thead-bg)">
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Cashier</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Opened</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Closed</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted) text-right">Opening Cash</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted) text-right">Expected Cash</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted) text-right">Actual Cash</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted) text-right">Difference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--ops-border-subtle)">
                                {shifts.data.map((s: ShiftItem) => {
                                    const diff = s.actual_cash - s.expected_cash;
                                    return (
                                        <tr key={s.id} className="hover:bg-(--ops-surface-sunken)/20 transition-colors">
                                            <td className="p-4 font-bold text-foreground">{s.cashier?.name}</td>
                                            <td className="p-4 text-(--ops-text-muted)">{s.opened_at ? format(new Date(s.opened_at), 'MMM dd, HH:mm') : 'N/A'}</td>
                                            <td className="p-4 text-(--ops-text-muted)">
                                                {s.closed_at ? format(new Date(s.closed_at), 'MMM dd, HH:mm') : <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[7px] font-black rounded-md">Active</Badge>}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-foreground">{formatCurrency(s.opening_cash)}</td>
                                            <td className="p-4 text-right font-mono font-bold text-foreground">{formatCurrency(s.expected_cash)}</td>
                                            <td className="p-4 text-right font-mono font-bold text-foreground">{formatCurrency(s.actual_cash)}</td>
                                            <td className={cn("p-4 text-right font-mono font-black", diff >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-(--ops-border-subtle) bg-(--ops-surface-sunken)/30 flex justify-between items-center flex-wrap gap-3">
                        <p className="text-[10px] font-bold text-(--ops-text-muted)">Showing {shifts.from} to {shifts.to} of {shifts.total} results</p>
                        <div className="flex gap-1">
                            {shifts.links.map((link: { url?: string; label: string; active: boolean }, i: number) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className="h-8 min-w-8 px-2 text-[10px]"
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
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
}

// ── ORIGINAL CASHIER REPORTS ──
function CashierReports({ sales, shifts, cashiers = [], filters, today_sales, total_revenue, total_orders }: CashierReportsProps) {
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
                rows = (shifts.data || []).map((s: ShiftItem) => ({
                    cashier: s.cashier?.name ?? 'N/A',
                    opened_at: s.opened_at ? format(new Date(s.opened_at), 'MMM dd, yyyy HH:mm') : 'N/A',
                    closed_at: s.closed_at ? format(new Date(s.closed_at), 'MMM dd, yyyy HH:mm') : 'Active',
                    opening: formatCurrency(s.opening_cash),
                    ending: formatCurrency(s.expected_cash),
                    actual: formatCurrency(s.actual_cash),
                    diff: formatCurrency(s.actual_cash - s.expected_cash)
                }));
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
        <div className="p-6 lg:p-8 space-y-10 bg-background min-h-[calc(100vh-64px)] text-(--ops-text-secondary)">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 border-b border-(--ops-border) pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <FiActivity className="size-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter italic uppercase text-foreground">Business Overview</h1>
                    </div>
                    <p className="text-(--ops-text-muted) font-bold uppercase text-[10px] tracking-[0.3em] mt-3">
                        {filters.date_from && filters.date_to
                            ? `${filters.date_from} → ${filters.date_to}`
                            : 'Personalized Sales Report'}
                    </p>
                </div>

                <div className="flex flex-col items-center xl:items-end gap-3 w-full xl:w-auto">
                    <div className="flex flex-wrap items-center justify-center xl:justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsExportOpen(true)} className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest border-(--ops-border) bg-(--ops-surface-raised) hover:bg-(--ops-hover) text-(--ops-text-secondary)">
                            <FiDownload className="size-3.5 mr-2 text-primary" /> Configure Export
                        </Button>
                        <div className="h-4 w-px bg-border/45 mx-1 hidden sm:block" />
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
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1 bg-(--ops-surface-sunken) rounded-2xl border border-(--ops-border-subtle) w-fit">
                <Button 
                    variant={activeTab === 'sales' ? 'default' : 'ghost'} 
                    onClick={() => setActiveTab('sales')}
                    className="h-10 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest transition-all"
                >
                    <FiShoppingBag className="size-3.5 mr-2" /> Order History
                </Button>
                <Button 
                    variant={activeTab === 'shifts' ? 'default' : 'ghost'} 
                    onClick={() => setActiveTab('shifts')}
                    className="h-10 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest transition-all"
                >
                    <FiDollarSign className="size-3.5 mr-2" /> My Cash Drawer
                </Button>
            </div>

            {activeTab === 'sales' ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Sales Today"
                        value={formatCurrency(today_sales ?? 0)}
                        icon={FiZap}
                        colorClass="bg-primary"
                    />
                    <StatCard
                        title={getPeriodLabel(filters, 'Sales')}
                        value={formatCurrency(total_revenue ?? 0)}
                        icon={FiDollarSign}
                        colorClass="bg-emerald-500"
                    />
                    <StatCard
                        title={getPeriodLabel(filters, 'Orders')}
                        value={(total_orders ?? 0).toLocaleString()}
                        icon={FiShoppingBag}
                        colorClass="bg-indigo-500"
                    />
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-(--ops-surface-sunken)/20 p-2 rounded-2xl ring-1 ring-(--ops-border)">
                    <div className="flex flex-wrap items-center gap-2 flex-1 w-full lg:w-auto">
                        <Select value={cashierId} onValueChange={(v) => {
                            setCashierId(v);
                            router.get('/reports', { date_from: dateFrom, date_to: dateTo, cashier_id: v === 'all' ? '' : v, status: status === 'all' ? '' : status }, { preserveState: true });
                        }}>
                            <SelectTrigger className="h-11 w-full lg:w-45 rounded-xl bg-background border-none ring-1 ring-border/40 font-bold text-[10px] uppercase tracking-widest">
                                <SelectValue placeholder="Cashier" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="all">All Cashiers</SelectItem>
                                {cashiers.map((c: { id: number; name: string }) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={status} onValueChange={(v) => {
                            setStatus(v);
                            router.get('/reports', { date_from: dateFrom, date_to: dateTo, cashier_id: cashierId === 'all' ? '' : cashierId, status: v === 'all' ? '' : v }, { preserveState: true });
                        }}>
                            <SelectTrigger className="h-11 w-full lg:w-40 rounded-xl bg-background border-none ring-1 ring-border/40 font-bold text-[10px] uppercase tracking-widest">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="preparing">Preparing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="ghost" onClick={handleReset} className="h-11 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-(--ops-text-muted) hover:text-primary transition-all">
                            <FiRefreshCw className="size-3.5 mr-2" /> Reset
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-(--ops-text-muted) bg-background/50 px-4 py-2.5 rounded-xl ring-1 ring-border/20">
                        <FiSearch className="size-3 text-primary" />
                        <span>Analyzing <span className="text-foreground">{sales.total}</span> Orders</span>
                    </div>
                </div>

                <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-2xl overflow-hidden shadow-lg">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-(--ops-border-subtle) bg-(--ops-thead-bg)">
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Order #</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Date</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Cashier</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Status</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-(--ops-text-muted) text-right">Total Sales</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--ops-border-subtle)">
                                    {sales.data.map((sale: SaleItem) => (
                                        <tr key={sale.id} className="hover:bg-(--ops-surface-sunken)/20 transition-colors">
                                            <td className="p-4 font-bold text-sm text-foreground">{sale.order_number}</td>
                                            <td className="p-4 text-xs text-(--ops-text-muted)">
                                                {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                                        {sale.cashier?.name?.charAt(0)}
                                                    </div>
                                                    <span>{sale.cashier?.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={cn(
                                                    "capitalize text-[9px] font-black tracking-wider rounded-md",
                                                    sale.status === 'completed' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                    sale.status === 'cancelled' && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                                                    sale.status === 'pending' && "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                )}>
                                                    {sale.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right font-black font-mono text-sm text-foreground">
                                                {formatCurrency(sale.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-(--ops-border-subtle) bg-(--ops-surface-sunken)/30 flex justify-between items-center flex-wrap gap-3">
                            <p className="text-[10px] font-bold text-(--ops-text-muted)">Showing {sales.from} to {sales.to} of {sales.total} results</p>
                            <div className="flex gap-1">
                                {sales.links.map((link: { url?: string; label: string; active: boolean }, i: number) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="h-8 min-w-8 px-2 text-[10px]"
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </>
            ) : (
                <ShiftHistory shifts={shifts} />
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

// ── MAIN EXPORT COMPONENT ──
export default function ReportsIndex(props: AdminReportsProps & CashierReportsProps) {
    const { auth } = usePage().props as unknown as { auth: { user: { role: string } } };
    const isAdmin = auth.user.role === 'admin';

    return (
        <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }]}>
            <Head title="Sales Reports" />

            {isAdmin ? (
                <AdminReports {...props} />
            ) : (
                <CashierReports {...props} />
            )}
        </AppLayout>
    );
}
