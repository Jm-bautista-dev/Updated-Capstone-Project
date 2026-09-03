import { Toaster } from 'sonner';

import { ConflictResolutionModal } from '@/components/conflict-resolution-modal';
import { GlobalToastContainer } from '@/components/notifications/GlobalToastContainer';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';

export default ({ children, breadcrumbs, hideFloatingBell, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} hideFloatingBell={hideFloatingBell} {...props}>
        {children}
        <Toaster position="top-right" richColors expand={false} visibleToasts={3} />
        <ConflictResolutionModal />
        <GlobalToastContainer />
    </AppLayoutTemplate>
);
