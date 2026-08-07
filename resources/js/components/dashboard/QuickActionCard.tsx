import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    ShoppingCart, 
    ClipboardList, 
    BarChart2, 
    Zap, 
    Cpu, 
    PackageCheck,
    ChevronRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ActionItem {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
}

const defaultActions: ActionItem[] = [
    {
        title: 'Forecast Engine',
        description: 'Sales prediction models',
        href: '/analytics/sales-forecast',
        icon: Zap,
    },
    {
        title: 'Benchmarking',
        description: 'Model error validation',
        href: '/analytics/forecast-benchmarking',
        icon: Cpu,
    },
    {
        title: 'Restock Suggestions',
        description: 'Prescriptive inventory',
        href: '/analytics/restock-suggestions',
        icon: PackageCheck,
    },
    {
        title: 'Transaction Ledger',
        description: 'Completed orders history',
        href: '/sales',
        icon: ShoppingCart,
    },
    {
        title: 'Safety Inventory',
        description: 'Stock thresholds & levels',
        href: '/inventory',
        icon: ClipboardList,
    },
    {
        title: 'Export Reports',
        description: 'PDF & CSV analytics',
        href: '/reports',
        icon: BarChart2,
    },
];

export function QuickActionCard() {
    return (
        <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                        Quick Operations
                    </h2>
                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                        Instant access to key modules and analytical workflows.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {defaultActions.map((action, idx) => {
                    const Icon = action.icon;

                    return (
                        <motion.div
                            key={action.title}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        >
                            <Link
                                href={action.href}
                                className="group flex flex-col justify-between h-full p-4 rounded-2xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/40 dark:border-white/10 shadow-xs hover:shadow-md hover:border-[#E75480]/40 dark:hover:border-[#E1062C]/50 transition-all duration-300 backdrop-blur-sm"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2.5 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] group-hover:bg-[#E75480] dark:group-hover:bg-[#E1062C] group-hover:text-white transition-all duration-300">
                                        <Icon className="size-4" />
                                    </div>
                                    <ChevronRight className="size-4 text-[#C5B8BA] dark:text-[#64748B] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] group-hover:translate-x-0.5 transition-all" />
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors leading-snug">
                                        {action.title}
                                    </h3>
                                    <p className="text-[11px] font-medium text-[#9E8B8E] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                                        {action.description}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
