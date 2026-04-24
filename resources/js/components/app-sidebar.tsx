import {
    BookOpen,
    Folder,
    LayoutGrid,
    Box,
    Users,
    User as UserIcon,
    ShoppingCart,
    Archive,
    ClipboardList,
    BarChart2,
    Database,
    CarTaxiFront,
    Truck,
    Navigation,
    Bike,
    TrendingUp,
    Zap,
    MapPin,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
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
import AppLogo from './app-logo';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { Link } from '@inertiajs/react';

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
        title: 'Suppliers',
        href: '/suppliers',
        icon: Truck,
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
];

const footerNavItems: NavItem[] = [
];

export function AppSidebar() {
    const { auth } = usePage().props as { auth: { user: User } };
    const user = auth.user;

    const filteredNavItems = useMemo(() => {
        if (user.role === 'admin') {
            return mainNavItems.filter(item => item.title !== 'Pos');
        }

        // Cashier restricted items (manage only via POS, view-only in main nav)
        const restrictedTitles = ['Dashboard', 'Suppliers', 'Riders', 'Employees', 'Performance', 'Forecast', 'Suggestions', 'Branches'];
        return mainNavItems.filter(item => !restrictedTitles.includes(item.title));
    }, [user.role]);

    const sidebarSections = [
        { label: 'Core', titles: ['Dashboard', 'Pos'] },
        { label: 'Operations', titles: ['Products', 'Categories', 'Inventory', 'Suppliers'] },
        { label: 'Sales', titles: ['Sales', 'Reports'] },
        { label: 'Analytics', titles: ['Performance', 'Forecast', 'Suggestions'] },
        { label: 'Logistics', titles: ['Delivery', 'Riders'] },
        { label: 'Management', titles: ['Employees', 'Branches'] },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r-0 border-l-[3px] border-primary/60 bg-[#fffcfd] dark:bg-[#1a1414]">
            <SidebarHeader className="bg-transparent pb-8 pt-10 px-6">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent h-auto p-0">
                            <Link href={user.role === 'admin' ? '/dashboard' : '/pos'} className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-7 bg-primary rounded-full glow-primary" />
                                    <span className="font-black text-2xl tracking-tighter uppercase italic text-gray-900 dark:text-white leading-none">
                                        Maki <span className="text-primary">Desu</span>
                                    </span>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-primary/30 ml-5">
                                    Operations Gateway
                                </span>
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

            <SidebarFooter className="p-4 border-t border-primary/5">
                <NavFooter items={footerNavItems} />
                <div className="mt-4">
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
