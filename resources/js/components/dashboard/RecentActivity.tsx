import { motion } from 'framer-motion';
import { Clock, Activity } from 'lucide-react';

export interface ActivityItem {
    timestamp: string;
    action: string;
    user: string;
    status?: string;
}

interface RecentActivityProps {
    recentActivity?: ActivityItem[];
}

export function RecentActivity({ recentActivity = [] }: RecentActivityProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                    <Activity className="size-4" />
                </div>
                <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                    Audited Operations Logs
                </h2>
            </div>
            <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] mb-6">
                System activity timeline and operational events.
            </p>

            <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F8C8DC]/50 dark:before:bg-white/10">
                {recentActivity.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 relative pl-7 group">
                        <div className="absolute left-1 top-1 size-3 rounded-full bg-white dark:bg-[#121218] border-2 border-[#E75480] dark:border-[#E1062C] shadow-xs shrink-0 group-hover:scale-125 group-hover:bg-[#E75480] dark:group-hover:bg-[#E1062C] transition-all" />
                        
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors">
                                    {item.action}
                                </span>
                                <span className="text-[10px] font-semibold text-[#9E8B8E] dark:text-[#64748B] flex items-center gap-1 font-mono">
                                    <Clock className="size-3" />
                                    {item.timestamp}
                                </span>
                            </div>
                            <span className="text-[11px] font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                Triggered by {item.user}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
