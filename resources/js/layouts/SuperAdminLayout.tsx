import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    Database,
    FileText,
    Flag,
    GitCommit,
    LayoutDashboard,
    LogOut,
    Settings,
    Shield,
    Terminal,
    Wrench,
} from 'lucide-react';
import React from 'react';
import { FlashMessages } from '@/components/flash-messages';
import { Badge } from '@/components/ui/badge';

interface SuperAdminLayoutProps {
    children: React.ReactNode;
}

interface PageProps {
    auth?: { user?: { name?: string; email?: string } };
    url?: string;
    [key: string]: unknown;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;

    const navItems = [
        { label: 'Overview', href: '/super-admin', icon: LayoutDashboard, exact: true },
        { label: 'System Health', href: '/super-admin/system-health', icon: Activity },
        { label: 'Error Logs', href: '/super-admin/errors', icon: AlertTriangle },
        { label: 'Maintenance Mode', href: '/super-admin/maintenance', icon: Wrench },
        { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileText },
        { label: 'API Monitor', href: '/super-admin/api-monitor', icon: Terminal },
        { label: 'Database Health', href: '/super-admin/database', icon: Database },
        { label: 'Feature Flags', href: '/super-admin/features', icon: Flag },
        { label: 'Deployment & Versions', href: '/super-admin/deployment', icon: GitCommit },
        { label: 'Security Center', href: '/super-admin/security', icon: Shield },
        { label: 'System Settings', href: '/super-admin/settings', icon: Settings },
    ];

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/super-admin';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
                {/* Brand Header */}
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-linear-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                        <Terminal className="size-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-sm tracking-tight text-white uppercase italic">
                                Maki <span className="text-rose-500">Ops</span>
                            </span>
                            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[9px] font-black uppercase tracking-wider px-1.5 py-0">
                                DEV
                            </Badge>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 truncate">
                            Super Admin Console
                        </p>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        System Operations
                    </p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact
                            ? currentPath === item.href || currentPath === `${item.href}/`
                            : currentPath.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    isActive
                                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                }`}
                            >
                                <Icon className={`size-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User & Status Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between px-2 py-1 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>System Online</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">v2.5.0</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Super Admin'}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="size-8 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors"
                            title="Log Out"
                        >
                            <LogOut className="size-4" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 bg-slate-950 overflow-y-auto">
                <FlashMessages />
                <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
