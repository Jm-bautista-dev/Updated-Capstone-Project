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

    const filteredEmployees = useMemo(() => {
        return employees.filter((e: any) => 
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const openCreateModal = () => {
        setEditingEmployee(null);
        reset();
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
        if (editingEmployee) {
            put(`/employees/${editingEmployee.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post('/employees', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };



    return (
        <AppLayout breadcrumbs={[{ title: 'Employees', href: '/employees' }]}>
            <Head title="Employee Management" />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border/40">
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter text-foreground">EMPLOYEE MGMT.</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Configure staff access and branch assignments</p>
                    </div>
                    <Button onClick={openCreateModal} className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20 gap-2 active:scale-95 transition-all">
                        <FiPlus className="size-4" /> Add New Member
                    </Button>
                </div>

                {/* Main Content Area */}
                <Card className="border-none shadow-xl shadow-black/5 bg-white/80 backdrop-blur-md overflow-hidden rounded-2xl ring-1 ring-black/[0.02]">
                    <div className="p-6 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-96">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <Input 
                                placeholder="Search by name or email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 bg-background rounded-xl border-border/60 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-white px-4 py-2 rounded-lg border border-border/40 shadow-sm">
                            <span className="text-primary">{filteredEmployees.length}</span> Members found
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Member Info</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Level</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Branch Assignment</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right w-[100px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
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
                                        <tr key={employee.id} className="hover:bg-primary/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner">
                                                        {employee.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="font-bold text-sm text-foreground truncate">{employee.name}</span>
                                                        <span className="text-[11px] text-muted-foreground font-medium truncate flex items-center gap-1">
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
                                                        employee.role === 'admin' ? "bg-primary shadow-sm" : "bg-muted text-muted-foreground border-border"
                                                    )}
                                                >
                                                    {employee.role === 'admin' ? <FiShield className="size-2.5" /> : <FiUser className="size-2.5" />}
                                                    {employee.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                {employee.branch ? (
                                                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-muted/30 border border-border/40 rounded-full w-fit mx-auto">
                                                        <FiBriefcase className="size-3 text-primary opacity-60" />
                                                        <span className="text-[11px] font-bold text-foreground italic">{employee.branch.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-center italic text-muted-foreground text-[10px] font-bold uppercase tracking-widest bg-destructive/5 py-1 rounded-full w-fit mx-auto px-4 border border-destructive/10">Unassigned</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <FiMoreVertical className="size-4 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-xl border-border/40">
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
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background">
                    <DialogHeader className="p-6 pb-0">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary shadow-inner">
                            <FiUser className="size-6" />
                        </div>
                        <DialogTitle className="text-2xl font-black italic tracking-tighter">
                            {editingEmployee ? 'REVISE MEMBER.' : 'ENLIST NEW MEMBER.'}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-muted-foreground uppercase opacity-70">
                            {editingEmployee ? 'Modify existing credentials and permissions.' : 'Grant administrative or cashier access to the system.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Identity <span className="text-destructive">*</span></label>
                            <Input
                                placeholder="e.g. Victor Amante"
                                className={cn("h-12 rounded-xl bg-muted/30 border-none transition-all focus:bg-background ring-offset-background placeholder:text-muted-foreground/50 font-bold", errors.name && "ring-2 ring-destructive")}
                                value={data.name}
                                onChange={(e) => {
                                    const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                    setData('name', cleaned);
                                }}
                                maxLength={50}
                                autoFocus
                            />
                            {errors.name && <p className="text-[11px] text-destructive font-bold ml-1">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Digital Mail <span className="text-destructive">*</span></label>
                            <Input
                                type="email"
                                placeholder="victor@pos.system"
                                className={cn("h-12 rounded-xl bg-muted/30 border-none transition-all focus:bg-background placeholder:text-muted-foreground/50 lowercase", errors.email && "ring-2 ring-destructive")}
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                maxLength={100}
                            />
                            {errors.email && <p className="text-[11px] text-destructive font-bold ml-1">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                Secure Key {!editingEmployee && <span className="text-destructive">*</span>}
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••••••"
                                className={cn("h-12 rounded-xl bg-muted/30 border-none transition-all focus:bg-background placeholder:text-muted-foreground/50", errors.password && "ring-2 ring-destructive")}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                minLength={8}
                                maxLength={100}
                            />
                            {errors.password ? (
                                <p className="text-[11px] text-destructive font-bold ml-1">{errors.password}</p>
                            ) : (
                                <p className="text-[10px] text-muted-foreground italic ml-1 opacity-60">Minimum 8 characters required.</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Authority <span className="text-destructive">*</span></label>
                                <Select value={data.role} onValueChange={(val) => setData('role', val)}>
                                    <SelectTrigger className={cn("h-12 rounded-xl bg-muted/30 border-none transition-all focus:bg-background font-bold uppercase text-xs tracking-tighter italic", errors.role && "ring-2 ring-destructive")}>
                                        <SelectValue placeholder="Access Level" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl">
                                        <SelectItem value="admin" className="font-bold text-xs italic uppercase">Admin Access</SelectItem>
                                        <SelectItem value="cashier" className="font-bold text-xs italic uppercase">Frontline Cashier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work HQ <span className="text-destructive">*</span></label>
                                <Select
                                    value={data.branch_id ? String(data.branch_id) : ''}
                                    onValueChange={(val) => setData('branch_id', val ? Number(val) : '')}
                                >
                                    <SelectTrigger className={cn("h-12 rounded-xl bg-muted/30 border-none transition-all focus:bg-background font-bold uppercase text-xs tracking-tighter italic", errors.branch_id && "ring-2 ring-destructive")}>
                                        <SelectValue placeholder="Branch" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl">
                                        {branches.map((b: any) => (
                                            <SelectItem key={b.id} value={String(b.id)} className="font-bold text-xs italic uppercase">{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="bg-muted/30 p-6 -mx-6 mt-6 border-t border-border/20 flex gap-2">
                            <Button type="button" variant="ghost" className="h-12 rounded-xl flex-1 font-bold text-muted-foreground active:bg-muted" onClick={() => handleModalChange(false)}>
                                Abort
                            </Button>
                            <Button 
                                className="h-12 rounded-xl flex-[2] font-black italic tracking-tight shadow-xl shadow-primary/20 active:scale-95 transition-all text-sm" 
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
