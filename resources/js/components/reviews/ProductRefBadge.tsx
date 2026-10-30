import { Package } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface ProductRefBadgeProps {
    productName: string;
    orderNumber?: string | null;
    imagePath?: string | null;
    className?: string;
}

export const ProductRefBadge: React.FC<ProductRefBadgeProps> = ({
    productName,
    orderNumber,
    imagePath,
    className,
}) => {
    return (
        <div
            className={cn(
                'inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 text-xs max-w-full leading-snug',
                className
            )}
        >
            {imagePath ? (
                <img
                    src={imagePath}
                    alt={productName}
                    className="size-4.5 rounded-sm object-cover aspect-square shrink-0"
                    onError={(e) => {
                        // Fallback on load error
                        (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                />
            ) : (
                <Package className="size-3 text-[#FF3366] dark:text-[#FF4F81] shrink-0" />
            )}
            <span className="font-bold text-slate-800 dark:text-slate-200 wrap-break-word">
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
