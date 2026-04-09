import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowLeft, Mail, Phone, MapPin, User, Package, AlertTriangle, Calendar,
    Truck, ExternalLink, DollarSign, Info, ShieldCheck, Clock
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */

interface Ingredient {
    id: number;
    name: string;
    stock: number;
    unit: string;
    low_stock_level: number;
    cost_price: number;
}

interface Supplier {
    id: number;
    name: string;
    contact_person: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: 'Active' | 'Inactive';
    last_delivery_at: string | null;
    created_at: string;
    updated_at: string;
    branch: { id: number; name: string };
    ingredients: Ingredient[];
    creator?: { name: string } | null;
    updater?: { name: string } | null;
}

interface Props {
    supplier: Supplier;
}

/* ─── Helpers ────────────────────────────────────────────────── */

function getStockStatus(item: Ingredient): { label: string; color: string; bg: string } {
    const stock = Number(item.stock);
    const threshold = Number(item.low_stock_level);
    if (stock <= 0) return { label: 'Out of Stock', color: 'text-rose-600', bg: 'bg-rose-500/10 border-rose-500/20' };
    if (stock <= threshold) return { label: 'Low Level', color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { label: 'Healthy', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20' };
}

/* ─── Component ──────────────────────────────────────────────── */

export default function SupplierShow({ supplier }: Props) {
    const lowStockItems = supplier.ingredients.filter(
        item => Number(item.stock) <= Number(item.low_stock_level)
    );
    const outOfStockItems = supplier.ingredients.filter(item => Number(item.stock) <= 0);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Suppliers', href: '/suppliers' },
            { title: supplier.name, href: `/suppliers/${supplier.id}` }
        ]}>
            <Head title={`Supplier — ${supplier.name}`} />

            <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
                {/* ── Header ──────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Link href="/suppliers">
                        <Button variant="ghost" className="gap-2 rounded-xl group font-bold">
                            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Back to Suppliers
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Badge className={`rounded-full px-5 py-1.5 text-sm font-black border-none shadow-sm ${
                            supplier.status === 'Active'
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-slate-400 text-white hover:bg-slate-500'
                        }`}>
                            {supplier.status}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ══════════════════════════════════════════ */}
                    {/* LEFT COLUMN: Supplier Info                */}
                    {/* ══════════════════════════════════════════ */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <Card className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
                            <div className="h-28 bg-primary relative">
                                <div className="absolute -bottom-8 left-6 size-20 rounded-2xl bg-white shadow-2xl flex items-center justify-center text-primary font-black text-3xl border-4 border-white">
                                    {supplier.name.charAt(0)}
                                </div>
                            </div>
                            <CardContent className="pt-12 pb-6 space-y-5">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">{supplier.name}</h2>
                                    <div className="flex items-center gap-1.5 text-sm text-primary font-bold mt-1">
                                        <MapPin className="size-3" /> {supplier.branch.name}
                                    </div>
                                </div>

                                <div className="space-y-3.5 pt-4 border-t border-muted/50">
                                    <InfoRow icon={<User className="size-4" />} label="Contact Person" value={supplier.contact_person} />
                                    <InfoRow icon={<Mail className="size-4" />} label="Email" value={supplier.email || 'Not provided'} />
                                    <InfoRow icon={<Phone className="size-4" />} label="Phone" value={supplier.phone || 'Not provided'} />
                                    <InfoRow icon={<MapPin className="size-4" />} label="Address" value={supplier.address || 'Not provided'} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Widget */}
                        <Card className="border-none shadow-xl shadow-black/5 rounded-3xl bg-primary text-primary-foreground overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="size-11 rounded-2xl bg-white/20 flex items-center justify-center">
                                        <Calendar className="size-5" />
                                    </div>
                                    {lowStockItems.length > 0 && (
                                        <Badge className="bg-rose-400 text-white animate-pulse text-[10px] font-black">
                                            {lowStockItems.length} Alert{lowStockItems.length > 1 ? 's' : ''}
                                        </Badge>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70">Last Delivery</h3>
                                    <p className="text-xl font-black">
                                        {supplier.last_delivery_at
                                            ? new Date(supplier.last_delivery_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                            : 'No deliveries yet'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audit Card */}
                        <Card className="border-none shadow-md rounded-3xl">
                            <CardContent className="p-5 space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <ShieldCheck className="size-3.5" /> Audit Trail
                                </h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="size-3 shrink-0" />
                                        <span>Created {new Date(supplier.created_at).toLocaleString()} {supplier.creator ? `by ${supplier.creator.name}` : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="size-3 shrink-0" />
                                        <span>Updated {new Date(supplier.updated_at).toLocaleString()} {supplier.updater ? `by ${supplier.updater.name}` : ''}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ══════════════════════════════════════════ */}
                    {/* RIGHT COLUMN: Supplies & Stats            */}
                    {/* ══════════════════════════════════════════ */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <SummaryCard
                                icon={<Package className="size-6" />}
                                label="Total Supplies"
                                value={supplier.ingredients.length}
                                bg="bg-sky-50"
                                iconBg="bg-sky-500"
                                textColor="text-sky-900"
                                labelColor="text-sky-700"
                            />
                            <SummaryCard
                                icon={<AlertTriangle className="size-6" />}
                                label="Low Stock"
                                value={lowStockItems.length - outOfStockItems.length}
                                bg="bg-amber-50"
                                iconBg="bg-amber-500"
                                textColor="text-amber-900"
                                labelColor="text-amber-700"
                            />
                            <SummaryCard
                                icon={<AlertTriangle className="size-6" />}
                                label="Out of Stock"
                                value={outOfStockItems.length}
                                bg="bg-rose-50"
                                iconBg="bg-rose-500"
                                textColor="text-rose-900"
                                labelColor="text-rose-700"
                            />
                        </div>

                        {/* Supplies Table */}
                        <Card className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-muted/30 p-5 flex flex-row items-center justify-between border-b">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Info className="size-4 text-primary" /> Tracked Supplies
                                </CardTitle>
                                <Link href="/inventory">
                                    <Button variant="outline" size="sm" className="rounded-full text-[10px] font-black uppercase gap-1">
                                        View Inventory <ExternalLink className="size-3" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm" role="table" aria-label="Linked ingredients">
                                        <thead className="bg-muted/10 border-b">
                                            <tr>
                                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ingredient</th>
                                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Current Stock</th>
                                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Reorder Level</th>
                                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Cost Price</th>
                                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-muted/10">
                                            {supplier.ingredients.map((item) => {
                                                const status = getStockStatus(item);
                                                return (
                                                    <tr key={item.id} className={`group hover:bg-muted/10 transition-colors ${Number(item.stock) <= Number(item.low_stock_level) ? 'bg-rose-50/30' : ''}`}>
                                                        <td className="px-5 py-3.5 font-bold text-foreground">{item.name}</td>
                                                        <td className="px-5 py-3.5 text-right font-mono font-bold">
                                                            {Number(item.stock).toLocaleString()} <span className="text-muted-foreground text-xs">{item.unit}</span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right text-muted-foreground font-medium">
                                                            {Number(item.low_stock_level).toLocaleString()} {item.unit}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right font-mono font-bold">
                                                            <span className="flex items-center justify-end gap-0.5">
                                                                <DollarSign className="size-3 text-muted-foreground" />
                                                                {Number(item.cost_price).toFixed(2)}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-center">
                                                            <Badge className={`${status.bg} ${status.color} text-[10px] font-black uppercase tracking-tighter rounded-full px-3`}>
                                                                {status.label}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {supplier.ingredients.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center">
                                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                                                            <Package className="size-12 stroke-1" />
                                                            <p className="font-bold">No supplies linked to this supplier.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Delivery History Placeholder */}
                        <Card className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-primary/5 p-5 border-b">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Truck className="size-4 text-primary" /> Delivery History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-10 flex flex-col items-center justify-center space-y-3 opacity-25">
                                <Truck className="size-14 stroke-1" />
                                <p className="font-bold text-base">Coming Soon</p>
                                <p className="text-xs text-center max-w-xs">Delivery tracking and supplier performance analytics will appear here in a future update.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 text-muted-foreground">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
                <p className="font-semibold text-sm truncate">{value}</p>
            </div>
        </div>
    );
}

function SummaryCard({ icon, label, value, bg, iconBg, textColor, labelColor }: {
    icon: React.ReactNode; label: string; value: number;
    bg: string; iconBg: string; textColor: string; labelColor: string;
}) {
    return (
        <Card className={`border-none shadow-lg rounded-3xl p-5 ${bg}`}>
            <div className="flex items-center gap-4">
                <div className={`size-12 rounded-2xl ${iconBg} flex items-center justify-center text-white shadow-lg`}>
                    {icon}
                </div>
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-70 ${labelColor}`}>{label}</p>
                    <h4 className={`text-2xl font-black ${textColor}`}>{value}</h4>
                </div>
            </div>
        </Card>
    );
}
