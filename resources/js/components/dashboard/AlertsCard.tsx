import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export interface AlertItem {
    description: string;
    action: string;
    severity?: string;
}

interface AlertsCardProps {
    alerts?: AlertItem[];
}

export function AlertsCard({ alerts = [] }: AlertsCardProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F8C8DC]/30 dark:border-white/10">
                <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-4" />
                </div>
                <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                    Actionable Alerts
                </h2>
            </div>

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <p className="text-xs text-[#9E8B8E] dark:text-[#64748B] italic text-center py-4">
                        All clear! No critical stock alerts found.
                    </p>
                ) : (
                    alerts.slice(0, 3).map((item, idx) => (
                        <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1"
                        >
                            <div className="flex items-start gap-2">
                                <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                        {item.description}
                                    </p>
                                    <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                                        Action Required: {item.action}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
