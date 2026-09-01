import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { FiBell, FiCheck, FiChevronLeft, FiChevronRight, FiEye, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { useOrderAlerts } from '@/lib/order-alert-manager';
import { isAudioReady, isSoundEnabled, setSoundEnabled, unlockAudio } from '@/lib/order-audio';

export const PendingOrderAlertModal: React.FC = () => {
    const { alerts, hasAlerts, acknowledgeAlert, acknowledgeAll } = useOrderAlerts();
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
    const [audioReady, setAudioReady] = useState<boolean>(() => isAudioReady());

    if (!hasAlerts) {
        return null;
    }

    // Ensure index stays in bounds
    const safeIndex = Math.min(currentIndex, alerts.length - 1);
    const currentAlert = alerts[safeIndex] || alerts[0];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % alerts.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + alerts.length) % alerts.length);
    };

    const handleToggleSound = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = !soundOn;
        setSoundOn(next);
        setSoundEnabled(next);
        if (next) {
            unlockAudio();
            setAudioReady(true);
        }
    };

    const handleUnlockAudioPrompt = () => {
        unlockAudio();
        setAudioReady(true);
    };

    const handleAcknowledge = (e: React.MouseEvent) => {
        e.stopPropagation();
        acknowledgeAlert(currentAlert.id);
        if (safeIndex >= alerts.length - 1) {
            setCurrentIndex(Math.max(0, alerts.length - 2));
        }
    };

    const handleAcknowledgeAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        acknowledgeAll();
        setCurrentIndex(0);
    };

    const handleViewOrder = (e: React.MouseEvent) => {
        e.stopPropagation();
        const targetId = currentAlert.id;
        const targetNumber = currentAlert.order_number;
        acknowledgeAlert(targetId);

        const targetUrl = `/deliveries?order_id=${targetId}&order_number=${encodeURIComponent(targetNumber)}`;
        router.visit(targetUrl);
    };

    const formattedTotal = typeof currentAlert.total_amount === 'number'
        ? `₱${currentAlert.total_amount.toFixed(2)}`
        : `₱${currentAlert.total_amount}`;

    return (
        <div className="fixed top-4 right-4 z-50 pointer-events-none max-w-sm sm:max-w-md w-full px-3">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentAlert.id}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="pointer-events-auto bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl border-2 border-emerald-500/80 dark:border-emerald-400 rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.45)] text-gray-900 dark:text-white font-['Outfit'] relative overflow-hidden ring-4 ring-emerald-500/20"
                    onClick={handleUnlockAudioPrompt}
                >
                    {/* Glowing pulse aura */}
                    <div className="absolute -top-16 -right-16 size-40 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none animate-pulse" />

                    {/* Header: Alert Tag & Controls */}
                    <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="relative flex size-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex rounded-full size-3 bg-rose-500" />
                            </span>
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60 flex items-center gap-1">
                                🚨 NEW ONLINE ORDER
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {/* Sound Toggle */}
                            <button
                                type="button"
                                onClick={handleToggleSound}
                                title={soundOn ? 'Mute Alert Sound' : 'Enable Alert Sound'}
                                className={`size-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                                    soundOn
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                {soundOn ? <FiVolume2 className="size-4 animate-bounce" /> : <FiVolumeX className="size-4" />}
                            </button>

                            {/* Queue count badge if multiple orders */}
                            {alerts.length > 1 && (
                                <span className="text-[11px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                                    {safeIndex + 1}/{alerts.length}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Order Number & Price Hero */}
                    <div className="flex items-baseline justify-between gap-2 mb-3 relative z-10 border-b border-gray-100 dark:border-white/10 pb-2.5">
                        <div>
                            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                Order Reference
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black font-mono text-gray-900 dark:text-white tracking-tight leading-none">
                                {currentAlert.order_number}
                            </h3>
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                Total Due
                            </div>
                            <span className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                                {formattedTotal}
                            </span>
                        </div>
                    </div>

                    {/* Order Details Body */}
                    <div className="space-y-1.5 text-xs relative z-10 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5 mb-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground font-medium">Customer:</span>
                            <span className="font-bold text-foreground text-xs">{currentAlert.customer_name || 'Mobile Customer'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground font-medium">Branch:</span>
                            <span className="font-bold text-foreground text-xs">{currentAlert.branch_name || 'Branch'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground font-medium">Items & Time:</span>
                            <span className="font-semibold text-foreground text-xs">
                                {currentAlert.items_count} item{currentAlert.items_count > 1 ? 's' : ''} • {currentAlert.timestamp}
                            </span>
                        </div>
                    </div>

                    {/* Unmute / Interaction hint if audio is not yet active */}
                    {!audioReady && soundOn && (
                        <button
                            type="button"
                            onClick={handleUnlockAudioPrompt}
                            className="w-full mb-2.5 py-1.5 px-3 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
                        >
                            <FiBell className="size-3.5" />
                            <span>Click here to enable loud alert sound</span>
                        </button>
                    )}

                    {/* Multi-order Pagination Navigation */}
                    {alerts.length > 1 && (
                        <div className="flex items-center justify-between gap-2 mb-3 px-1 text-xs">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="p-1 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer"
                                    title="Previous Order"
                                >
                                    <FiChevronLeft className="size-3.5" />
                                </button>
                                <span className="text-[11px] font-bold text-muted-foreground">
                                    Order {safeIndex + 1} of {alerts.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="p-1 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer"
                                    title="Next Order"
                                >
                                    <FiChevronRight className="size-3.5" />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleAcknowledgeAll}
                                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                            >
                                Acknowledge All ({alerts.length})
                            </button>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 relative z-10">
                        <button
                            type="button"
                            onClick={handleViewOrder}
                            className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <FiEye className="size-3.5" />
                            <span>VIEW ORDER</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleAcknowledge}
                            className="h-10 px-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 active:scale-[0.98] text-gray-700 dark:text-gray-200 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                            <FiCheck className="size-3.5" />
                            <span>ACKNOWLEDGE</span>
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
