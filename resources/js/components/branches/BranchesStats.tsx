import { motion } from 'framer-motion';
import { Bike, Building2, MapPin, Navigation } from 'lucide-react';
import React, { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';

import type { Branch } from './BranchCard';

export type { Branch };

export interface BranchStatsData {
    total_branches?: number;
    internal_fleet_count?: number;
    average_radius_km?: number | string | null;
    average_base_fee?: number | string | null;
}

interface BranchesStatsProps {
    branches: Branch[];
    stats?: BranchStatsData;
}

export function BranchesStats({ branches, stats }: BranchesStatsProps) {
    const totalHubs = stats?.total_branches ?? branches.length;
    const internalFleetCount = stats?.internal_fleet_count ?? branches.filter((b) => b.has_internal_riders).length;
    
    // Average radius calculation (server-authoritative with defensive fallback)
    const avgRadiusValue = useMemo(() => {
        if (stats?.average_radius_km !== undefined && stats.average_radius_km !== null) {
            const val = Number(stats.average_radius_km);
            return !isNaN(val) && isFinite(val) && val > 0 ? val : null;
        }

        const validRadii = branches
            .map((b) => (b.delivery_radius_km !== null && b.delivery_radius_km !== '' ? Number(b.delivery_radius_km) : NaN))
            .filter((r) => !isNaN(r) && isFinite(r) && r > 0);

        if (validRadii.length === 0) return null;
        return validRadii.reduce((a, b) => a + b, 0) / validRadii.length;
    }, [branches, stats]);

    // Average base fee calculation (server-authoritative with defensive fallback)
    const avgBaseFeeValue = useMemo(() => {
        if (stats?.average_base_fee !== undefined && stats.average_base_fee !== null) {
            const val = Number(stats.average_base_fee);
            return !isNaN(val) && isFinite(val) && val >= 0 ? val : null;
        }

        const validFees = branches
            .map((b) => (b.base_delivery_fee !== null && b.base_delivery_fee !== '' ? Number(b.base_delivery_fee) : NaN))
            .filter((f) => !isNaN(f) && isFinite(f) && f >= 0);

        if (validFees.length === 0) return null;
        return validFees.reduce((a, b) => a + b, 0) / validFees.length;
    }, [branches, stats]);

    const displayRadius = avgRadiusValue !== null && !isNaN(avgRadiusValue) && isFinite(avgRadiusValue)
        ? `${avgRadiusValue.toFixed(1)} km`
        : '—';

    const displayBaseFee = avgBaseFeeValue !== null && !isNaN(avgBaseFeeValue) && isFinite(avgBaseFeeValue)
        ? formatCurrency(avgBaseFeeValue)
        : '—';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-['Outfit']">
            {/* Total Hubs */}
            <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-3xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
            >
                <div className="p-3 rounded-2xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] shrink-0">
                    <Building2 className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Total Hubs</p>
                    <h3 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] font-mono mt-0.5">{totalHubs}</h3>
                    <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Active operational branches</p>
                </div>
            </motion.div>

            {/* Internal Fleet Hubs */}
            <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-3xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
            >
                <div className="p-3 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Bike className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Internal Fleet</p>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{internalFleetCount}</h3>
                    <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Dedicated rider dispatch</p>
                </div>
            </motion.div>

            {/* Avg Delivery Radius */}
            <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-3xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
            >
                <div className="p-3 rounded-2xl bg-blue-100/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                    <Navigation className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Avg Radius</p>
                    <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">{displayRadius}</h3>
                    <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Geofence coverage zone</p>
                </div>
            </motion.div>

            {/* Avg Base Fee */}
            <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-3xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/50 dark:border-white/10 shadow-xs backdrop-blur-xl flex items-center gap-4 transition-all"
            >
                <div className="p-3 rounded-2xl bg-purple-100/60 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                    <MapPin className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Avg Base Fee</p>
                    <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">{displayBaseFee}</h3>
                    <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Starting delivery charge</p>
                </div>
            </motion.div>
        </div>
    );
}
