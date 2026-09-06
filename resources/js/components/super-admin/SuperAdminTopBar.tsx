import { Link } from '@inertiajs/react';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import React, { useState } from 'react';
import { broadcastLogoutEvent } from '@/lib/auth-sync';
import { SystemStatusBadge } from './SystemStatusBadge';

interface SuperAdminTopBarProps {
    user?: { name?: string; email?: string };
    environment?: string;
    isMaintenance?: boolean;
}

export const SuperAdminTopBar: React.FC<SuperAdminTopBarProps> = ({
    user,
    environment = 'PRODUCTION',
    isMaintenance = false,
}) => {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        }
        return 'dark';
    });

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const envName = (environment || 'PRODUCTION').toUpperCase();

    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
            {/* Left Section: Environment Badge & Operational Status */}
            <div className="flex items-center gap-3">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                    envName === 'PRODUCTION'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}>
                    <span className={`size-1.5 rounded-full ${envName === 'PRODUCTION' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span>{envName}</span>
                </div>

                <div className="hidden sm:block">
                    <SystemStatusBadge status={isMaintenance ? 'maintenance' : 'healthy'} />
                </div>
            </div>

            {/* Right Section: Theme Toggle & Developer Info */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className="size-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition-colors shadow-2xs"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-600" />}
                </button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

                <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
                        <User className="size-4" />
                    </div>

                    <div className="hidden md:block text-left">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {user?.name || 'Super Admin'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-40">
                            {user?.email || 'superadmin@makidesu'}
                        </p>
                    </div>

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        onClick={broadcastLogoutEvent}
                        className="size-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors shadow-2xs ml-1 cursor-pointer"
                        title="Log Out"
                    >
                        <LogOut className="size-4" />
                    </Link>
                </div>
            </div>
        </header>
    );
};
