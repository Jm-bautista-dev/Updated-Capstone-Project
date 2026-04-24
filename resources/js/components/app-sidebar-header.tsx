import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType, User } from '@/types';
import { NotificationBell } from './notification-bell';
import { usePage } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Button } from '@/components/ui/button';
import { FiChevronDown } from 'react-icons/fi';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props as { auth: { user: User } };
    const getInitials = useInitials();

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-125 transition-transform duration-500" />
                    <SidebarTrigger className="relative z-10 size-9 border border-primary/10 bg-white/5 hover:bg-primary/10 rounded-xl transition-all duration-300 shadow-sm" />
                </div>
                
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/50 leading-none">
                            Operations Module
                        </span>
                        <div className="size-1 rounded-full bg-primary/20" />
                    </div>
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
                {/* System Status - Quick Look */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">System Live</span>
                </div>

                <div className="h-4 w-px bg-primary/10 mx-1 hidden md:block" />

                {auth.user.role === 'admin' && <NotificationBell />}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="group relative flex h-10 items-center gap-2 rounded-full px-1.5 pl-1.5 pr-3 hover:bg-primary/5 transition-all duration-300 border border-transparent hover:border-primary/10"
                        >
                            <div className="relative">
                                <Avatar className="h-7 w-7 overflow-hidden rounded-full border border-primary/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary italic">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
                            </div>
                            <div className="hidden flex-col items-start gap-0.5 md:flex">
                                <span className="text-[11px] font-black uppercase tracking-tight text-gray-900 dark:text-white leading-none">
                                    {auth.user.name.split(' ')[0]}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-primary/40 leading-none">
                                    {auth.user.role}
                                </span>
                            </div>
                            <FiChevronDown className="size-3 text-primary/40 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 mt-1" align="end" sideOffset={8}>
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
