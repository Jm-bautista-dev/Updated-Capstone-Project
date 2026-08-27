import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import { FiNavigation, FiClock, FiMapPin } from 'react-icons/fi';

interface PosMiniMapProps {
    branchCoords: [number, number] | null;
    customerCoords: [number, number] | null;
    routeCoordinates?: [number, number][];
    branchName?: string;
    customerAddress?: string;
    distanceKm?: number | null;
    durationText?: string | null;
    isLoading?: boolean;
    error?: string | null;
}

const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '&copy; OpenStreetMap';

// Helper to create Branch HQ Marker
const createBranchDivIcon = () => {
    const html = `
        <div class="relative flex items-center justify-center size-8 rounded-xl bg-linear-to-tr from-[#E75480] to-[#FF4F81] text-white border-2 border-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
            </svg>
        </div>
    `;
    return L.divIcon({
        html,
        className: 'custom-branch-pos-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
};

// Helper to create Customer Destination Marker
const createCustomerDivIcon = () => {
    const html = `
        <div class="relative flex items-center justify-center size-8 rounded-xl bg-[#1E293B] dark:bg-zinc-800 text-emerald-400 border-2 border-emerald-500 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
        </div>
    `;
    return L.divIcon({
        html,
        className: 'custom-customer-pos-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
};

export const PosMiniMap: React.FC<PosMiniMapProps> = ({
    branchCoords,
    customerCoords,
    routeCoordinates = [],
    branchName = 'Branch HQ',
    customerAddress = 'Customer Location',
    distanceKm,
    durationText,
    isLoading = false,
    error = null,
}) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const branchMarkerRef = useRef<L.Marker | null>(null);
    const customerMarkerRef = useRef<L.Marker | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);
    const polylineGlowRef = useRef<L.Polyline | null>(null);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            const initialCenter: [number, number] = branchCoords || [14.2307, 121.3283]; // Victoria Laguna fallback

            const map = L.map(mapContainerRef.current, {
                center: initialCenter,
                zoom: 13,
                zoomControl: false,
                attributionControl: false,
                dragging: true,
                touchZoom: true,
                scrollWheelZoom: false,
            });

            L.tileLayer(DEFAULT_TILE_URL, {
                attribution: DEFAULT_ATTRIBUTION,
                maxZoom: 19,
            }).addTo(map);

            mapInstanceRef.current = map;
        }

        const resizeObserver = new ResizeObserver(() => {
            mapInstanceRef.current?.invalidateSize();
        });

        resizeObserver.observe(mapContainerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [branchCoords]);

    // Update markers, polyline and bounds
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // 1. Branch Marker
        if (branchCoords && branchCoords[0] && branchCoords[1]) {
            if (branchMarkerRef.current) {
                branchMarkerRef.current.setLatLng(branchCoords);
            } else {
                branchMarkerRef.current = L.marker(branchCoords, {
                    icon: createBranchDivIcon(),
                })
                    .bindPopup(`<strong class="text-xs font-bold text-[#E75480]">${branchName}</strong><br><span class="text-[10px] text-gray-500">Order Origin</span>`)
                    .addTo(map);
            }
        } else if (branchMarkerRef.current) {
            map.removeLayer(branchMarkerRef.current);
            branchMarkerRef.current = null;
        }

        // 2. Customer Marker
        if (customerCoords && customerCoords[0] && customerCoords[1]) {
            if (customerMarkerRef.current) {
                customerMarkerRef.current.setLatLng(customerCoords);
            } else {
                customerMarkerRef.current = L.marker(customerCoords, {
                    icon: createCustomerDivIcon(),
                })
                    .bindPopup(`<strong class="text-xs font-bold text-emerald-600">Customer Location</strong><br><span class="text-[10px] text-gray-500">${customerAddress}</span>`)
                    .addTo(map);
            }
        } else if (customerMarkerRef.current) {
            map.removeLayer(customerMarkerRef.current);
            customerMarkerRef.current = null;
        }

        // 3. Polyline Route
        if (polylineRef.current) {
            map.removeLayer(polylineRef.current);
            polylineRef.current = null;
        }
        if (polylineGlowRef.current) {
            map.removeLayer(polylineGlowRef.current);
            polylineGlowRef.current = null;
        }

        if (routeCoordinates.length > 1) {
            // Glow layer
            polylineGlowRef.current = L.polyline(routeCoordinates, {
                color: '#E75480',
                weight: 6,
                opacity: 0.35,
                lineCap: 'round',
            }).addTo(map);

            // Core line
            polylineRef.current = L.polyline(routeCoordinates, {
                color: '#E75480',
                weight: 3.5,
                opacity: 0.95,
                lineCap: 'round',
            }).addTo(map);
        } else if (branchCoords && customerCoords) {
            // Straight fallback line
            const straightLine = [branchCoords, customerCoords];
            polylineRef.current = L.polyline(straightLine, {
                color: '#E75480',
                weight: 2.5,
                dashArray: '6, 6',
                opacity: 0.8,
            }).addTo(map);
        }

        // 4. Fit Bounds
        const points: [number, number][] = [];
        if (branchCoords) points.push(branchCoords);
        if (customerCoords) points.push(customerCoords);
        if (routeCoordinates.length > 0) {
            points.push(...routeCoordinates);
        }

        if (points.length > 1) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, {
                padding: [25, 25],
                maxZoom: 15,
                animate: true,
            });
        } else if (branchCoords) {
            map.setView(branchCoords, 13);
        }
    }, [branchCoords, customerCoords, routeCoordinates, branchName, customerAddress]);

    return (
        <div className="w-full relative rounded-2xl overflow-hidden border border-[#F8C8DC]/60 dark:border-[#26262A] bg-[#FFF5F7]/50 dark:bg-[#1E1E21]/50 shadow-2xs">
            {/* Map Container */}
            <div
                ref={mapContainerRef}
                className="w-full h-36 sm:h-40 z-0 relative"
                style={{ minHeight: '140px' }}
            />

            {/* Overlays / Status Banner */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center z-10 gap-2 text-xs font-bold text-[#E75480]">
                    <div className="size-4 border-2 border-[#E75480] border-t-transparent rounded-full animate-spin" />
                    <span>Finding address & calculating route...</span>
                </div>
            )}

            {!isLoading && error && (
                <div className="absolute inset-0 bg-white/90 dark:bg-[#1A1A1D]/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-10">
                    <FiMapPin className="size-5 text-amber-500 mb-1" />
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{error}</p>
                    <p className="text-[10px] text-[#7D6B6E] dark:text-zinc-400 mt-0.5">Please check the customer address or verify spelling.</p>
                </div>
            )}

            {!isLoading && !error && !customerCoords && (
                <div className="absolute inset-0 bg-white/75 dark:bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center p-3 text-center z-10 pointer-events-none">
                    <FiNavigation className="size-5 text-[#E75480] mb-1 animate-pulse" />
                    <p className="text-xs font-bold text-[#3D2C2E] dark:text-zinc-200">Enter a delivery address</p>
                    <p className="text-[10px] text-[#7D6B6E] dark:text-zinc-400">Road distance & travel time will be calculated automatically</p>
                </div>
            )}

            {/* Bottom Floating Metrics Pill */}
            {customerCoords && distanceKm !== undefined && distanceKm !== null && !isLoading && !error && (
                <div className="absolute bottom-2 left-2 right-2 z-10 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#F8C8DC]/80 dark:border-white/10 shadow-md flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#3D2C2E] dark:text-white">
                        <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{distanceKm.toFixed(1)} km <span className="font-normal text-[10px] text-[#7D6B6E] dark:text-zinc-400">from {branchName}</span></span>
                    </div>
                    {durationText && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#E75480] dark:text-[#FF7597]">
                            <FiClock className="size-3" />
                            <span>~{durationText}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
