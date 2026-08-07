import { Shield, User } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

export type EmployeeRole = 'admin' | 'cashier' | string;

interface EmployeeRoleBadgeProps {
    role: EmployeeRole;
    className?: string;
}

export function EmployeeRoleBadge({ role, className }: EmployeeRoleBadgeProps) {
    const normalizeRole = role?.toLowerCase() || 'cashier';

    const getRoleDetails = (r: string) => {
        switch (r) {
            case 'admin':
                return {
                    label: 'Admin Access',
                    icon: Shield,
                    style: 'bg-[#E75480]/10 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] border-[#E75480]/20 dark:border-[#E1062C]/30',
                };
            case 'cashier':
                return {
                    label: 'Frontline Cashier',
                    icon: User,
                    style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30',
                };
            default:
                return {
                    label: role,
                    icon: User,
                    style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-slate-500/30',
                };
        }
    };

    const details = getRoleDetails(normalizeRole);
    const Icon = details.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors select-none',
                details.style,
                className
            )}
        >
            <Icon className="size-3 shrink-0" />
            <span>{details.label}</span>
        </span>
    );
}
