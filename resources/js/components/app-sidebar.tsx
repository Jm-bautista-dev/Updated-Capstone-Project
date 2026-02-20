import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Folder,
    LayoutGrid,
    Box,
    Users,
    User,
    ShoppingCart,
    Archive,
    ClipboardList,
    BarChart2,
    Database,
    CarTaxiFront,
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
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
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
        icon: Users,
    },
    {
        title: 'Categories',
        href: '/categories',
        icon: Archive,
    },
    {
        title: 'Customers',
        href: '/customers',
        icon: User,
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
        title: 'Delivery',
        href: '/delivery',
        icon: CarTaxiFront,
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
