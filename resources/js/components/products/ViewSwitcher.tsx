import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'grid';

interface ViewSwitcherProps {
    mode: ViewMode;
    onChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ mode, onChange }: ViewSwitcherProps) {
    return (
        <div className="flex items-center bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl p-1 shadow-2xs backdrop-blur-md transition-colors duration-300">
            <button
                type="button"
                onClick={() => onChange('table')}
                className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none',
                    mode === 'table'
                        ? 'bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs border border-[#F8C8DC]/40 dark:border-white/10'
                        : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                )}
                aria-label="Switch to Table View"
            >
                <List className="size-4" />
                <span className="hidden sm:inline">Table View</span>
            </button>

            <button
                type="button"
                onClick={() => onChange('grid')}
                className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none',
                    mode === 'grid'
                        ? 'bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs border border-[#F8C8DC]/40 dark:border-white/10'
                        : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                )}
                aria-label="Switch to Catalog Grid View"
            >
                <LayoutGrid className="size-4" />
                <span className="hidden sm:inline">Catalog View</span>
            </button>
        </div>
    );
}
