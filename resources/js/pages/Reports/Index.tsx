import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  FiTrendingUp,
  FiDollarSign,
  FiShoppingBag,
  FiAlertTriangle,
  FiFilter,
  FiDownload,
  FiBarChart2,
  FiActivity,
  FiSearch,
  FiLayers,
  FiRefreshCw
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

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
  { name: 'Ramen', value: 45, color: '#E1062C' }, // Red Accent
  { name: 'Sushi', value: 25, color: '#10b981' }, // Green Success
  { name: 'Beverages', value: 20, color: '#f59e0b' }, // Orange Warning
  { name: 'Sides', value: 10, color: '#3b82f6' }, // Blue Info
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

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  trendValue?: string;
  colorClass?: string;
}

// --- Standardized KPI Card Component ---
function StatCard({ title, value, icon: Icon, trend, trendValue }: StatCardProps) {
  const isUp = trend === 'up';
  
  return (
    <Card className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-25">
      <div className="absolute top-0 right-0 size-24 bg-primary blur-3xl opacity-[0.01] group-hover:opacity-[0.03] transition-opacity" />
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">{title}</p>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn(
              "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-[6px] shrink-0 border",
              isUp 
                ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" 
                : "bg-rose-500/5 text-rose-500 border-rose-500/10"
            )}>
              {trendValue}
            </span>
          )}
          <Icon className="size-4 text-(--ops-text-secondary)" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{value}</h3>
        <p className="text-[8px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">System Telemetry Data</p>
      </div>
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
      
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background font-sans">
        
        {/* ── Header Area ── */}
        <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-(--ops-surface-sunken) border-b border-(--ops-border) shrink-0">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="text-primary size-6 animate-pulse" />
            <div>
              <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">Reports & Analytics</h1>
              <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                Analytics overview of sales, inventory, and system performance
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="h-10 rounded-xl bg-(--ops-surface-sunken) border-(--ops-border) text-[10px] font-black uppercase tracking-wider hover:bg-(--ops-chip-active-bg) text-(--ops-text-secondary) hover:text-foreground">
              <FiDownload className="size-4 mr-1.5" /> Export Data
            </Button>
            <Button className="h-10 px-4 gap-2 bg-primary hover:bg-primary-hover text-foreground shadow-lg shadow-primary/10 rounded-xl font-black uppercase text-[10px] tracking-wider italic shrink-0">
              <FiRefreshCw className="size-4 mr-1.5" /> Sync Intel
            </Button>
          </div>
        </div>

        {/* ── Content Layout ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            <StatCard 
              title="Gross Sales Inflow" 
              value={formatCurrency(73380.50)} 
              icon={FiDollarSign} 
              trend="up" 
              trendValue="+12.5%" 
              colorClass="bg-primary" 
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

          {/* Sticky Tab Toolbar */}
          <div className="sticky top-0 z-30 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md pb-4 pt-1 space-y-4 border-b border-(--ops-border-subtle)">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "h-8 px-4 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 border",
                      isActive
                        ? "bg-primary border-primary text-foreground shadow-sm"
                        : "bg-(--ops-thead-bg) border-(--ops-border) text-(--ops-text-secondary) hover:text-foreground hover:bg-(--ops-chip-active-bg)"
                    )}
                  >
                    <Icon className="size-3 text-(--ops-text-secondary)" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB CONTENTS */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' ? (
                <div className="space-y-6">
                  
                  {/* Recharts Charts Matrix */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* Area Chart */}
                    <Card className="xl:col-span-8 border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden group shadow-sm flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                        <div>
                          <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                            Growth Trajectory
                          </CardTitle>
                          <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted) mt-1">Revenue Performance Vector</CardDescription>
                        </div>
                        <Select defaultValue="7d">
                          <SelectTrigger className="w-32 h-8.5 bg-(--ops-surface-sunken) border-(--ops-border) rounded-[8px] text-[9px] font-black uppercase text-(--ops-text-secondary)">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-(--ops-surface-sunken) border-(--ops-border) rounded-[10px] text-foreground">
                            <SelectItem value="24h" className="text-xs font-bold py-2">Last 24h</SelectItem>
                            <SelectItem value="7d" className="text-xs font-bold py-2">Standard 7D</SelectItem>
                            <SelectItem value="30d" className="text-xs font-bold py-2">Monthly 30D</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardHeader>
                      <CardContent className="p-0 pt-4">
                        <div className="h-80 w-full px-6 pb-4">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={SALES_MOCK} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#E1062C" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#E1062C" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10 dark:text-zinc-800" />
                              <XAxis dataKey="date" stroke="currentColor" className="text-(--ops-text-muted) font-bold" fontSize={8} axisLine={false} tickLine={false} />
                              <YAxis stroke="currentColor" className="text-(--ops-text-muted) font-bold font-mono" fontSize={8} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v/1000}k`} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', background: '#09090b', color: '#fff' }}
                              />
                              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#E1062C" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" animationDuration={1000} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Donut Chart */}
                    <Card className="xl:col-span-4 border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] flex flex-col h-full shadow-sm">
                      <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Market Share</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted) mt-1">Category Distribution</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col items-center justify-center pb-6 pt-0">
                        <div className="h-50 w-full relative">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                              <Pie data={CATEGORY_MOCK} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                                {CATEGORY_MOCK.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-[8px] font-black text-(--ops-text-muted) uppercase tracking-widest mb-0.5">Total</p>
                            <p className="text-lg font-black italic text-foreground leading-none">100%</p>
                          </div>
                        </div>
                        <div className="w-full space-y-2 mt-4 px-2">
                          {CATEGORY_MOCK.map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between group cursor-default">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-(--ops-text-secondary) group-hover:text-foreground transition-colors">{cat.name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-foreground font-mono">{cat.value}%</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Terminal Stream Table */}
                  <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden shadow-sm">
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-(--ops-surface-sunken)/30 border-b border-(--ops-border) gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Terminal Stream</CardTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted) mt-1">Real-time Sale Events</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-64">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-(--ops-text-muted)" />
                          <Input placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9.5 bg-(--ops-surface-sunken) border-(--ops-border) rounded-[10px] text-[10px] font-bold uppercase text-foreground placeholder-zinc-500" />
                        </div>
                        <Button variant="outline" className="h-9.5 w-9.5 p-0 rounded-[10px] border-(--ops-border) bg-(--ops-surface-sunken) text-(--ops-text-secondary) hover:text-foreground"><FiFilter className="size-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-auto text-(--ops-text-secondary)">
                          <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border-subtle) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary) select-none">
                            <tr>
                              {['Timestamp', 'Item Specification', 'Qty', 'Scale', 'Vector (Value)', 'Status'].map((h) => (
                                <th key={h} className="px-6 py-3.5">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-(--ops-border-subtle)">
                            {RECENT_HISTORY_MOCK.map((row) => (
                              <tr key={row.id} className="hover:bg-(--ops-surface-sunken)/30 transition-all duration-150 group">
                                <td className="px-6 py-4 text-[10px] font-bold text-(--ops-text-muted) font-mono">{row.timestamp}</td>
                                <td className="px-6 py-4">
                                  <span className="text-xs font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{row.item}</span>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-zinc-350 font-mono">{row.qty}</td>
                                <td className="px-6 py-4">
                                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest rounded-lg bg-(--ops-surface-sunken) border-(--ops-border) text-(--ops-text-secondary)">
                                    {row.unit}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs font-black text-primary font-mono">{formatCurrency(row.value)}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "size-1.5 rounded-full",
                                      row.status === 'Completed' 
                                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                                        : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                    )} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-(--ops-text-secondary)">{row.status}</span>
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
              ) : (
                <Card className="p-20 text-center border-dashed border border-(--ops-border) bg-(--ops-surface-sunken)/20 rounded-[14px]">
                  <div className="flex flex-col items-center gap-4">
                    <FiRefreshCw className="size-10 text-primary animate-spin" />
                    <div>
                      <p className="text-base font-black italic uppercase tracking-tighter text-(--ops-text-muted)">Module Initializing</p>
                      <p className="text-[10px] font-bold text-(--ops-text-faint) uppercase mt-1">Deep analysis module is synchronizing with the telemetry network</p>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
