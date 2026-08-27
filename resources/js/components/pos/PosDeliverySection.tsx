import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiUser, FiPhone, FiMapPin, FiTruck, FiPackage, FiFileText } from 'react-icons/fi';
import { Input } from '@/components/ui/input';
import { PosMiniMap } from './PosMiniMap';
import { PosRiderSelector, PosRider } from './PosRiderSelector';
import { cn } from '@/lib/utils';

export interface PosDeliveryInfo {
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    delivery_type: 'internal' | 'external';
    rider_id: string | number;
    external_service?: 'grab' | 'lalamove' | string;
    tracking_number?: string;
    distance_km?: number | string;
    delivery_fee?: number | string;
    external_notes?: string;
    latitude?: number | null;
    longitude?: number | null;
}

interface PosDeliverySectionProps {
    deliveryInfo: PosDeliveryInfo;
    onChange: (updater: (prev: PosDeliveryInfo) => PosDeliveryInfo) => void;
    onDeliveryFeeChange: (fee: number) => void;
    branch?: {
        id: number;
        name: string;
        latitude?: number | string;
        longitude?: number | string;
        base_delivery_fee?: number | string;
        per_km_fee?: number | string;
    };
    allRiders?: PosRider[];
}

export const PosDeliverySection: React.FC<PosDeliverySectionProps> = ({
    deliveryInfo,
    onChange,
    onDeliveryFeeChange,
    branch,
    allRiders = [],
}) => {
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [branchCoords, setBranchCoords] = useState<[number, number] | null>(() => {
        if (branch?.latitude && branch?.longitude) {
            return [Number(branch.latitude), Number(branch.longitude)];
        }
        return [14.2307, 121.3283]; // Victoria Laguna default HQ
    });
    const [customerCoords, setCustomerCoords] = useState<[number, number] | null>(() => {
        if (deliveryInfo.latitude && deliveryInfo.longitude) {
            return [Number(deliveryInfo.latitude), Number(deliveryInfo.longitude)];
        }
        return null;
    });
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
    const [durationText, setDurationText] = useState<string | null>(null);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate distance and route via API
    const calculateDistance = useCallback(async (address: string) => {
        if (!address || address.trim().length < 4) {
            setCustomerCoords(null);
            setRouteCoordinates([]);
            setRouteError(null);
            setDurationText(null);
            return;
        }

        setIsCalculatingRoute(true);
        setRouteError(null);

        try {
            const response = await axios.post('/api/pos/calculate-delivery-distance', {
                address: address.trim(),
                branch_id: branch?.id,
            });

            if (response.data?.success) {
                const data = response.data;
                const cCoords: [number, number] = [data.customer.latitude, data.customer.longitude];
                const bCoords: [number, number] = [data.branch.latitude, data.branch.longitude];

                setCustomerCoords(cCoords);
                setBranchCoords(bCoords);
                setRouteCoordinates(data.route_coordinates || []);
                setDurationText(data.duration_text);

                // Update parent state
                onChange(prev => ({
                    ...prev,
                    distance_km: data.distance_km,
                    latitude: data.customer.latitude,
                    longitude: data.customer.longitude,
                }));

                if (data.delivery_fee !== undefined) {
                    onDeliveryFeeChange(Number(data.delivery_fee));
                }
            } else {
                setRouteError(response.data?.message || 'Unable to calculate road route.');
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Unable to locate this address. Please verify spelling.';
            setRouteError(errorMsg);
        } finally {
            setIsCalculatingRoute(false);
        }
    }, [branch?.id, onChange, onDeliveryFeeChange]);

    // Handle debounced address change
    const handleAddressChange = (newAddress: string) => {
        onChange(prev => ({ ...prev, customer_address: newAddress }));

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            calculateDistance(newAddress);
        }, 650);
    };

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const numericDistance = deliveryInfo.distance_km !== undefined && deliveryInfo.distance_km !== ''
        ? Number(deliveryInfo.distance_km)
        : null;

    return (
        <div className="space-y-4 pt-1 font-['Outfit']">
            {/* 1. CUSTOMER INFORMATION */}
            <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-zinc-400">
                    <FiUser className="size-3.5 text-[#E75480]" />
                    <span>Customer Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                        <Input
                            placeholder="Customer Name *"
                            className="bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] rounded-xl h-10 text-xs font-medium text-[#3D2C2E] dark:text-white pl-3 focus:ring-1 focus:ring-[#E75480]"
                            value={deliveryInfo.customer_name}
                            onChange={e => onChange(p => ({ ...p, customer_name: e.target.value }))}
                        />
                    </div>
                    <div className="relative">
                        <Input
                            placeholder="Contact Number (e.g. 0917...)"
                            className="bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] rounded-xl h-10 text-xs font-medium text-[#3D2C2E] dark:text-white pl-3 focus:ring-1 focus:ring-[#E75480]"
                            value={deliveryInfo.customer_phone}
                            onChange={e => onChange(p => ({ ...p, customer_phone: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Customer Address */}
                <div className="relative">
                    <Input
                        placeholder="Customer Delivery Address (Barangay, Street, Town) *"
                        className="bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] rounded-xl h-10 text-xs font-medium text-[#3D2C2E] dark:text-white pl-8 focus:ring-1 focus:ring-[#E75480]"
                        value={deliveryInfo.customer_address}
                        onChange={e => handleAddressChange(e.target.value)}
                    />
                    <FiMapPin className="absolute left-2.5 top-3 size-4 text-[#E75480]" />
                </div>
            </div>

            {/* 2. MINI MAP PREVIEW & AUTOMATIC ROAD DISTANCE */}
            <div className="space-y-1.5">
                <PosMiniMap
                    branchCoords={branchCoords}
                    customerCoords={customerCoords}
                    routeCoordinates={routeCoordinates}
                    branchName={branch?.name || 'Victoria Branch'}
                    customerAddress={deliveryInfo.customer_address}
                    distanceKm={numericDistance}
                    durationText={durationText}
                    isLoading={isCalculatingRoute}
                    error={routeError}
                />
            </div>

            {/* 3. COURIER TYPE SEGMENTED CONTROL (Equal width, zero overlap) */}
            <div className="space-y-2.5">
                <div className="p-1 rounded-2xl bg-[#FFF5F7] dark:bg-[#1A1A1D] border border-[#F8C8DC]/60 dark:border-[#26262A] flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onChange(p => ({ ...p, delivery_type: 'internal' }))}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                            deliveryInfo.delivery_type === 'internal'
                                ? "bg-[#E75480] text-white shadow-sm"
                                : "text-[#7D6B6E] dark:text-zinc-400 hover:text-[#3D2C2E] dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60"
                        )}
                    >
                        <FiTruck className="size-3.5" />
                        <span>Internal Rider</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onChange(p => ({ ...p, delivery_type: 'external' }))}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                            deliveryInfo.delivery_type === 'external'
                                ? "bg-[#E75480] text-white shadow-sm"
                                : "text-[#7D6B6E] dark:text-zinc-400 hover:text-[#3D2C2E] dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60"
                        )}
                    >
                        <FiPackage className="size-3.5" />
                        <span>External Courier</span>
                    </button>
                </div>

                {/* 4. MUTUALLY EXCLUSIVE CONTENT */}
                {deliveryInfo.delivery_type === 'internal' ? (
                    <PosRiderSelector
                        riders={allRiders}
                        selectedRiderId={deliveryInfo.rider_id}
                        onSelectRider={(riderId) => onChange(p => ({ ...p, rider_id: riderId }))}
                    />
                ) : (
                    <div className="space-y-2.5 p-3 rounded-2xl bg-white dark:bg-[#1A1A1D] border border-[#F8C8DC]/60 dark:border-[#26262A] shadow-2xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-zinc-400">
                            <FiPackage className="size-3.5 text-[#E75480]" />
                            <span>External Courier Details</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                                className="w-full bg-[#FFF5F7] dark:bg-[#1E1E21] border border-[#F8C8DC]/60 dark:border-[#26262A] rounded-xl h-10 px-3 text-[#3D2C2E] dark:text-white text-xs font-bold focus:ring-1 focus:ring-[#E75480]"
                                value={deliveryInfo.external_service || 'grab'}
                                onChange={e => onChange(p => ({ ...p, external_service: e.target.value as any }))}
                            >
                                <option value="grab">Grab Express</option>
                                <option value="lalamove">Lalamove</option>
                                <option value="other">Other Courier</option>
                            </select>

                            <Input
                                placeholder="Tracking / Booking Ref *"
                                className="bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] rounded-xl h-10 text-xs font-medium text-[#3D2C2E] dark:text-white focus:ring-1 focus:ring-[#E75480]"
                                value={deliveryInfo.tracking_number || ''}
                                onChange={e => onChange(p => ({ ...p, tracking_number: e.target.value }))}
                            />
                        </div>

                        <div className="relative">
                            <Input
                                placeholder="Courier rider notes / instructions (optional)"
                                className="bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] rounded-xl h-10 text-xs font-medium text-[#3D2C2E] dark:text-white focus:ring-1 focus:ring-[#E75480]"
                                value={deliveryInfo.external_notes || ''}
                                onChange={e => onChange(p => ({ ...p, external_notes: e.target.value }))}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
