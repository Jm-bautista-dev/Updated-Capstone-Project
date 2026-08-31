import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
    category: string;
    className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className }) => {
    return (
        <span
            className={cn(
                'inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider text-[#FF3366] dark:text-[#FF4F81] select-none truncate',
                className
            )}
        >
            {category || 'Uncategorized'}
        </span>
    );
};
