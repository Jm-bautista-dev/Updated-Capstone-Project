import { Head, useForm, usePage } from '@inertiajs/react';
import { 
    User, Mail, 
    Lock, CheckCircle2, Copy, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { EmployeeDrawer } from '@/components/employees/EmployeeDrawer';
import { EmployeeFilterToolbar } from '@/components/employees/EmployeeFilterToolbar';
import { EmployeeGrid } from '@/components/employees/EmployeeGrid';
import { EmployeesHero, type EmployeeKpis } from '@/components/employees/EmployeesHero';
import { EmployeeTable, type Employee } from '@/components/employees/EmployeeTable';
import { type ViewMode } from '@/components/products/ViewSwitcher';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface EmployeeCreds {
    name?: string;
    email?: string;
    password?: string;
    temp_password?: string;
    email_sent?: boolean;
    auto_generated?: boolean;
}

interface PageProps {
    flash?: {
        new_employee?: EmployeeCreds;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface Props {
    employees: Employee[];
    branches: Array<{ id: number; name: string }>;
    kpis?: EmployeeKpis;
}

export default function EmployeeIndex({ employees, branches, kpis }: Props) {
    const { props } = usePage<PageProps>();
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterBranchId, setFilterBranchId] = useState('');

    // Detail drawer state
    const [selectedEmployeeForDrawer, setSelectedEmployeeForDrawer] = useState<Employee | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Confirmation States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [newEmployeeCreds] = useState<EmployeeCreds | null>(() => props.flash?.new_employee || null);
    const [isCredsModalOpen, setIsCredsModalOpen] = useState(() => Boolean(props.flash?.new_employee));
    const [showPassword, setShowPassword] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, isDirty } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'cashier',
        branch_id: '' as string | number,
        auto_generate: true,
    });

    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
    const [passwordStrength, setPasswordStrength] = useState<{ score: number; label: string; color: string } | null>(null);

    const checkPasswordStrength = (pass: string) => {
        if (!pass) return null;
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass) || /[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;
        if (/[0-9]/.test(pass) && /[a-z]/.test(pass)) score++;

        if (score === 1) return { score: 1, label: 'Weak', color: 'text-rose-500' };
        if (score === 2) return { score: 2, label: 'Medium', color: 'text-amber-500' };
        return { score: 3, label: 'Strong', color: 'text-emerald-500' };
    };

    const validateField = (name: string, value: unknown) => {
        let error = '';

        switch (name) {
            case 'name': {
                const trimmed = String(value || '').trim();
                if (!trimmed) error = 'Full name is required';
                else if (trimmed.length < 3) error = 'Must be at least 3 characters';
                else if (trimmed.length > 80) error = 'Too long (max 80 characters)';
                else if (!/[a-zA-Z]/.test(trimmed)) error = 'Invalid name format';
                break;
            }
            case 'email': {
                const email = String(value || '').trim();
                if (!email) error = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'Invalid email format';
                break;
            }
            case 'password': {
                const passStr = String(value || '');
                if (!editingEmployee) {
                    if (data.auto_generate) break;
                    if (!passStr) error = 'Password is required';
                    else if (passStr.length < 8) error = 'Minimum 8 characters required';
                    else if (!/[a-zA-Z]/.test(passStr) || !/[0-9]/.test(passStr)) error = 'Must include letters and numbers';
                } else if (passStr && passStr.length > 0) {
                    if (passStr.length < 8) error = 'Minimum 8 characters required';
                    else if (!/[a-zA-Z]/.test(passStr) || !/[0-9]/.test(passStr)) error = 'Must include letters and numbers';
                }
                break;
            }
            case 'role':
                if (!value) error = 'Please select a role';
                break;
            case 'branch_id':
                if (!value) error = 'Please select a branch';
                break;
        }

        setLocalErrors(prev => {
            const next = { ...prev };
            if (error) next[name] = error;
            else delete next[name];
            return next;
        });

        return error;
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter((e: Employee) => {
            const matchesSearch =
                e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = !filterRole || filterRole === 'all' || e.role?.toLowerCase() === filterRole.toLowerCase();
            const matchesBranch = !filterBranchId || filterBranchId === 'all' || String(e.branch_id) === String(filterBranchId);
            return matchesSearch && matchesRole && matchesBranch;
        });
    }, [employees, searchTerm, filterRole, filterBranchId]);

    const openCreateModal = () => {
        setEditingEmployee(null);
        reset();
        setLocalErrors({});
        setPasswordStrength(null);
        setIsModalOpen(true);
    };

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setData({
            name: employee.name,
            email: employee.email,
            password: '',
            role: employee.role,
            branch_id: employee.branch_id ?? '',
            auto_generate: false,
        });
        setIsModalOpen(true);
        setLocalErrors({});
        setPasswordStrength(null);
    };

    const openEmployeeDrawer = (employee: Employee) => {
        setSelectedEmployeeForDrawer(employee);
        setIsDrawerOpen(true);
    };

    const handleModalChange = (open: boolean) => {
        if (!open && isDirty) {
            setShowDiscardConfirm(true);
        } else {
            setIsModalOpen(open);
            if (!open) reset();
        }
    };

    const confirmDiscard = () => {
        setIsModalOpen(false);
        reset();
        setShowDiscardConfirm(false);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            destroy(`/employees/${itemToDelete}`, {
                onSuccess: () => {
                    toast.success("Employee record deleted successfully");
                    setItemToDelete(null);
                },
                onError: () => toast.error("Failed to delete employee")
            });
        }
    };

    const handleDelete = (id: number) => {
        setItemToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Final Comprehensive Validation
        const fields = ['name', 'email', 'password', 'role', 'branch_id'];
        let hasLocalError = false;
        fields.forEach(f => {
            const err = validateField(f, (data as Record<string, unknown>)[f]);
            if (err) hasLocalError = true;
        });

        if (hasLocalError) return;

        if (editingEmployee) {
            put(`/employees/${editingEmployee.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setLocalErrors({});
                    toast.success("Employee updated successfully");
                },
                onError: (errs) => setLocalErrors(prev => ({ ...prev, ...errs }))
            });
        } else {
            post('/employees', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setLocalErrors({});
                    toast.success("New employee authorized");
                },
                onError: (errs) => setLocalErrors(prev => ({ ...prev, ...errs }))
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Employees', href: '/employees' }]}>
            <Head title="Employee Management" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-['Outfit'] transition-colors duration-300">
                {/* Hero Header & Summary Cards */}
                <EmployeesHero employees={employees} kpis={kpis} onOpenAddModal={openCreateModal} />

                {/* Filter Toolbar */}
                <EmployeeFilterToolbar
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterRole={filterRole}
                    onRoleChange={setFilterRole}
                    filterBranchId={filterBranchId}
                    onBranchChange={setFilterBranchId}
                    branches={branches}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {/* Employee Display (Table or Grid View) */}
                {viewMode === 'table' ? (
                    <EmployeeTable
                        employees={filteredEmployees}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        onSelectEmployee={openEmployeeDrawer}
                    />
                ) : (
                    <EmployeeGrid
                        employees={filteredEmployees}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        onSelectEmployee={openEmployeeDrawer}
                    />
                )}
            </div>

            {/* Employee Details Drawer */}
            <EmployeeDrawer
                employee={selectedEmployeeForDrawer}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onEdit={openEditModal}
                onDelete={handleDelete}
            />

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
                <DialogContent className="max-w-xl rounded-4xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#E2E8F0] font-['Outfit']">
                    <DialogHeader className="p-8 bg-linear-to-r from-[#E75480] via-[#F472B6] to-[#E75480] dark:from-[#E1062C] dark:via-[#FF4F81] dark:to-[#E1062C] text-white">
                        <DialogTitle className="text-2xl font-black">
                            {editingEmployee ? 'Update Member Access' : 'Authorize New Member'}
                        </DialogTitle>
                        <DialogDescription className="text-white/80 text-xs font-medium mt-1">
                            {editingEmployee
                                ? 'Modify credentials, authorization roles, and branch deployment.'
                                : 'Grant administrative or frontline cashier access to the system.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Full Name <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g. Victor Amante"
                                className={cn(
                                    "h-12 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]",
                                    (localErrors.name || errors.name) && "border-rose-500 ring-2 ring-rose-500/20"
                                )}
                                value={data.name}
                                onChange={(e) => {
                                    const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                    setData('name', cleaned);
                                    if (localErrors.name) validateField('name', cleaned);
                                }}
                                onBlur={() => validateField('name', data.name)}
                                maxLength={50}
                                autoFocus
                            />
                            {localErrors.name && <p className="text-xs text-rose-500 font-bold ml-1">{localErrors.name}</p>}
                        </div>

                        {/* Email Address */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Email Address <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                type="email"
                                placeholder="victor@pos.system"
                                className={cn(
                                    "h-12 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]",
                                    (localErrors.email || errors.email) && "border-rose-500 ring-2 ring-rose-500/20"
                                )}
                                value={data.email}
                                onChange={(e) => {
                                    setData('email', e.target.value.toLowerCase());
                                    if (localErrors.email) validateField('email', e.target.value);
                                }}
                                onBlur={() => validateField('email', data.email)}
                                maxLength={100}
                            />
                            {(localErrors.email || errors.email) && (
                                <p className="text-xs text-rose-500 font-bold ml-1">{localErrors.email || errors.email}</p>
                            )}
                        </div>

                        {/* Password Section */}
                        <div className="space-y-3">
                            {!editingEmployee && (
                                <div
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-[#FFF5F7] dark:bg-[#181820]/70 border border-[#F8C8DC]/60 dark:border-white/10 group cursor-pointer hover:border-[#E75480]/40 transition-all"
                                    onClick={() => setData('auto_generate', !data.auto_generate)}
                                >
                                    <div
                                        className={cn(
                                            "size-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                            data.auto_generate
                                                ? "bg-[#E75480] dark:bg-[#E1062C] border-transparent"
                                                : "border-[#9E8B8E] dark:border-white/30"
                                        )}
                                    >
                                        {data.auto_generate && <CheckCircle2 className="size-3.5 text-white" strokeWidth={3} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            Auto-generate secure key
                                        </p>
                                        <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                                            System will create a high-entropy key and email it to member.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(!data.auto_generate || editingEmployee) && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                            Password {!editingEmployee && <span className="text-rose-500">*</span>}
                                        </label>
                                        {passwordStrength && (
                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", passwordStrength.color)}>
                                                [{passwordStrength.label}]
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••••••"
                                            className={cn(
                                                "h-12 rounded-2xl pr-10 bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]",
                                                (localErrors.password || errors.password) && "border-rose-500 ring-2 ring-rose-500/20"
                                            )}
                                            value={data.password}
                                            onChange={(e) => {
                                                setData('password', e.target.value);
                                                setPasswordStrength(checkPasswordStrength(e.target.value));
                                                if (localErrors.password) validateField('password', e.target.value);
                                            }}
                                            onBlur={() => validateField('password', data.password)}
                                            minLength={8}
                                            maxLength={100}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8B8E] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {(localErrors.password || errors.password) ? (
                                        <p className="text-xs text-rose-500 font-bold ml-1">{localErrors.password || errors.password}</p>
                                    ) : (
                                        <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] font-medium ml-1">
                                            Minimum 8 characters with letters and numbers.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                            {/* Role Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Authority Role <span className="text-rose-500">*</span>
                                </label>
                                <Select
                                    value={data.role}
                                    onValueChange={(val) => {
                                        setData('role', val);
                                        validateField('role', val);
                                    }}
                                >
                                    <SelectTrigger className={cn(
                                        "h-12 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]",
                                        (localErrors.role || errors.role) && "border-rose-500 ring-2 ring-rose-500/20"
                                    )}>
                                        <SelectValue placeholder="Access Level" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                        <SelectItem value="admin" className="rounded-xl py-2 font-bold cursor-pointer text-[#E75480] dark:text-[#FF4F81]">
                                            Admin Access
                                        </SelectItem>
                                        <SelectItem value="cashier" className="rounded-xl py-2 font-bold cursor-pointer text-blue-600 dark:text-blue-400">
                                            Frontline Cashier
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {(localErrors.role || errors.role) && (
                                    <p className="text-xs text-rose-500 font-bold ml-1">{localErrors.role || errors.role}</p>
                                )}
                            </div>

                            {/* Branch Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Work HQ <span className="text-rose-500">*</span>
                                </label>
                                <Select
                                    value={data.branch_id ? String(data.branch_id) : ''}
                                    onValueChange={(val) => {
                                        const bId = val ? Number(val) : '';
                                        setData('branch_id', bId);
                                        validateField('branch_id', bId);
                                    }}
                                >
                                    <SelectTrigger className={cn(
                                        "h-12 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]",
                                        (localErrors.branch_id || errors.branch_id) && "border-rose-500 ring-2 ring-rose-500/20"
                                    )}>
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                        {branches.map((b: { id: number; name: string }) => (
                                            <SelectItem key={b.id} value={String(b.id)} className="rounded-xl py-2 font-bold cursor-pointer">
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {(localErrors.branch_id || errors.branch_id) && (
                                    <p className="text-xs text-rose-500 font-bold ml-1">{localErrors.branch_id || errors.branch_id}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-[#FFF9FA]/60 dark:bg-[#181820]/60 -mx-8 -mb-8 mt-6 border-t border-[#F8C8DC]/60 dark:border-white/10 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 rounded-2xl px-8 font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]"
                                onClick={() => handleModalChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="h-12 rounded-2xl px-10 font-bold bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white shadow-lg shadow-[#E75480]/20 cursor-pointer"
                                disabled={processing || !data.name || !data.email || (!editingEmployee && !data.auto_generate && !data.password) || !data.role || !data.branch_id}
                            >
                                {processing ? 'Saving...' : editingEmployee ? 'Update Access' : 'Authorize Member'}
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
                        <DialogTitle className="text-2xl font-black">Access Authorized!</DialogTitle>
                        <p className="text-emerald-50 text-xs font-medium">
                            {newEmployeeCreds?.email_sent
                                ? `Credentials sent to ${newEmployeeCreds?.email}`
                                : 'Credentials generated successfully.'}
                        </p>
                    </div>

                    <div className="p-8 space-y-5">
                        {newEmployeeCreds?.email_sent ? (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
                                <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                    <Mail className="size-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Email Delivered</p>
                                    <p className="opacity-80">Credentials sent to {newEmployeeCreds?.email}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
                                <div className="size-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                                    <AlertCircle className="size-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Manual Share Required</p>
                                    <p className="opacity-80">Please share these credentials manually with the member.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/60 dark:border-white/10 space-y-1 relative group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1.5">
                                    <User className="size-3" /> Identity
                                </label>
                                <p className="font-bold text-base text-[#3D2C2E] dark:text-[#F8FAFC]">{newEmployeeCreds?.name}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/60 dark:border-white/10 space-y-1 relative group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1.5">
                                    <Mail className="size-3" /> Email / Login Username
                                </label>
                                <p className="font-bold text-base select-all text-[#3D2C2E] dark:text-[#F8FAFC]">{newEmployeeCreds?.email}</p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl cursor-pointer hover:bg-white/80 dark:hover:bg-white/10"
                                    onClick={() => {
                                        navigator.clipboard.writeText(newEmployeeCreds?.email || '');
                                        toast.success("Email copied to clipboard");
                                    }}
                                >
                                    <Copy className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                </Button>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/60 dark:border-white/10 space-y-1 relative group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1.5">
                                    <Lock className="size-3" />
                                    {newEmployeeCreds?.auto_generated ? 'Auto-Generated Password' : 'Admin Password'}
                                </label>
                                <p className="font-mono font-bold text-xl tracking-wider text-[#E75480] dark:text-[#FF4F81] select-all">
                                    {newEmployeeCreds?.password}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl cursor-pointer hover:bg-white/80 dark:hover:bg-white/10"
                                    onClick={() => {
                                        navigator.clipboard.writeText(newEmployeeCreds?.password || '');
                                        toast.success("Password copied to clipboard");
                                    }}
                                >
                                    <Copy className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300 text-xs flex gap-3">
                            <div className="size-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0 mt-0.5 text-white font-bold text-[10px]">!</div>
                            <p className="font-medium leading-relaxed">
                                The employee will be required to change this password immediately upon their first login for security purposes.
                            </p>
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

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={confirmDelete}
                variant="destructive"
                title="Delete Employee Member?"
                description="This will permanently remove the employee account and all system access permissions. This action cannot be undone."
                confirmText="Delete Now"
            />

            <ConfirmDialog
                open={showDiscardConfirm}
                onOpenChange={setShowDiscardConfirm}
                onConfirm={confirmDiscard}
                title="Discard Unsaved Changes?"
                description="You have pending modifications. Discarding will lose all unsaved form inputs."
                confirmText="Discard Changes"
                cancelText="Keep Editing"
            />
        </AppLayout>
    );
}
