import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { FlashMessages } from '@/components/flash-messages';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { NotificationBell } from '@/components/notification-bell';
import { useRealTime } from '@/hooks/use-real-time';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
}: AppLayoutProps) {
    useRealTime();

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="w-full max-w-full min-w-0 overflow-x-hidden relative bg-transparent pb-20 md:pb-0">
                {/* Minimal Floating Notification Bell in Top-Right of Page Content Area */}
                <div className="absolute top-4 right-4 z-40">
                    <NotificationBell />
                </div>
                <FlashMessages />
                {children}
            </AppContent>
            <MobileBottomNav />
        </AppShell>
    );
}
