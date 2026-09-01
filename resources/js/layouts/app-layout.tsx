import { Toaster } from 'sonner';

import { PendingOrderAlertModal } from '@/components/alerts/PendingOrderAlertModal';
import { ConflictResolutionModal } from '@/components/conflict-resolution-modal';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';

export default ({ children, breadcrumbs, hideFloatingBell, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} hideFloatingBell={hideFloatingBell} {...props}>
        {children}
        <Toaster position="top-right" richColors expand={false} />
        <ConflictResolutionModal />
        <PendingOrderAlertModal />
    </AppLayoutTemplate>
);
