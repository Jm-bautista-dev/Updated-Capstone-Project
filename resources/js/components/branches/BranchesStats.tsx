import { motion } from 'framer-motion';
import { Bike, Building2, MapPin, Navigation } from 'lucide-react';
import React from 'react';

interface Branch {
    id: number;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    delivery_radius_km: number | null;
    has_internal_riders: boolean;
    base_delivery_fee: number | null;
    per_km_fee: number | null;
}

interface BranchesStatsProps {
    branches: Branch[];
}

export function BranchesStats({ branches }: BranchesStatsProps) {
    const totalHubs = branches.length;
    const internalFleetCount = branches.filter((b) => b.has_internal_riders).length;
    
    const validRadii = branches.map((b) => b.delivery_radius_km).filter((r): r is number => r !== null && !isNaN(r));
    const avgRadius = validRadii.length > 0 ? (validRadii.reduce((a, b) => a + b, 0) / validRadii.length).toFixed(1) : '5.0';

    const validFees = branches.map((b) => b.base_delivery_fee).filter((f): f is number => f !== null && !isNaN(f));
    const avgBaseFee = validFees.length > 0 ? (validFees.reduce((a, b) => a + b, 0) / validFees.length).toFixed(0) : '49';

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
                    <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">{avgRadius} km</h3>
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
                    <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">₱{avgBaseFee}</h3>
                    <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B]">Starting delivery charge</p>
                </div>
            </motion.div>
        </div>
    );
}
