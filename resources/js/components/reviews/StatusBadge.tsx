import { AlertTriangle, CheckCircle2, EyeOff, ShieldAlert } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: 'published' | 'hidden' | 'flagged' | 'pending' | string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
    switch (status) {
        case 'published':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0',
                        className
                    )}
                >
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    <span>Published</span>
                </Badge>
            );
        case 'hidden':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0',
                        className
                    )}
                >
                    <EyeOff className="size-3 text-slate-400" />
                    <span>Hidden</span>
                </Badge>
            );
        case 'flagged':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0',
                        className
                    )}
                >
                    <ShieldAlert className="size-3 text-rose-500" />
                    <span>Flagged</span>
                </Badge>
            );
        case 'pending':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0',
                        className
                    )}
                >
                    <AlertTriangle className="size-3 text-amber-500" />
                    <span>Pending</span>
                </Badge>
            );
        default:
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full',
                        className
                    )}
                >
                    {status}
                </Badge>
            );
    }
};
