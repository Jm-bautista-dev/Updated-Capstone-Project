import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bike, BarChart2, ShoppingBag } from 'lucide-react';
import React from 'react';

export function DeliveryQuickActions() {
    const actions = [
        {
            title: 'Rider Fleet Center',
            description: 'Manage rider personnel, status, and fleet credentials',
            icon: Bike,
            href: '/riders',
            color: 'text-[#E75480] dark:text-[#FF4F81]',
            bg: 'bg-[#FADADD]/40 dark:bg-[#E1062C]/15',
        },
        {
            title: 'Delivery Reports',
            description: 'Analyze logistics performance, trends, and daily metrics',
            icon: BarChart2,
            href: '/reports',
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-100/60 dark:bg-purple-950/40',
        },
        {
            title: 'Point of Sale',
            description: 'Create new delivery orders directly from POS terminal',
            icon: ShoppingBag,
            href: '/pos',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100/60 dark:bg-blue-950/40',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-['Outfit']">
            {actions.map((act, idx) => {
                const Icon = act.icon;
                return (
                    <Link key={idx} href={act.href}>
                        <motion.div
                            whileHover={{ y: -3 }}
                            className="p-5 rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-[#E75480]/40 dark:hover:border-white/20 cursor-pointer flex items-center gap-4"
                        >
                            <div className={`p-3 rounded-2xl ${act.bg} ${act.color} shrink-0`}>
                                <Icon className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {act.title}
                                </h4>
                                <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium truncate mt-0.5">
                                    {act.description}
                                </p>
                            </div>
                        </motion.div>
                    </Link>
                );
            })}
        </div>
    );
}
