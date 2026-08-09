import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { FlashMessages } from '@/components/flash-messages';
import { useRealTime } from '@/hooks/use-real-time';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
}: AppLayoutProps) {
    useRealTime();

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden relative bg-transparent">
                <FlashMessages />
                {children}
            </AppContent>
        </AppShell>
    );
}
