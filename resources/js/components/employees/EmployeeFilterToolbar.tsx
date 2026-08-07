import { Building2, Filter, Search } from 'lucide-react';
import React from 'react';
import { ViewSwitcher, type ViewMode } from '@/components/products/ViewSwitcher';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Branch {
    id: number;
    name: string;
}

interface EmployeeFilterToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    filterRole: string;
    onRoleChange: (value: string) => void;
    filterBranchId: string;
    onBranchChange: (value: string) => void;
    branches: Branch[];
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export function EmployeeFilterToolbar({
    search,
    onSearchChange,
    filterRole,
    onRoleChange,
    filterBranchId,
    onBranchChange,
    branches,
    viewMode,
    onViewModeChange,
}: EmployeeFilterToolbarProps) {
    return (
        <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] p-4 sm:p-6 backdrop-blur-2xl transition-colors duration-300 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-60">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A08E91] dark:text-[#64748B] focus-within:text-[#E75480] dark:focus-within:text-[#FF4F81] transition-colors">
                        <Search className="size-4" />
                    </div>
                    <Input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search employees by name or email address..."
                        className="h-12 pl-11 pr-4 bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] rounded-2xl focus:ring-4 focus:ring-[#E75480]/15 dark:focus:ring-[#E1062C]/20 focus:border-[#E75480] dark:focus:border-[#E1062C] transition-all placeholder:text-[#C5B8BA] dark:placeholder:text-[#64748B] font-medium text-sm shadow-2xs hover:border-[#E75480]/40 dark:hover:border-white/20"
                    />
                </div>

                {/* Filters & View Switcher */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Role Filter */}
                    <Select value={filterRole || 'all'} onValueChange={onRoleChange}>
                        <SelectTrigger className="w-40 h-12 bg-white/90 dark:bg-[#181820]/90 border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs rounded-2xl font-bold text-xs uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer hover:border-[#E75480]/40 dark:hover:border-white/20 transition-all">
                            <div className="flex items-center gap-2">
                                <Filter className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                <SelectValue placeholder="All Roles" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                            <SelectItem value="all" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">
                                All Roles
                            </SelectItem>
                            <SelectItem value="admin" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-[#E75480] dark:text-[#FF4F81] cursor-pointer dark:focus:bg-white/10">
                                Admin Access
                            </SelectItem>
                            <SelectItem value="cashier" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-blue-600 dark:text-blue-400 cursor-pointer dark:focus:bg-white/10">
                                Frontline Cashier
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Branch Filter */}
                    <Select value={filterBranchId || 'all'} onValueChange={onBranchChange}>
                        <SelectTrigger className="w-44 h-12 bg-white/90 dark:bg-[#181820]/90 border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs rounded-2xl font-bold text-xs uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0] cursor-pointer hover:border-[#E75480]/40 dark:hover:border-white/20 transition-all">
                            <div className="flex items-center gap-2">
                                <Building2 className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                <SelectValue placeholder="All Branches" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 shadow-xl p-2 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                            <SelectItem value="all" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">
                                All Branches
                            </SelectItem>
                            {branches?.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)} className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer dark:focus:bg-white/10">
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* View Switcher */}
                    <ViewSwitcher mode={viewMode} onChange={onViewModeChange} />
                </div>
            </div>
        </div>
    );
}
