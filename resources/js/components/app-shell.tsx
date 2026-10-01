import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';

type Props = {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
};

export function AppShell({ children, variant = 'header' }: Props) {
    const { url, props } = usePage();
    const isPos = url === '/pos' || url.startsWith('/pos?') || url.startsWith('/pos/');
    const isOpen = isPos ? false : (props.sidebarOpen ?? true);

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return <SidebarProvider defaultOpen={!isPos && isOpen}>{children}</SidebarProvider>;
}
