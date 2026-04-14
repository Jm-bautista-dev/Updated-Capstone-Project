import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiFilter, FiDownload, FiSearch, FiFileText, FiDatabase, FiTrendingUp, FiDollarSign, FiShoppingBag, FiActivity, FiRefreshCw, FiAlertTriangle, FiZap } from 'react-icons/fi';
import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}

// ── CUSTOM RECHARTS TOOLTIP ──
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/90 backdrop-blur-md border border-border shadow-xl rounded-xl p-3 ring-1 ring-black/5">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 mt-1">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[11px] font-bold text-foreground/80">{entry.name}</span>
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

// ── ADMIN UI STAT CARD ──
function StatCard({ title, value, icon: Icon, trend, trendValue, colorClass }: any) {
  return (
    <Card className="relative overflow-hidden group border-none shadow-sm ring-1 ring-border bg-card hover:ring-primary/40 transition-all duration-300">
      <div className={cn("absolute -top-4 -right-4 size-24 blur-3xl opacity-10", colorClass)} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-xl bg-muted transition-all duration-300 group-hover:scale-110", colorClass.replace('bg-', 'text-'))}>
            <Icon className="size-5" />
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
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
          <h3 className="text-2xl font-black tracking-tight text-foreground dark:text-white tabular-nums">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

// ── ADMIN REPORTS DASHBOARD ──
function AdminReports({ sales, cashiers, filters }: any) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get('/reports', {
            date_from: dateFrom,
            date_to: dateTo,
        }, { preserveState: true });
    };

    const handleExport = (type: 'pdf' | 'excel') => {
        const params = new URLSearchParams({
            date_from: dateFrom,
            date_to: dateTo,
        }).toString();
        window.open(`/reports/${type}?${params}`, '_blank');
    };

    // Calculate dynamic stats from current page data (mock logic for UX)
    const pageRevenue = sales.data.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    
    // MOCK DATA FOR VISUALIZATIONS
    const TREND_DATA = [
      { date: 'Apr 01', Revenue: 45000 },
      { date: 'Apr 02', Revenue: 52000 },
      { date: 'Apr 03', Revenue: 48000 },
      { date: 'Apr 04', Revenue: 61000 },
      { date: 'Apr 05', Revenue: 55000 },
      { date: 'Apr 06', Revenue: 67000 },
      { date: 'Apr 07', Revenue: 73380 },
    ];

    const CAT_DATA = [
      { name: 'Ramen', value: 45, color: '#6366f1' },
      { name: 'Sushi', value: 25, color: '#10b981' },
      { name: 'Beverages', value: 20, color: '#f59e0b' },
      { name: 'Sides', value: 10, color: '#ec4899' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-10 bg-background dark:bg-zinc-950 min-h-[calc(100vh-64px)]">
            {/* 1. 📊 INSIGHT HEADER */}
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 border-b border-border/40 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <FiActivity className="size-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter italic uppercase text-foreground dark:text-white">Business Intelligence</h1>
                    </div>
                    <p className="text-muted-foreground dark:text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">
                        Executive analytics overview of sales and system performance
                    </p>
                </div>
                
                <div className="flex flex-col items-center xl:items-end gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => handleExport('pdf')} className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest border-border/50 hover:bg-muted">
                            <FiFileText className="size-3.5 mr-2" /> PDF
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('excel')} className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest border-border/50 hover:bg-muted">
                            <FiDatabase className="size-3.5 mr-2" /> Excel
                        </Button>
                        <Button className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-primary/20 gap-2 px-6">
                            <FiRefreshCw className="size-3.5" /> Sync Intel
                        </Button>
                    </div>

                    {/* GLOBAL DATE RANGE FILTER */}
                    <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50 w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-32">
                           <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-full rounded-lg text-[10px] font-bold uppercase bg-background border-none shadow-sm pb-0!" />
                        </div>
                        <span className="text-muted-foreground/40 text-[10px] font-black">-</span>
                        <div className="relative flex-1 xl:w-32">
                           <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-full rounded-lg text-[10px] font-bold uppercase bg-background border-none shadow-sm pb-0!" />
                        </div>
                        <Button onClick={handleFilter} variant="secondary" className="h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest"><FiFilter className="size-3 mr-2" /> Apply</Button>
                    </div>
                </div>
            </div>

            {/* 2. 📈 PERFORMANCE OVERVIEW */}
            <div className="space-y-5">
                <h2 className="text-lg font-black italic uppercase tracking-tighter text-foreground/80 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary" /> Performance Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Current Frame Inflow" 
                        value={formatCurrency(pageRevenue || 125430)} 
                        icon={FiDollarSign} 
                        trend="up" 
                        trendValue="12.5%" 
                        colorClass="bg-indigo-500" 
                    />
                    <StatCard 
                        title="Transaction Volume" 
                        value={sales?.total || 0} 
                        icon={FiShoppingBag} 
                        trend="up" 
                        trendValue="4.2%" 
                        colorClass="bg-emerald-500" 
                    />
                    <StatCard 
                        title="Active Operators" 
                        value={cashiers?.length || 0} 
                        icon={FiTrendingUp} 
                        colorClass="bg-amber-500" 
                    />
                    <StatCard 
                        title="System Exceptions" 
                        value={sales?.data?.filter((s:any) => s.status === 'cancelled').length || 0} 
                        icon={FiAlertTriangle} 
                        trend={sales?.data?.filter((s:any) => s.status === 'cancelled').length > 5 ? 'down' : 'up'} 
                        trendValue="Notice" 
                        colorClass="bg-rose-500" 
                    />
                </div>
            </div>

            {/* 3. 📉 SALES ANALYTICS */}
            <div className="space-y-5">
                <h2 className="text-lg font-black italic uppercase tracking-tighter text-foreground/80 flex items-center gap-2 mt-2">
                    <span className="size-2 rounded-full bg-indigo-500" /> Sales Analytics
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <Card className="xl:col-span-8 border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 overflow-hidden group h-[400px]">
                        <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                                    Revenue Growth Vector
                                </CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">7-Day Trajectory</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 h-[320px]">
                                <ResponsiveContainer width="100%" height="85%">
                                    <AreaChart data={TREND_DATA} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                                        <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground dark:text-zinc-600" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} tickMargin={10} />
                                        <YAxis stroke="currentColor" className="text-muted-foreground dark:text-zinc-600" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v/1000}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-4 border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 flex flex-col h-[400px]">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Market Share</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Category Dispersion</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-6 pt-0">
                            <div className="h-[200px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={CAT_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none">
                                            {CAT_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
                                {CAT_DATA.map((cat) => (
                                    <div key={cat.name} className="flex justify-between items-center group">
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{cat.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black tabular-nums">{cat.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 4. 🧠 BUSINESS INSIGHTS */}
            <div className="space-y-5">
                <h2 className="text-lg font-black italic uppercase tracking-tighter text-foreground/80 flex items-center gap-2 mt-2">
                    <span className="size-2 rounded-full bg-amber-500" /> Business Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-muted/30 dark:bg-zinc-900/40 p-5 rounded-3xl border border-border/40 flex items-center justify-between group hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="size-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                  <FiZap className="size-5" />
                              </div>
                              <div>
                                  <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-tighter leading-none mb-1.5">Top Performer</p>
                                  <p className="text-sm font-black italic uppercase text-foreground dark:text-zinc-200 tracking-tighter leading-none">Spicy Ramen</p>
                              </div>
                          </div>
                          <div className="bg-background rounded-xl px-3 py-2 border shadow-sm">
                              <p className="text-[10px] font-black tabular-nums text-amber-600">342 Units</p>
                          </div>
                     </div>
                     <div className="bg-muted/30 dark:bg-zinc-900/40 p-5 rounded-3xl border border-border/40 flex items-center justify-between group hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                  <FiTrendingUp className="size-5" />
                              </div>
                              <div>
                                  <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-tighter leading-none mb-1.5">Peak Revenue Day</p>
                                  <p className="text-sm font-black italic uppercase text-foreground dark:text-zinc-200 tracking-tighter leading-none">Friday, Apr 05</p>
                              </div>
                          </div>
                          <div className="bg-background rounded-xl px-3 py-2 border shadow-sm">
                              <p className="text-[10px] font-black tabular-nums text-emerald-600">₱85.2k</p>
                          </div>
                     </div>
                     <div className="bg-muted/30 dark:bg-zinc-900/40 p-5 rounded-3xl border border-border/40 flex items-center justify-between group hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="size-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                                  <FiAlertTriangle className="size-5" />
                              </div>
                              <div>
                                  <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-tighter leading-none mb-1.5">Risk Factor</p>
                                  <p className="text-sm font-black italic uppercase text-foreground dark:text-zinc-200 tracking-tighter leading-none">Cancellation Spike</p>
                              </div>
                          </div>
                          <div className="bg-background rounded-xl px-3 py-2 border shadow-sm">
                              <p className="text-[10px] font-black tabular-nums text-rose-600">Monitor</p>
                          </div>
                     </div>
                </div>
            </div>
        </div>
    );
}

// ── ORIGINAL CASHIER REPORTS ──
function CashierReports({ sales, cashiers, filters }: any) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [cashierId, setCashierId] = useState(filters.cashier_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleFilter = () => {
        router.get('/reports', {
            date_from: dateFrom,
            date_to: dateTo,
            cashier_id: cashierId === 'all' ? '' : cashierId,
            status: status === 'all' ? '' : status,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setDateFrom('');
        setDateTo('');
        setCashierId('all');
        setStatus('all');
        router.get('/reports');
    };

    const handleExport = (type: 'pdf' | 'excel') => {
        const params = new URLSearchParams({
            date_from: dateFrom,
            date_to: dateTo,
            cashier_id: cashierId === 'all' ? '' : cashierId,
            status: status === 'all' ? '' : status,
        }).toString();
        window.open(`/reports/${type}?${params}`, '_blank');
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sales Reports</h1>
                    <p className="text-muted-foreground">Monitor performance and export detailed sales data.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('pdf')} className="gap-2">
                        <FiFileText /> Export PDF
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('excel')} className="gap-2">
                        <FiDatabase /> Export Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date From</label>
                            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date To</label>
                            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cashier</label>
                            <Select value={cashierId} onValueChange={setCashierId}>
                                <SelectTrigger className="h-10 rounded-xl">
                                    <SelectValue placeholder="All Cashiers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Cashiers</SelectItem>
                                    {cashiers.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-10 rounded-xl">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="preparing">Preparing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleFilter} className="flex-1 h-10 rounded-xl gap-2 font-bold">
                                <FiFilter className="size-4" /> Filter
                            </Button>
                            <Button variant="outline" onClick={handleReset} className="h-10 rounded-xl px-3">
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sales Table */}
            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Order #</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Date</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Cashier</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Revenue</th>
                                    <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.data.map((sale: any) => (
                                    <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                        <td className="p-4">
                                            <span className="font-bold text-sm tracking-tight">{sale.order_number}</span>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {sale.cashier?.name?.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium">{sale.cashier?.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={cn(
                                                "capitalize",
                                                sale.status === 'completed' && "bg-green-50 text-green-700 border-green-200",
                                                sale.status === 'cancelled' && "bg-red-50 text-red-700 border-red-200",
                                                sale.status === 'pending' && "bg-amber-50 text-amber-700 border-amber-200",
                                            )}>
                                                {sale.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right font-bold text-sm">
                                            {formatCurrency(sale.total)}
                                        </td>
                                        <td className="p-4 text-right font-bold text-sm text-green-600">
                                            {formatCurrency(sale.profit)}
                                        </td>
                                    </tr>
                                ))}
                                {sales.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                            No sales found for the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">Showing {sales.from} to {sales.to} of {sales.total} results</p>
                        <div className="flex gap-1">
                            {sales.links.map((link: any, i: number) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className="h-8 min-w-[32px] px-2 text-[10px]"
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ── MAIN EXPORT COMPONENT ──
export default function ReportsIndex(props: any) {
    const { auth } = usePage().props as any;
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
