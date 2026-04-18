import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiTrendingUp,
  FiDollarSign,
  FiShoppingBag,
  FiAlertTriangle,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiPieChart,
  FiBarChart2,
  FiActivity,
  FiSearch,
  FiArrowUpRight,
  FiArrowDownRight,
  FiLayers,
  FiMapPin,
  FiRefreshCw
} from 'react-icons/fi';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
];

// --- DUMMY DATA FOR UI VISUALIZATION ---
const SALES_MOCK = [
  { date: '2024-04-01', revenue: 45000, orders: 120 },
  { date: '2024-04-02', revenue: 52000, orders: 154 },
  { date: '2024-04-03', revenue: 48000, orders: 110 },
  { date: '2024-04-04', revenue: 61000, orders: 165 },
  { date: '2024-04-05', revenue: 55000, orders: 140 },
  { date: '2024-04-06', revenue: 67000, orders: 180 },
  { date: '2024-04-07', revenue: 73380, orders: 204 },
];

const CATEGORY_MOCK = [
  { name: 'Ramen', value: 45, color: '#6366f1' },
  { name: 'Sushi', value: 25, color: '#10b981' },
  { name: 'Beverages', value: 20, color: '#f59e0b' },
  { name: 'Sides', value: 10, color: '#ec4899' },
];

const RECENT_HISTORY_MOCK = [
  { id: 1, timestamp: '2024-04-14 10:24 AM', item: 'Premium Tonkotsu', qty: 2, unit: 'pcs', value: 760, status: 'Completed' },
  { id: 2, timestamp: '2024-04-14 10:30 AM', item: 'Spicy Salmon Roll', qty: 1, unit: 'pcs', value: 320, status: 'Completed' },
  { id: 3, timestamp: '2024-04-14 10:45 AM', item: 'Green Tea (Pot)', qty: 1, unit: 'pcs', value: 150, status: 'Completed' },
  { id: 4, timestamp: '2024-04-14 11:05 AM', item: 'Miso Soup', qty: 3, unit: 'pcs', value: 270, status: 'Refunded' },
  { id: 5, timestamp: '2024-04-14 11:15 AM', item: 'Gyoza (6pcs)', qty: 2, unit: 'pcs', value: 360, status: 'Completed' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

// --- Stat Card Component ---
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
              {trend === 'up' ? <FiArrowUpRight className="size-3" /> : <FiArrowDownRight className="size-3" />}
              {trendValue}
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

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'sales', label: 'Sales Reports', icon: FiBarChart2 },
    { id: 'inventory', label: 'Inventory Reports', icon: FiLayers },
    { id: 'activity', label: 'Activity Logs', icon: FiRefreshCw },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Maki Desu Reports Intelligence" />
      
      <div className="p-6 lg:p-8 space-y-8 bg-background dark:bg-zinc-950 min-h-[calc(100vh-64px)]">
        
        {/* ── Header Section ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <FiBarChart2 className="size-6" />
                 </div>
                 <h1 className="text-4xl font-black tracking-tighter italic uppercase text-foreground dark:text-white">Reports</h1>
              </div>
              <p className="text-muted-foreground dark:text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">
                Analytics overview of sales, inventory, and system performance
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Button variant="outline" className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest italic border-border/50 transition-all hover:bg-muted">
                 <FiDownload className="size-4 mr-2" /> Export Data
              </Button>
              <Button className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-primary/20">
                 <FiRefreshCw className="size-4 mr-2" /> Sync Intelligence
              </Button>
           </div>
        </div>

        {/* ── KPI Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Gross Sales Inflow" 
              value={formatCurrency(73380.50)} 
              icon={FiDollarSign} 
              trend="up" 
              trendValue="+12.5%" 
              colorClass="bg-indigo-500" 
            />
            <StatCard 
              title="Transaction Velocity" 
              value="204" 
              icon={FiShoppingBag} 
              trend="up" 
              trendValue="+8.2%" 
              colorClass="bg-emerald-500" 
            />
            <StatCard 
              title="Peak Commodity" 
              value="Tonkotsu" 
              icon={FiTrendingUp} 
              colorClass="bg-amber-500" 
            />
            <StatCard 
              title="Network Alerts" 
              value="12" 
              icon={FiAlertTriangle} 
              trend="down" 
              trendValue="Safe" 
              colorClass="bg-rose-500" 
            />
        </div>

        {/* ── Tabbed Navigation (UI Only) ── */}
        <div className="flex flex-wrap items-center gap-1 bg-muted/30 p-1.5 rounded-2xl w-fit ring-1 ring-border/40 backdrop-blur-sm">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest italic transition-all duration-300",
                 activeTab === tab.id 
                  ? "text-white shadow-xl" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
               )}
             >
               {activeTab === tab.id && (
                 <motion.div
                   layoutId="active-tab"
                   className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/30"
                   transition={{ type: "spring", stiffness: 380, damping: 30 }}
                 />
               )}
               <tab.icon className="size-3.5" />
               {tab.label}
             </button>
           ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                 <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Area Chart */}
                    <Card className="xl:col-span-8 border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between p-8">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                                  Growth Trajectory
                                </CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Revenue Performance Vector</CardDescription>
                            </div>
                            <Select defaultValue="7d">
                                <SelectTrigger className="w-32 h-9 bg-muted/50 border-none ring-1 ring-border rounded-xl text-[10px] font-black uppercase italic">
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border">
                                   <SelectItem value="24h" className="text-[10px] font-bold py-2">Last 24h</SelectItem>
                                   <SelectItem value="7d" className="text-[10px] font-bold py-2">Standard 7D</SelectItem>
                                   <SelectItem value="30d" className="text-[10px] font-bold py-2">Monthly 30D</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent className="p-0">
                             <div className="h-[380px] w-full px-6 pb-6">
                                <ResponsiveContainer width="99%" height="100%">
                                    <AreaChart data={SALES_MOCK} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis stroke="currentColor" className="text-muted-foreground/40" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v/1000}k`} />
                                        <Tooltip 
                                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={2000} />
                                    </AreaChart>
                                </ResponsiveContainer>
                             </div>
                        </CardContent>
                    </Card>

                    {/* Donut Chart */}
                    <Card className="xl:col-span-4 border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 flex flex-col h-full">
                         <CardHeader className="p-8">
                            <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Market Share</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Category Distribution</CardDescription>
                         </CardHeader>
                         <CardContent className="flex-1 flex flex-col items-center justify-center pb-8 pt-0">
                             <div className="h-[240px] w-full relative">
                                <ResponsiveContainer width="99%" height="100%">
                                    <PieChart>
                                        <Pie data={CATEGORY_MOCK} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                                            {CATEGORY_MOCK.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total</p>
                                    <p className="text-xl font-black italic text-foreground leading-none">100%</p>
                                </div>
                             </div>
                             <div className="w-full space-y-3 mt-6">
                                {CATEGORY_MOCK.map((cat) => (
                                    <div key={cat.name} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-2">
                                            <div className="size-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{cat.name}</span>
                                        </div>
                                        <span className="text-[11px] font-black tabular-nums">{cat.value}%</span>
                                    </div>
                                ))}
                             </div>
                         </CardContent>
                    </Card>
                 </div>

                 {/* Table Block */}
                 <Card className="border-none shadow-sm ring-1 ring-border bg-card dark:bg-zinc-900/50 overflow-hidden">
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-muted/20 dark:bg-black/20 border-b border-border/40 gap-6">
                        <div className="space-y-1">
                           <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Terminal Stream</CardTitle>
                           <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Real-time Sale Events</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-11 bg-card dark:bg-zinc-800/50 border-none ring-1 ring-border rounded-xl text-[10px] font-bold uppercase" />
                            </div>
                            <Button variant="outline" className="h-11 w-11 p-0 rounded-xl border-border"><FiFilter className="size-4" /></Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/30 dark:bg-black/40 border-b border-border/40">
                                    <tr>
                                        {['Timestamp', 'Item Specification', 'Qty', 'Scale', 'Vector (Value)', 'Status'].map((h) => (
                                           <th key={h} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {RECENT_HISTORY_MOCK.map((row) => (
                                        <tr key={row.id} className="hover:bg-primary/[0.03] dark:hover:bg-white/[0.01] transition-all duration-300 group">
                                            <td className="px-8 py-5 text-[11px] font-bold text-muted-foreground tabular-nums">{row.timestamp}</td>
                                            <td className="px-8 py-5">
                                               <span className="text-sm font-black italic uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">{row.item}</span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-black tabular-nums">{row.qty}</td>
                                            <td className="px-8 py-5">
                                               <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest rounded-lg bg-muted border-none">{row.unit}</Badge>
                                            </td>
                                            <td className="px-8 py-5">
                                               <span className="text-sm font-black italic text-primary dark:text-primary-foreground tabular-nums">{formatCurrency(row.value)}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                               <div className="flex items-center gap-2">
                                                  <div className={cn("size-2 rounded-full", row.status === 'Completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]')} />
                                                  <span className="text-[10px] font-black uppercase tracking-widest shrink-0">{row.status}</span>
                                               </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                 </Card>
              </div>
            )}

            {/* Placeholder sections for other tabs */}
            {activeTab !== 'overview' && (
              <Card className="p-20 text-center border-dashed ring-1 ring-border bg-card/50">
                 <div className="flex flex-col items-center gap-4">
                    <FiRefreshCw className="size-12 text-muted-foreground opacity-20 animate-spin-slow" />
                    <div>
                      <p className="text-xl font-black italic uppercase tracking-tighter text-muted-foreground">Module Initializing</p>
                      <p className="text-xs font-bold text-muted-foreground/60 uppercase mt-1">Deep analysis module is synchronizing with the telemetry network</p>
                    </div>
                 </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
