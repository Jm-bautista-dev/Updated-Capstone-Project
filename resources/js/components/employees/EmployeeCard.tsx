import { motion } from 'framer-motion';
import { Building2, Edit2, Mail, MoreHorizontal, Trash2, User } from 'lucide-react';
import React from 'react';
import { EmployeeRoleBadge } from '@/components/employees/EmployeeRoleBadge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Employee {
    id: number;
    name: string;
    email: string;
    role: string;
    branch_id?: number | string | null;
    branch?: { id: number; name: string } | null;
}

interface EmployeeCardProps {
    employee: Employee;
    onEdit: (employee: Employee) => void;
    onDelete: (id: number) => void;
    onSelectEmployee?: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onEdit, onDelete, onSelectEmployee }: EmployeeCardProps) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
                if (onSelectEmployee) onSelectEmployee(employee);
                else onEdit(employee);
            }}
            className="group relative rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] p-5 backdrop-blur-2xl transition-all duration-300 hover:border-[#E75480]/40 dark:hover:border-white/20 cursor-pointer flex flex-col justify-between space-y-4"
        >
            {/* Header: Avatar, Name, Email & Options */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-linear-to-br from-[#FADADD]/60 via-[#F8C8DC]/30 to-[#FFF0F5] dark:from-[#E1062C]/20 dark:via-rose-950/20 dark:to-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] font-black text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        {employee.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-base font-bold text-[#3D2C2E] dark:text-[#F8FAFC] truncate group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors">
                            {employee.name}
                        </h4>
                        <p className="text-xs text-[#9E8B8E] dark:text-[#64748B] font-mono truncate mt-0.5 flex items-center gap-1">
                            <Mail className="size-3 shrink-0 opacity-60" />
                            <span className="truncate">{employee.email}</span>
                        </p>
                    </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-xl text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] p-1.5 shadow-xl w-44 font-['Outfit']"
                        >
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] px-3 py-1.5">
                                Options
                            </DropdownMenuLabel>
                            {onSelectEmployee && (
                                <DropdownMenuItem
                                    onClick={() => onSelectEmployee(employee)}
                                    className="rounded-xl px-3 py-2 text-xs font-bold gap-2 cursor-pointer dark:focus:bg-white/10"
                                >
                                    <User className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                    <span>View Profile</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onEdit(employee)}
                                className="rounded-xl px-3 py-2 text-xs font-bold gap-2 cursor-pointer dark:focus:bg-white/10"
                            >
                                <Edit2 className="size-3.5 text-blue-500" />
                                <span>Edit Account</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#F8C8DC]/40 dark:bg-white/10 my-1" />
                            <DropdownMenuItem
                                onClick={() => onDelete(employee.id)}
                                className="rounded-xl px-3 py-2 text-xs font-bold gap-2 cursor-pointer text-rose-600 dark:text-rose-400 dark:focus:bg-rose-950/30"
                            >
                                <Trash2 className="size-3.5" />
                                <span>Delete Member</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Meta details */}
            <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#9E8B8E] dark:text-[#64748B] font-bold uppercase text-[10px] tracking-wider">Branch HQ</span>
                    <span className="font-bold text-[#3D2C2E] dark:text-[#E2E8F0] flex items-center gap-1.5 truncate">
                        <Building2 className="size-3.5 text-[#E75480] dark:text-[#FF4F81] shrink-0" />
                        <span className="truncate">{employee.branch?.name || 'Unassigned HQ'}</span>
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#9E8B8E] dark:text-[#64748B] font-bold uppercase text-[10px] tracking-wider">Member ID</span>
                    <span className="font-bold font-mono text-[#3D2C2E] dark:text-[#E2E8F0]">
                        #{employee.id}
                    </span>
                </div>
            </div>

            {/* Footer Role Badge */}
            <div className="pt-3 border-t border-[#F8C8DC]/30 dark:border-white/10 flex items-center justify-between gap-2">
                <EmployeeRoleBadge role={employee.role} />

                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                    Active Access
                </span>
            </div>
        </motion.div>
    );
}
