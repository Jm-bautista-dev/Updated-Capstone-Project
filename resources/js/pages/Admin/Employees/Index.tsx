import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiMapPin, FiSearch, FiMoreVertical, FiShield, FiBriefcase } from 'react-icons/fi';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EmployeeIndex({ employees, branches }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Confirmation States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, isDirty } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'cashier',
        branch_id: '' as string | number,
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

    const validateField = (name: string, value: any) => {
        let error = '';

        switch (name) {
            case 'name':
                const trimmed = String(value || '').trim();
                if (!trimmed) error = 'Full name is required';
                else if (trimmed.length < 3) error = 'Must be at least 3 characters';
                else if (trimmed.length > 80) error = 'Too long (max 80 characters)';
                else if (!/[a-zA-Z]/.test(trimmed)) error = 'Invalid name format';
                break;
            case 'email':
                const email = String(value || '').trim();
                if (!email) error = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'Invalid email format';
                break;
            case 'password':
                if (!editingEmployee) {
                    if (!value) error = 'Password is required';
                    else if (value.length < 8) error = 'Minimum 8 characters required';
                    else if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) error = 'Must include letters and numbers';
                } else if (value && value.length > 0) {
                    if (value.length < 8) error = 'Minimum 8 characters required';
                    else if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) error = 'Must include letters and numbers';
                }
                break;
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
        return employees.filter((e: any) => 
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const openCreateModal = () => {
        setEditingEmployee(null);
        reset();
        setLocalErrors({});
        setPasswordStrength(null);
        setIsModalOpen(true);
    };

    const openEditModal = (employee: any) => {
        setEditingEmployee(employee);
        setData({
            name: employee.name,
            email: employee.email,
            password: '',
            role: employee.role,
            branch_id: employee.branch_id ?? '',
        });
        setIsModalOpen(true);
        setLocalErrors({});
        setPasswordStrength(null);
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
            const err = validateField(f, (data as any)[f]);
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

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-border/40 dark:border-zinc-800">
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter text-foreground dark:text-white">EMPLOYEE MGMT.</h1>
                        <p className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest mt-1">Configure staff access and branch assignments</p>
                    </div>
                    <Button onClick={openCreateModal} className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20 gap-2 active:scale-95 transition-all">
                        <FiPlus className="size-4" /> Add New Member
                    </Button>
                </div>

                {/* Main Content Area */}
                <Card className="border-none shadow-xl shadow-black/5 bg-card dark:bg-zinc-900/50 backdrop-blur-md overflow-hidden rounded-2xl ring-1 ring-black/[0.02] dark:ring-white/[0.05]">
                    <div className="p-6 border-b border-border/40 dark:border-zinc-800 bg-muted/20 dark:bg-zinc-800/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-96">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-zinc-500 size-4" />
                            <Input 
                                placeholder="Search by name or email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 bg-background dark:bg-zinc-900 rounded-xl border-border/60 dark:border-zinc-800 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground dark:text-zinc-400 bg-background dark:bg-zinc-800 px-4 py-2 rounded-lg border border-border/40 dark:border-zinc-700 shadow-sm">
                            <span className="text-primary dark:text-white">{filteredEmployees.length}</span> Members found
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 dark:bg-zinc-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500">Member Info</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500">Access Level</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 text-center">Branch Assignment</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 text-right w-[100px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 dark:divide-zinc-800">
                                {filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                                    <FiUser className="size-8 opacity-20" />
                                                </div>
                                                <p className="font-bold text-lg italic tracking-tight uppercase">No employees found.</p>
                                                <p className="text-xs uppercase font-medium max-w-[200px] mt-2 leading-relaxed opacity-60">Try adjusting your search filters or add a new team member.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map((employee: any) => (
                                        <tr key={employee.id} className="hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-foreground font-black shadow-inner">
                                                        {employee.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="font-bold text-sm text-foreground dark:text-white truncate">{employee.name}</span>
                                                        <span className="text-[11px] text-muted-foreground dark:text-zinc-500 font-medium truncate flex items-center gap-1">
                                                            <FiMail className="size-2.5 opacity-60" /> {employee.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge 
                                                    variant={employee.role === 'admin' ? 'default' : 'secondary'} 
                                                    className={cn(
                                                        "rounded-lg px-2.5 py-1 text-[10px] items-center gap-1 font-black italic uppercase tracking-tighter",
                                                        employee.role === 'admin' ? "bg-primary dark:bg-zinc-100 dark:text-zinc-900 shadow-sm" : "bg-muted dark:bg-zinc-800 text-muted-foreground dark:text-zinc-400 border-border dark:border-zinc-700"
                                                    )}
                                                >
                                                    {employee.role === 'admin' ? <FiShield className="size-2.5" /> : <FiUser className="size-2.5" />}
                                                    {employee.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                {employee.branch ? (
                                                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-muted/30 dark:bg-zinc-800/40 border border-border/40 dark:border-zinc-700 rounded-full w-fit mx-auto">
                                                        <FiBriefcase className="size-3 text-primary dark:text-zinc-100 opacity-60" />
                                                        <span className="text-[11px] font-bold text-foreground dark:text-zinc-200 italic">{employee.branch.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-center italic text-muted-foreground dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest bg-destructive/5 dark:bg-destructive/10 py-1 rounded-full w-fit mx-auto px-4 border border-destructive/10 dark:border-destructive/20">Unassigned</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <FiMoreVertical className="size-4 text-muted-foreground dark:text-zinc-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-xl border-border/40 dark:border-zinc-800 dark:bg-zinc-900">
                                                        <DropdownMenuItem 
                                                            onClick={() => openEditModal(employee)}
                                                            className="rounded-lg gap-2 font-bold text-xs py-2.5 cursor-pointer"
                                                        >
                                                            <FiEdit2 className="size-3.5 text-primary" /> Edit Account
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDelete(employee.id)}
                                                            className="rounded-lg gap-2 font-bold text-xs py-2.5 text-destructive focus:text-destructive cursor-pointer"
                                                        >
                                                            <FiTrash2 className="size-3.5" /> Delete Member
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
                </Card>
            </div>

            <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background dark:bg-zinc-900 ring-1 ring-black/[0.05] dark:ring-white/[0.05]">
                    <DialogHeader className="p-6 pb-0">
                        <div className="size-12 rounded-2xl bg-primary/10 dark:bg-zinc-800 flex items-center justify-center mb-4 text-primary dark:text-zinc-100 shadow-inner">
                            <FiUser className="size-6" />
                        </div>
                        <DialogTitle className="text-2xl font-black italic tracking-tighter text-foreground dark:text-white">
                            {editingEmployee ? 'REVISE MEMBER.' : 'ENLIST NEW MEMBER.'}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase opacity-70">
                            {editingEmployee ? 'Modify existing credentials and permissions.' : 'Grant administrative or cashier access to the system.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 ml-1">Full Identity <span className="text-destructive">*</span></label>
                            <Input
                                placeholder="e.g. Victor Amante"
                                className={cn(
                                    "h-12 rounded-xl bg-muted/30 dark:bg-zinc-800/50 border-none transition-all focus:bg-background dark:focus:bg-zinc-800 ring-offset-background placeholder:text-muted-foreground/50 font-bold dark:text-white",
                                    localErrors.name ? "ring-2 ring-destructive" : (errors.name && "ring-2 ring-destructive")
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
                            {localErrors.name && <p className="text-[11px] text-destructive font-bold ml-1">{localErrors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 ml-1">Digital Mail <span className="text-destructive">*</span></label>
                            <Input
                                type="email"
                                placeholder="victor@pos.system"
                                className={cn(
                                    "h-12 rounded-xl bg-muted/30 dark:bg-zinc-800/50 border-none transition-all focus:bg-background dark:focus:bg-zinc-800 placeholder:text-muted-foreground/50 lowercase dark:text-white",
                                    localErrors.email ? "ring-2 ring-destructive" : (errors.email && "ring-2 ring-destructive")
                                )}
                                value={data.email}
                                onChange={(e) => {
                                    setData('email', e.target.value.toLowerCase());
                                    if (localErrors.email) validateField('email', e.target.value);
                                }}
                                onBlur={() => validateField('email', data.email)}
                                maxLength={100}
                            />
                            {localErrors.email ? (
                                <p className="text-[11px] text-destructive font-bold ml-1">{localErrors.email}</p>
                            ) : (
                                errors.email && <p className="text-[11px] text-destructive font-bold ml-1">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500">
                                    Secure Key {!editingEmployee && <span className="text-destructive">*</span>}
                                </label>
                                {passwordStrength && (
                                    <span className={cn("text-[9px] font-black uppercase tracking-widest italic animate-in slide-in-from-right-2", passwordStrength.color)}>
                                        [{passwordStrength.label}]
                                    </span>
                                )}
                            </div>
                            <Input
                                type="password"
                                placeholder="••••••••••••"
                                className={cn(
                                    "h-12 rounded-xl bg-muted/30 dark:bg-zinc-800/50 border-none transition-all focus:bg-background dark:focus:bg-zinc-800 placeholder:text-muted-foreground/50 dark:text-white",
                                    localErrors.password ? "ring-2 ring-destructive" : (errors.password && "ring-2 ring-destructive")
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
                            {localErrors.password ? (
                                <p className="text-[11px] text-destructive font-bold ml-1">{localErrors.password}</p>
                            ) : (
                                errors.password ? (
                                    <p className="text-[11px] text-destructive font-bold ml-1">{errors.password}</p>
                                ) : (
                                    <p className="text-[10px] text-muted-foreground italic ml-1 opacity-60">Minimum 8 characters with letters and numbers.</p>
                                )
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 ml-1">Authority <span className="text-destructive">*</span></label>
                                <Select 
                                    value={data.role} 
                                    onValueChange={(val) => {
                                        setData('role', val);
                                        validateField('role', val);
                                    }}
                                >
                                    <SelectTrigger className={cn(
                                        "h-12 rounded-xl bg-muted/30 dark:bg-zinc-800/50 border-none transition-all focus:bg-background dark:focus:bg-zinc-800 font-bold uppercase text-xs tracking-tighter italic dark:text-white",
                                        localErrors.role ? "ring-2 ring-destructive" : (errors.role && "ring-2 ring-destructive")
                                    )}>
                                        <SelectValue placeholder="Access Level" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl dark:bg-zinc-900 dark:border-zinc-800">
                                        <SelectItem value="admin" className="font-bold text-xs italic uppercase dark:text-zinc-300">Admin Access</SelectItem>
                                        <SelectItem value="cashier" className="font-bold text-xs italic uppercase dark:text-zinc-300">Frontline Cashier</SelectItem>
                                    </SelectContent>
                                </Select>
                                {localErrors.role && <p className="text-[9px] text-destructive font-bold ml-1 mt-1 font-mono uppercase">{localErrors.role}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 ml-1">Work HQ <span className="text-destructive">*</span></label>
                                <Select
                                    value={data.branch_id ? String(data.branch_id) : ''}
                                    onValueChange={(val) => {
                                        const bId = val ? Number(val) : '';
                                        setData('branch_id', bId);
                                        validateField('branch_id', bId);
                                    }}
                                >
                                    <SelectTrigger className={cn(
                                        "h-12 rounded-xl bg-muted/30 dark:bg-zinc-800/50 border-none transition-all focus:bg-background dark:focus:bg-zinc-800 font-bold uppercase text-xs tracking-tighter italic dark:text-white",
                                        localErrors.branch_id ? "ring-2 ring-destructive" : (errors.branch_id && "ring-2 ring-destructive")
                                    )}>
                                        <SelectValue placeholder="Branch" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl dark:bg-zinc-900 dark:border-zinc-800">
                                        {branches.map((b: any) => (
                                            <SelectItem key={b.id} value={String(b.id)} className="font-bold text-xs italic uppercase dark:text-zinc-300">{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {localErrors.branch_id && <p className="text-[9px] text-destructive font-bold ml-1 mt-1 font-mono uppercase">{localErrors.branch_id}</p>}
                            </div>
                        </div>

                        <DialogFooter className="bg-muted/30 dark:bg-zinc-800/50 p-6 -mx-6 mt-6 border-t border-border/20 dark:border-zinc-800 flex gap-2">
                            <Button type="button" variant="ghost" className="h-12 rounded-xl flex-1 font-bold text-muted-foreground dark:text-zinc-400 active:bg-muted dark:active:bg-zinc-800" onClick={() => handleModalChange(false)}>
                                Abort
                            </Button>
                            <Button 
                                className="h-12 rounded-xl flex-[2] font-black italic tracking-tight shadow-xl shadow-primary/20 active:scale-95 transition-all text-sm dark:bg-zinc-100 dark:text-zinc-900" 
                                disabled={processing || !data.name || !data.email || (!editingEmployee && !data.password) || !data.role || !data.branch_id}
                            >
                                {processing ? 'Synthesizing...' : editingEmployee ? 'UPGRADE ACCESS' : 'AUTHORIZE INITIATION'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <ConfirmDialog 
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={confirmDelete}
                variant="destructive"
                title="Delete Employee?"
                description="This will permanently remove the employee account and access permissions."
                confirmText="Delete Now"
            />

            <ConfirmDialog 
                open={showDiscardConfirm}
                onOpenChange={setShowDiscardConfirm}
                onConfirm={confirmDiscard}
                title="Unsaved Changes"
                description="You have pending modifications. Discarding will lose all unsaved progress."
                confirmText="Discard Changes"
                cancelText="Keep Editing"
            />
        </AppLayout>
    );
}
