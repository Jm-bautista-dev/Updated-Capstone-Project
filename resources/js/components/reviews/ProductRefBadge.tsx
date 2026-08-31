import { Package } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface ProductRefBadgeProps {
    productName: string;
    orderNumber?: string | null;
    className?: string;
}

export const ProductRefBadge: React.FC<ProductRefBadgeProps> = ({
    productName,
    orderNumber,
    className,
}) => {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 text-xs max-w-full truncate',
                className
            )}
        >
            <Package className="size-3 text-[#FF3366] dark:text-[#FF4F81] shrink-0" />
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {productName}
            </span>
            {orderNumber && (
                <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 shrink-0">
                    ({orderNumber})
                </span>
            )}
        </div>
    );
};
