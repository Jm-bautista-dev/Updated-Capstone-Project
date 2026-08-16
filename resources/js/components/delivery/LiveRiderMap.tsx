import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Bike,
    ChevronRight,
    Compass,
    Navigation,
    Radio,
    RefreshCw,
    Wifi,
    WifiOff,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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

export interface ActiveRouteSummary {
    distance_text: string;
    duration_text: string;
    is_fallback: boolean;
    is_stale?: boolean;
    provider?: string;
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
        <div class="relative flex items-center justify-center size-9 sm:size-10 rounded-2xl border-2 shadow-xl backdrop-blur-md transition-all duration-300 ${statusColorClass} ${selectedRing}">
            ${rider.signal_status === 'live' ? pulseHtml : ''}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"></path>
                <circle cx="7.5" cy="17.5" r="2.5"></circle>
                <circle cx="17.5" cy="17.5" r="2.5"></circle>
            </svg>
        </div>
    `;

    return L.divIcon({
        html,
        className: 'custom-rider-leaflet-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
    });
};

const createDestinationDivIcon = () => {
    const html = `
        <div class="relative flex items-center justify-center size-9 sm:size-10 rounded-2xl bg-[#1E293B] dark:bg-white text-emerald-400 dark:text-emerald-600 border-2 border-emerald-500 shadow-2xl scale-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
        </div>
    `;
    return L.divIcon({
        html,
        className: 'custom-dest-leaflet-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
    });
};

const createHQDivIcon = () => {
    const html = `
        <div class="relative flex items-center justify-center size-9 sm:size-10 rounded-2xl bg-linear-to-r from-[#E75480] to-[#FF4F81] text-white border-2 border-white shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
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
    const destinationMarkerRef = useRef<L.Marker | null>(null);
    const routePolylineRef = useRef<L.Polyline | null>(null);
    const routeGlowPolylineRef = useRef<L.Polyline | null>(null);
    const lastRoutedLocationRef = useRef<{ [key: number]: { lat: number; lng: number; time: number } }>({});

    const [riders, setRiders] = useState<ActiveRiderData[]>(initialRiders);
    const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
    const [activeRouteInfo, setActiveRouteInfo] = useState<ActiveRouteSummary | null>(null);
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

    // Handle responsive container resize invalidation for Leaflet
    useEffect(() => {
        const handleResize = () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        };

        window.addEventListener('resize', handleResize);

        const timer = setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 300);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
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
                    icon: createHQDivIcon(),
                }).addTo(map);

                hqMarker.bindPopup(`
                    <div style="font-family: 'Outfit', sans-serif; width: 100%; max-width: 190px; padding: 2px; box-sizing: border-box;">
                        <div style="font-weight: 800; font-size: 12px; color: #E75480; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${riders[0].branch.name}</div>
                        <div style="font-size: 10px; color: #64748B;">Central Operations Hub</div>
                    </div>
                `, { maxWidth: 200 });
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
                <div style="font-family: 'Outfit', sans-serif; width: 100%; max-width: 190px; padding: 2px; box-sizing: border-box;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 4px;">
                        <span style="font-weight: 900; font-size: 12px; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;">${rider.name}</span>
                        <span style="font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 9999px; white-space: nowrap; background: ${
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
                            ? `<div style="font-size: 11px; font-weight: 800; color: #E75480; margin-bottom: 2px;">
                                Order #${rider.delivery.order_number}
                               </div>
                               <div style="font-size: 10px; color: #475569; margin-bottom: 4px; word-break: break-word; white-space: normal;">
                                📍 ${rider.delivery.customer_name} ${rider.delivery.customer_address ? `• ${rider.delivery.customer_address}` : ''}
                               </div>`
                            : `<div style="font-size: 10px; color: #64748B; margin-bottom: 4px;">No active order assignment</div>`
                    }

                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9px; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 4px; margin-top: 4px;">
                        <span>Updated ${rider.last_updated_at}</span>
                        <span>±${Math.round(rider.accuracy)}m</span>
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
                marker.bindPopup(popupContent, { maxWidth: 210 });
                marker.on('click', () => setSelectedRiderId(rider.id));
                markersRef.current[rider.id] = marker;
            }
        });

        // Trigger size invalidation to adjust to container bounds
        map.invalidateSize();
    }, [riders, selectedRiderId]);

    // Fetch road route for active delivery
    const fetchRoadRoute = useCallback(async (deliveryId: number) => {
        try {
            const response = await fetch(`/deliveries/${deliveryId}/route`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) return null;
            const data = await response.json();
            if (data.success && data.route && Array.isArray(data.route.coordinates)) {
                return data.route;
            }
        } catch (e) {
            console.warn('Road route fetch failed:', e);
        }
        return null;
    }, []);

    // Handle Road-Network Route Drawing for Selected Rider
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const selectedRider = riders.find((r) => r.id === selectedRiderId);

        // If no rider selected or selected rider has no delivery with coords, clear route layers
        if (
            !selectedRider ||
            !selectedRider.delivery ||
            !selectedRider.delivery.latitude ||
            !selectedRider.delivery.longitude
        ) {
            if (routePolylineRef.current) {
                routePolylineRef.current.remove();
                routePolylineRef.current = null;
            }
            if (routeGlowPolylineRef.current) {
                routeGlowPolylineRef.current.remove();
                routeGlowPolylineRef.current = null;
            }
            if (destinationMarkerRef.current) {
                destinationMarkerRef.current.remove();
                destinationMarkerRef.current = null;
            }
            setActiveRouteInfo(null);
            return;
        }

        const delivery = selectedRider.delivery;
        const destLat = delivery.latitude;
        const destLng = delivery.longitude;

        if (destLat === null || destLng === null) {
            return;
        }

        // Plot or update destination marker
        const destIcon = createDestinationDivIcon();
        const destPopup = `
            <div style="font-family: 'Outfit', sans-serif; width: 100%; max-width: 190px; padding: 2px; box-sizing: border-box;">
                <div style="font-weight: 800; font-size: 12px; color: #10B981;">📍 Delivery Destination</div>
                <div style="font-weight: 700; font-size: 11px; color: #1E293B; margin-top: 2px;">${delivery.customer_name}</div>
                <div style="font-size: 10px; color: #64748B; word-break: break-word;">${delivery.customer_address || 'Customer Location'}</div>
                <div style="font-size: 9px; font-weight: 800; color: #E75480; margin-top: 3px;">Order #${delivery.order_number}</div>
            </div>
        `;

        if (!destinationMarkerRef.current) {
            const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
            destMarker.bindPopup(destPopup, { maxWidth: 200 });
            destinationMarkerRef.current = destMarker;
        } else {
            destinationMarkerRef.current.setLatLng([destLat, destLng]);
            destinationMarkerRef.current.setIcon(destIcon);
            destinationMarkerRef.current.setPopupContent(destPopup);
        }

        // Check if we need to query the routing engine (moved > 50m or > 30s elapsed)
        const lastRoute = lastRoutedLocationRef.current[selectedRider.id];
        const now = Date.now();
        const distMoved = lastRoute
            ? Math.hypot(selectedRider.latitude - lastRoute.lat, selectedRider.longitude - lastRoute.lng) * 111000
            : 999;
        const timeElapsed = lastRoute ? now - lastRoute.time : 99999;

        if (!lastRoute || distMoved > 50 || timeElapsed > 30000) {
            const requestTime = now;
            fetchRoadRoute(delivery.id).then((route) => {
                if (!mapInstanceRef.current) return;

                // If fetch failed or coordinates invalid, DO NOT wipe out existing road polyline!
                if (!route || !Array.isArray(route.coordinates) || route.coordinates.length < 2) {
                    setActiveRouteInfo((prev) => prev ? { ...prev, is_stale: true } : null);
                    return;
                }

                const latLngs: [number, number][] = route.coordinates;

                // Update glow outline layer
                if (routeGlowPolylineRef.current) {
                    routeGlowPolylineRef.current.setLatLngs(latLngs);
                } else {
                    routeGlowPolylineRef.current = L.polyline(latLngs, {
                        color: '#FF4F81',
                        weight: 8,
                        opacity: 0.35,
                        lineCap: 'round',
                        lineJoin: 'round',
                    }).addTo(mapInstanceRef.current);
                }

                // Update main road polyline
                if (routePolylineRef.current) {
                    routePolylineRef.current.setLatLngs(latLngs);
                } else {
                    routePolylineRef.current = L.polyline(latLngs, {
                        color: '#E75480',
                        weight: 4.5,
                        opacity: 0.9,
                        dashArray: route.is_fallback ? '6, 8' : undefined,
                        lineCap: 'round',
                        lineJoin: 'round',
                    }).addTo(mapInstanceRef.current);
                }

                lastRoutedLocationRef.current[selectedRider.id] = {
                    lat: selectedRider.latitude,
                    lng: selectedRider.longitude,
                    time: requestTime,
                };

                setActiveRouteInfo({
                    distance_text: route.summary?.distance_text || `${route.distance_km} km`,
                    duration_text: route.summary?.duration_text || `${route.duration_minutes} mins`,
                    is_fallback: !!route.is_fallback,
                    is_stale: !!route.is_stale,
                    provider: route.provider,
                });
            });
        }
    }, [selectedRiderId, riders, fetchRoadRoute]);

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
        map.fitBounds(bounds, { padding: [30, 30] });
    };

    const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
    const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

    return (
        <div className="relative rounded-3xl sm:rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-2xl p-3.5 sm:p-6 backdrop-blur-2xl transition-colors duration-300 space-y-4 sm:space-y-5 font-['Outfit'] overflow-hidden w-full max-w-full min-w-0 box-border">
            {/* ── TOP MAP BAR & KPI SUMMARY ─────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 min-w-0 w-full">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="p-2 sm:p-3 rounded-2xl bg-linear-to-r from-[#E75480] to-[#FF4F81] text-white shadow-md shadow-[#E75480]/20 shrink-0">
                        <Navigation className="size-5 sm:size-6 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm sm:text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight truncate">
                            Live Rider Telemetry Map
                        </h4>
                        <p className="text-[10px] sm:text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium truncate">
                            Real-time GPS tracking powered by OpenStreetMap
                        </p>
                    </div>
                </div>

                {/* KPI Status Counters — Grid on mobile, flex on desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-1 px-2 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-black min-w-0">
                        <Bike className="size-3.5 sm:size-4 text-slate-500 shrink-0" />
                        <span className="truncate">Active: {stats.total_active}</span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-1 px-2 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-black min-w-0">
                        <Wifi className="size-3.5 sm:size-4 text-emerald-500 animate-pulse shrink-0" />
                        <span className="truncate">Live: {stats.live}</span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-1 px-2 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] sm:text-xs font-black min-w-0">
                        <Radio className="size-3.5 sm:size-4 text-amber-500 shrink-0" />
                        <span className="truncate">Delayed: {stats.delayed}</span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-1 px-2 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-[11px] sm:text-xs font-black min-w-0">
                        <WifiOff className="size-3.5 sm:size-4 text-rose-500 shrink-0" />
                        <span className="truncate">Offline: {stats.offline}</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchLiveLocations}
                        disabled={isLoading}
                        className="col-span-2 sm:col-span-1 w-full sm:w-auto rounded-2xl h-8 text-xs gap-1.5 border-[#F8C8DC] dark:border-white/10 hover:bg-[#FFF5F7] dark:hover:bg-slate-800 cursor-pointer justify-center"
                    >
                        <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* ── MAP CONTAINER & SIDEBAR PANEL ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0 w-full">
                {/* Map Viewport */}
                <div className="lg:col-span-3 relative h-72 sm:h-96 lg:h-112 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F8C8DC]/60 dark:border-white/10 shadow-inner group w-full min-w-0">
                    <div ref={mapContainerRef} className="size-full z-0" />

                    {/* Floating Road Route Telemetry Overlay */}
                    {activeRouteInfo && (
                        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/95 dark:bg-[#121218]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl pointer-events-none">
                            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <Navigation className="size-4" />
                            </div>
                            <div className="min-w-0 pr-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                        {activeRouteInfo.distance_text}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">•</span>
                                    <span className="text-xs font-black text-[#E75480] dark:text-[#FF4F81]">
                                        ~{activeRouteInfo.duration_text}
                                    </span>
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                    <span>{activeRouteInfo.is_stale ? '🟡 Route update delayed' : activeRouteInfo.is_fallback ? '⚠️ Direct estimate' : '🛣️ Road Route'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Custom Map Controls Overlay */}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col gap-2">
                        <div className="flex flex-col rounded-2xl bg-white/90 dark:bg-[#121218]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={handleZoomIn}
                                className="size-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-black text-lg touch-manipulation"
                                title="Zoom In"
                            >
                                +
                            </button>
                            <div className="h-px bg-slate-200 dark:bg-slate-800" />
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                className="size-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-black text-lg touch-manipulation"
                                title="Zoom Out"
                            >
                                −
                            </button>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleLocateAllRiders}
                            className="rounded-2xl shadow-lg bg-white/90 dark:bg-[#121218]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                        >
                            <Compass className="size-4 text-[#E75480]" />
                            <span className="hidden sm:inline">Fit All</span>
                        </Button>
                    </div>
                </div>

                {/* Active Rider Side List */}
                <div className="lg:col-span-1 flex flex-col h-64 sm:h-80 lg:h-112 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-white/5 p-3 sm:p-4 overflow-hidden min-w-0 w-full">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-white/5 shrink-0 min-w-0">
                        <h5 className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-slate-400 truncate">
                            Active Fleet ({riders.length})
                        </h5>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            Synced {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pt-2.5 space-y-2 min-w-0">
                        {riders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 text-slate-400">
                                <Bike className="size-7 stroke-1 opacity-50" />
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
                                        className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer space-y-1 min-w-0 w-full ${
                                            isSelected
                                                ? 'bg-white dark:bg-[#181824] border-[#E75480] dark:border-[#FF4F81] shadow-lg scale-[1.01]'
                                                : 'bg-white/60 dark:bg-[#121218]/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div
                                                    className={`size-2.5 rounded-full shrink-0 ${
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
                                                className={`size-4 shrink-0 transition-transform ${
                                                    isSelected ? 'text-[#E75480] translate-x-0.5' : 'text-slate-400'
                                                }`}
                                            />
                                        </div>

                                        {rider.delivery ? (
                                            <div className="text-[11px] font-bold text-[#E75480] dark:text-[#FF4F81] truncate">
                                                Order #{rider.delivery.order_number}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-slate-400 font-medium italic truncate">
                                                Standby / Waiting assignment
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5 min-w-0">
                                            <span className="truncate">{rider.last_updated_at}</span>
                                            <span className="shrink-0">±{Math.round(rider.accuracy)}m</span>
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
