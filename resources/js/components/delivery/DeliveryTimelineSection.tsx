import { motion } from 'framer-motion';
import { Bike, Building2, CheckCircle2, Clock, Navigation, Package } from 'lucide-react';
import React from 'react';
import type { Delivery } from './types';
import { formatTime } from './types';

interface DeliveryTimelineSectionProps {
    deliveries: Delivery[];
    onSelectDelivery: (delivery: Delivery) => void;
}

export function DeliveryTimelineSection({ deliveries, onSelectDelivery }: DeliveryTimelineSectionProps) {
    if (deliveries.length === 0) return null;

    const recentDeliveries = deliveries.slice(0, 5);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="size-4 text-amber-500" />;
            case 'preparing':
                return <Package className="size-4 text-blue-500" />;
            case 'in_transit':
            case 'picked_up':
                return <Navigation className="size-4 text-purple-500" />;
            case 'delivered':
                return <CheckCircle2 className="size-4 text-emerald-500" />;
            default:
                return <Bike className="size-4 text-[#E75480] dark:text-[#FF4F81]" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transition-colors duration-300 space-y-6 font-['Outfit']"
        >
            <div>
                <h3 className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                    Recent Dispatch Activity
                </h3>
                <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                    Live timeline of order updates, rider assignments, and completed deliveries
                </p>
            </div>

            <div className="space-y-3">
                {recentDeliveries.map((delivery) => (
                    <div
                        key={delivery.id}
                        onClick={() => onSelectDelivery(delivery)}
                        className="p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-between gap-4 hover:border-[#E75480]/40 transition-all cursor-pointer shadow-2xs"
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 rounded-xl bg-[#FFF5F7] dark:bg-[#1C1C28] border border-[#F8C8DC]/60 dark:border-white/10 shrink-0">
                                {getStatusIcon(delivery.status)}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-sm text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        #{delivery.sale?.order_number || delivery.tracking_number || delivery.id}
                                    </span>
                                    <span className="text-xs font-bold text-[#E75480] dark:text-[#FF4F81] truncate">
                                        {delivery.customer_name}
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] font-medium flex items-center gap-1.5 mt-0.5">
                                    <Building2 className="size-3" />
                                    <span>{delivery.sale?.branch?.name || delivery.order?.branch?.name || 'Main HQ'}</span>
                                    <span>•</span>
                                    <span className="font-mono">{formatTime(delivery.created_at)}</span>
                                </p>
                            </div>
                        </div>

                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FADADD]/30 dark:bg-white/5 text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/40 dark:border-white/10 shrink-0">
                            {delivery.status_label || delivery.status.replace('_', ' ')}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
