import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    Database,
    FileText,
    Flag,
    GitCommit,
    LayoutDashboard,
    ScrollText,
    Settings,
    Shield,
    Terminal,
    Wrench,
} from 'lucide-react';
import React from 'react';

export const SuperAdminSidebar: React.FC = () => {
    const { url } = usePage();
    const currentPath = url || (typeof window !== 'undefined' ? window.location.pathname : '/super-admin');

    const navGroups = [
        {
            group: 'OPERATIONS',
            items: [
                { label: 'Overview', href: '/super-admin', icon: LayoutDashboard, exact: true },
                { label: 'System Health', href: '/super-admin/system-health', icon: Activity },
                { label: 'API Monitor', href: '/super-admin/api-monitor', icon: Terminal },
            ],
        },
        {
            group: 'DIAGNOSTICS',
            items: [
                { label: 'Log Viewer', href: '/super-admin/logs', icon: ScrollText },
                { label: 'Error Logs', href: '/super-admin/errors', icon: AlertTriangle },
                { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileText },
                { label: 'Security Center', href: '/super-admin/security', icon: Shield },
            ],
        },
        {
            group: 'CONTROL',
            items: [
                { label: 'Maintenance Mode', href: '/super-admin/maintenance', icon: Wrench },
                { label: 'Feature Flags', href: '/super-admin/features', icon: Flag },
                { label: 'Database Health', href: '/super-admin/database', icon: Database },
                { label: 'System Settings', href: '/super-admin/settings', icon: Settings },
            ],
        },
        {
            group: 'DEPLOYMENT',
            items: [
                { label: 'Release & Version', href: '/super-admin/deployment', icon: GitCommit },
            ],
        },
    ];

    return (
        <aside className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            {/* Brand Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/20 text-white shrink-0">
                    <Terminal className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white uppercase italic">
                            Maki <span className="text-rose-600 dark:text-rose-500">Ops</span>
                        </span>
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider px-1.5 py-0 rounded-md">
                            DEV
                        </span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        Developer Operations
                    </p>
                </div>
            </div>

            {/* Nav Groups */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                {navGroups.map((group) => (
                    <div key={group.group} className="space-y-1">
                        <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                            {group.group}
                        </p>

                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.exact
                                ? currentPath === item.href || currentPath === `${item.href}/`
                                : currentPath.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                        isActive
                                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <Icon className={`size-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Status Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px]">
                    <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>System Online</span>
                    </div>
                    <span className="font-mono text-slate-400 dark:text-slate-500">v2.5.0</span>
                </div>
            </div>
        </aside>
    );
};
