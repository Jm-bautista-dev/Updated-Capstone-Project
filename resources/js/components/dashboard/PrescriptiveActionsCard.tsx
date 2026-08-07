import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { PackageCheck, ArrowRight } from 'lucide-react';

export interface Suggestion {
    name: string;
    status: string;
    citation: string;
    suggested_restock: number;
    unit: string;
    depletion_date: string;
}

interface PrescriptiveActionsCardProps {
    suggestions?: Suggestion[];
}

export function PrescriptiveActionsCard({ suggestions = [] }: PrescriptiveActionsCardProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F8C8DC]/30 dark:border-white/10">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                        <PackageCheck className="size-4" />
                    </div>
                    <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                        Prescriptive Actions
                    </h2>
                </div>
                <Link
                    href="/analytics/restock-suggestions"
                    className="text-[10px] font-bold uppercase tracking-wider text-[#E75480] dark:text-[#FF4F81] hover:underline flex items-center gap-1"
                >
                    <span>View All</span>
                    <ArrowRight className="size-3" />
                </Link>
            </div>

            <div className="space-y-3">
                {suggestions.length === 0 ? (
                    <p className="text-xs text-[#9E8B8E] dark:text-[#64748B] italic text-center py-4">
                        No replenishment adjustments required currently.
                    </p>
                ) : (
                    suggestions.slice(0, 3).map((item, idx) => (
                        <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/40 dark:border-white/10 shadow-2xs space-y-1.5 backdrop-blur-sm hover:border-[#E75480]/40 dark:hover:border-[#E1062C]/50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{item.name}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/50">
                                    {item.status}
                                </span>
                            </div>
                            <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] leading-relaxed line-clamp-2">
                                {item.citation}
                            </p>
                            <div className="flex items-center justify-between text-[10px] font-semibold text-[#9E8B8E] dark:text-[#64748B] border-t border-[#F8C8DC]/20 dark:border-white/5 pt-1.5">
                                <span>Restock: <strong className="text-[#3D2C2E] dark:text-[#E2E8F0]">{item.suggested_restock} {item.unit}</strong></span>
                                <span>Expected Out: <strong className="text-[#3D2C2E] dark:text-[#E2E8F0]">{item.depletion_date}</strong></span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
