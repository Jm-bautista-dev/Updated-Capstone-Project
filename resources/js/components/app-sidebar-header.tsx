import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType, User } from '@/types';
import { NotificationBell } from './notification-bell';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props as { auth: { user: User } };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-6">
            <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
                <SidebarTrigger className="-ml-1" />
                <div className="hidden sm:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <div className="sm:hidden truncate">
                    {breadcrumbs.length > 0 && (
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest truncate">
                            {breadcrumbs[breadcrumbs.length - 1].title}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                {auth.user.role === 'admin' && <NotificationBell />}
            </div>
        </header>
    );
}
