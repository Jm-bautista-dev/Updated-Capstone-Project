import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const getStatusStyle = (s: string) => {
        switch (s) {
            case 'In Stock':
                return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50';
            case 'Low Stock':
                return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50';
            case 'Out of Stock':
                return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50';
            default:
                return 'bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-400 border-gray-200/60 dark:border-gray-800/50';
        }
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs whitespace-nowrap transition-colors duration-300',
                getStatusStyle(status),
                className
            )}
        >
            <span
                className={cn(
                    'size-1.5 rounded-full shrink-0',
                    status === 'In Stock' && 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
                    status === 'Low Stock' && 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
                    status === 'Out of Stock' && 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]'
                )}
            />
            {status}
        </span>
    );
}
