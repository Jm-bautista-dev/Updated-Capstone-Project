import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';

export function FlashMessages() {
    const { flash } = usePage().props as any;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'success' | 'error'>('success');

    useEffect(() => {
        if (flash.success) {
            setMessage(flash.success);
            setType('success');
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
        if (flash.error) {
            setMessage(flash.error);
            setType('error');
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed bottom-8 right-8 z-[100] flex items-center gap-4 p-4 rounded-2xl shadow-2xl bg-white border border-muted/20 min-w-[300px]"
                >
                    <div className={`p-2 rounded-xl ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {type === 'success' ? <CheckCircle className="size-6" /> : <XCircle className="size-6" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{type}</p>
                        <p className="font-bold text-sm">{message}</p>
                    </div>
                    <button onClick={() => setVisible(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                        <X className="size-4 text-muted-foreground" />
                    </button>
                    {/* Progress bar */}
                    <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                        className={`absolute bottom-0 left-0 h-1 rounded-full ${type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
