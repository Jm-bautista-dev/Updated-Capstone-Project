import { usePage } from '@inertiajs/react';
import React from 'react';
import { Toaster } from 'sonner';
import { FlashMessages } from '@/components/flash-messages';
import { GlobalToastContainer } from '@/components/notifications/GlobalToastContainer';
import { SuperAdminSidebar } from '@/components/super-admin/SuperAdminSidebar';
import { SuperAdminTopBar } from '@/components/super-admin/SuperAdminTopBar';

interface SuperAdminLayoutProps {
    children: React.ReactNode;
}

interface PageProps {
    auth?: { user?: { name?: string; email?: string } };
    environment?: string;
    isMaintenance?: boolean;
    [key: string]: unknown;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const { props } = usePage<PageProps>();
    const user = props.auth?.user;
    const environment = (props.environment as string) || 'PRODUCTION';
    const isMaintenance = Boolean(props.isMaintenance);

    React.useEffect(() => {
        if (!user && typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }, [user]);

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col md:flex-row">
            {/* Grouped Nav Sidebar */}
            <SuperAdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Persistent Top Bar */}
                <SuperAdminTopBar
                    user={user}
                    environment={environment}
                    isMaintenance={isMaintenance}
                />

                {/* Flash Messages */}
                <FlashMessages />

                {/* Content Container */}
                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 overflow-y-auto">
                    {children}
                </main>

                <Toaster position="top-right" richColors expand={false} visibleToasts={3} />
                <GlobalToastContainer />
            </div>
        </div>
    );
}
