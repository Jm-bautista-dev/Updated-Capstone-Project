import { Building2, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { Branch } from './BranchCard';

interface BranchDetailDrawerProps {
    branch: Branch | null;
    open: boolean;
    onClose: () => void;
}

export function BranchDetailDrawer({ branch, open, onClose }: BranchDetailDrawerProps) {
    if (!branch) return null;

    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(branch.longitude?.toString() || '0') - 0.005},${parseFloat(branch.latitude?.toString() || '0') - 0.005},${parseFloat(branch.longitude?.toString() || '0') + 0.005},${parseFloat(branch.latitude?.toString() || '0') + 0.005}&layer=mapnik&marker=${branch.latitude},${branch.longitude}`;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl p-0 overflow-y-auto bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl border-l border-white/90 dark:border-white/10 font-['Outfit']">
                {/* Header */}
                <div className="p-6 sm:p-8 bg-linear-to-br from-[#FFF5F7] via-white to-[#FADADD]/20 dark:from-[#181824] dark:via-[#121218] dark:to-[#1C1C28] border-b border-[#F8C8DC]/60 dark:border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-linear-to-br from-[#FADADD]/60 via-[#F8C8DC]/30 to-[#FFF0F5] dark:from-[#E1062C]/20 dark:via-rose-950/20 dark:to-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shadow-2xs">
                            <Building2 className="size-6" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {branch.name}
                            </SheetTitle>
                            <SheetDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                                Operational Hub ID: <span className="font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">#{branch.id}</span>
                            </SheetDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="px-3 py-1 rounded-xl text-xs font-bold bg-white/80 dark:bg-[#252532] text-[#3D2C2E] dark:text-[#F8FAFC] border border-[#F8C8DC]/40 dark:border-white/10">
                            {branch.has_internal_riders ? 'Internal Dedicated Fleet' : '3rd-Party Delivery Service'}
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                            Active GPS Geofence
                        </Badge>
                    </div>
                </div>

                {/* Body Details */}
                <div className="p-6 sm:p-8 space-y-6">
                    {/* Live Map Box */}
                    <div className="relative h-56 rounded-3xl overflow-hidden border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/40 dark:bg-[#181820]/40">
                        {branch.latitude && branch.longitude ? (
                            <iframe
                                title="Branch Detail Map"
                                src={mapSrc}
                                className="w-full h-full border-none grayscale-15 hover:grayscale-0 transition-all duration-500"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                <MapPin className="size-10 text-[#7D6B6E]/30 dark:text-[#94A3B8]/30 mb-2" />
                                <p className="text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">Map Coordinates Pending</p>
                            </div>
                        )}
                    </div>

                    {/* Physical Location */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8]">
                            Physical Address & Coordinates
                        </h4>

                        <div className="p-4 rounded-2xl bg-[#FFF5F7]/60 dark:bg-[#181820]/60 border border-[#F8C8DC]/40 dark:border-white/10 space-y-2">
                            <p className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F8FAFC] leading-relaxed">
                                {branch.address || 'Address not specified.'}
                            </p>

                            <div className="flex items-center gap-4 text-xs font-mono text-[#7D6B6E] dark:text-[#94A3B8] pt-1">
                                <div className="flex items-center gap-1.5">
                                    <Navigation className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                    <span>Lat: {branch.latitude || 'Unset'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                    <span>Lng: {branch.longitude || 'Unset'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Operational Logistics */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#7D6B6E] dark:text-[#94A3B8]">
                            Delivery Fees & Radius
                        </h4>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/40 dark:border-white/10 text-center">
                                <p className="text-[10px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase">Radius</p>
                                <p className="text-lg font-black font-mono text-[#3D2C2E] dark:text-[#F8FAFC] mt-0.5">
                                    {branch.delivery_radius_km !== null && branch.delivery_radius_km !== '' && !isNaN(Number(branch.delivery_radius_km))
                                        ? `${parseFloat(branch.delivery_radius_km.toString()).toFixed(1)} km`
                                        : '—'}
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/40 dark:border-white/10 text-center">
                                <p className="text-[10px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase">Base Fee</p>
                                <p className="text-lg font-black font-mono text-[#E75480] dark:text-[#FF4F81] mt-0.5">
                                    {branch.base_delivery_fee !== null && branch.base_delivery_fee !== '' && !isNaN(Number(branch.base_delivery_fee))
                                        ? `₱${parseFloat(branch.base_delivery_fee.toString()).toFixed(2)}`
                                        : '—'}
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/40 dark:border-white/10 text-center">
                                <p className="text-[10px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase">Per KM</p>
                                <p className="text-lg font-black font-mono text-[#3D2C2E] dark:text-[#F8FAFC] mt-0.5">
                                    {branch.per_km_fee !== null && branch.per_km_fee !== '' && !isNaN(Number(branch.per_km_fee))
                                        ? `₱${parseFloat(branch.per_km_fee.toString()).toFixed(2)}`
                                        : '—'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Status Note */}
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                        <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                            Coordinates are active for mobile customer app location resolution and POS dispatch fee calculation.
                        </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="h-11 px-6 rounded-2xl font-bold text-xs border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] cursor-pointer"
                        >
                            Close Details
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
