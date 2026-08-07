import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Eye, ShieldAlert, Utensils, ShoppingBag, Truck, Receipt, UserCheck, Clock } from 'lucide-react';
import React from 'react';

import type { Sale } from '@/components/sales/SalesHero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SalesCardGridProps {
    sales: Sale[];
    isAdmin?: boolean;
    onSelectSale: (sale: Sale) => void;
    onOpenVoidModal: (sale: Sale) => void;
}

export function SalesCardGrid({
    sales,
    isAdmin = false,
    onSelectSale,
    onOpenVoidModal,
}: SalesCardGridProps) {
    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amt);

    const safeFormatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            return format(parseISO(dateStr), 'MMM dd, yyyy • hh:mm a');
        } catch {
            return dateStr;
        }
    };

    if (sales.length === 0) {
        return (
            <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-12 text-center shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 font-['Outfit'] space-y-3">
                <div className="size-16 rounded-3xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center mx-auto shadow-sm">
                    <Receipt className="size-8" />
                </div>
                <h3 className="text-xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">No Transactions Found</h3>
                <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] max-w-sm mx-auto">
                    There are no sales orders matching your current search query or status filters.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 font-['Outfit']">
            {sales.map((sale, index) => {
                const isVoided = sale.status === 'cancelled';

                return (
                    <motion.div
                        key={sale.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className={cn(
                            'rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:border-[#E75480]/40 group',
                            isVoided && 'opacity-65 bg-rose-50/30 dark:bg-rose-950/10'
                        )}
                    >
                        {/* Header: SKU & Status */}
                        <div className="flex items-center justify-between gap-2 border-b border-[#F8C8DC]/40 dark:border-white/10 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center font-mono font-black shadow-2xs group-hover:scale-105 transition-transform">
                                    <Receipt className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-mono font-extrabold text-base text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        #{sale.order_number}
                                    </h3>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                        {sale.type === 'dine-in' && <Utensils className="size-3 text-amber-500" />}
                                        {sale.type === 'take-out' && <ShoppingBag className="size-3 text-blue-500" />}
                                        {sale.type === 'delivery' && <Truck className="size-3 text-purple-500" />}
                                        <span className="capitalize">{sale.type || 'In-Store'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Pill */}
                            <div>
                                {sale.status === 'completed' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 uppercase">
                                        Completed
                                    </span>
                                )}
                                {sale.status === 'preparing' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 uppercase animate-pulse">
                                        Preparing
                                    </span>
                                )}
                                {sale.status === 'pending' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 uppercase">
                                        Pending
                                    </span>
                                )}
                                {sale.status === 'cancelled' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 uppercase">
                                        Voided
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Amount & Items Breakdown */}
                        <div className="space-y-3">
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Total Revenue</span>
                                <span className="font-mono font-black text-2xl text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {formatCurrency(Number(sale.total || 0))}
                                </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-[#FFF5F7]/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/40 dark:border-white/10 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8] font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <UserCheck className="size-3.5" />
                                        Cashier
                                    </span>
                                    <span className="text-[#3D2C2E] dark:text-[#F8FAFC]">{sale.cashier?.name || 'Staff User'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8] font-bold">
                                    <span>Branch</span>
                                    <span className="text-[#3D2C2E] dark:text-[#F8FAFC] font-mono">{sale.branch?.name || 'Main Branch'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8] font-bold">
                                    <span>Payment Method</span>
                                    <Badge className="bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#E2E8F0] border border-[#F8C8DC]/60 dark:border-white/10 font-bold uppercase text-[10px]">
                                        {sale.payment_method || 'Cash'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Footer Meta & Actions */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                <Clock className="size-3" />
                                <span>{safeFormatDate(sale.created_at)}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onSelectSale(sale)}
                                    className="h-8 px-3 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10 gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <Eye className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                    <span>Details</span>
                                </Button>

                                {isAdmin && !isVoided && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onOpenVoidModal(sale)}
                                        className="h-8 w-8 p-0 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                        title="Void Transaction"
                                    >
                                        <ShieldAlert className="size-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>

                    </motion.div>
                );
            })}
        </div>
    );
}
