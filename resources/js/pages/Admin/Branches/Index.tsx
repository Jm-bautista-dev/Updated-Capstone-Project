import { Head } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';

import { BranchCard, type Branch } from '@/components/branches/BranchCard';
import { BranchDetailDrawer } from '@/components/branches/BranchDetailDrawer';
import { BranchesHero } from '@/components/branches/BranchesHero';
import { BranchesStats } from '@/components/branches/BranchesStats';
import { BranchTable } from '@/components/branches/BranchTable';
import AppLayout from '@/layouts/app-layout';

interface Props {
    branches: Branch[];
}

export default function BranchesIndex({ branches }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [selectedDrawerBranch, setSelectedDrawerBranch] = useState<Branch | null>(null);

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

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-['Outfit'] transition-colors duration-300">
                {/* Hero Banner Header */}
                <BranchesHero
                    totalBranches={branches.length}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {/* KPI Metrics Strip */}
                <BranchesStats branches={branches} />

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

            {/* Branch Detail Drawer */}
            <BranchDetailDrawer
                branch={selectedDrawerBranch}
                open={!!selectedDrawerBranch}
                onClose={() => setSelectedDrawerBranch(null)}
            />
        </AppLayout>
    );
}
