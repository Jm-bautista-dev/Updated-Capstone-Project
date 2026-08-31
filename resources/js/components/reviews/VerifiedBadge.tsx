import { CheckCircle } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
    className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ className }) => {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs select-none shrink-0',
                className
            )}
            title="Verified Customer Purchase"
        >
            <CheckCircle className="size-2.5 text-emerald-500 shrink-0" />
            <span>Verified Purchase</span>
        </span>
    );
};
