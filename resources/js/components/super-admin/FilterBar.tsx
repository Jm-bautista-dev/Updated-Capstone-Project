import { Filter, Search } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FilterBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    placeholder?: string;
    children?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    search,
    onSearchChange,
    onSubmit,
    placeholder = 'Search by keyword, ID, status or target...',
    children,
}) => {
    return (
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
                <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 pl-10 h-10 text-xs rounded-xl shadow-xs"
                />
            </div>

            {children}

            <Button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md shadow-rose-600/10 gap-1.5"
            >
                <Filter className="size-3.5" />
                Filter Records
            </Button>
        </form>
    );
};
