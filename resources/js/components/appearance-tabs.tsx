import { Monitor, Moon, Sun } from 'lucide-react';
import React, { type HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: React.ElementType; label: string; description: string }[] = [
        { value: 'light', icon: Sun, label: 'Light Mode', description: 'Soft pink & clean luxury aesthetic' },
        { value: 'dark', icon: Moon, label: 'Dark Mode', description: 'Deep obsidian dark glass aesthetic' },
        { value: 'system', icon: Monitor, label: 'System Default', description: 'Sync automatically with OS preference' },
    ];

    return (
        <div
            className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans', className)}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label, description }) => {
                const isActive = appearance === value;
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'p-5 rounded-3xl text-left border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 select-none',
                            isActive
                                ? 'bg-white dark:bg-[#181820] border-[#E75480] dark:border-[#FF4F81] shadow-md shadow-[#E75480]/10 dark:shadow-[#FF4F81]/10 ring-2 ring-[#E75480]/20'
                                : 'bg-white/60 dark:bg-[#181820]/60 border-[#F8C8DC]/40 dark:border-white/10 hover:border-[#E75480]/40 dark:hover:border-white/20'
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className={cn(
                                'p-3 rounded-2xl transition-colors',
                                isActive
                                    ? 'bg-[#E75480] dark:bg-[#E1062C] text-white'
                                    : 'bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#7D6B6E] dark:text-[#94A3B8]'
                            )}>
                                <Icon className="size-5" />
                            </div>
                            <span className={cn(
                                'size-3 rounded-full border-2 transition-all',
                                isActive ? 'bg-[#E75480] dark:bg-[#FF4F81] border-[#E75480]' : 'border-black/20 dark:border-white/20'
                            )} />
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{label}</h4>
                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-1 leading-snug">{description}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
