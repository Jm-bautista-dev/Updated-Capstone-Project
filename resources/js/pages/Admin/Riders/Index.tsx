import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Plus, Search, Edit2, Trash2, Phone, User, 
    MoreHorizontal, Filter, ChevronLeft, ChevronRight,
    Building2, Bike, X
} from 'lucide-react';
import { useState } from 'react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface Rider {
    id: number;
    name: string;
    phone: string | null;
    status: 'available' | 'busy' | 'offline';
    branch_id: number;
    branch?: { id: number; name: string };
    deliveries_count?: number;
}

interface Props {
    riders: {
        data: Rider[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
    };
    branches: { id: number; name: string }[];
    filters: {
        search?: string;
        status?: string;
        branch_id?: string;
    };
}

export default function RiderIndex({ riders, branches, filters }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRider, setEditingRider] = useState<Rider | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        status: 'available' as 'available' | 'busy' | 'offline',
        branch_id: '' as string | number,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/riders', { ...filters, search }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/riders', { ...filters, [key]: value }, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditingRider(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (rider: Rider) => {
        setEditingRider(rider);
        setData({
            name: rider.name,
            phone: rider.phone || '',
            status: rider.status,
            branch_id: rider.branch_id,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRider) {
            put(`/riders/${editingRider.id}`, { onSuccess: () => setIsModalOpen(false) });
        } else {
            post('/riders', { onSuccess: () => setIsModalOpen(false) });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to remove this rider?')) {
            router.delete(`/riders/${id}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'busy': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            case 'offline': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
            default: return 'bg-gray-500/10 text-gray-600';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Delivery Riders', href: '/riders' }]}>
            <Head title="Rider Management" />

            <div className="p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Delivery Riders</h1>
                        <p className="text-muted-foreground text-sm">Manage your internal delivery personnel across branches.</p>
                    </div>
                    <Button onClick={openCreateModal} className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 font-bold">
                        <Plus className="size-5" /> Add New Rider
                    </Button>
                </div>

                {/* Filters */}
                <Card className="border-none shadow-md rounded-2xl">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                            <form onSubmit={handleSearch} className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search riders..."
                                    className="pl-10 h-11 rounded-xl border-none bg-muted/50 focus-visible:bg-background transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </form>

                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                <Select value={filters.status || 'all'} onValueChange={v => handleFilter('status', v)}>
                                    <SelectTrigger className="h-10 w-[140px] rounded-xl bg-muted/50 border-none text-xs font-bold">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="busy">Busy</SelectItem>
                                        <SelectItem value="offline">Offline</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filters.branch_id || 'all'} onValueChange={v => handleFilter('branch_id', v)}>
                                    <SelectTrigger className="h-10 w-[160px] rounded-xl bg-muted/50 border-none text-xs font-bold">
                                        <Building2 className="size-3 mr-1" />
                                        <SelectValue placeholder="Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-none shadow-xl shadow-black/5 overflow-hidden rounded-3xl bg-card">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/30 border-b">
                                    <tr>
                                        <th className="p-4 pl-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Rider</th>
                                        <th className="p-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Branch</th>
                                        <th className="p-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Contact</th>
                                        <th className="p-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-center">Deliveries</th>
                                        <th className="p-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                        <th className="p-4 pr-6 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/20">
                                    {riders.data.map((rider) => (
                                        <tr key={rider.id} className="group hover:bg-muted/10 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-11 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-base border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                        <Bike className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground truncate">{rider.name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black">ID: #{rider.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Building2 className="size-3.5 text-muted-foreground" />
                                                    <span className="font-medium">{rider.branch?.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {rider.phone ? (
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        <Phone className="size-3.5" />
                                                        <span>{rider.phone}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs italic text-muted-foreground/50">No phone</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge variant="secondary" className="font-black h-6 px-2.5 rounded-lg">
                                                    {rider.deliveries_count || 0}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={`rounded-full px-3.5 text-[10px] font-black uppercase tracking-wider ${getStatusColor(rider.status)}`} variant="outline">
                                                    {rider.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[170px] rounded-2xl p-2 shadow-2xl">
                                                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-black tracking-widest px-2 mb-1">Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer" onClick={() => openEditModal(rider)}>
                                                            <Edit2 className="size-4" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="opacity-50" />
                                                        <DropdownMenuItem className="rounded-xl gap-2 text-rose-500 cursor-pointer" onClick={() => handleDelete(rider.id)}>
                                                            <Trash2 className="size-4" /> Remove Rider
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}

                                    {riders.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                                                    <Bike className="size-16 stroke-1" />
                                                    <p className="text-lg font-bold">No riders found</p>
                                                    <p className="text-sm">Start by adding your internal delivery team.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {riders.last_page > 1 && (
                            <div className="p-4 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Showing <span className="text-foreground font-bold">{riders.from}–{riders.to}</span> of <span className="text-foreground font-bold">{riders.total}</span>
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <Link href={riders.links[0].url || '#'} className={!riders.links[0].url ? 'pointer-events-none opacity-40' : ''}>
                                        <Button variant="outline" size="icon" className="rounded-xl h-9 w-9"><ChevronLeft className="size-4" /></Button>
                                    </Link>
                                    <div className="flex items-center gap-1">
                                        {riders.links.slice(1, -1).map((link, i) => (
                                            <Link key={i} href={link.url || '#'} className={!link.url ? 'pointer-events-none' : ''}>
                                                <Button variant={link.active ? 'default' : 'outline'} size="icon" className={`rounded-xl h-9 w-9 text-xs ${link.active ? 'shadow-md shadow-primary/20' : ''}`}>
                                                    {link.label}
                                                </Button>
                                            </Link>
                                        ))}
                                    </div>
                                    <Link href={riders.links[riders.links.length - 1].url || '#'} className={!riders.links[riders.links.length - 1].url ? 'pointer-events-none opacity-40' : ''}>
                                        <Button variant="outline" size="icon" className="rounded-xl h-9 w-9"><ChevronRight className="size-4" /></Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="p-8 bg-primary text-primary-foreground">
                            <DialogTitle className="text-2xl font-black">{editingRider ? 'Update Rider' : 'Register New Rider'}</DialogTitle>
                            <DialogDescription className="text-primary-foreground/70">
                                {editingRider ? 'Modify rider information below.' : 'Add a new member to your internal delivery fleet.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name *</label>
                                <Input 
                                    placeholder="Ex. Mario Dela Cruz" 
                                    className="h-12 rounded-2xl" 
                                    value={data.name} 
                                    onChange={e => setData('name', e.target.value)} 
                                    required 
                                />
                                {errors.name && <p className="text-xs text-destructive ml-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                                    <Input 
                                        placeholder="+63 912 345 6789" 
                                        className="h-12 rounded-2xl" 
                                        value={data.phone} 
                                        onChange={e => setData('phone', e.target.value)} 
                                    />
                                    {errors.phone && <p className="text-xs text-destructive ml-1">{errors.phone}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Branch *</label>
                                    <Select value={data.branch_id ? String(data.branch_id) : ''} onValueChange={v => setData('branch_id', Number(v))}>
                                        <SelectTrigger className="h-12 rounded-2xl">
                                            <SelectValue placeholder="Select a branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.branch_id && <p className="text-xs text-destructive ml-1">{errors.branch_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Initial Status *</label>
                                <Select value={data.status} onValueChange={(v: any) => setData('status', v)}>
                                    <SelectTrigger className="h-12 rounded-2xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="busy">Busy</SelectItem>
                                        <SelectItem value="offline">Offline</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-xs text-destructive ml-1">{errors.status}</p>}
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-muted/30 border-t gap-3">
                            <Button type="button" variant="outline" className="h-12 rounded-2xl px-8 font-bold" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="h-12 rounded-2xl px-10 font-black shadow-lg shadow-primary/20" disabled={processing}>
                                {processing ? 'Saving...' : editingRider ? 'Update Rider' : 'Register Rider'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// Add Link import from inertia
import { Link } from '@inertiajs/react';
