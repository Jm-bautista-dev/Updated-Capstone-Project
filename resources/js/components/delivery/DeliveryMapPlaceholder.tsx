import { motion } from 'framer-motion';
import { Bike, Building2, MapPin, Navigation, Radio } from 'lucide-react';
import React from 'react';

interface DeliveryMapPlaceholderProps {
    activeDeliveriesCount: number;
}

export function DeliveryMapPlaceholder({ activeDeliveriesCount }: DeliveryMapPlaceholderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] p-6 backdrop-blur-2xl transition-colors duration-300 space-y-4 overflow-hidden font-['Outfit']"
        >
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                        <Navigation className="size-5" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Live Delivery Telemetry Map
                        </h4>
                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                            Real-time GPS dispatch tracking & rider location telemetry
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                        <Radio className="size-3 animate-pulse" />
                        <span>GPS Signal Active</span>
                    </span>
                </div>
            </div>

            {/* Map Visual Container */}
            <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden bg-linear-to-br from-[#FFF5F7] via-[#FADADD]/20 to-[#FFF0F5] dark:from-[#0F0F14] dark:via-[#181820] dark:to-[#121218] border border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-center">
                {/* Grid Overlay Simulation */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#E754800f_1px,transparent_1px),linear-gradient(to_bottom,#E754800f_1px,transparent_1px)] bg-size-[2rem_2rem] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />

                {/* Animated Route Line */}
                <svg className="absolute inset-0 size-full pointer-events-none opacity-40">
                    <path
                        d="M 100 200 Q 250 80 400 180 T 700 120"
                        fill="none"
                        stroke="url(#gradient-line)"
                        strokeWidth="3"
                        strokeDasharray="6 6"
                        className="animate-pulse"
                    />
                    <defs>
                        <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#E75480" />
                            <stop offset="100%" stopColor="#F472B6" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Simulated Pins */}
                <div className="absolute top-1/4 left-1/4 p-2.5 rounded-2xl bg-white dark:bg-[#181820] shadow-lg border border-[#F8C8DC] dark:border-white/10 flex items-center gap-2 text-xs font-bold animate-bounce">
                    <Building2 className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                    <span>HQ Branch</span>
                </div>

                <div className="absolute bottom-1/3 right-1/3 p-2.5 rounded-2xl bg-white dark:bg-[#181820] shadow-lg border border-[#F8C8DC] dark:border-white/10 flex items-center gap-2 text-xs font-bold">
                    <Bike className="size-4 text-emerald-500 animate-pulse" />
                    <span>Rider #{activeDeliveriesCount || 1} Transit</span>
                </div>

                <div className="absolute top-1/3 right-1/4 p-2.5 rounded-2xl bg-white dark:bg-[#181820] shadow-lg border border-[#F8C8DC] dark:border-white/10 flex items-center gap-2 text-xs font-bold">
                    <MapPin className="size-4 text-rose-500" />
                    <span>Customer Destination</span>
                </div>

                {/* Central Overlay Info */}
                <div className="relative z-10 text-center p-6 rounded-3xl bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl border border-white/90 dark:border-white/10 shadow-xl max-w-sm">
                    <h5 className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Map Integration Standby
                    </h5>
                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-1">
                        Google Maps / Mapbox SDK ready for live dispatch tracking. Currently monitoring {activeDeliveriesCount} active route assignments.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
