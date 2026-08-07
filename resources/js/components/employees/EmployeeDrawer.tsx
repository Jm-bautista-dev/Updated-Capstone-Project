import { Building2, Edit2, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import React from 'react';
import { EmployeeRoleBadge } from '@/components/employees/EmployeeRoleBadge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

export interface Employee {
    id: number;
    name: string;
    email: string;
    role: string;
    branch_id?: number | string | null;
    branch?: { id: number; name: string } | null;
}

interface EmployeeDrawerProps {
    employee: Employee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: (employee: Employee) => void;
    onDelete: (id: number) => void;
}

export function EmployeeDrawer({ employee, open, onOpenChange, onEdit, onDelete }: EmployeeDrawerProps) {
    if (!employee) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl border-l border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]">
                {/* Header */}
                <div className="relative p-6 bg-linear-to-br from-[#FFF5F7] via-[#FFF0F5] to-white dark:from-[#181820] dark:via-[#14141E] dark:to-[#0F0F14] border-b border-[#F8C8DC]/60 dark:border-white/10 space-y-4">
                    <SheetHeader className="text-left space-y-1">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                Staff Member Overview
                            </span>
                            <EmployeeRoleBadge role={employee.role} />
                        </div>
                        <SheetTitle className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                            {employee.name}
                        </SheetTitle>
                        <SheetDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                            System credentials, authorization level, and branch HQ deployment.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Quick Avatar Hero */}
                    <div className="flex items-center gap-4 pt-2">
                        <div className="size-16 rounded-3xl bg-linear-to-br from-[#E75480] via-[#F472B6] to-[#E75480] dark:from-[#E1062C] dark:via-[#FF4F81] dark:to-[#E1062C] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#E75480]/20 dark:shadow-[#E1062C]/30 shrink-0">
                            {employee.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-1 min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold">
                                <Building2 className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                <span>{employee.branch?.name || 'Unassigned HQ'}</span>
                            </div>
                            <p className="text-xs text-[#9E8B8E] dark:text-[#64748B] font-mono truncate">
                                Staff ID: #{employee.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="p-6 space-y-6">
                    {/* Credentials & Access Card */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                            System Access Credentials
                        </h4>

                        <div className="rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 p-4 space-y-3.5 shadow-2xs">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[#FADADD]/30 dark:bg-white/5 text-[#E75480] dark:text-[#FF4F81] shrink-0">
                                    <Mail className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Email / Login Username</p>
                                    <p className="text-xs font-bold font-mono text-[#3D2C2E] dark:text-[#F8FAFC] truncate">{employee.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-[#F8C8DC]/30 dark:border-white/10">
                                <div className="p-2.5 rounded-xl bg-[#FADADD]/30 dark:bg-white/5 text-[#E75480] dark:text-[#FF4F81] shrink-0">
                                    <ShieldCheck className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Authorization Role</p>
                                    <p className="text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        {employee.role?.toUpperCase() || 'CASHIER'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branch Info Card */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                            Branch Assignment
                        </h4>

                        <div className="rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 p-4 flex items-center justify-between gap-4 shadow-2xs">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <Building2 className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Workplace HQ</p>
                                    <p className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{employee.branch?.name || 'Unassigned HQ'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="pt-4 border-t border-[#F8C8DC]/60 dark:border-white/10 flex items-center gap-3">
                        <Button
                            type="button"
                            onClick={() => {
                                onOpenChange(false);
                                onEdit(employee);
                            }}
                            className="flex-1 h-12 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white rounded-2xl font-bold text-xs uppercase tracking-wider gap-2 cursor-pointer shadow-xs"
                        >
                            <Edit2 className="size-4" />
                            <span>Edit Account</span>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                onDelete(employee.id);
                            }}
                            className="h-12 px-4 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl font-bold text-xs uppercase tracking-wider gap-2 cursor-pointer"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
