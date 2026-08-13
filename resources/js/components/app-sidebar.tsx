import { Link, usePage } from '@inertiajs/react';
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
    ShoppingCart,
    Star,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { useMemo } from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem, User } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {

        title: 'Pos',
        href: '/pos',
        icon: Database,
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
        title: 'Delivery',
        href: '/deliveries',
        icon: Navigation,
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

export function AppSidebar() {
    const { auth } = usePage().props as { auth: { user: User } };
    const user = auth.user;

    const filteredNavItems = useMemo(() => {
        if (user.role === 'admin') {
            return mainNavItems.filter(item => item.title !== 'Pos');
        }

        // Cashier restricted items (manage only via POS, view-only in main nav)
        const restrictedTitles = ['Dashboard', 'Riders', 'Employees', 'Performance', 'Forecast', 'Forecast Benchmarking', 'Suggestions', 'Branches', 'Sales Data Management'];
        return mainNavItems.filter(item => !restrictedTitles.includes(item.title));
    }, [user.role]);

    const sidebarSections = [
        { label: 'Core', titles: ['Dashboard', 'Pos'] },
        { label: 'Operations', titles: ['Products', 'Categories', 'Inventory', 'Reviews & Ratings'] },
        { label: 'Sales', titles: ['Sales', 'Reports'] },
        { label: 'Analytics', titles: ['Performance', 'Forecast', 'Forecast Benchmarking', 'Suggestions'] },
        { label: 'Logistics', titles: ['Delivery', 'Riders'] },
        { label: 'Management', titles: ['Employees', 'Branches', 'Sales Data Management'] },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-none">
            <SidebarHeader className="bg-transparent pb-2 pt-4 px-5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent h-auto p-0">
                        <Link href={user.role === 'admin' ? '/dashboard' : '/pos'} className="flex flex-col items-center w-full gap-1.5">
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
