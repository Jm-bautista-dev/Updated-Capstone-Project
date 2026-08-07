import { Head } from '@inertiajs/react';
import React, { useState } from 'react';

import { ExportCenter } from '@/components/reports/ExportCenter';
import { InsightCard } from '@/components/reports/InsightCard';
import { RecentReportsCard, type RecentReport } from '@/components/reports/RecentReportsCard';
import { ReportsAnalytics } from '@/components/reports/ReportsAnalytics';
import { ReportsDrawer } from '@/components/reports/ReportsDrawer';
import { ReportsHero } from '@/components/reports/ReportsHero';
import { ReportsNavigation } from '@/components/reports/ReportsNavigation';
import { ReportsTable } from '@/components/reports/ReportsTable';
import AppLayout from '@/layouts/app-layout';

export default function Reports() {
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('30d');
    const [selectedReport, setSelectedReport] = useState<RecentReport | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleInspectReport = (report: RecentReport) => {
        setSelectedReport(report);
        setIsDrawerOpen(true);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }]}>
            <Head title="Maki Desu Business Intelligence" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-[calc(100vh-64px)] overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                
                {/* ── ZONE 1: EXECUTIVE HERO BANNER & BI KPIS ── */}
                <ReportsHero />

                {/* ── ZONE 2: CATEGORY NAVIGATION PILLS & CONTROLS ── */}
                <ReportsNavigation
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onExportData={() => window.print()}
                    onSyncIntel={() => window.location.reload()}
                />

                {/* ── ZONE 3: AI INSIGHT RECOMMENDATIONS ── */}
                <InsightCard />

                {/* ── ZONE 4: ANALYTICS VISUALIZATION CHARTS ── */}
                <ReportsAnalytics />

                {/* ── ZONE 5: EXPORT & DISTRIBUTION CENTER ── */}
                <ExportCenter />

                {/* ── ZONE 6: RECENT GENERATED REPORTS ── */}
                <RecentReportsCard
                    onInspectReport={handleInspectReport}
                />

                {/* ── ZONE 7: SYSTEM TELEMETRY AUDIT LOG TABLE ── */}
                <ReportsTable />

            </div>

            {/* Report Inspection Drawer */}
            <ReportsDrawer
                report={selectedReport}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
        </AppLayout>
    );
}
