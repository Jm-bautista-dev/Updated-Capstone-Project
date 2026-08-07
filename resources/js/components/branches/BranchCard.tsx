import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, MapPin, Navigation, Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface Branch {
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

interface BranchCardProps {
    branch: Branch;
}

export function BranchCard({ branch }: BranchCardProps) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name: branch.name,
        address: branch.address ?? '',
        latitude: branch.latitude?.toString() ?? '',
        longitude: branch.longitude?.toString() ?? '',
        delivery_radius_km: branch.delivery_radius_km?.toString() ?? '5',
        has_internal_riders: branch.has_internal_riders,
        base_delivery_fee: branch.base_delivery_fee?.toString() ?? '49',
        per_km_fee: branch.per_km_fee?.toString() ?? '15',
    });

    const [isFetchingAddress, setIsFetchingAddress] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Auto-close success modal and manage "Recently Saved" feedback
    useEffect(() => {
        if (recentlySuccessful) {
            setShowSuccessModal(true);
            setIsEditing(false); // Lock the form after success
            const timer = setTimeout(() => setShowSuccessModal(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [recentlySuccessful]);

    // Auto-fetch address from Lat/Lng using Nominatim (Debounced)
    useEffect(() => {
        if (!isEditing) return; // Only auto-fetch address while in Edit Mode

        const fetchAddress = async () => {
            setGeoError(null);
            setIsFetchingAddress(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.latitude}&lon=${data.longitude}&zoom=18&addressdetails=1`,
                    { headers: { 'User-Agent': 'Maki-Desu-Inventory-System' } }
                );
                const result = await response.json();
                if (result.display_name) {
                    setData('address', result.display_name);
                } else if (result.error) {
                    setGeoError('Location not found');
                }
            } catch {
                setGeoError('Failed to reach geocoding service');
            } finally {
                setIsFetchingAddress(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (data.latitude && data.longitude) {
                const lat = parseFloat(data.latitude);
                const lon = parseFloat(data.longitude);

                if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    fetchAddress();
                } else {
                    setGeoError('Invalid coordinate range');
                }
            }
        }, 1200);

        return () => clearTimeout(timeoutId);
    }, [data.latitude, data.longitude, isEditing, setData]);

    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(data.longitude || '0') - 0.005},${parseFloat(data.latitude || '0') - 0.005},${parseFloat(data.longitude || '0') + 0.005},${parseFloat(data.latitude || '0') + 0.005}&layer=mapnik&marker=${data.latitude},${data.longitude}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 overflow-hidden font-['Outfit']"
        >
            {/* Success Overlay Modal */}
            {showSuccessModal && (
                <div
                    className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setShowSuccessModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-[#181820] border border-white/90 dark:border-white/10 shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4 max-w-xs w-full text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="size-10 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">SAVED!</h3>
                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] mt-1 font-medium">
                                Branch parameters synchronized across system services.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 border-b border-[#F8C8DC]/60 dark:border-white/10">
                <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-2xl bg-linear-to-br from-[#FADADD]/60 via-[#F8C8DC]/30 to-[#FFF0F5] dark:from-[#E1062C]/20 dark:via-rose-950/20 dark:to-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shadow-2xs">
                        <Building2 className="size-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-bold text-base text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {data.name}
                            </h2>
                            {recentlySuccessful && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider animate-pulse">
                                    ✓ Synced
                                </Badge>
                            )}
                            {!isEditing && (
                                <Badge variant="outline" className="text-[10px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase tracking-wider">
                                    Read Only
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                            Hub ID: <span className="font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">#{branch.id}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1 rounded-xl text-xs font-bold bg-white/70 dark:bg-[#252532] text-[#3D2C2E] dark:text-[#F8FAFC] border border-[#F8C8DC]/40 dark:border-white/10">
                        {data.has_internal_riders ? 'Internal Fleet' : '3P Delivery'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left Form */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!isEditing) {
                            setIsEditing(true);
                            return;
                        }

                        put(`/branches/${branch.id}`, {
                            preserveScroll: true,
                            onSuccess: () => console.log('Branch Update Successful'),
                            onError: (err) => {
                                console.error('Branch Update Failed', err);
                                if (err.latitude || err.longitude) {
                                    setGeoError('Coordinates rejected by server.');
                                }
                            },
                        });
                    }}
                    className="p-6 space-y-4 border-r border-[#F8C8DC]/40 dark:border-white/10"
                >
                    {/* Validation Errors */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold p-3.5 rounded-2xl flex flex-col gap-1">
                            <p className="uppercase tracking-widest text-[10px] font-black">⚠️ Validation Warnings:</p>
                            {Object.values(errors).map((err, i) => (
                                <li key={i} className="list-none flex items-center gap-2 font-medium">
                                    <span className="size-1.5 bg-rose-500 rounded-full" />
                                    {err}
                                </li>
                            ))}
                        </div>
                    )}

                    {geoError && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold p-3 rounded-2xl">
                            {geoError}
                        </div>
                    )}

                    {/* Fixed Identity Banner */}
                    <div className="p-3.5 rounded-2xl bg-[#FFF5F7]/80 dark:bg-[#1C1C28]/80 border border-[#F8C8DC]/50 dark:border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Fixed Identity</span>
                        <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                            <span className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{branch.name}</span>
                        </div>
                    </div>

                    {/* Coordinates Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8] ml-1">Latitude</label>
                            <div className="relative mt-1">
                                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                                <Input
                                    value={data.latitude}
                                    disabled={!isEditing}
                                    onChange={(e) => setData('latitude', e.target.value)}
                                    placeholder="Lat"
                                    className={`pl-9 h-10 rounded-xl font-mono text-xs ${!isEditing ? 'bg-black/5 dark:bg-white/5 opacity-70 cursor-not-allowed' : 'bg-white dark:bg-[#181820]'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8] ml-1">Longitude</label>
                            <div className="relative mt-1">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                                <Input
                                    value={data.longitude}
                                    disabled={!isEditing}
                                    onChange={(e) => setData('longitude', e.target.value)}
                                    placeholder="Lng"
                                    className={`pl-9 h-10 rounded-xl font-mono text-xs ${!isEditing ? 'bg-black/5 dark:bg-white/5 opacity-70 cursor-not-allowed' : 'bg-white dark:bg-[#181820]'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Textarea */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8] ml-1">Physical Address</label>
                            {isFetchingAddress && (
                                <span className="text-[10px] text-[#E75480] dark:text-[#FF4F81] font-bold animate-pulse">RE-RESOLVING...</span>
                            )}
                        </div>
                        <textarea
                            value={data.address}
                            disabled={!isEditing}
                            onChange={(e) => setData('address', e.target.value)}
                            className={`w-full min-h-17.5 p-3 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium resize-none transition-all outline-none ${!isEditing ? 'bg-black/5 dark:bg-white/5 opacity-70 cursor-not-allowed' : 'bg-white dark:bg-[#181820] focus:ring-2 focus:ring-[#E75480]/20'}`}
                            placeholder="Determined by map coordinates..."
                        />
                    </div>

                    {/* Operational Parameters */}
                    <div className="border-t border-[#F8C8DC]/40 dark:border-white/10 pt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[9px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase">Radius (km)</label>
                                <Input
                                    disabled={!isEditing}
                                    type="number"
                                    value={data.delivery_radius_km}
                                    onChange={(e) => setData('delivery_radius_km', e.target.value)}
                                    className="mt-1 h-9 rounded-xl font-mono text-xs bg-white dark:bg-[#181820]"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase">Base Fee (₱)</label>
                                <Input
                                    disabled={!isEditing}
                                    type="number"
                                    value={data.base_delivery_fee}
                                    onChange={(e) => setData('base_delivery_fee', e.target.value)}
                                    className="mt-1 h-9 rounded-xl font-mono text-xs bg-white dark:bg-[#181820]"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-[#7D6B6E] dark:text-[#94A3B8] uppercase">Per KM Fee (₱)</label>
                                <Input
                                    disabled={!isEditing}
                                    type="number"
                                    value={data.per_km_fee}
                                    onChange={(e) => setData('per_km_fee', e.target.value)}
                                    className="mt-1 h-9 rounded-xl font-mono text-xs bg-white dark:bg-[#181820]"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={!isEditing}
                            onClick={() => setData('has_internal_riders', !data.has_internal_riders)}
                            className={`flex items-center gap-2 text-xs font-bold transition-opacity cursor-pointer ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${data.has_internal_riders ? 'bg-[#E75480] dark:bg-[#FF4F81]' : 'bg-black/20 dark:bg-white/20'}`}>
                                <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${data.has_internal_riders ? 'left-4.5' : 'left-0.5'}`} />
                            </div>
                            <span className="text-[#3D2C2E] dark:text-[#F8FAFC]">Internal Rider Fleet Enabled</span>
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex gap-3">
                        {isEditing && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="h-11 px-4 rounded-2xl font-bold text-xs border-[#F8C8DC]/60 dark:border-white/10 hover:bg-[#FFF5F7] dark:hover:bg-white/10 cursor-pointer"
                            >
                                CANCEL
                            </Button>
                        )}

                        <Button
                            type="submit"
                            disabled={processing}
                            className={`flex-1 h-11 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                                isEditing
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                    : 'bg-[#E75480] hover:bg-[#D43F6B] text-white shadow-[#E75480]/20'
                            }`}
                        >
                            {isEditing ? <Save className="size-4" /> : <X className="size-4 rotate-45" />}
                            {processing ? 'SYNCING...' : isEditing ? 'SAVE CHANGES' : 'EDIT LOCATION'}
                        </Button>
                    </div>
                </form>

                {/* Right Map Preview */}
                <div className="relative min-h-87.5 bg-[#FFF5F7]/30 dark:bg-[#121218]/40 overflow-hidden">
                    {data.latitude && data.longitude ? (
                        <iframe
                            key={data.latitude + data.longitude}
                            title="Branch Location"
                            className="w-full h-full grayscale-20 hover:grayscale-0 transition-all duration-700 border-none"
                            src={mapSrc}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                            <MapPin className="size-12 text-[#7D6B6E]/30 dark:text-[#94A3B8]/30 mb-2" />
                            <p className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">Coordinates Missing</p>
                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-1">
                                Provide latitude and longitude to verify physical branch location.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
