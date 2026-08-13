import { Link, router, usePage } from '@inertiajs/react';
import {
    Archive,
    BarChart2,
    Bike,
    Box,
    ChevronRight,
    ClipboardList,
    Cpu,
    Database,
    LayoutGrid,
    LogOut,
    MapPin,
    Moon,
    MoreHorizontal,
    Navigation,
    ShoppingCart,
    Star,
    Sun,
    TrendingUp,
    User as UserIcon,
    Users,
    Zap,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { useAppearance } from '@/hooks/use-appearance';
import type { NavItem, User } from '@/types';

const allNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'POS Kiosk', href: '/pos', icon: Database },
    { title: 'Products', href: '/products', icon: Box },
    { title: 'Categories', href: '/categories', icon: Archive },
    { title: 'Sales', href: '/sales', icon: ShoppingCart },
    { title: 'Inventory', href: '/inventory', icon: ClipboardList },
    { title: 'Reviews & Ratings', href: '/admin/reviews', icon: Star },
    { title: 'Reports', href: '/reports', icon: BarChart2 },
    { title: 'Performance', href: '/analytics/cashier-performance', icon: TrendingUp },
    { title: 'Forecast', href: '/analytics/sales-forecast', icon: Zap },
    { title: 'Forecast Benchmarking', href: '/analytics/forecast-benchmarking', icon: Cpu },
    { title: 'Suggestions', href: '/analytics/restock-suggestions', icon: ShoppingCart },
    { title: 'Delivery', href: '/deliveries', icon: Navigation },
    { title: 'Riders', href: '/riders', icon: Bike },
    { title: 'Employees', href: '/employees', icon: Users },
    { title: 'Branches', href: '/branches', icon: MapPin },
    { title: 'Sales Data Management', href: '/admin/sales-data', icon: Database },
];

const getHrefString = (href: NavItem['href'] | unknown): string => {
    if (typeof href === 'string') return href;
    if (href && typeof href === 'object' && 'url' in href && typeof (href as { url: string }).url === 'string') {
        return (href as { url: string }).url;
    }
    return '#';
};

export function MobileBottomNav() {
    const { url, props } = usePage();
    const { auth } = props as { auth: { user: User } };
    const user = auth.user;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [moreOpen, setMoreOpen] = useState(false);

    // Role-based navigation filtering matching AppSidebar
    const filteredNavItems = useMemo(() => {
        if (!user) return [];
        if (user.role === 'admin') {
            return allNavItems.filter((item) => item.title !== 'POS Kiosk');
        }
        // Cashier restricted items
        const restrictedTitles = [
            'Dashboard',
            'Riders',
            'Employees',
            'Performance',
            'Forecast',
            'Forecast Benchmarking',
            'Suggestions',
            'Branches',
            'Sales Data Management',
        ];
        return allNavItems.filter((item) => !restrictedTitles.includes(item.title));
    }, [user]);

    // Primary bottom bar items (First 4 most relevant + "More")
    const primaryItems = useMemo(() => {
        if (!user) return [];
        if (user.role === 'admin') {
            return [
                allNavItems.find((i) => i.title === 'Dashboard')!,
                allNavItems.find((i) => i.title === 'Products')!,
                allNavItems.find((i) => i.title === 'Sales')!,
                allNavItems.find((i) => i.title === 'Delivery')!,
            ];
        }
        return [
            allNavItems.find((i) => i.title === 'POS Kiosk')!,
            allNavItems.find((i) => i.title === 'Products')!,
            allNavItems.find((i) => i.title === 'Sales')!,
            allNavItems.find((i) => i.title === 'Delivery')!,
        ];
    }, [user]);

    // Secondary items for "More" sheet
    const secondaryItems = useMemo(() => {
        const primaryHrefs = new Set(primaryItems.map((i) => getHrefString(i?.href)));
        return filteredNavItems.filter((i) => !primaryHrefs.has(getHrefString(i.href)));
    }, [filteredNavItems, primaryItems]);

    // Group secondary items into clean sections
    const secondarySections = useMemo(() => {
        const sections = [
            {
                label: 'Operations & Catalog',
                titles: ['Categories', 'Inventory', 'Reviews & Ratings'],
            },
            {
                label: 'Sales & Analytics',
                titles: ['Reports', 'Performance', 'Forecast', 'Forecast Benchmarking', 'Suggestions'],
            },
            {
                label: 'Logistics & Team',
                titles: ['Riders', 'Employees', 'Branches', 'Sales Data Management'],
            },
        ];

        return sections
            .map((sec) => ({
                label: sec.label,
                items: secondaryItems.filter((i) => sec.titles.includes(i.title)),
            }))
            .filter((sec) => sec.items.length > 0);
    }, [secondaryItems]);

    const isCurrentUrl = useCallback(
        (href: NavItem['href'] | unknown) => {
            const hrefStr = getHrefString(href);
            if (hrefStr === '/dashboard' || hrefStr === '/pos') {
                return url === hrefStr;
            }
            return url.startsWith(hrefStr);
        },
        [url]
    );

    const isSecondaryActive = useMemo(() => {
        return secondaryItems.some((item) => isCurrentUrl(item.href));
    }, [secondaryItems, isCurrentUrl]);

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = () => {
        setMoreOpen(false);
        router.post('/logout');
    };

    if (!user) return null;

    return (
        <>
            {/* ── FIXED MOBILE BOTTOM NAVIGATION BAR ───────────────────────── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl border-t border-[#F8C8DC]/60 dark:border-white/10 shadow-2xl font-['Outfit'] transition-colors duration-300"
                style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.25rem)',
                }}
            >
                <div className="grid grid-cols-5 h-15 items-center px-1 max-w-md mx-auto">
                    {primaryItems.map((item) => {
                        if (!item) return null;
                        const hrefStr = getHrefString(item.href);
                        const active = isCurrentUrl(item.href);
                        const Icon = item.icon || Box;

                        return (
                            <Link
                                key={hrefStr}
                                href={hrefStr}
                                className={`flex flex-col items-center justify-center h-full w-full py-1 rounded-2xl transition-all duration-200 relative group ${
                                    active
                                        ? 'text-[#E75480] dark:text-[#FF4F81] font-black'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                {active && (
                                    <span className="absolute top-1 size-1.5 rounded-full bg-[#E75480] dark:bg-[#FF4F81] shadow-xs" />
                                )}
                                <div
                                    className={`p-1.5 rounded-xl transition-all ${
                                        active
                                            ? 'bg-[#FFF5F7] dark:bg-[#1E1E28] scale-110'
                                            : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/50'
                                    }`}
                                >
                                    <Icon className="size-5" />
                                </div>
                                <span className="text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-full px-0.5">
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}

                    {/* "More" Button */}
                    <button
                        type="button"
                        onClick={() => setMoreOpen(true)}
                        className={`flex flex-col items-center justify-center h-full w-full py-1 rounded-2xl transition-all duration-200 relative group ${
                            isSecondaryActive || moreOpen
                                ? 'text-[#E75480] dark:text-[#FF4F81] font-black'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        {(isSecondaryActive || moreOpen) && (
                            <span className="absolute top-1 size-1.5 rounded-full bg-[#E75480] dark:bg-[#FF4F81] shadow-xs" />
                        )}
                        <div
                            className={`p-1.5 rounded-xl transition-all ${
                                isSecondaryActive || moreOpen
                                    ? 'bg-[#FFF5F7] dark:bg-[#1E1E28] scale-110'
                                    : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/50'
                            }`}
                        >
                            <MoreHorizontal className="size-5" />
                        </div>
                        <span className="text-[10px] tracking-tight leading-none mt-0.5">
                            More
                        </span>
                    </button>
                </div>
            </nav>

            {/* ── MOBILE "MORE" NAVIGATION DRAWER SHEET ────────────────────── */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent
                    side="bottom"
                    className="rounded-t-[2.5rem] border-t border-[#F8C8DC]/60 dark:border-white/10 p-0 overflow-hidden bg-white/95 dark:bg-[#121218]/95 backdrop-blur-3xl font-['Outfit'] max-h-[85vh] flex flex-col shadow-2xl text-[#3D2C2E] dark:text-[#F8FAFC]"
                >
                    {/* Header Handle Bar & Title */}
                    <div className="pt-3 pb-2 px-6 border-b border-slate-100 dark:border-white/5 flex flex-col items-center shrink-0">
                        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mb-3" />
                        <div className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-linear-to-r from-[#E75480] to-[#FF4F81] text-white flex items-center justify-center font-black shadow-md">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <SheetTitle className="text-base font-black tracking-tight text-[#3D2C2E] dark:text-white flex items-center gap-2">
                                        {user.name}
                                        <Badge
                                            variant="outline"
                                            className="text-[9px] uppercase font-black px-2 py-0.2 bg-[#FFF5F7] text-[#E75480] dark:bg-[#1E1E28] dark:text-[#FF4F81] border-[#F8C8DC]"
                                        >
                                            {user.role}
                                        </Badge>
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-slate-400 font-medium">
                                        {user.email}
                                    </SheetDescription>
                                </div>
                            </div>

                            {/* Theme Toggle Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleTheme}
                                className="size-10 p-0 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                                title="Toggle Theme"
                            >
                                {resolvedAppearance === 'dark' ? (
                                    <Sun className="size-5 text-amber-400" />
                                ) : (
                                    <Moon className="size-5 text-indigo-600" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Navigation List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {secondarySections.map((sec) => (
                            <div key={sec.label} className="space-y-2">
                                <h3 className="text-[10px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-slate-400 px-2">
                                    {sec.label}
                                </h3>
                                <div className="grid grid-cols-1 gap-1">
                                    {sec.items.map((item) => {
                                        const hrefStr = getHrefString(item.href);
                                        const active = isCurrentUrl(item.href);
                                        const Icon = item.icon || Box;

                                        return (
                                            <Link
                                                key={hrefStr}
                                                href={hrefStr}
                                                onClick={() => setMoreOpen(false)}
                                                className={`flex items-center justify-between p-3 rounded-2xl transition-colors font-bold text-sm ${
                                                    active
                                                        ? 'bg-linear-to-r from-[#E75480] to-[#FF4F81] text-white shadow-md shadow-[#E75480]/20'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 text-[#3D2C2E] dark:text-[#F8FAFC]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`p-2 rounded-xl ${
                                                            active
                                                                ? 'bg-white/20 text-white'
                                                                : 'bg-[#FFF5F7] dark:bg-[#1E1E28] text-[#E75480] dark:text-[#FF4F81]'
                                                        }`}
                                                    >
                                                        <Icon className="size-4.5" />
                                                    </div>
                                                    <span>{item.title}</span>
                                                </div>
                                                <ChevronRight
                                                    className={`size-4 ${
                                                        active ? 'text-white' : 'text-slate-400'
                                                    }`}
                                                />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions (Profile & Logout) */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-3 shrink-0">
                        <Link
                            href="/profile"
                            onClick={() => setMoreOpen(false)}
                            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#181824] border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
                        >
                            <UserIcon className="size-4 text-[#E75480]" />
                            Profile Settings
                        </Link>

                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors h-auto"
                        >
                            <LogOut className="size-4" />
                            Log Out
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
