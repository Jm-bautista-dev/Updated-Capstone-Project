import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({ items = [], label }: { items: NavItem[]; label?: string }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-2">
            {label && (
                <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 mb-1 italic">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu>
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    "h-10 transition-all duration-200 group-hover:bg-muted/50",
                                    active && "bg-primary/10 text-primary font-bold border-l-2 border-primary rounded-none rounded-r-lg"
                                )}
                            >
                                <Link href={item.href} className="flex items-center gap-3">
                                    {item.icon && (
                                        <item.icon 
                                            className={cn(
                                                "size-4 transition-transform duration-200", 
                                                active && "scale-110"
                                            )} 
                                        />
                                    )}
                                    <span className="text-xs tracking-tight">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
