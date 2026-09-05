import { router } from '@inertiajs/core';
import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Edit2,
    Trash2,
    Sparkles,
    Layers,
    Package,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    ArrowUpDown,
    Check,
    AlertCircle,
    Info,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

const ToggleSwitch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (val: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            checked ? 'bg-pink-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
    >
        <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                checked ? 'translate-x-5' : 'translate-x-0'
            }`}
        />
    </button>
);

interface AddOnItem {
    id: number;
    name: string;
    price: number | string;
    cost_price?: number | string;
    is_active: boolean;
    branch_id?: number | null;
    stock_linked: boolean;
    ingredient_id?: number | null;
    ingredient_quantity?: number | null;
    branch?: { id: number; name: string } | null;
    ingredient?: { id: number; name: string; unit: string; quantity: number } | null;
}

interface AddonGroupItem {
    id: number;
    addon_group_id: number;
    add_on_id: number;
    sort_order: number;
    is_default: boolean;
    addon?: AddOnItem;
}

interface ProductItem {
    id: number;
    name: string;
    price: number | string;
    category_id?: number;
}

interface AddonGroupData {
    id: number;
    name: string;
    selection_type: 'single' | 'multi';
    is_required: boolean;
    min_selections: number;
    max_selections?: number | null;
    is_active: boolean;
    sort_order: number;
    items?: AddonGroupItem[];
    products?: ProductItem[];
    product?: ProductItem | null;
}

interface InventoryOption {
    id: number;
    name: string;
    unit: string;
    type: string;
    quantity: number;
}

interface BranchOption {
    id: number;
    name: string;
}

interface Props {
    addons: AddOnItem[];
    addonGroups: AddonGroupData[];
    products: ProductItem[];
    branches: BranchOption[];
    inventoryItems: InventoryOption[];
}

export default function AddonsIndex({
    addons = [],
    addonGroups = [],
    products = [],
    branches = [],
    inventoryItems = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'addons' | 'groups'>('addons');
    const [searchQuery, setSearchQuery] = useState('');

    // Addon Modal State
    const [addonModalOpen, setAddonModalOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<AddOnItem | null>(null);
    const [deleteAddonId, setDeleteAddonId] = useState<number | null>(null);

    // Group Modal State
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<AddonGroupData | null>(null);
    const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null);

    // Addon Form
    const addonForm = useForm({
        name: '',
        price: '',
        cost_price: '0',
        is_active: true,
        branch_id: '',
        stock_linked: false,
        ingredient_id: '',
        ingredient_quantity: '',
    });

    // Group Form
    const groupForm = useForm({
        name: '',
        selection_type: 'single' as 'single' | 'multi',
        is_required: false,
        min_selections: 0,
        max_selections: 1,
        is_active: true,
        sort_order: 0,
        addon_ids: [] as number[],
        product_ids: [] as number[],
    });

    // KPI Metrics
    const kpis = useMemo(() => {
        const totalAddons = addons.length;
        const activeAddons = addons.filter((a) => a.is_active).length;
        const stockLinkedAddons = addons.filter((a) => a.stock_linked).length;
        const totalGroups = addonGroups.length;
        const activeGroups = addonGroups.filter((g) => g.is_active).length;

        return { totalAddons, activeAddons, stockLinkedAddons, totalGroups, activeGroups };
    }, [addons, addonGroups]);

    // Filtered lists
    const filteredAddons = useMemo(() => {
        return addons.filter((a) =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [addons, searchQuery]);

    const filteredGroups = useMemo(() => {
        return addonGroups.filter((g) =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [addonGroups, searchQuery]);

    // Handlers for Addon
    const openCreateAddon = () => {
        setEditingAddon(null);
        addonForm.setData({
            name: '',
            price: '',
            cost_price: '0',
            is_active: true,
            branch_id: '',
            stock_linked: false,
            ingredient_id: '',
            ingredient_quantity: '',
        });
        setAddonModalOpen(true);
    };

    const openEditAddon = (addon: AddOnItem) => {
        setEditingAddon(addon);
        addonForm.setData({
            name: addon.name,
            price: String(addon.price),
            cost_price: String(addon.cost_price || 0),
            is_active: !!addon.is_active,
            branch_id: addon.branch_id ? String(addon.branch_id) : '',
            stock_linked: !!addon.stock_linked,
            ingredient_id: addon.ingredient_id ? String(addon.ingredient_id) : '',
            ingredient_quantity: addon.ingredient_quantity ? String(addon.ingredient_quantity) : '',
        });
        setAddonModalOpen(true);
    };

    const handleSaveAddon = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAddon) {
            addonForm.put(`/admin/addons/${editingAddon.id}`, {
                preserveScroll: true,
                onSuccess: () => setAddonModalOpen(false),
            });
        } else {
            addonForm.post('/admin/addons', {
                preserveScroll: true,
                onSuccess: () => setAddonModalOpen(false),
            });
        }
    };

    const confirmDeleteAddon = () => {
        if (!deleteAddonId) return;
        router.delete(`/admin/addons/${deleteAddonId}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteAddonId(null),
        });
    };

    // Handlers for Groups
    const openCreateGroup = () => {
        setEditingGroup(null);
        groupForm.setData({
            name: '',
            selection_type: 'single',
            is_required: false,
            min_selections: 0,
            max_selections: 1,
            is_active: true,
            sort_order: 0,
            addon_ids: [],
            product_ids: [],
        });
        setGroupModalOpen(true);
    };

    const openEditGroup = (group: AddonGroupData) => {
        setEditingGroup(group);
        const attachedAddonIds = group.items?.map((item) => item.add_on_id) || [];
        const attachedProductIds = group.products?.map((p) => p.id) || (group.product ? [group.product.id] : []);

        groupForm.setData({
            name: group.name,
            selection_type: group.selection_type || 'single',
            is_required: !!group.is_required,
            min_selections: group.min_selections || 0,
            max_selections: group.max_selections || 1,
            is_active: !!group.is_active,
            sort_order: group.sort_order || 0,
            addon_ids: attachedAddonIds,
            product_ids: attachedProductIds,
        });
        setGroupModalOpen(true);
    };

    const handleSaveGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingGroup) {
            groupForm.put(`/admin/addon-groups/${editingGroup.id}`, {
                preserveScroll: true,
                onSuccess: () => setGroupModalOpen(false),
            });
        } else {
            groupForm.post('/admin/addon-groups', {
                preserveScroll: true,
                onSuccess: () => setGroupModalOpen(false),
            });
        }
    };

    const confirmDeleteGroup = () => {
        if (!deleteGroupId) return;
        router.delete(`/admin/addon-groups/${deleteGroupId}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteGroupId(null),
        });
    };

    const toggleAddonInGroup = (addonId: number) => {
        const current = [...groupForm.data.addon_ids];
        const index = current.indexOf(addonId);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(addonId);
        }
        groupForm.setData('addon_ids', current);
    };

    const toggleProductInGroup = (productId: number) => {
        const current = [...groupForm.data.product_ids];
        const index = current.indexOf(productId);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(productId);
        }
        groupForm.setData('product_ids', current);
    };

    return (
        <AppLayout>
            <Head title="Add-ons & Modifiers Management" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                            <Sparkles className="w-7 h-7 text-pink-500" />
                            Add-ons & Modifier Groups
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Configure customize options, toppings, sides, size choices, and inventory-linked modifier groups.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {activeTab === 'addons' ? (
                            <Button
                                onClick={openCreateAddon}
                                className="bg-pink-600 hover:bg-pink-700 text-white shadow-sm flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Add-on
                            </Button>
                        ) : (
                            <Button
                                onClick={openCreateGroup}
                                className="bg-pink-600 hover:bg-pink-700 text-white shadow-sm flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Modifier Group
                            </Button>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Add-ons</span>
                            <Package className="w-5 h-5 text-pink-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{kpis.totalAddons}</div>
                        <span className="text-xs text-emerald-600 font-medium">{kpis.activeAddons} active in menu</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modifier Groups</span>
                            <Layers className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{kpis.totalGroups}</div>
                        <span className="text-xs text-slate-500">{kpis.activeGroups} active groups</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock-Linked</span>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{kpis.stockLinkedAddons}</div>
                        <span className="text-xs text-slate-500">Auto-deducts raw ingredients</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configured Products</span>
                            <Sparkles className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{products.length}</div>
                        <span className="text-xs text-slate-500">Active catalog items</span>
                    </div>
                </div>

                {/* Tabs & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('addons')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'addons'
                                    ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Individual Add-ons ({addons.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'groups'
                                    ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Modifier Groups ({addonGroups.length})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder={`Search ${activeTab === 'addons' ? 'add-ons' : 'groups'}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                        />
                    </div>
                </div>

                {/* Tab 1: Addons Table */}
                {activeTab === 'addons' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3.5">Add-on Name</th>
                                        <th className="px-5 py-3.5">Price (₱)</th>
                                        <th className="px-5 py-3.5">Inventory Tracking</th>
                                        <th className="px-5 py-3.5">Branch Scope</th>
                                        <th className="px-5 py-3.5">Status</th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredAddons.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                                                No add-on modifiers found. Click "New Add-on" to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAddons.map((addon) => (
                                            <tr key={addon.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                                                    {addon.name}
                                                </td>
                                                <td className="px-5 py-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                                    ₱{Number(addon.price).toFixed(2)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {addon.stock_linked && addon.ingredient ? (
                                                        <div className="flex flex-col text-xs">
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                                <Package className="w-3.5 h-3.5 text-pink-500" />
                                                                {addon.ingredient.name}
                                                            </span>
                                                            <span className="text-slate-500">
                                                                Deduct: {addon.ingredient_quantity} {addon.ingredient.unit}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs text-slate-400 font-normal">
                                                            Price-only (No stock)
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-xs">
                                                    {addon.branch?.name || 'All Branches'}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {addon.is_active ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openEditAddon(addon)}
                                                            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setDeleteAddonId(addon.id)}
                                                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 2: Modifier Groups */}
                {activeTab === 'groups' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredGroups.length === 0 ? (
                            <div className="col-span-2 p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-400">
                                No modifier groups found. Click "New Modifier Group" to create one.
                            </div>
                        ) : (
                            filteredGroups.map((group) => {
                                const attachedItems = group.items || [];
                                const attachedProducts = group.products || (group.product ? [group.product] : []);

                                return (
                                    <div
                                        key={group.id}
                                        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                        {group.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                group.selection_type === 'single'
                                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200'
                                                                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border-purple-200'
                                                            }
                                                        >
                                                            {group.selection_type === 'single' ? 'Single-Select (Radio)' : 'Multi-Select (Checkbox)'}
                                                        </Badge>
                                                        {group.is_required && (
                                                            <Badge className="bg-rose-500 text-white text-xs">
                                                                Required
                                                            </Badge>
                                                        )}
                                                        {group.selection_type === 'multi' && (
                                                            <span className="text-xs text-slate-500">
                                                                Min: {group.min_selections} | Max: {group.max_selections || '∞'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openEditGroup(group)}
                                                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setDeleteGroupId(group.id)}
                                                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Attached Addons */}
                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                    Options ({attachedItems.length})
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {attachedItems.length === 0 ? (
                                                        <span className="text-xs text-slate-400 italic">No add-ons assigned</span>
                                                    ) : (
                                                        attachedItems.map((item) => (
                                                            <span
                                                                key={item.id}
                                                                className="px-2 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                                            >
                                                                {item.addon?.name}{' '}
                                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                                    (+₱{Number(item.addon?.price || 0).toFixed(2)})
                                                                </span>
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Attached Products */}
                                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                    Linked Products ({attachedProducts.length})
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {attachedProducts.length === 0 ? (
                                                        <span className="text-xs text-amber-500 italic">Not linked to any product yet</span>
                                                    ) : (
                                                        attachedProducts.map((p) => (
                                                            <span
                                                                key={p.id}
                                                                className="px-2 py-0.5 rounded text-xs bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300 border border-pink-200/50"
                                                            >
                                                                {p.name}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 text-xs text-slate-400 flex items-center justify-between">
                                            <span>Sort Order: {group.sort_order}</span>
                                            <span>Status: {group.is_active ? 'Active' : 'Disabled'}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Create / Edit Addon Modal */}
            <Dialog open={addonModalOpen} onOpenChange={setAddonModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {editingAddon ? 'Edit Add-on Modifier' : 'Create New Add-on'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Configure modifier pricing and raw ingredient inventory deductions.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveAddon} className="space-y-4 pt-2">
                        <div>
                            <Label htmlFor="addon_name" className="text-xs font-semibold">Name *</Label>
                            <Input
                                id="addon_name"
                                value={addonForm.data.name}
                                onChange={(e) => addonForm.setData('name', e.target.value)}
                                placeholder="e.g., Extra Cheese, Spicy Level, Large Cup"
                                required
                                className="mt-1"
                            />
                            {addonForm.errors.name && <p className="text-xs text-rose-500 mt-1">{addonForm.errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="addon_price" className="text-xs font-semibold">Price (₱) *</Label>
                                <Input
                                    id="addon_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={addonForm.data.price}
                                    onChange={(e) => addonForm.setData('price', e.target.value)}
                                    placeholder="0.00"
                                    required
                                    className="mt-1 font-mono"
                                />
                                {addonForm.errors.price && <p className="text-xs text-rose-500 mt-1">{addonForm.errors.price}</p>}
                            </div>

                            <div>
                                <Label htmlFor="cost_price" className="text-xs font-semibold">Cost Price (₱)</Label>
                                <Input
                                    id="cost_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={addonForm.data.cost_price}
                                    onChange={(e) => addonForm.setData('cost_price', e.target.value)}
                                    placeholder="0.00"
                                    className="mt-1 font-mono"
                                />
                            </div>
                        </div>

                        {/* Stock Link Section */}
                        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-xs font-semibold cursor-pointer">Link to Inventory Stock?</Label>
                                    <p className="text-[11px] text-slate-500">Auto-deduct raw material when ordered</p>
                                </div>
                                <ToggleSwitch
                                    checked={addonForm.data.stock_linked}
                                    onCheckedChange={(val) => addonForm.setData('stock_linked', val)}
                                />
                            </div>

                            {addonForm.data.stock_linked && (
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <div>
                                        <Label className="text-xs font-semibold">Ingredient *</Label>
                                        <Select
                                            value={addonForm.data.ingredient_id}
                                            onValueChange={(val) => addonForm.setData('ingredient_id', val)}
                                        >
                                            <SelectTrigger className="mt-1 bg-white dark:bg-slate-900 text-xs">
                                                <SelectValue placeholder="Select ingredient..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {inventoryItems.map((item) => (
                                                    <SelectItem key={item.id} value={String(item.id)}>
                                                        {item.name} ({item.unit})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {addonForm.errors.ingredient_id && (
                                            <p className="text-xs text-rose-500 mt-1">{addonForm.errors.ingredient_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold">Deduction Qty *</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="e.g. 50"
                                            value={addonForm.data.ingredient_quantity}
                                            onChange={(e) => addonForm.setData('ingredient_quantity', e.target.value)}
                                            className="mt-1 bg-white dark:bg-slate-900"
                                        />
                                        {addonForm.errors.ingredient_quantity && (
                                            <p className="text-xs text-rose-500 mt-1">{addonForm.errors.ingredient_quantity}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <Label className="text-xs font-semibold">Active Status</Label>
                                <p className="text-[11px] text-slate-500">Visible for cashiers & customers</p>
                            </div>
                            <ToggleSwitch
                                checked={addonForm.data.is_active}
                                onCheckedChange={(val) => addonForm.setData('is_active', val)}
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button type="button" variant="outline" onClick={() => setAddonModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={addonForm.processing} className="bg-pink-600 hover:bg-pink-700 text-white">
                                {editingAddon ? 'Update Add-on' : 'Create Add-on'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create / Edit Modifier Group Modal */}
            <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {editingGroup ? 'Edit Modifier Group' : 'Create Modifier Group'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Configure modifier group limits, single/multi rules, and attach products.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveGroup} className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="group_name" className="text-xs font-semibold">Group Name *</Label>
                                <Input
                                    id="group_name"
                                    value={groupForm.data.name}
                                    onChange={(e) => groupForm.setData('name', e.target.value)}
                                    placeholder="e.g., Select Spice Level, Add Toppings"
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold">Selection Type *</Label>
                                <Select
                                    value={groupForm.data.selection_type}
                                    onValueChange={(val: 'single' | 'multi') => {
                                        groupForm.setData({
                                            ...groupForm.data,
                                            selection_type: val,
                                            max_selections: val === 'single' ? 1 : groupForm.data.max_selections,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="mt-1 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single Select (Radio button - Exactly 1)</SelectItem>
                                        <SelectItem value="multi">Multi Select (Checkboxes - Min/Max bounds)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-xs font-semibold">Is Selection Required?</Label>
                                    <p className="text-[11px] text-slate-500">User cannot add to cart without making a selection</p>
                                </div>
                                <ToggleSwitch
                                    checked={groupForm.data.is_required}
                                    onCheckedChange={(val) => groupForm.setData('is_required', val)}
                                />
                            </div>

                            {groupForm.data.selection_type === 'multi' && (
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <div>
                                        <Label className="text-xs font-semibold">Minimum Selections</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={groupForm.data.min_selections}
                                            onChange={(e) => groupForm.setData('min_selections', parseInt(e.target.value) || 0)}
                                            className="mt-1 bg-white dark:bg-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">Maximum Selections</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={groupForm.data.max_selections || ''}
                                            onChange={(e) => groupForm.setData('max_selections', parseInt(e.target.value) || 1)}
                                            placeholder="Leave empty for unlimited"
                                            className="mt-1 bg-white dark:bg-slate-900"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Assign Addon Options */}
                        <div>
                            <Label className="text-xs font-semibold block mb-1">Select Add-ons in this Group</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/20">
                                {addons.map((addon) => {
                                    const isSelected = groupForm.data.addon_ids.includes(addon.id);
                                    return (
                                        <button
                                            type="button"
                                            key={addon.id}
                                            onClick={() => toggleAddonInGroup(addon.id)}
                                            className={`p-2 rounded-lg text-left text-xs font-medium border transition-all flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-pink-50 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300 border-pink-300'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="truncate">{addon.name} (+₱{Number(addon.price).toFixed(2)})</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-pink-600 shrink-0 ml-1" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Assign Products */}
                        <div>
                            <Label className="text-xs font-semibold block mb-1">Apply this Group to Products</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/20">
                                {products.map((prod) => {
                                    const isSelected = groupForm.data.product_ids.includes(prod.id);
                                    return (
                                        <button
                                            type="button"
                                            key={prod.id}
                                            onClick={() => toggleProductInGroup(prod.id)}
                                            className={`p-2 rounded-lg text-left text-xs font-medium border transition-all flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-300'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="truncate">{prod.name}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button type="button" variant="outline" onClick={() => setGroupModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={groupForm.processing} className="bg-pink-600 hover:bg-pink-700 text-white">
                                {editingGroup ? 'Update Modifier Group' : 'Create Modifier Group'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Addon Dialog */}
            <Dialog open={!!deleteAddonId} onOpenChange={() => setDeleteAddonId(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertCircle className="w-5 h-5" />
                            Delete Add-on
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Are you sure you want to delete this add-on? Existing sales records will retain their historical price snapshots, but this add-on will be removed from modifier groups.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteAddonId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteAddon}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Group Dialog */}
            <Dialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertCircle className="w-5 h-5" />
                            Delete Modifier Group
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Are you sure you want to delete this modifier group? Products will no longer prompt for these choices.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteGroupId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteGroup}>Delete Group</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
