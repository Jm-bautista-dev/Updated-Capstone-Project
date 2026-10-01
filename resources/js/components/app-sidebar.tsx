import { Link, router, usePage } from '@inertiajs/react';
import {
    Archive,
    BarChart2,
    Bike,
    Box,
    ClipboardList,
    Cpu,
    Database,
    LayoutGrid,
    MapPin,
    Navigation,
    ShoppingBag,
    ShoppingCart,
    Star,
    TrendingUp,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import type { NavItem, User } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'POS',
        href: '/pos',
        icon: Database,
    },
    {
        title: 'Delivery Orders',
        href: '/deliveries',
        icon: Navigation,
    },
    {
        title: 'Pickup Orders',
        href: '/pickups',
        icon: ShoppingBag,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Box,
    },
    {
        title: 'Categories',
        href: '/categories',
        icon: Archive,
    },
    {
        title: 'Add-ons & Modifiers',
        href: '/admin/addons',
        icon: Zap,
    },
    {
        title: 'Sales',
        href: '/sales',
        icon: ShoppingCart,
    },
    {
        title: 'Inventory',
        href: '/inventory',
        icon: ClipboardList,
    },
    {
        title: 'Reviews & Ratings',
        href: '/admin/reviews',
        icon: Star,
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: BarChart2,
    },
    {
        title: 'Performance',
        href: '/analytics/cashier-performance',
        icon: TrendingUp,
    },
    {
        title: 'Forecast',
        href: '/analytics/sales-forecast',
        icon: Zap,
    },
    {
        title: 'Forecast Benchmarking',
        href: '/analytics/forecast-benchmarking',
        icon: Cpu,
    },
    {
        title: 'Suggestions',
        href: '/analytics/restock-suggestions',
        icon: ShoppingCart,
    },
    {
        title: 'Riders',
        href: '/riders',
        icon: Bike,
    },
    {
        title: 'Employees',
        href: '/employees',
        icon: Users,
    },
    {
        title: 'Branches',
        href: '/branches',
        icon: MapPin,
    },
    {
        title: 'Sales Data Management',
        href: '/admin/sales-data',
        icon: Database,
    },
];

export function AppSidebar({ isPos: isPosProp }: { isPos?: boolean }) {
    const { url, props } = usePage();
    const { auth } = props as { auth: { user: User } };
    const user = auth.user;
    const { isMobile, openMobile, setOpenMobile, open, setOpen } = useSidebar();

    const isPos = isPosProp ?? (url === '/pos' || url.startsWith('/pos?') || url.startsWith('/pos/'));

    // Automatically close sidebar on POS navigation
    useEffect(() => {
        if (!isPos) return;
        const unsubscribe = router.on('start', () => {
            setOpen(false);
            setOpenMobile(false);
            document.body.style.removeProperty('pointer-events');
        });
        return () => unsubscribe();
    }, [isPos, setOpen, setOpenMobile]);

    // Handle Escape key to close POS drawer
    useEffect(() => {
        if (!isPos || (!open && !openMobile)) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                setOpenMobile(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPos, open, openMobile, setOpen, setOpenMobile]);

    const handleLogoClick = () => {
        setOpen(false);
        if (isMobile) {
            setOpenMobile(false);
            document.body.style.removeProperty('pointer-events');
        }
    };

    const filteredNavItems = useMemo(() => {
        if (!user) return [];
        if (user.role === 'admin' || user.role === 'super_admin') {
            return mainNavItems.filter(item => item.title !== 'POS' && item.title !== 'Pos');
        }

        // Cashier restricted items (manage only via POS, view-only in main nav)
        const restrictedTitles = ['Dashboard', 'Riders', 'Employees', 'Performance', 'Forecast', 'Forecast Benchmarking', 'Suggestions', 'Branches', 'Sales Data Management', 'Add-ons & Modifiers'];
        return mainNavItems.filter(item => !restrictedTitles.includes(item.title));
    }, [user]);

    const sidebarSections = [
        { label: 'Core', titles: ['Dashboard', 'POS', 'Delivery Orders', 'Pickup Orders'] },
        { label: 'Operations', titles: ['Products', 'Categories', 'Add-ons & Modifiers', 'Inventory', 'Reviews & Ratings'] },
        { label: 'Sales', titles: ['Sales', 'Reports'] },
        { label: 'Analytics', titles: ['Performance', 'Forecast', 'Forecast Benchmarking', 'Suggestions'] },
        { label: 'Management', titles: ['Employees', 'Riders', 'Branches', 'Sales Data Management'] },
    ];

    if (!user) return null;

    // POS-SPECIFIC OVERLAY DRAWER (Takes 0px space when closed, opens as an overlay drawer with backdrop)
    if (isPos) {
        const isDrawerOpen = isMobile ? openMobile : open;
        if (!isDrawerOpen) return null;

        return (
            <>
                {/* Backdrop Overlay */}
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
                    onClick={() => {
                        setOpen(false);
                        setOpenMobile(false);
                    }}
                    aria-hidden="true"
                />

                {/* Sliding Drawer Navigation Panel */}
                <aside
                    className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#121218] border-r border-[#F8C8DC]/60 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform animate-in slide-in-from-left"
                    role="dialog"
                    aria-label="POS Navigation Menu"
                >
                    {/* Header with Logo, Title, and Close Button */}
                    <div className="flex items-center justify-between p-4 border-b border-[#F8C8DC]/40 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                        <Link
                            href={user.role === 'admin' || user.role === 'super_admin' ? '/dashboard' : '/pos'}
                            onClick={handleLogoClick}
                            className="flex items-center gap-3 group"
                        >
                            <img
                                src="/images/maki-desu-logo.png"
                                alt="Maki Desu Logo"
                                className="w-10 h-10 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="flex flex-col">
                                <span className="font-black text-sm tracking-tight uppercase italic text-gray-900 dark:text-white leading-none">
                                    Maki <span className="text-primary">Desu</span>
                                </span>
                                <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-primary/60 mt-0.5">
                                    Operations Gateway
                                </span>
                            </div>
                        </Link>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setOpen(false);
                                setOpenMobile(false);
                            }}
                            className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            aria-label="Close navigation"
                            title="Close Menu"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>

                    {/* Navigation Menu List */}
                    <div className="flex-1 overflow-y-auto py-3 gap-2 flex flex-col">
                        {sidebarSections.map((section) => {
                            const items = filteredNavItems.filter((item) => section.titles.includes(item.title));
                            if (items.length === 0) return null;
                            return <NavMain key={section.label} label={section.label} items={items} />;
                        })}
                    </div>

                    {/* Footer with User Account Menu */}
                    <div className="p-3 border-t border-[#F8C8DC]/40 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                        <NavUser />
                    </div>
                </aside>
            </>
        );
    }

    // STANDARD APP SIDEBAR FOR ALL NON-POS PAGES (Dashboard, Inventory, Products, Reports, Sales, etc.)
    return (
        <Sidebar collapsible="icon" variant="inset" className="border-none">
            <SidebarHeader className="bg-transparent pb-2 pt-4 px-5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent h-auto p-0">
                            <Link 
                                href={user.role === 'admin' || user.role === 'super_admin' ? '/dashboard' : '/pos'} 
                                onClick={handleLogoClick}
                                className="flex flex-col items-center w-full gap-1.5"
                            >
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-125 transition-transform duration-500" />
                                    <img 
                                        src="/images/maki-desu-logo.png" 
                                        alt="Maki Desu Logo" 
                                        className="w-12 h-12 object-contain relative z-10 drop-shadow-lg transition-transform duration-500 group-hover:scale-110" 
                                    />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="font-black text-base tracking-tighter uppercase italic text-gray-900 dark:text-white leading-none">
                                        Maki <span className="text-primary">Desu</span>
                                    </span>
                                    <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-primary/30 mt-0.5">
                                        Operations Gateway
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-3 py-4">
                {sidebarSections.map((section) => {
                    const items = filteredNavItems.filter((item) => section.titles.includes(item.title));
                    if (items.length === 0) return null;
                    return <NavMain key={section.label} label={section.label} items={items} />;
                })}
            </SidebarContent>

            <SidebarFooter className="p-4 mt-auto">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
