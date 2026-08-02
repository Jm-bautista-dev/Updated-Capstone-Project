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
        <SidebarGroup className="px-4 py-2">
            {label && (
                <SidebarGroupLabel className="text-[10px] font-bold text-primary/40 px-4 mb-2 tracking-[0.15em]">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-2">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    "h-11 px-5 rounded-2xl relative group overflow-hidden transition-all duration-300",
                                    "hover:bg-primary/[0.04] hover:translate-x-1",
                                    active && "bg-accent/80 text-primary font-bold shadow-sm shadow-primary/5 hover:translate-x-0"
                                )}
                            >
                                <Link href={item.href} className="flex items-center gap-4 w-full">
                                    {item.icon && (
                                        <item.icon 
                                            className={cn(
                                                "size-4.5 transition-colors duration-300", 
                                                active ? "text-primary stroke-[2.5px]" : "text-primary/45 group-hover:text-primary/70"
                                            )} 
                                        />
                                    )}
                                    <span className={cn(
                                        "text-xs tracking-wide transition-colors duration-300",
                                        active ? "font-bold text-primary" : "font-medium text-foreground/80 group-hover:text-foreground"
                                    )}>
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
