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
            <SidebarMenu className="gap-1">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    "h-10 px-4 rounded-xl relative group overflow-hidden",
                                    "hover:bg-primary/[0.04]",
                                    active && "bg-primary/[0.08] text-primary font-bold"
                                )}
                            >
                                <Link href={item.href} className="flex items-center gap-4">
                                    {/* Left Accent Bar for Active State */}
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(225,6,44,0.4)]" />
                                    )}

                                    {item.icon && (
                                        <item.icon 
                                            className={cn(
                                                "size-4.5", 
                                                active ? "text-primary font-bold" : "text-primary/40 group-hover:text-primary/60"
                                            )} 
                                        />
                                    )}
                                    <span className="text-xs tracking-wide font-medium">
                                        {item.title}
                                    </span>
                                    
                                    {/* Removed active pulse dot for cleaner look */}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
