import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import { Toaster } from 'sonner';
import { ConflictResolutionModal } from '@/components/conflict-resolution-modal';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <Toaster position="top-right" richColors expand={false} />
        <ConflictResolutionModal />
    </AppLayoutTemplate>
);
