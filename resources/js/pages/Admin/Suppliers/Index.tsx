import { Head, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus, Search, Edit2, Trash2, Eye, Mail, Phone, MapPin, User, Package,
    MoreHorizontal, Filter, ChevronLeft, ChevronRight, AlertTriangle,
    ArrowUpDown, Building2, ShieldAlert, X
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import debounce from 'lodash/debounce';

/* ─── Types ──────────────────────────────────────────────────── */

interface Supplier {
    id: number;
    name: string;
    contact_person: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: 'Active' | 'Inactive';
    branch_id: number;
    updated_at: string;
    ingredients_count: number;
    critical_count: number;
    branch?: { id: number; name: string };
    ingredients?: { id: number; name: string }[];
}

interface Filters {
    search?: string;
    status?: string;
    branch_id?: string;
    low_stock?: string;
    sort?: string;
    direction?: string;
}

interface Props {
    suppliers: {
        data: Supplier[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
    };
    branches: { id: number; name: string }[];
    ingredients: { id: number; name: string }[];
    filters: Filters;
}

/* ─── Component ──────────────────────────────────────────────── */

export default function SupplierIndex({ suppliers, branches, ingredients, filters }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [isDirty, setIsDirty] = useState(false);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        status: 'Active' as 'Active' | 'Inactive',
        branch_id: '' as string | number,
        ingredient_ids: [] as number[],
    });

    // Track form changes for unsaved-changes warning
    const initialData = useRef(data);
    useEffect(() => {
        if (isModalOpen) {
            initialData.current = { ...data };
        }
    }, [isModalOpen]);

    useEffect(() => {
        setIsDirty(JSON.stringify(data) !== JSON.stringify(initialData.current));
    }, [data]);

    /* ── Navigation helpers ─────────────────────────────────── */

    const applyFilters = (updates: Partial<Filters>) => {
        const merged = { ...filters, ...updates };
        // Clean empty/default values
        Object.keys(merged).forEach(key => {
            const k = key as keyof Filters;
            if (!merged[k] || merged[k] === 'all') delete merged[k];
        });
        router.get('/suppliers', merged, { preserveState: true, replace: true });
    };

    const debouncedSearch = useCallback(
        debounce((value: string) => applyFilters({ search: value }), 300),
        [filters]
    );

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    const toggleSort = (field: string) => {
        const newDir = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        applyFilters({ sort: field, direction: newDir });
    };

    /* ── CRUD helpers ───────────────────────────────────────── */

    const openCreateModal = () => {
        setEditingSupplier(null);
        reset();
        setIngredientSearch('');
        setIsModalOpen(true);
    };

    const openEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setData({
            name: supplier.name,
            contact_person: supplier.contact_person,
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            status: supplier.status,
            branch_id: supplier.branch_id,
            ingredient_ids: supplier.ingredients?.map(i => i.id) || [],
        });
        setIngredientSearch('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isDirty) {
            if (!confirm('You have unsaved changes. Discard them?')) return;
        }
        setIsModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            put(`/suppliers/${editingSupplier.id}`, { onSuccess: () => setIsModalOpen(false) });
        } else {
            post('/suppliers', { onSuccess: () => setIsModalOpen(false) });
        }
    };

    const handleDelete = (id: number) => {
        router.delete(`/suppliers/${id}`, {
            onSuccess: () => setDeleteConfirmId(null),
        });
    };

    const filteredIngredients = ingredients.filter(i =>
        i.name.toLowerCase().includes(ingredientSearch.toLowerCase())
    );

    const activeFilterCount = [
        filters.status && filters.status !== 'all',
        filters.branch_id && filters.branch_id !== 'all',
        filters.low_stock === 'true',
    ].filter(Boolean).length;

    /* ── Render ──────────────────────────────────────────────── */

    return (
        <AppLayout breadcrumbs={[{ title: 'Suppliers', href: '/suppliers' }]}>
            <Head title="Supplier Management" />

            <div className="p-4 md:p-8 space-y-6">
                {/* ── Header ──────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Suppliers</h1>
                        <p className="text-muted-foreground text-sm">Manage your supply chain partners and track their inventory contributions.</p>
                    </div>
                    <Button onClick={openCreateModal} className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 font-bold">
                        <Plus className="size-5" /> Add New Supplier
                    </Button>
                </div>

                {/* ── Filters Bar ─────────────────────────────────── */}
                <Card className="border-none shadow-md rounded-2xl">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                            {/* Search */}
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, contact, or email..."
                                    className="pl-10 h-11 rounded-xl border-none bg-muted/50 focus-visible:bg-background transition-all"
                                    value={search}
                                    onChange={onSearchChange}
                                    aria-label="Search suppliers"
                                />
                            </div>

                            {/* Filter dropdowns */}
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                {activeFilterCount > 0 && (
                                    <Badge variant="secondary" className="rounded-full text-xs font-bold gap-1 pr-1">
                                        {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                                        <button onClick={() => applyFilters({ status: '', branch_id: '', low_stock: '' })} className="ml-1 p-0.5 rounded-full hover:bg-muted">
                                            <X className="size-3" />
                                        </button>
                                    </Badge>
                                )}
                                <Select value={filters.status || 'all'} onValueChange={v => applyFilters({ status: v })}>
                                    <SelectTrigger className="h-10 w-[140px] rounded-xl bg-muted/50 border-none text-xs font-bold" aria-label="Filter by status">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filters.branch_id || 'all'} onValueChange={v => applyFilters({ branch_id: v })}>
                                    <SelectTrigger className="h-10 w-[160px] rounded-xl bg-muted/50 border-none text-xs font-bold" aria-label="Filter by branch">
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

                                <Button
                                    variant={filters.low_stock === 'true' ? 'default' : 'outline'}
                                    size="sm"
                                    className="rounded-xl h-10 gap-1.5 text-xs font-bold"
                                    onClick={() => applyFilters({ low_stock: filters.low_stock === 'true' ? '' : 'true' })}
                                    aria-label="Filter low stock suppliers"
                                >
                                    <ShieldAlert className="size-3.5" />
                                    Low Stock
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Table ───────────────────────────────────────── */}
                <Card className="border-none shadow-xl shadow-black/5 overflow-hidden rounded-3xl bg-card">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse" role="table" aria-label="Suppliers list">
                                <thead className="bg-muted/30 border-b">
                                    <tr>
                                        <th className="p-4 pl-6">
                                            <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                                                Supplier <ArrowUpDown className="size-3" />
                                            </button>
                                        </th>
                                        <th className="p-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Contact</th>
                                        <th className="p-4 text-center">
                                            <button onClick={() => toggleSort('ingredients_count')} className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mx-auto">
                                                Supplies <ArrowUpDown className="size-3" />
                                            </button>
                                        </th>
                                        <th className="p-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                        <th className="p-4">
                                            <button onClick={() => toggleSort('updated_at')} className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                                                Updated <ArrowUpDown className="size-3" />
                                            </button>
                                        </th>
                                        <th className="p-4 pr-6 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/20">
                                    {suppliers.data.map((supplier) => (
                                        <tr key={supplier.id} className={`group hover:bg-muted/10 transition-colors ${supplier.critical_count > 0 ? 'bg-rose-50/40' : ''}`}>
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-11 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-base border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                                                        {supplier.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-foreground truncate">{supplier.name}</p>
                                                            {supplier.critical_count > 0 && (
                                                                <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[9px] font-black uppercase px-1.5 py-0 shrink-0">
                                                                    <AlertTriangle className="size-2.5 mr-0.5" />{supplier.critical_count} critical
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                            <MapPin className="size-3 shrink-0" />
                                                            <span className="truncate">{supplier.branch?.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <User className="size-3 text-muted-foreground shrink-0" />
                                                        <span className="font-medium truncate max-w-[180px]">{supplier.contact_person}</span>
                                                    </div>
                                                    {supplier.email && (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Mail className="size-3 shrink-0" />
                                                            <span className="truncate max-w-[180px]">{supplier.email}</span>
                                                        </div>
                                                    )}
                                                    {supplier.phone && (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Phone className="size-3 shrink-0" />
                                                            <span>{supplier.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge variant="outline" className="rounded-full px-3 py-1 bg-amber-50 text-amber-700 border-amber-200 font-bold">
                                                    <Package className="size-3 mr-1" />
                                                    {supplier.ingredients_count}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={`rounded-full px-3.5 text-[10px] font-black uppercase tracking-wider ${
                                                    supplier.status === 'Active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                                }`} variant="outline">
                                                    {supplier.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-xs text-muted-foreground">
                                                {new Date(supplier.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link href={`/suppliers/${supplier.id}`}>
                                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary h-9 w-9" aria-label={`View ${supplier.name}`}>
                                                            <Eye className="size-4" />
                                                        </Button>
                                                    </Link>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" aria-label="More actions">
                                                                <MoreHorizontal className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[170px] rounded-2xl p-2 shadow-2xl">
                                                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-black tracking-widest px-2 mb-1">Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer" onClick={() => openEditModal(supplier)}>
                                                                <Edit2 className="size-4" /> Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="opacity-50" />
                                                            <DropdownMenuItem className="rounded-xl gap-2 text-rose-500 cursor-pointer" onClick={() => setDeleteConfirmId(supplier.id)}>
                                                                <Trash2 className="size-4" /> Deactivate
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {suppliers.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                                                    <Package className="size-16 stroke-1" />
                                                    <p className="text-lg font-bold">No suppliers found</p>
                                                    <p className="text-sm">Try adjusting your search or filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination ──────────────────────────────── */}
                        {suppliers.last_page > 1 && (
                            <div className="p-4 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Showing <span className="text-foreground font-bold">{suppliers.from}–{suppliers.to}</span> of <span className="text-foreground font-bold">{suppliers.total}</span>
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {suppliers.links.map((link, i) => {
                                        if (link.label.includes('Previous'))
                                            return <Link key={i} href={link.url || '#'} preserveScroll className={!link.url ? 'pointer-events-none opacity-40' : ''}><Button variant="outline" size="icon" className="rounded-xl h-9 w-9"><ChevronLeft className="size-4" /></Button></Link>;
                                        if (link.label.includes('Next'))
                                            return <Link key={i} href={link.url || '#'} preserveScroll className={!link.url ? 'pointer-events-none opacity-40' : ''}><Button variant="outline" size="icon" className="rounded-xl h-9 w-9"><ChevronRight className="size-4" /></Button></Link>;
                                        if (!isNaN(Number(link.label)))
                                            return <Link key={i} href={link.url || '#'} preserveScroll><Button variant={link.active ? 'default' : 'outline'} size="icon" className={`rounded-xl h-9 w-9 text-xs ${link.active ? 'shadow-md shadow-primary/20' : ''}`}>{link.label}</Button></Link>;
                                        return null;
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Delete Confirmation Dialog ───────────────────── */}
            <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
                <DialogContent className="max-w-sm rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Confirm Deactivation</DialogTitle>
                        <DialogDescription>
                            This supplier will be soft-deleted and can be restored later. Their data will remain in the system for audit purposes.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-4">
                        <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                        <Button variant="destructive" className="h-11 rounded-2xl font-bold" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                            <Trash2 className="size-4 mr-2" /> Deactivate Supplier
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Create / Edit Modal ─────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="p-8 bg-primary text-primary-foreground">
                            <DialogTitle className="text-2xl font-black">{editingSupplier ? 'Update Supplier' : 'Register New Supplier'}</DialogTitle>
                            <DialogDescription className="text-primary-foreground/70">
                                {editingSupplier ? 'Modify supplier information below.' : 'Provide accurate information to maintain clean supply chain records.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-8 space-y-6 max-h-[58vh] overflow-y-auto">
                            {/* Row 1: Name + Contact */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company Name *</label>
                                    <Input placeholder="Ex. Global Foods Inc." className="h-12 rounded-2xl" value={data.name} onChange={e => setData('name', e.target.value)} required aria-label="Company name" />
                                    {errors.name && <p className="text-xs text-destructive ml-1">{errors.name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Person *</label>
                                    <Input placeholder="Ex. Juan Dela Cruz" className="h-12 rounded-2xl" value={data.contact_person} onChange={e => setData('contact_person', e.target.value)} required aria-label="Contact person" />
                                    {errors.contact_person && <p className="text-xs text-destructive ml-1">{errors.contact_person}</p>}
                                </div>
                            </div>

                            {/* Row 2: Email + Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address *</label>
                                    <Input type="email" placeholder="contact@company.com" className="h-12 rounded-2xl" value={data.email} onChange={e => setData('email', e.target.value)} required aria-label="Email" />
                                    {errors.email && <p className="text-xs text-destructive ml-1">{errors.email}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                                    <Input placeholder="+63 912 345 6789" className="h-12 rounded-2xl" value={data.phone} onChange={e => setData('phone', e.target.value)} aria-label="Phone number" />
                                    {errors.phone && <p className="text-xs text-destructive ml-1">{errors.phone}</p>}
                                </div>
                            </div>

                            {/* Row 3: Address */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Office Address</label>
                                <Input placeholder="Full office or warehouse address" className="h-12 rounded-2xl" value={data.address} onChange={e => setData('address', e.target.value)} aria-label="Address" />
                                {errors.address && <p className="text-xs text-destructive ml-1">{errors.address}</p>}
                            </div>

                            {/* Row 4: Status + Branch */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status *</label>
                                    <Select value={data.status} onValueChange={(v: any) => setData('status', v)}>
                                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-xs text-destructive ml-1">{errors.status}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Branch *</label>
                                    <Select value={data.branch_id ? String(data.branch_id) : ''} onValueChange={v => setData('branch_id', Number(v))}>
                                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Select a branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.branch_id && <p className="text-xs text-destructive ml-1">{errors.branch_id}</p>}
                                </div>
                            </div>

                            {/* Row 5: Ingredients */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Supplies Provided</label>
                                    <span className="text-[10px] font-bold text-primary">{data.ingredient_ids.length} selected</span>
                                </div>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search ingredients..."
                                        className="pl-9 h-9 rounded-xl text-sm bg-muted/50 border-none"
                                        value={ingredientSearch}
                                        onChange={e => setIngredientSearch(e.target.value)}
                                        aria-label="Search ingredients"
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-2xl bg-muted/10 max-h-[160px] overflow-y-auto">
                                    {filteredIngredients.map(item => (
                                        <label key={item.id} htmlFor={`ing-${item.id}`} className="flex items-center gap-2 bg-background p-2 rounded-xl border border-transparent hover:border-primary/20 cursor-pointer transition-all text-sm">
                                            <input
                                                type="checkbox"
                                                id={`ing-${item.id}`}
                                                checked={data.ingredient_ids.includes(item.id)}
                                                onChange={e => {
                                                    setData('ingredient_ids', e.target.checked
                                                        ? [...data.ingredient_ids, item.id]
                                                        : data.ingredient_ids.filter(id => id !== item.id)
                                                    );
                                                }}
                                                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="truncate font-medium">{item.name}</span>
                                        </label>
                                    ))}
                                    {filteredIngredients.length === 0 && (
                                        <p className="col-span-full text-center text-sm text-muted-foreground py-4 italic">No ingredients found.</p>
                                    )}
                                </div>
                                {data.ingredient_ids.length === 0 && (
                                    <p className="text-[10px] text-amber-600 ml-1 font-medium">⚠ No ingredients selected. Consider linking supplies for better tracking.</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-muted/30 border-t gap-3">
                            <Button type="button" variant="outline" className="h-12 rounded-2xl px-8" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button className="h-12 rounded-2xl px-10 font-black shadow-lg shadow-primary/20" disabled={processing}>
                                {processing ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Register Supplier'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
