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

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background font-sans">
                {/* ── Executive Header ── */}
                <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-[var(--ops-surface-sunken)] border-b border-[var(--ops-border)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Bike className="text-primary size-6 animate-pulse" />
                        <div>
                            <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">Riders</h1>
                            <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                                Fleet Management & Rider Performance Logs.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button 
                            onClick={openCreateModal} 
                            className="h-10 px-4 gap-2 bg-primary hover:bg-primary-hover text-foreground shadow-lg shadow-primary/10 rounded-[12px] font-black uppercase text-[10px] tracking-wider italic shrink-0"
                        >
                            <Plus className="size-4" /> <span>Add Rider</span>
                        </Button>
                    </div>
                </div>

                {/* ── Content Layout ── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)]">Total Riders</p>
                                <User className="size-4 text-[var(--ops-text-secondary)]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{stats.total}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Active fleet size</p>
                            </div>
                        </div>

                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Available</p>
                                <CheckCircle2 className="size-4 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-emerald-500 tabular-nums leading-none">{stats.available}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Ready for assignment</p>
                            </div>
                        </div>

                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500/70">On Delivery</p>
                                <AlertCircle className="size-4 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-rose-500 tabular-nums leading-none">{stats.busy}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Currently occupied</p>
                            </div>
                        </div>

                        <div className="bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-[14px] p-4.5 relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[100px]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)]">Offline</p>
                                <EyeOff className="size-4 text-[var(--ops-text-secondary)]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[var(--ops-text-secondary)] tabular-nums leading-none">{stats.offline}</h3>
                                <p className="text-[8px] text-[var(--ops-text-faint)] font-bold uppercase mt-1 tracking-widest">Off schedule</p>
                            </div>
                        </div>
                    </div>

                    {/* STICKY TOOLBAR FILTERS */}
                    <div className="sticky top-0 z-30 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md pb-4 pt-1 space-y-4 border-b border-[var(--ops-border-subtle)]">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                                {/* Search box */}
                                <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--ops-text-muted)]" />
                                    <Input
                                        placeholder="Search by name or phone..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] focus:ring-primary/45 text-[10px] font-bold uppercase tracking-tight text-foreground placeholder-zinc-500"
                                    />
                                </form>

                                {/* Status filter */}
                                <Select value={filters.status || 'all'} onValueChange={v => handleFilter('status', v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full sm:w-44 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px]">
                                        <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Status</SelectItem>
                                        <SelectItem value="available" className="text-[10px] font-bold uppercase py-2 text-emerald-500">Available</SelectItem>
                                        <SelectItem value="busy" className="text-[10px] font-bold uppercase py-2 text-rose-500">On Delivery</SelectItem>
                                        <SelectItem value="offline" className="text-[10px] font-bold uppercase py-2 text-slate-500">Offline</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Branch Filter */}
                                <Select value={filters.branch_id || 'all'} onValueChange={v => handleFilter('branch_id', v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full sm:w-44 h-9.5 bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[10px] text-[10px] font-black uppercase tracking-wider text-[var(--ops-text-secondary)]">
                                        <Building2 className="size-3.5 mr-2 text-primary" />
                                        <SelectValue placeholder="All Branches" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--ops-surface-sunken)] border-[var(--ops-border)] rounded-[12px]">
                                        <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Branches</SelectItem>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={String(b.id)} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* RIDERS TABLE ZONE */}
                    <div className="border border-[var(--ops-border)] rounded-[14px] bg-[var(--ops-surface-sunken)] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-auto text-[var(--ops-text-secondary)]">
                                <thead className="bg-[var(--ops-thead-bg)] border-b border-[var(--ops-border)] text-[9px] font-black uppercase tracking-[0.15em] text-[var(--ops-text-secondary)] select-none">
                                    <tr>
                                        <th className="px-6 py-3.5 font-black">Rider info</th>
                                        <th className="px-6 py-3.5 font-black">Branch</th>
                                        <th className="px-6 py-3.5 font-black">Contact</th>
                                        <th className="px-6 py-3.5 font-black text-center">Deliveries</th>
                                        <th className="px-6 py-3.5 font-black">Status</th>
                                        <th className="px-6 py-3.5 font-black text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--ops-border-subtle)] bg-[var(--ops-surface-raised)]">
                                    {riders.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--ops-text-muted)] italic">
                                                No riders currently registered in the fleet.
                                            </td>
                                        </tr>
                                    ) : (
                                        riders.data.map(rider => (
                                            <tr key={rider.id} className="cursor-pointer group select-none hover:bg-[var(--ops-surface-sunken)]/50 transition-colors duration-150 relative border-b border-[var(--ops-border)]" onClick={() => openEditModal(rider)}>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-lg bg-[var(--ops-surface-sunken)] border overflow-hidden shrink-0 shadow-inner flex items-center justify-center text-primary bg-primary/5">
                                                            <Bike className="size-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-[var(--ops-text-primary)] leading-tight">{rider.name}</span>
                                                            <span className="text-[9px] text-[var(--ops-text-muted)] font-mono uppercase font-bold mt-0.5">{rider.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                                        <Building2 className="size-3.5 text-[var(--ops-text-muted)]" />
                                                        <span>{rider.branch?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold font-mono text-[var(--ops-text-primary)]">{rider.phone || 'No phone'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 text-center">
                                                    <span className="font-black text-lg italic tracking-tighter leading-none text-[var(--ops-text-primary)]">
                                                        {rider.deliveries_count || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6">
                                                    <Badge className={cn("text-[9px] font-black uppercase rounded-md border", getStatusColor(rider.status))}>
                                                        {rider.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 text-right" onClick={e => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-[var(--ops-surface-sunken)]">
                                                                <FiMoreHorizontal className="size-4 text-[var(--ops-text-muted)] animate-in fade-in" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40 bg-[var(--ops-surface-raised)] border-[var(--ops-border)] rounded-[12px] p-1.5 shadow-2xl text-[var(--ops-text-secondary)]">
                                                            <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--ops-text-muted)] px-2.5 py-1.5">Options</DropdownMenuLabel>
                                                            <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-surface-sunken)]" onClick={() => openEditModal(rider)}>
                                                                Edit Rider Info
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-[var(--ops-border)] my-1" />
                                                            <DropdownMenuItem className="rounded-[8px] py-1.5 px-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[var(--ops-surface-sunken)] text-rose-500 hover:text-rose-600" onClick={() => handleDelete(rider)}>
                                                                Remove Rider
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PAGINATION BOTTOM BAR */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[var(--ops-surface-raised)] border border-[var(--ops-border)] rounded-2xl shadow-sm gap-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-[var(--ops-text-muted)] uppercase tracking-widest">
                                Results {riders.from || 0} - {riders.to || 0} of {riders.total} riders
                            </span>
                        </div>

                        <div className="flex gap-1">
                            <Link href={riders.links[0]?.url || '#'} disabled={!riders.links[0]?.url}>
                                <Button variant="outline" size="icon" className="rounded-lg size-8"><ChevronLeft className="size-4" /></Button>
                            </Link>
                            <Link href={riders.links[riders.links.length - 1]?.url || '#'} disabled={!riders.links[riders.links.length - 1]?.url}>
                                <Button variant="outline" size="icon" className="rounded-lg size-8"><ChevronRight className="size-4" /></Button>
                            </Link>
                        </div>
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
