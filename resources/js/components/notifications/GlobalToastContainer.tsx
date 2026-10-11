import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiBell, FiCheck, FiEye, FiPackage, FiTrash2, FiX } from 'react-icons/fi';
import {
    globalNotificationManager,
    type GlobalNotificationItem,
} from '@/lib/global-notification-manager';

export const GlobalToastContainer: React.FC = () => {
    const [state, setState] = useState(() => globalNotificationManager.getState());

    useEffect(() => {
        return globalNotificationManager.subscribe((latestState) => {
            setState(latestState);
        });
    }, []);

    const { visible, queueCount, totalActive } = state;

    if (visible.length === 0) {
        return null;
    }

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        globalNotificationManager.clearAll();
    };

    const handleViewOrder = (item: GlobalNotificationItem) => {
        globalNotificationManager.dismiss(item.id);
        if (item.link_url) {
            router.visit(item.link_url);
            return;
        }

        const isPickup = item.type === 'pickup' || item.fulfillment_type === 'pickup' || item.is_pickup;
        const targetId = item.order_id || item.id;
        const displayOrderNum = item.order_number || (targetId ? `ORD-${targetId}` : 'ORD');
        const queryParams = new URLSearchParams();
        if (targetId) queryParams.set('order_id', String(targetId));
        if (displayOrderNum) queryParams.set('order_number', displayOrderNum);
        const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

        const targetUrl = isPickup
            ? `/pickups${queryStr}`
            : `/deliveries${queryStr}`;
        router.visit(targetUrl);
    };

    const handleDismiss = (id: string | number) => {
        globalNotificationManager.dismiss(id);
    };

    return (
        <div
            id="maki-global-toast-layer"
            className="fixed top-4 right-4 z-50 pointer-events-none flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm w-full font-['Outfit'] select-none"
            role="region"
            aria-label="Order and Inventory Notifications"
            aria-live="polite"
        >
            {/* Top Queue & Clear All Bar (Rendered when multiple notifications are active) */}
            {totalActive > 1 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="pointer-events-auto bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/50 shadow-lg flex items-center justify-between gap-2 text-xs font-bold"
                >
                    <div className="flex items-center gap-1.5">
                        <FiBell className="size-3.5 text-amber-400 animate-bounce" />
                        <span>
                            {visible.length} Active {queueCount > 0 ? `(+${queueCount} queued)` : ''}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-[11px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-0.5 rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="Dismiss all current and queued notifications"
                    >
                        <FiTrash2 className="size-3" />
                        <span>Clear All</span>
                    </button>
                </motion.div>
            )}

            {/* Visible Toast Cards (Maximum 3) */}
            <AnimatePresence mode="popLayout">
                {visible.map((item) => {
                    const isPickup = item.type === 'pickup';
                    const isPrepDue = item.type === 'pickup_prep_due';
                    const isCancellation = item.type === 'cancellation';
                    const isOutOfStock = item.type === 'out_of_stock';
                    const isLowStock = item.type === 'low_stock';
                    const isInventoryAlert = isOutOfStock || isLowStock;

                    const displayOrderNum = item.order_number || (item.id ? `ORD-${item.id}` : 'ORD-NEW');
                    const formattedTotal = typeof item.total_amount === 'number'
                        ? `₱${item.total_amount.toFixed(2)}`
                        : item.total_amount
                        ? `₱${item.total_amount}`
                        : '';

                    const badgeColor = isOutOfStock
                        ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 font-black animate-pulse'
                        : isLowStock
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 font-black animate-pulse'
                        : isCancellation
                        ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60'
                        : isPrepDue
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 animate-pulse'
                        : isPickup
                        ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-900/60'
                        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60';

                    const borderColor = isOutOfStock
                        ? 'border-rose-500/70 dark:border-rose-400/70'
                        : isLowStock
                        ? 'border-amber-500/70 dark:border-amber-400/70'
                        : isCancellation
                        ? 'border-rose-500/40 dark:border-rose-400/50'
                        : isPrepDue
                        ? 'border-amber-500/60 dark:border-amber-400/60'
                        : isPickup
                        ? 'border-cyan-500/40 dark:border-cyan-400/50'
                        : 'border-emerald-500/40 dark:border-emerald-400/50';

                    const ambientGlow = isOutOfStock
                        ? 'bg-rose-500/20'
                        : isLowStock
                        ? 'bg-amber-500/20'
                        : isPrepDue
                        ? 'bg-amber-500/20'
                        : 'bg-emerald-500/10';

                    const progressColor = isOutOfStock
                        ? 'bg-rose-500/70'
                        : isLowStock
                        ? 'bg-amber-500/70'
                        : 'bg-emerald-500/70';

                    const actionBtnColor = isOutOfStock
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : isLowStock
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-emerald-600 hover:bg-emerald-700';

                    return (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: -15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            onMouseEnter={() => globalNotificationManager.pauseTimer(item.id)}
                            onMouseLeave={() => globalNotificationManager.resumeTimer(item.id)}
                            className={`pointer-events-auto bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl border-2 ${borderColor} rounded-3xl p-3.5 sm:p-4 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.2)] text-gray-900 dark:text-white relative overflow-hidden ring-2 ring-black/5 dark:ring-white/5`}
                        >
                            {/* Ambient Glow */}
                            <div className={`absolute -top-10 -right-10 size-28 rounded-full ${ambientGlow} blur-2xl pointer-events-none`} />

                            {/* Header Row */}
                            <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor} shrink-0`}>
                                        {isOutOfStock
                                            ? '🚨 OUT OF STOCK'
                                            : isLowStock
                                            ? '⚠️ LOW STOCK'
                                            : isCancellation
                                            ? '🚨 CANCELLATION'
                                            : isPrepDue
                                            ? '🍳 PREPARE NOW'
                                            : isPickup
                                            ? '🛍️ NEW PICKUP'
                                            : '🛎️ NEW ONLINE ORDER'}
                                    </span>
                                    <span className="text-xs sm:text-sm font-black font-mono text-gray-900 dark:text-white truncate">
                                        {isInventoryAlert ? (item.ingredient_name || 'Inventory Item') : displayOrderNum}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isInventoryAlert && item.current_stock !== undefined ? (
                                        <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-xl border ${isOutOfStock ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800/60' : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800/60'}`}>
                                            {item.current_stock}
                                        </span>
                                    ) : formattedTotal ? (
                                        <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-xl border border-emerald-300 dark:border-emerald-800/60">
                                            {formattedTotal}
                                        </span>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => handleDismiss(item.id)}
                                        aria-label="Close notification"
                                        className="size-6 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                    >
                                        <FiX className="size-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Body Details */}
                            {isInventoryAlert ? (
                                <div className="text-[11px] text-muted-foreground bg-gray-50/80 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5 mb-2.5 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-500 dark:text-gray-400">Ingredient:</span>
                                        <span className="font-bold text-gray-900 dark:text-white truncate max-w-45">
                                            {item.ingredient_name || 'Inventory Item'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-500 dark:text-gray-400">Current Stock:</span>
                                        <span className={`font-black font-mono truncate max-w-45 ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {item.current_stock || (isOutOfStock ? '0' : 'Low')}
                                        </span>
                                    </div>
                                    {item.threshold && (
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-500 dark:text-gray-400">Min. Threshold:</span>
                                            <span className="font-semibold font-mono text-gray-700 dark:text-gray-300 truncate max-w-45">
                                                {item.threshold}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-0.5 border-t border-gray-200/50 dark:border-white/5">
                                        <span className="font-medium text-gray-500 dark:text-gray-400">Branch:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-45">
                                            📍 {item.branch_name || 'Branch'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[11px] text-muted-foreground bg-gray-50/80 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5 mb-2.5 space-y-0.5">
                                    <div className="flex items-center justify-between">
                                        <span>Customer:</span>
                                        <span className="font-bold text-foreground truncate max-w-45">
                                            {item.customer_name || 'Mobile Customer'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Branch / Items:</span>
                                        <span className="font-semibold text-foreground truncate max-w-45">
                                            {item.branch_name || 'Branch'} {item.items_count ? `• ${item.items_count} item(s)` : ''}
                                        </span>
                                    </div>
                                    {item.reason && (
                                        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold pt-0.5 border-t border-gray-200/50 dark:border-white/5">
                                            <span>Reason:</span>
                                            <span className="truncate max-w-45">{item.reason}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 relative z-10">
                                <button
                                    type="button"
                                    onClick={() => handleViewOrder(item)}
                                    className={`flex-1 h-8 ${actionBtnColor} active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5`}
                                >
                                    {isInventoryAlert ? <FiPackage className="size-3.5" /> : <FiEye className="size-3.5" />}
                                    <span>{item.link_text || (isInventoryAlert ? 'VIEW INVENTORY' : 'VIEW ORDER')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDismiss(item.id)}
                                    className="h-8 px-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 active:scale-[0.98] text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                    <FiCheck className="size-3" />
                                    <span>DISMISS</span>
                                </button>
                            </div>

                            {/* Auto-Dismiss Progress Indicator */}
                            {item.auto_dismiss && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: (item.duration_ms || 5000) / 1000, ease: 'linear' }}
                                        className={`h-full ${progressColor}`}
                                    />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
