import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Activity,
    Bike,
    Building2,
    CheckCircle2,
    ChevronRight,
    Compass,
    MapPin,
    Navigation,
    Phone,
    Radio,
    RefreshCw,
    ShieldAlert,
    Wifi,
    WifiOff,
    Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ActiveRiderData {
    id: number;
    name: string;
    phone: string | null;
    status: string;
    is_active: boolean;
    signal_status: 'live' | 'signal_delayed' | 'offline';
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
    seconds_ago: number;
    last_updated_at: string;
    raw_timestamp?: string;
    branch: {
        id: number | null;
        name: string;
        latitude: number;
        longitude: number;
    };
    delivery: {
        id: number;
        order_number: string;
        status: string;
        status_label: string;
        customer_name: string;
        customer_address: string | null;
        latitude: number | null;
        longitude: number | null;
    } | null;
}

interface StatsSummary {
    total_active: number;
    live: number;
    delayed: number;
    offline: number;
}

interface LiveRiderMapProps {
    initialRiders?: ActiveRiderData[];
    tileProviderUrl?: string;
}

const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Helper to generate dynamic SVG DivIcons for Leaflet
const createRiderDivIcon = (rider: ActiveRiderData, isSelected: boolean) => {
    let statusColorClass = 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80';
    let pulseHtml = '<span class="absolute -top-1 -right-1 size-3 bg-emerald-500 rounded-full animate-ping opacity-75"></span>';

    if (rider.signal_status === 'signal_delayed') {
        statusColorClass = 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/80';
        pulseHtml = '';
    } else if (rider.signal_status === 'offline') {
        statusColorClass = 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/80';
        pulseHtml = '';
    }

    const selectedRing = isSelected ? 'ring-4 ring-[#E75480] scale-125 z-50' : 'scale-100';

    const html = `
        <div class="relative flex items-center justify-center size-10 rounded-2xl border-2 shadow-xl backdrop-blur-md transition-all duration-300 ${statusColorClass} ${selectedRing}">
            ${rider.signal_status === 'live' ? pulseHtml : ''}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"></path>
                <circle cx="7.5" cy="17.5" r="2.5"></circle>
                <circle cx="17.5" cy="17.5" r="2.5"></circle>
            </svg>
        </div>
    `;

    return L.divIcon({
        html,
        className: 'custom-rider-leaflet-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22],
    });
};

const createHQDivIcon = (name: string) => {
    const html = `
        <div class="relative flex items-center justify-center size-10 rounded-2xl bg-linear-to-r from-[#E75480] to-[#FF4F81] text-white border-2 border-white shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
                <path d="M10 6h4"></path>
                <path d="M10 10h4"></path>
                <path d="M10 14h4"></path>
                <path d="M10 18h4"></path>
            </svg>
        </div>
    `;
    return L.divIcon({
        html,
        className: 'custom-hq-leaflet-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22],
    });
};

export function LiveRiderMap({
    initialRiders = [],
    tileProviderUrl = DEFAULT_TILE_URL,
}: LiveRiderMapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<{ [key: number]: L.Marker }>({});
    const hqMarkerRef = useRef<L.Marker | null>(null);

    const [riders, setRiders] = useState<ActiveRiderData[]>(initialRiders);
    const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
    const [stats, setStats] = useState<StatsSummary>({
        total_active: initialRiders.length,
        live: initialRiders.filter((r) => r.signal_status === 'live').length,
        delayed: initialRiders.filter((r) => r.signal_status === 'signal_delayed').length,
        offline: initialRiders.filter((r) => r.signal_status === 'offline').length,
    });

    // Fetch latest rider locations from backend
    const fetchLiveLocations = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/deliveries/live-riders', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch rider telemetry');
            const result = await response.json();

            if (result.success && Array.isArray(result.riders)) {
                setRiders(result.riders);
                if (result.stats) {
                    setStats(result.stats);
                }
                setLastRefreshedAt(new Date());
            }
        } catch (error) {
            console.error('LiveRiderMap fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        // Victoria, Laguna default center coordinates: 14.229371, 121.328383
        const defaultCenter: [number, number] = [14.229371, 121.328383];

        const map = L.map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: 13,
            zoomControl: false,
        });

        L.tileLayer(tileProviderUrl, {
            attribution: DEFAULT_ATTRIBUTION,
            maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;

        // Initial fetch
        fetchLiveLocations();

        // Auto polling every 5 seconds
        const pollInterval = setInterval(() => {
            fetchLiveLocations();
        }, 5000);

        return () => {
            clearInterval(pollInterval);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [fetchLiveLocations, tileProviderUrl]);

    // Update markers dynamically when riders state changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Plot HQ Branch marker if available
        if (riders.length > 0 && riders[0].branch) {
            const hqLat = riders[0].branch.latitude;
            const hqLng = riders[0].branch.longitude;

            if (!hqMarkerRef.current) {
                const hqMarker = L.marker([hqLat, hqLng], {
                    icon: createHQDivIcon(riders[0].branch.name),
                }).addTo(map);

                hqMarker.bindPopup(`
                    <div style="font-family: 'Outfit', sans-serif; padding: 4px;">
                        <div style="font-weight: 800; font-size: 14px; color: #E75480;">${riders[0].branch.name}</div>
                        <div style="font-size: 11px; color: #64748B;">Central Branch Operations Hub</div>
                    </div>
                `);
                hqMarkerRef.current = hqMarker;
            } else {
                hqMarkerRef.current.setLatLng([hqLat, hqLng]);
            }
        }

        // Track current rider IDs
        const currentRiderIds = new Set(riders.map((r) => r.id));

        // Remove markers for riders no longer active
        Object.keys(markersRef.current).forEach((idStr) => {
            const id = Number(idStr);
            if (!currentRiderIds.has(id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        // Add or update rider markers
        riders.forEach((rider) => {
            const isSelected = selectedRiderId === rider.id;
            const position: [number, number] = [rider.latitude, rider.longitude];
            const icon = createRiderDivIcon(rider, isSelected);

            const popupContent = `
                <div style="font-family: 'Outfit', sans-serif; min-width: 200px; padding: 4px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-weight: 900; font-size: 14px; color: #1E293B;">${rider.name}</span>
                        <span style="font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; background: ${
                            rider.signal_status === 'live'
                                ? '#DEF7EC'
                                : rider.signal_status === 'signal_delayed'
                                ? '#FEF3C7'
                                : '#FDE8E8'
                        }; color: ${
                            rider.signal_status === 'live'
                                ? '#03543F'
                                : rider.signal_status === 'signal_delayed'
                                ? '#92400E'
                                : '#9B1C1C'
                        };">
                            ${rider.signal_status.toUpperCase()}
                        </span>
                    </div>

                    ${
                        rider.delivery
                            ? `<div style="font-size: 12px; font-weight: 800; color: #E75480; margin-bottom: 4px;">
                                Order #${rider.delivery.order_number}
                               </div>
                               <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
                                📍 ${rider.delivery.customer_name} ${rider.delivery.customer_address ? `• ${rider.delivery.customer_address}` : ''}
                               </div>`
                            : `<div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">No active order assignment</div>`
                    }

                    <div style="display: flex; items-center; justify-content: space-between; font-size: 10px; color: #94A3B8; border-top: 1px solid #F1F5F9; pt: 4px; margin-top: 6px;">
                        <span>Updated ${rider.last_updated_at}</span>
                        <span>Accuracy ±${Math.round(rider.accuracy)}m</span>
                    </div>
                </div>
            `;

            if (markersRef.current[rider.id]) {
                const marker = markersRef.current[rider.id];
                marker.setLatLng(position);
                marker.setIcon(icon);
                marker.setPopupContent(popupContent);
            } else {
                const marker = L.marker(position, { icon }).addTo(map);
                marker.bindPopup(popupContent);
                marker.on('click', () => setSelectedRiderId(rider.id));
                markersRef.current[rider.id] = marker;
            }
        });
    }, [riders, selectedRiderId]);

    // Handle focusing/selecting a rider
    const handleSelectRider = (rider: ActiveRiderData) => {
        setSelectedRiderId(rider.id);
        const map = mapInstanceRef.current;
        if (map) {
            map.flyTo([rider.latitude, rider.longitude], 16, { duration: 1.2 });
            const marker = markersRef.current[rider.id];
            if (marker) {
                marker.openPopup();
            }
        }
    };

    // Locate all riders on map (Fit Bounds)
    const handleLocateAllRiders = () => {
        const map = mapInstanceRef.current;
        if (!map || riders.length === 0) return;

        const bounds = L.latLngBounds(riders.map((r) => [r.latitude, r.longitude]));
        if (hqMarkerRef.current) {
            bounds.extend(hqMarkerRef.current.getLatLng());
        }
        map.fitBounds(bounds, { padding: [50, 50] });
    };

    const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
    const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

    return (
        <div className="relative rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-2xl p-6 backdrop-blur-2xl transition-colors duration-300 space-y-5 font-['Outfit'] overflow-hidden">
            {/* ── TOP MAP BAR & KPI SUMMARY ─────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-linear-to-r from-[#E75480] to-[#FF4F81] text-white shadow-md shadow-[#E75480]/20">
                        <Navigation className="size-6 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Live Rider Telemetry Map
                        </h4>
                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                            Real-time GPS tracking powered by OpenStreetMap
                        </p>
                    </div>
                </div>

                {/* KPI Status Counters */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-black">
                        <Bike className="size-4 text-slate-500" />
                        <span>Active: {stats.total_active}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                        <Wifi className="size-4 text-emerald-500 animate-pulse" />
                        <span>Live: {stats.live}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-black">
                        <Radio className="size-4 text-amber-500" />
                        <span>Delayed: {stats.delayed}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-black">
                        <WifiOff className="size-4 text-rose-500" />
                        <span>Offline: {stats.offline}</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchLiveLocations}
                        disabled={isLoading}
                        className="rounded-2xl h-8 text-xs gap-1.5 border-[#F8C8DC] dark:border-white/10 hover:bg-[#FFF5F7] dark:hover:bg-slate-800 cursor-pointer"
                    >
                        <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* ── MAP CONTAINER & SIDEBAR PANEL ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Map Viewport */}
                <div className="lg:col-span-3 relative h-96 sm:h-[450px] rounded-3xl overflow-hidden border border-[#F8C8DC]/60 dark:border-white/10 shadow-inner group">
                    <div ref={mapContainerRef} className="size-full z-0" />

                    {/* Custom Map Controls Overlay */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                        <div className="flex flex-col rounded-2xl bg-white/90 dark:bg-[#121218]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={handleZoomIn}
                                className="size-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-black text-lg"
                                title="Zoom In"
                            >
                                +
                            </button>
                            <div className="h-px bg-slate-200 dark:bg-slate-800" />
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                className="size-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-black text-lg"
                                title="Zoom Out"
                            >
                                −
                            </button>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleLocateAllRiders}
                            className="rounded-2xl shadow-lg bg-white/90 dark:bg-[#121218]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Compass className="size-4 text-[#E75480]" />
                            <span className="hidden sm:inline">Fit All</span>
                        </Button>
                    </div>
                </div>

                {/* Active Rider Side List */}
                <div className="lg:col-span-1 flex flex-col h-96 sm:h-[450px] bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-white/5 p-4 overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5 shrink-0">
                        <h5 className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-slate-400">
                            Active Fleet ({riders.length})
                        </h5>
                        <span className="text-[10px] text-slate-400 font-medium">
                            Auto 5s sync
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pt-3 space-y-2.5">
                        {riders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 text-slate-400">
                                <Bike className="size-8 stroke-1 opacity-50" />
                                <p className="text-xs font-bold">No active riders online</p>
                                <p className="text-[10px]">Assigned delivery riders will appear on the live telemetry map automatically.</p>
                            </div>
                        ) : (
                            riders.map((rider) => {
                                const isSelected = selectedRiderId === rider.id;

                                return (
                                    <div
                                        key={rider.id}
                                        onClick={() => handleSelectRider(rider)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                                            isSelected
                                                ? 'bg-white dark:bg-[#181824] border-[#E75480] dark:border-[#FF4F81] shadow-lg scale-[1.02]'
                                                : 'bg-white/60 dark:bg-[#121218]/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`size-2.5 rounded-full ${
                                                        rider.signal_status === 'live'
                                                            ? 'bg-emerald-500 animate-pulse'
                                                            : rider.signal_status === 'signal_delayed'
                                                            ? 'bg-amber-500'
                                                            : 'bg-rose-500'
                                                    }`}
                                                />
                                                <span className="text-xs font-extrabold text-[#3D2C2E] dark:text-white truncate">
                                                    {rider.name}
                                                </span>
                                            </div>
                                            <ChevronRight
                                                className={`size-4 transition-transform ${
                                                    isSelected ? 'text-[#E75480] translate-x-1' : 'text-slate-400'
                                                }`}
                                            />
                                        </div>

                                        {rider.delivery ? (
                                            <div className="text-[11px] font-bold text-[#E75480] dark:text-[#FF4F81]">
                                                Order #{rider.delivery.order_number}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-slate-400 font-medium italic">
                                                Standby / Waiting assignment
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                                            <span>{rider.last_updated_at}</span>
                                            <span>±{Math.round(rider.accuracy)}m</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
