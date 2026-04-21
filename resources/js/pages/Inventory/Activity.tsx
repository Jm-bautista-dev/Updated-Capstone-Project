import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    FiActivity,
    FiFilter, 
    FiCalendar, 
    FiUser, 
    FiBox, 
    FiMapPin, 
    FiArrowLeft,
    FiSearch
} from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileFilter } from '@/components/shared/mobile-filter';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Log {
    id: number;
    ingredient_id: number;
    user_id: number;
    change_qty: number;
    reason: string;
    created_at: string;
    ingredient: {
        name: string;
        unit: string;
        branch: {
            name: string;
        };
    };
    user: {
        name: string;
    } | null;
}

export default function Activity() {
    const { logs, branches, employees, filters } = usePage().props as any;
    
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || 'all');
    const [employeeFilter, setEmployeeFilter] = useState(filters.employee_id || 'all');
    const [dateFilter, setDateFilter] = useState(filters.date || '');

    const handleFilterChange = () => {
        router.get('/inventory/activity', {
            branch_id: branchFilter !== 'all' ? branchFilter : '',
            employee_id: employeeFilter !== 'all' ? employeeFilter : '',
            date: dateFilter
        }, { preserveState: true });
    };

    const resetFilters = () => {
        setBranchFilter('all');
        setEmployeeFilter('all');
        setDateFilter('');
        router.get('/inventory/activity');
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Inventory', href: '/inventory' }, { title: 'Activity Log', href: '/inventory/activity' }]}>
            <Head title="Inventory Activity Log" />

            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                             <FiActivity className="size-5 text-primary" />
                             Inventory Activity
                        </h1>
                        <p className="hidden sm:block text-muted-foreground text-sm mt-1 font-medium">Real-time monitoring of stock changes across all branches.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <MobileFilter
                            title="Activity Filters"
                            activeFilterCount={(branchFilter !== 'all' ? 1 : 0) + (employeeFilter !== 'all' ? 1 : 0) + (dateFilter ? 1 : 0)}
                            activeFilterSummary={`${branchFilter !== 'all' ? (branches.find((b: any) => String(b.id) === branchFilter)?.name || 'Branch') : 'All Branches'} • ${employeeFilter !== 'all' ? (employees.find((e: any) => String(e.id) === employeeFilter)?.name || 'Staff') : 'All Staff'} • ${dateFilter || 'Any Date'}`}
                            onApply={handleFilterChange}
                            onClear={resetFilters}
                        >
                            <div className="flex flex-col gap-6 w-full">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Branch Location</label>
                                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none ring-1 ring-black/5 font-bold uppercase text-[10px] tracking-widest px-4">
                                            <SelectValue placeholder="All Branches" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all" className="font-bold py-3 uppercase text-[10px] tracking-widest">All Branches</SelectItem>
                                            {branches.map((b: any) => (
                                                <SelectItem key={b.id} value={String(b.id)} className="font-bold py-3 uppercase text-[10px] tracking-widest">{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Staff Member</label>
                                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none ring-1 ring-black/5 font-bold uppercase text-[10px] tracking-widest px-4">
                                            <SelectValue placeholder="All Employees" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all" className="font-bold py-3 uppercase text-[10px] tracking-widest">All Employees</SelectItem>
                                            {employees.map((e: any) => (
                                                <SelectItem key={e.id} value={String(e.id)} className="font-bold py-3 uppercase text-[10px] tracking-widest">{e.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Specific Date</label>
                                    <div className="relative">
                                        <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
                                        <Input 
                                            type="date" 
                                            className="pl-12 h-12 rounded-xl bg-muted/30 border-none ring-1 ring-black/5 font-bold" 
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </MobileFilter>

                        <Button variant="outline" size="sm" onClick={() => window.history.back()} className="h-10 rounded-xl gap-2 font-bold text-xs">
                            <FiArrowLeft className="size-4" /> <span className="hidden sm:inline">Back</span>
                        </Button>
                    </div>
                </div>

                {/* Filters (Desktop only) */}
                <Card className="hidden md:block border-none shadow-sm ring-1 ring-black/5">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Branch</label>
                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches.map((b: any) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Employee</label>
                            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="All Employees" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    {employees.map((e: any) => (
                                        <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Date</label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                                <Input 
                                    type="date" 
                                    className="pl-9 h-9" 
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button className="h-9 flex-1 font-bold uppercase text-[10px] tracking-widest" onClick={handleFilterChange}>
                                Apply Filters
                            </Button>
                            <Button variant="ghost" className="h-9 px-3" onClick={resetFilters}>
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>


                {/* Activity Table */}
                <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date & Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Employee</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branch</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ingredient</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Quantity</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.data.map((log: Log) => (
                                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <FiUser className="size-3 text-primary" />
                                                </div>
                                                <span className="font-bold">{log.user ? log.user.name : 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                                {log.ingredient.branch ? log.ingredient.branch.name : 'N/A'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-foreground">
                                            {log.ingredient.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.change_qty > 0 ? (
                                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] font-bold uppercase">🟢 Added</Badge>
                                            ) : (
                                                <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-bold uppercase">🔴 Deducted</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black font-mono">
                                            {Math.abs(log.change_qty)} {log.ingredient.unit}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-muted-foreground font-medium italic">{log.reason}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.links.length > 3 && (
                        <div className="p-4 border-t flex justify-center bg-muted/10 gap-2">
                            {logs.links.map((link: any, i: number) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className="h-8 min-w-[32px]"
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
