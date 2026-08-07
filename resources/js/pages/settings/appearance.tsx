import { Head } from '@inertiajs/react';
import React from 'react';

import AppearanceTabs from '@/components/appearance-tabs';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    return (
        <SettingsLayout>
            <Head title="Appearance Settings" />

            <div className="space-y-8 font-['Outfit']">
                {/* Header */}
                <div className="space-y-1 border-b border-[#F8C8DC]/40 dark:border-white/10 pb-6">
                    <h2 className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Visual Theme & Appearance
                    </h2>
                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                        Customize your interface color palette between Light Mode, Dark Mode, or System sync.
                    </p>
                </div>

                <AppearanceTabs />
            </div>
        </SettingsLayout>
    );
}
