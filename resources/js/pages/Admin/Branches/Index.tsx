import { useForm } from '@inertiajs/react';
import { MapPin, Save, Building2, Navigation, CheckCircle2, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import React, { useState, useEffect } from 'react';

// Fix for TypeScript error: Cannot find name 'route'
declare var route: any;

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

interface Props {
    branches: Branch[];
}

function BranchCard({ branch }: { branch: Branch }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name:                branch.name,
        address:             branch.address ?? '',
        latitude:            branch.latitude?.toString()  ?? '',
        longitude:           branch.longitude?.toString() ?? '',
        delivery_radius_km:  branch.delivery_radius_km?.toString() ?? '5',
        has_internal_riders: branch.has_internal_riders,
        base_delivery_fee:   branch.base_delivery_fee?.toString()  ?? '49',
        per_km_fee:          branch.per_km_fee?.toString() ?? '15',
    });

    const [isFetchingAddress, setIsFetchingAddress] = React.useState(false);
    const [geoError, setGeoError] = React.useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);

    // Auto-close success modal and manage "Recently Saved" feedback
    React.useEffect(() => {
        if (recentlySuccessful) {
            setShowSuccessModal(true);
            setIsEditing(false); // Lock the form after success
            const timer = setTimeout(() => setShowSuccessModal(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [recentlySuccessful]);

    // Auto-fetch address from Lat/Lng using Nominatim (Debounced)
    React.useEffect(() => {
        if (!isEditing) return; // Only auto-fetch address while in Edit Mode

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
    }, [data.latitude, data.longitude, isEditing]);

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
        } catch (error) {
            setGeoError('Failed to reach geocoding service');
        } finally {
            setIsFetchingAddress(false);
        }
    };

    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(data.longitude) - 0.005},${parseFloat(data.latitude) - 0.005},${parseFloat(data.longitude) + 0.005},${parseFloat(data.latitude) + 0.005}&layer=mapnik&marker=${data.latitude},${data.longitude}`;

    // Safe route helper to avoid "route is not defined"
    const safeRoute = (name: string, params?: any) => {
        const routeFn = (window as any).route || (globalThis as any).route;
        if (!routeFn) {
            console.error('Ziggy route helper is not initialized.');
            return '';
        }
        return routeFn(name, params);
    };

    return (
        <div className="relative rounded-2xl border bg-card shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
            {/* Success Overlay Modal */}
            {showSuccessModal && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setShowSuccessModal(false)}
                >
                    <div 
                        className="bg-card border shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4 max-w-xs w-full text-center transform transition-all duration-300 scale-100 opacity-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="size-10 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic">SAVED!</h3>
                            <p className="text-sm text-muted-foreground mt-1">Branch data is now synchronized across all systems.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-muted/30 border-b">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h2 className="font-bold text-base flex items-center gap-2">
                        {data.name}
                        {recentlySuccessful && (
                            <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse transition-opacity">
                                ✓ Synced
                            </span>
                        )}
                        {!isEditing && (
                            <span className="text-[9px] font-bold text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full uppercase tracking-tight italic">
                                Read Only
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-muted-foreground">Operational ID: {branch.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left: Form Fields */}
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        if (!isEditing) {
                            setIsEditing(true);
                            return;
                        }

                        // Primary fix: Use direct URL to bypass Ziggy initialization issues
                        put(`/branches/${branch.id}`, {
                            preserveScroll: true,
                            onSuccess: () => console.log('Update Successful'),
                            onError: (err) => {
                                console.error('Update Failed', err);
                                if (err.latitude || err.longitude) {
                                    setGeoError('Coordinates rejected by server.');
                                }
                            }
                        });
                    }}
                    className="p-6 space-y-4 border-r border-muted/30"
                >
                    {/* Error Summary */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold p-3 rounded-xl flex flex-col gap-1">
                            <p className="uppercase tracking-widest text-[9px] mb-1">⚠️ Validation Errors:</p>
                            {Object.values(errors).map((err, i) => (
                                <li key={i} className="list-none flex items-center gap-2">
                                    <span className="size-1 bg-destructive rounded-full" />
                                    {err}
                                </li>
                            ))}
                        </div>
                    )}

                    {/* Fixed Identity Section */}
                    <div className="bg-muted/40 p-4 rounded-xl border border-dashed flex flex-col gap-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Fixed Branch Identity</label>
                        <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-primary" />
                            <span className="text-sm font-bold">{branch.name}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Latitude</label>
                            <div className="relative mt-1">
                                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    value={data.latitude}
                                    disabled={!isEditing}
                                    onChange={e => setData('latitude', e.target.value)}
                                    placeholder="Lat"
                                    className={`w-full h-11 rounded-xl border pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/30 transition-all ${!isEditing ? 'bg-muted/10 opacity-70 cursor-not-allowed' : 'bg-muted/20'}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Longitude</label>
                            <div className="relative mt-1">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    value={data.longitude}
                                    disabled={!isEditing}
                                    onChange={e => setData('longitude', e.target.value)}
                                    placeholder="Lng"
                                    className={`w-full h-11 rounded-xl border pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/30 transition-all ${!isEditing ? 'bg-muted/10 opacity-70 cursor-not-allowed' : 'bg-muted/20'}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Physical Address</label>
                            {isFetchingAddress && <span className="text-[9px] text-primary animate-pulse font-bold">RE-RESOLVING...</span>}
                        </div>
                        <textarea
                            value={data.address}
                            disabled={!isEditing}
                            onChange={e => setData('address', e.target.value)}
                            className={`w-full min-h-[70px] p-3 rounded-xl border text-sm resize-none transition-all ${!isEditing ? 'bg-muted/10 opacity-70 cursor-not-allowed' : 'bg-muted/20'}`}
                            placeholder="Determined by map coordinates..."
                        />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[9px] font-bold text-muted-foreground uppercase">Radius (km)</label>
                                <input disabled={!isEditing} type="number" value={data.delivery_radius_km} onChange={e => setData('delivery_radius_km', e.target.value)} className="mt-1 w-full h-9 rounded-lg border bg-muted/10 px-3 text-xs" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-muted-foreground uppercase">Base Fee (₱)</label>
                                <input disabled={!isEditing} type="number" value={data.base_delivery_fee} onChange={e => setData('base_delivery_fee', e.target.value)} className="mt-1 w-full h-9 rounded-lg border bg-muted/10 px-3 text-xs" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-muted-foreground uppercase">KM Fee (₱)</label>
                                <input disabled={!isEditing} type="number" value={data.per_km_fee} onChange={e => setData('per_km_fee', e.target.value)} className="mt-1 w-full h-9 rounded-lg border bg-muted/10 px-3 text-xs" />
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={!isEditing}
                            onClick={() => setData('has_internal_riders', !data.has_internal_riders)}
                            className={`flex items-center gap-2 text-xs font-bold transition-opacity ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${data.has_internal_riders ? 'bg-primary' : 'bg-muted'}`}>
                                <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${data.has_internal_riders ? 'left-4.5' : 'left-0.5'}`} />
                            </div>
                            Uses Internal Riders
                        </button>
                    </div>

                    <div className="pt-2 flex gap-3">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="h-11 px-4 rounded-xl border font-bold text-xs hover:bg-muted/50 transition-colors"
                            >
                                CANCEL
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className={`flex-1 h-11 rounded-xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                                isEditing 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                                : 'bg-primary text-primary-foreground'
                            }`}
                        >
                            {isEditing ? <Save className="size-4" /> : <X className="size-4 rotate-45" />}
                            {processing ? 'SYNCING...' : (isEditing ? 'SAVE CHANGES' : 'EDIT LOCATION')}
                        </button>
                    </div>
                </form>

                {/* Right: Map Preview */}
                <div className="relative min-h-[350px] bg-muted/20">
                    {data.latitude && data.longitude ? (
                        <iframe
                            key={data.latitude + data.longitude}
                            title="Branch Location"
                            className="w-full h-full grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                            src={mapSrc}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                            <MapPin className="size-12 text-muted-foreground/30 mb-2" />
                            <p className="text-sm font-bold text-muted-foreground/50">Coordinates missing</p>
                            <p className="text-xs text-muted-foreground/40 mt-1">Provide latitude and longitude to verify the physical location here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BranchesIndex({ branches }: Props) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Management', href: '#' }, { title: 'Branches', href: '/branches' }]}>
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Branch Registry</h1>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Verify and update the physical mapping for your operational hubs. This data powers the mobile app's "Nearest Branch" logic.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-2xl border border-primary/20">
                        <MapPin className="size-4" />
                        <span className="text-xs font-black uppercase tracking-widest">{branches.length} Registered Hubs</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {branches.map(branch => (
                        <BranchCard key={branch.id} branch={branch} />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
