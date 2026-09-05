import { Head } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';

import { BranchCard, type Branch } from '@/components/branches/BranchCard';
import { BranchDetailDrawer } from '@/components/branches/BranchDetailDrawer';
import { BranchesHero } from '@/components/branches/BranchesHero';
import { BranchesStats, type BranchStatsData } from '@/components/branches/BranchesStats';
import { BranchTable } from '@/components/branches/BranchTable';
import { CreateBranchModal } from '@/components/branches/CreateBranchModal';
import AppLayout from '@/layouts/app-layout';

interface Props {
    branches: Branch[];
    stats?: BranchStatsData;
}

export default function BranchesIndex({ branches, stats }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [selectedDrawerBranch, setSelectedDrawerBranch] = useState<Branch | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Filter branches based on search query
    const filteredBranches = useMemo(() => {
        if (!searchQuery.trim()) return branches;
        const q = searchQuery.toLowerCase();
        return branches.filter(
            (b) =>
                b.name.toLowerCase().includes(q) ||
                (b.address && b.address.toLowerCase().includes(q)) ||
                b.id.toString().includes(q)
        );
    }, [branches, searchQuery]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Management', href: '#' }, { title: 'Branches', href: '/branches' }]}>
            <Head title="Branch Management" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                {/* Hero Banner Header */}
                <BranchesHero
                    totalBranches={branches.length}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onAddBranch={() => setIsCreateModalOpen(true)}
                />

                {/* KPI Metrics Strip */}
                <BranchesStats branches={branches} stats={stats} />

                {/* Branch Display Content Area */}
                {viewMode === 'grid' ? (
                    <div className="space-y-6">
                        {filteredBranches.map((branch) => (
                            <BranchCard key={branch.id} branch={branch} />
                        ))}
                    </div>
                ) : (
                    <BranchTable
                        branches={filteredBranches}
                        onSelectBranch={(branch) => setSelectedDrawerBranch(branch)}
                    />
                )}
            </div>

            {/* Create Branch Modal */}
            <CreateBranchModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Branch Detail Drawer */}
            <BranchDetailDrawer
                branch={selectedDrawerBranch}
                open={!!selectedDrawerBranch}
                onClose={() => setSelectedDrawerBranch(null)}
            />
        </AppLayout>
    );
}
