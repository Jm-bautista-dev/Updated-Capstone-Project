import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
import { 
    User, 
    ChevronLeft, ChevronRight,
    Eye, EyeOff, Lock, Mail, CheckCircle2, Copy, AlertCircle
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { type ViewMode } from '@/components/products/ViewSwitcher';
import { RiderDrawer } from '@/components/riders/RiderDrawer';
import { RiderFilterToolbar } from '@/components/riders/RiderFilterToolbar';
import { RiderGrid } from '@/components/riders/RiderGrid';
import { RidersHero } from '@/components/riders/RidersHero';
import { RiderTable, type Rider } from '@/components/riders/RiderTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

interface RiderCreds {
    name?: string;
    email?: string;
    password?: string;
    temp_password?: string;
    email_sent?: boolean;
    auto_generated?: boolean;
}

interface PageProps {
    flash?: {
        new_rider?: RiderCreds;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface Props {
    riders: {
        data: Rider[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
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
    const { props } = usePage<PageProps>();
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRiderCreds] = useState<RiderCreds | null>(() => props.flash?.new_rider || null);
    const [isCredsModalOpen, setIsCredsModalOpen] = useState(() => Boolean(props.flash?.new_rider));
    const [showPassword, setShowPassword] = useState(false);
    const [editingRider, setEditingRider] = useState<Rider | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);

    // Rider detail drawer state
    const [selectedRiderForDrawer, setSelectedRiderForDrawer] = useState<Rider | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        branch_id: '' as string | number,
        password: '',
        is_active: true,
    });

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/riders', { ...filters, search }, { preserveState: true });
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
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

    const openRiderDrawer = (rider: Rider) => {
        setSelectedRiderForDrawer(rider);
        setIsDrawerOpen(true);
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

    return (
        <AppLayout breadcrumbs={[{ title: 'Rider Management', href: '/riders' }]}>
            <Head title="Rider Management" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                {/* Hero Header & KPI Cards */}
                <RidersHero stats={stats} onOpenAddModal={openCreateModal} />

                {/* Filter Toolbar */}
                <RiderFilterToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    onSearchSubmit={handleSearch}
                    filterStatus={filters.status || 'all'}
                    onStatusChange={(v) => handleFilter('status', v === 'all' ? '' : v)}
                    filterBranchId={filters.branch_id || 'all'}
                    onBranchChange={(v) => handleFilter('branch_id', v === 'all' ? '' : v)}
                    branches={branches}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {/* Rider List (Table or Grid View) */}
                {viewMode === 'table' ? (
                    <RiderTable
                        riders={riders.data}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        onSelectRider={openRiderDrawer}
                    />
                ) : (
                    <RiderGrid
                        riders={riders.data}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        onSelectRider={openRiderDrawer}
                    />
                )}

                {/* Pagination Controls Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 rounded-3xl shadow-xs backdrop-blur-2xl gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                        <span>Showing</span>
                        <span className="font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">
                            {riders.from || 0} - {riders.to || 0}
                        </span>
                        <span>of</span>
                        <span className="font-mono text-[#E75480] dark:text-[#FF4F81]">{riders.total}</span>
                        <span>riders</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={riders.links[0]?.url || '#'} disabled={!riders.links[0]?.url}>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-2xl size-10 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10 cursor-pointer"
                                disabled={!riders.links[0]?.url}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                        </Link>
                        <Link
                            href={riders.links[riders.links.length - 1]?.url || '#'}
                            disabled={!riders.links[riders.links.length - 1]?.url}
                        >
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-2xl size-10 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10 cursor-pointer"
                                disabled={!riders.links[riders.links.length - 1]?.url}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Rider Detail Drawer */}
            <RiderDrawer
                rider={selectedRiderForDrawer}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onEdit={openEditModal}
                onDelete={handleDelete}
            />

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl rounded-4xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#E2E8F0] font-['Outfit']">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="p-8 bg-linear-to-r from-[#E75480] via-[#F472B6] to-[#E75480] dark:from-[#E1062C] dark:via-[#FF4F81] dark:to-[#E1062C] text-white">
                            <DialogTitle className="text-2xl font-black">
                                {editingRider ? 'Update Rider Information' : 'Register New Delivery Rider'}
                            </DialogTitle>
                            <DialogDescription className="text-white/80 text-xs font-medium mt-1">
                                {editingRider
                                    ? 'Modify rider profile, contact information, and branch assignment.'
                                    : 'Add a new member to your internal branch delivery fleet.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-8 space-y-5">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Full Name *
                                </label>
                                <Input
                                    placeholder="Ex. Mario Dela Cruz"
                                    className="h-12 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-xs text-rose-500 font-bold ml-1">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Email Address (Login Username) *
                                </label>
                                <Input
                                    type="email"
                                    placeholder="rider@example.com"
                                    className="h-12 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && <p className="text-xs text-rose-500 font-bold ml-1">{errors.email}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Phone Number */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                        Phone Number
                                    </label>
                                    <Input
                                        placeholder="+63 912 345 6789"
                                        className="h-12 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                    />
                                    {errors.phone && <p className="text-xs text-rose-500 font-bold ml-1">{errors.phone}</p>}
                                </div>

                                {/* Branch */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                        Branch Assignment *
                                    </label>
                                    <Select
                                        value={data.branch_id ? String(data.branch_id) : ''}
                                        onValueChange={(v) => setData('branch_id', Number(v))}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            <SelectValue placeholder="Select a branch" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                            {branches.map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)} className="rounded-xl py-2 cursor-pointer">
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.branch_id && <p className="text-xs text-rose-500 font-bold ml-1">{errors.branch_id}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                        {editingRider ? 'New Password (Optional)' : 'Password (Optional)'}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="h-12 rounded-2xl pr-10 bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8B8E] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-rose-500 font-bold ml-1">{errors.password}</p>}
                                </div>

                                {/* Account Status */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                        Account Status *
                                    </label>
                                    <Select
                                        value={data.is_active ? 'true' : 'false'}
                                        onValueChange={(v) => setData('is_active', v === 'true')}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                            <SelectItem value="true" className="rounded-xl py-2 cursor-pointer">
                                                Active Account
                                            </SelectItem>
                                            <SelectItem value="false" className="rounded-xl py-2 cursor-pointer text-rose-600 dark:text-rose-400">
                                                Suspended Account
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.is_active && <p className="text-xs text-rose-500 font-bold ml-1">{errors.is_active}</p>}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-[#FFF9FA]/60 dark:bg-[#181820]/60 border-t border-[#F8C8DC]/60 dark:border-white/10 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 rounded-2xl px-8 font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="h-12 rounded-2xl px-10 font-bold bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white shadow-lg shadow-[#E75480]/20 cursor-pointer"
                                disabled={processing}
                            >
                                {processing ? 'Saving...' : editingRider ? 'Update Rider' : 'Register Rider'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Credentials Display Modal */}
            <Dialog open={isCredsModalOpen} onOpenChange={setIsCredsModalOpen}>
                <DialogContent className="max-w-md rounded-4xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#E2E8F0] font-['Outfit']">
                    <div className="p-8 bg-emerald-600 text-white text-center space-y-2">
                        <div className="size-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                            <CheckCircle2 className="size-10 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-black">Rider Account Created!</DialogTitle>
                        <p className="text-emerald-50 text-xs font-medium">
                            {newRiderCreds?.email_sent
                                ? `Credentials have been emailed to ${newRiderCreds?.email}`
                                : 'Please copy these credentials and provide them to the rider.'}
                        </p>
                    </div>

                    <div className="p-8 space-y-5">
                        {/* Email sent status banner */}
                        {newRiderCreds?.email_sent ? (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
                                <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                    <Mail className="size-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Email Sent Successfully</p>
                                    <p className="opacity-80">Login credentials delivered to {newRiderCreds?.email}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-3">
                                <div className="size-8 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                                    <AlertCircle className="size-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Manual Delivery Required</p>
                                    <p className="opacity-80">Please share these credentials manually with the rider.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/60 dark:border-white/10 space-y-1 relative group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1.5">
                                    <User className="size-3" /> Rider Name
                                </label>
                                <p className="font-bold text-base text-[#3D2C2E] dark:text-[#F8FAFC]">{newRiderCreds?.name}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/60 dark:border-white/10 space-y-1 relative group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1.5">
                                    <Mail className="size-3" /> Email / Username
                                </label>
                                <p className="font-bold text-base select-all text-[#3D2C2E] dark:text-[#F8FAFC]">{newRiderCreds?.email}</p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl cursor-pointer hover:bg-white/80 dark:hover:bg-white/10"
                                    onClick={() => {
                                        navigator.clipboard.writeText(newRiderCreds?.email || '');
                                        toast.success('Email copied to clipboard');
                                    }}
                                >
                                    <Copy className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                </Button>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/60 dark:border-white/10 space-y-1 relative group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1.5">
                                    <Lock className="size-3" />
                                    {newRiderCreds?.auto_generated ? 'Auto-Generated Password' : 'Admin-Set Password'}
                                </label>
                                <p className="font-mono font-bold text-xl tracking-wider text-[#E75480] dark:text-[#FF4F81] select-all">
                                    {newRiderCreds?.password}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl cursor-pointer hover:bg-white/80 dark:hover:bg-white/10"
                                    onClick={() => {
                                        navigator.clipboard.writeText(newRiderCreds?.password || '');
                                        toast.success('Password copied to clipboard');
                                    }}
                                >
                                    <Copy className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                </Button>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer"
                            onClick={() => setIsCredsModalOpen(false)}
                        >
                            Got it, I've saved it
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={confirmDelete}
                variant="destructive"
                title="Remove Rider from Fleet?"
                description={
                    riderToDelete
                        ? `This will permanently remove ${riderToDelete.name} from the fleet. This action cannot be undone.`
                        : ''
                }
                confirmText="Remove Rider"
                cancelText="Keep Rider"
            />
        </AppLayout>
    );
}
