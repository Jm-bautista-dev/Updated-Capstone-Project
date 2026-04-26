import { Head, useForm, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Plus, Search, Edit2, Trash2, Phone, User, 
    MoreHorizontal, Filter, ChevronLeft, ChevronRight,
    Building2, Bike, X, Eye, EyeOff, Lock, Mail, CheckCircle2, Copy, AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { toast } from 'sonner';

interface Rider {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: 'available' | 'busy' | 'offline';
    is_active: boolean;
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
    stats: {
        total: number;
        available: number;
        busy: number;
        offline: number;
    };
}

export default function RiderIndex({ riders, branches, filters, stats }: Props) {
    const { props } = usePage<any>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
    const [newRiderCreds, setNewRiderCreds] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [editingRider, setEditingRider] = useState<Rider | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        branch_id: '' as string | number,
        password: '',
        is_active: true,
    });

    useEffect(() => {
        if (props.flash?.new_rider) {
            setNewRiderCreds(props.flash.new_rider);
            setIsCredsModalOpen(true);
        }
    }, [props.flash?.new_rider]);

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
            email: rider.email,
            phone: rider.phone || '',
            branch_id: rider.branch_id,
            password: '',
            is_active: rider.is_active,
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

    const handleDelete = (rider: Rider) => {
        setRiderToDelete(rider);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!riderToDelete) return;
        router.delete(`/riders/${riderToDelete.id}`, {
            onSuccess: () => {
                toast.success(`${riderToDelete.name} has been removed from the fleet.`);
                setRiderToDelete(null);
            },
            onError: () => toast.error('Failed to delete rider. Please try again.'),
        });
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

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
                {/* Header Bar */}
                <div className="border-b bg-background/50 backdrop-blur-md flex-shrink-0">
                    <div className="h-20 px-6 flex items-center justify-between max-w-6xl mx-auto w-full">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
                                <Bike className="text-primary size-6" />
                                Delivery Riders
                            </h1>
                            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">Fleet Management & Performance</p>
                        </div>
                        <Button onClick={openCreateModal} className="gap-2 h-11 px-6 shadow-xl shadow-primary/20 font-black uppercase text-xs tracking-widest">
                            <Plus className="size-4" /> Add New Rider
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-6xl mx-auto w-full space-y-6 flex flex-col">
                        
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
                            <Card className="bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-900/30 shadow-sm transition-all duration-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-slate-500/10 flex items-center justify-center ring-4 ring-slate-500/5">
                                        <User className="text-slate-600 dark:text-slate-400 size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-600/60 dark:text-slate-400/60 tracking-widest leading-none mb-1">Total Fleet</p>
                                        <p className="text-2xl font-black text-foreground">{stats.total}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 shadow-sm transition-all duration-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center ring-4 ring-emerald-500/5">
                                        <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-emerald-600/60 dark:text-emerald-400/60 tracking-widest leading-none mb-1">Available</p>
                                        <p className="text-2xl font-black text-foreground">{stats.available}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 shadow-sm transition-all duration-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-rose-500/10 flex items-center justify-center ring-4 ring-rose-500/5">
                                        <AlertCircle className="text-rose-600 dark:text-rose-400 size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-rose-600/60 dark:text-rose-400/60 tracking-widest leading-none mb-1">On Delivery</p>
                                        <p className="text-2xl font-black text-foreground">{stats.busy}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-900/30 shadow-sm transition-all duration-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-slate-500/10 flex items-center justify-center ring-4 ring-slate-500/5">
                                        <EyeOff className="text-slate-600 dark:text-slate-400 size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-600/60 dark:text-slate-400/60 tracking-widest leading-none mb-1">Offline</p>
                                        <p className="text-2xl font-black text-foreground">{stats.offline}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <form onSubmit={handleSearch} className="relative w-full lg:max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or phone..."
                                    className="pl-10 h-11 rounded-2xl border-none bg-muted/50 focus-visible:bg-background transition-all ring-1 ring-black/5"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </form>

                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                <Select value={filters.status || 'all'} onValueChange={v => handleFilter('status', v)}>
                                    <SelectTrigger className="h-11 w-full lg:w-[160px] rounded-2xl bg-muted/50 border-none text-xs font-black uppercase tracking-widest ring-1 ring-black/5">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="busy">Busy</SelectItem>
                                        <SelectItem value="offline">Offline</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filters.branch_id || 'all'} onValueChange={v => handleFilter('branch_id', v)}>
                                    <SelectTrigger className="h-11 w-full lg:w-[180px] rounded-2xl bg-muted/50 border-none text-xs font-black uppercase tracking-widest ring-1 ring-black/5">
                                        <Building2 className="size-3.5 mr-2 text-primary" />
                                        <SelectValue placeholder="All Branches" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Table Card */}
                        <Card className="border-none shadow-xl shadow-black/5 overflow-hidden rounded-[2rem] bg-card flex flex-col flex-1">
                            <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b">
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
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black flex items-center gap-1">
                                                                    <Mail className="size-2.5" /> {rider.email}
                                                                </p>
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
                                                                <DropdownMenuItem className="rounded-xl gap-2 text-rose-500 cursor-pointer" onClick={() => handleDelete(rider)}>
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
                </div>
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

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address (Login Username) *</label>
                                <Input 
                                    type="email"
                                    placeholder="rider@example.com" 
                                    className="h-12 rounded-2xl" 
                                    value={data.email} 
                                    onChange={e => setData('email', e.target.value)} 
                                    required 
                                />
                                {errors.email && <p className="text-xs text-destructive ml-1">{errors.email}</p>}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        {editingRider ? 'New Password (Leave blank to keep current)' : 'Password (Leave blank for auto-generate)'}
                                    </label>
                                    <div className="relative">
                                        <Input 
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••" 
                                            className="h-12 rounded-2xl pr-10" 
                                            value={data.password} 
                                            onChange={e => setData('password', e.target.value)} 
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-destructive ml-1">{errors.password}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Status *</label>
                                    <Select value={data.is_active ? 'true' : 'false'} onValueChange={v => setData('is_active', v === 'true')}>
                                        <SelectTrigger className="h-12 rounded-2xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Active Account</SelectItem>
                                            <SelectItem value="false">Suspended Account</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.is_active && <p className="text-xs text-destructive ml-1">{errors.is_active}</p>}
                                </div>
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
            {/* Credentials Display Modal */}
            <Dialog open={isCredsModalOpen} onOpenChange={setIsCredsModalOpen}>
                <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="p-8 bg-emerald-600 text-white text-center space-y-2">
                        <div className="size-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="size-10" />
                        </div>
                        <DialogTitle className="text-2xl font-black">Rider Account Created!</DialogTitle>
                        <p className="text-emerald-50 text-sm">
                            {newRiderCreds?.email_sent
                                ? `Credentials have been emailed to ${newRiderCreds?.email}`
                                : 'Please copy these credentials and provide them to the rider.'}
                        </p>
                    </div>

                    <div className="p-8 space-y-5">
                        {/* Email sent status banner */}
                        {newRiderCreds?.email_sent ? (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
                                <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                    <Mail className="size-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Email Sent Successfully</p>
                                    <p className="opacity-75">Login credentials were delivered to {newRiderCreds?.email}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-3">
                                <div className="size-8 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                                    <AlertCircle className="size-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Email Could Not Be Sent</p>
                                    <p className="opacity-75">Please share these credentials manually with the rider.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="p-4 rounded-2xl bg-muted/50 border border-muted-foreground/10 space-y-1 relative group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <User className="size-3" /> Rider Name
                                </label>
                                <p className="font-bold text-base">{newRiderCreds?.name}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/50 border border-muted-foreground/10 space-y-1 relative group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Mail className="size-3" /> Email / Username
                                </label>
                                <p className="font-bold text-base select-all">{newRiderCreds?.email}</p>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => navigator.clipboard.writeText(newRiderCreds?.email)}
                                >
                                    <Copy className="size-4" />
                                </Button>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/50 border border-muted-foreground/10 space-y-1 relative group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Lock className="size-3" /> 
                                    {newRiderCreds?.auto_generated ? 'Auto-Generated Password' : 'Admin-Set Password'}
                                </label>
                                <p className="font-mono font-bold text-xl tracking-wider text-primary select-all">{newRiderCreds?.password}</p>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => navigator.clipboard.writeText(newRiderCreds?.password)}
                                >
                                    <Copy className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs flex gap-3">
                            <div className="size-5 rounded-full bg-amber-300 dark:bg-amber-700 flex items-center justify-center shrink-0 mt-0.5 text-amber-900 dark:text-amber-100 font-black text-[10px]">!</div>
                            <p className="font-medium leading-relaxed">
                                {newRiderCreds?.auto_generated
                                    ? 'This password was auto-generated by the system. The rider should change it after first login.'
                                    : 'This password was set by the admin. The rider can log in to the mobile app immediately.'}
                            </p>
                        </div>

                        <Button 
                            className="w-full h-12 rounded-2xl font-black text-base shadow-lg shadow-emerald-600/20" 
                            onClick={() => setIsCredsModalOpen(false)}
                        >
                            Got it, I've saved it
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={confirmDelete}
                variant="destructive"
                title="Remove Rider?"
                description={riderToDelete ? `This will permanently remove ${riderToDelete.name} from the fleet. This action cannot be undone.` : ''}
                confirmText="Remove Rider"
                cancelText="Keep Rider"
            />
        </AppLayout>
    );
}
