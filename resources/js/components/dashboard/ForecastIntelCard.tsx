import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export interface ForecastIntel {
    recommended_model: string;
    confidence: string;
    accuracy_pct: number;
    explanation: string;
}

interface ForecastIntelCardProps {
    forecastIntel?: ForecastIntel;
}

export function ForecastIntelCard({ forecastIntel }: ForecastIntelCardProps) {
    const intel = forecastIntel || {
        recommended_model: 'SES Model',
        confidence: 'High (89%)',
        accuracy_pct: 88.5,
        explanation: 'Walk-forward training/validation splits evaluated.',
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-[2.5rem] bg-linear-to-br from-white/90 via-[#FFF9FA]/80 to-[#FFF0F5]/50 dark:from-[#121218]/90 dark:via-[#161620]/80 dark:to-[#1A1A28]/70 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 backdrop-blur-2xl transition-colors duration-300"
        >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F8C8DC]/30 dark:border-white/10">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                        <Cpu className="size-4" />
                    </div>
                    <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                        Forecast Projections
                    </h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
                    {intel.accuracy_pct}% Acc.
                </span>
            </div>

            <div className="space-y-3.5 text-xs">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">
                        Recommended Model
                    </span>
                    <span className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                        {intel.recommended_model}
                    </span>
                </div>

                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] block">
                        Confidence Rating
                    </span>
                    <span className="text-xs font-semibold text-[#5D4A4D] dark:text-[#E2E8F0]">
                        {intel.confidence}
                    </span>
                </div>

                <p className="text-[11px] leading-relaxed text-[#7D6B6E] dark:text-[#94A3B8] border-t border-[#F8C8DC]/30 dark:border-white/10 pt-3 italic">
                    {intel.explanation}
                </p>
            </div>
        </motion.div>
    );
}
