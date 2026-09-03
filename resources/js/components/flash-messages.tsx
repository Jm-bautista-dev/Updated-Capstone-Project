import { usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface FlashPayload {
    success?: string;
    error?: string;
    [key: string]: unknown;
}

interface PageWithFlash {
    flash?: FlashPayload;
    [key: string]: unknown;
}

export function FlashMessages() {
    const { props } = usePage<PageWithFlash>();
    const flash = props.flash;

    const [dismissedKey, setDismissedKey] = useState<string>('');

    const activeMessage = flash?.success || flash?.error || '';
    const activeType: 'success' | 'error' = flash?.error ? 'error' : 'success';
    const messageKey = `${activeType}:${activeMessage}`;

    const isVisible = Boolean(activeMessage) && dismissedKey !== messageKey;

    useEffect(() => {
        if (!isVisible) return;

        const timer = setTimeout(() => {
            setDismissedKey(messageKey);
        }, 5000);

        return () => clearTimeout(timer);
    }, [isVisible, messageKey]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key={messageKey}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed bottom-8 right-8 z-100 flex items-center gap-4 p-4 rounded-2xl shadow-2xl bg-white border border-muted/20 min-w-75"
                >
                    <div className={`p-2 rounded-xl ${activeType === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {activeType === 'success' ? <CheckCircle className="size-6" /> : <XCircle className="size-6" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{activeType}</p>
                        <p className="font-bold text-sm">{activeMessage}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDismissedKey(messageKey)}
                        aria-label="Dismiss notification"
                        className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="size-4 text-muted-foreground" />
                    </button>
                    {/* Progress bar */}
                    <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                        className={`absolute bottom-0 left-0 h-1 rounded-full ${activeType === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
