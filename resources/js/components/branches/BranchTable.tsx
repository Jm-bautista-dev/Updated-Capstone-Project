import { Building2, Clock, MapPin, Navigation } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Branch } from './BranchCard';
import { BranchOperatingHoursModal } from './BranchOperatingHoursModal';

interface BranchTableProps {
    branches: Branch[];
    onSelectBranch: (branch: Branch) => void;
}

export function BranchTable({ branches, onSelectBranch }: BranchTableProps) {
    const [selectedHoursBranch, setSelectedHoursBranch] = useState<Branch | null>(null);

    const activeHoursBranch = selectedHoursBranch
        ? branches.find((b) => b.id === selectedHoursBranch.id) ?? selectedHoursBranch
        : null;

    return (
        <div className="w-full overflow-hidden rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors duration-300 font-['Outfit']">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-[#FFF5F7]/70 dark:bg-[#181824]/70 border-b border-[#F8C8DC]/60 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8] select-none">
                            <th className="py-4 px-6">Branch Name</th>
                            <th className="py-4 px-4">Operating Status</th>
                            <th className="py-4 px-4">Coordinates (Lat / Lng)</th>
                            <th className="py-4 px-4">Address</th>
                            <th className="py-4 px-4 text-center">Radius</th>
                            <th className="py-4 px-4 text-right">Base Fee</th>
                            <th className="py-4 px-4 text-center">Fleet</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                        {branches.map((branch) => {
                            const isBranchOpen = branch.operating_status?.is_open ?? false;
                            const currentMode = branch.operating_mode ?? 'automatic';

                            return (
                                <tr
                                    key={branch.id}
                                    className="hover:bg-[#FFF5F7]/60 dark:hover:bg-[#1C1C28]/60 transition-colors duration-150 cursor-pointer"
                                    onClick={() => onSelectBranch(branch)}
                                >
                                    <td className="py-4 px-6 font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-8 rounded-xl bg-[#FFF5F7] dark:bg-[#1C1C28] border border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shrink-0">
                                                <Building2 className="size-4" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm">{branch.name}</span>
                                                <span className="block text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] font-mono">
                                                    ID: #{branch.id}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Operating Status Column */}
                                    <td className="py-4 px-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Badge
                                                    className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                                                        isBranchOpen
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                    }`}
                                                >
                                                    <span className={`size-1.5 rounded-full mr-1 inline-block ${isBranchOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                    {isBranchOpen ? 'OPEN' : 'CLOSED'}
                                                </Badge>

                                                {currentMode !== 'automatic' && (
                                                    <Badge className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                                        ⚡ {currentMode.replace('_', ' ')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="block text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                                                {branch.operating_status?.today_hours_display ?? '10:00 AM — 8:00 PM'}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="py-4 px-4 font-mono text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                        {branch.latitude && branch.longitude ? (
                                            <div className="flex items-center gap-1">
                                                <Navigation className="size-3 text-[#E75480] dark:text-[#FF4F81] shrink-0" />
                                                <span>
                                                    {parseFloat(branch.latitude.toString()).toFixed(4)}, {parseFloat(branch.longitude.toString()).toFixed(4)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[#9E8B8E] dark:text-[#64748B] italic">Unset</span>
                                        )}
                                    </td>

                                    <td className="py-4 px-4 font-medium text-[#3D2C2E] dark:text-[#F8FAFC] max-w-xs truncate">
                                        {branch.address || 'No address specified'}
                                    </td>

                                    <td className="py-4 px-4 text-center font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        {branch.delivery_radius_km !== null && branch.delivery_radius_km !== '' && !isNaN(Number(branch.delivery_radius_km))
                                            ? `${parseFloat(branch.delivery_radius_km.toString()).toFixed(1)} km`
                                            : '—'}
                                    </td>

                                    <td className="py-4 px-4 text-right font-mono font-bold text-[#E75480] dark:text-[#FF4F81]">
                                        {branch.base_delivery_fee !== null && branch.base_delivery_fee !== '' && !isNaN(Number(branch.base_delivery_fee))
                                            ? `₱${parseFloat(branch.base_delivery_fee.toString()).toFixed(2)}`
                                            : '—'}
                                    </td>

                                    <td className="py-4 px-4 text-center">
                                        <Badge
                                            variant="secondary"
                                            className="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/40 dark:border-white/10"
                                        >
                                            {branch.has_internal_riders ? 'Internal Fleet' : 'External'}
                                        </Badge>
                                    </td>

                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-2.5 rounded-xl gap-1 text-[11px] font-bold border-[#F8C8DC]/60 dark:border-white/10 hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedHoursBranch(branch);
                                                }}
                                            >
                                                <Clock className="size-3 text-[#E75480] dark:text-[#FF4F81]" />
                                                <span>Hours</span>
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-2.5 rounded-xl gap-1 text-[11px] font-bold border-[#F8C8DC]/60 dark:border-white/10 hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectBranch(branch);
                                                }}
                                            >
                                                <MapPin className="size-3 text-[#E75480] dark:text-[#FF4F81]" />
                                                <span>Inspect</span>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Operating Hours Modal */}
            <BranchOperatingHoursModal
                branch={activeHoursBranch as any}
                open={Boolean(activeHoursBranch)}
                onClose={() => setSelectedHoursBranch(null)}
            />
        </div>
    );
}
