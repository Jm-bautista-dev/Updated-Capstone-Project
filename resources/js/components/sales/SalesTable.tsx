import { format, parseISO } from 'date-fns';
import { Eye, ShieldAlert, Utensils, ShoppingBag, Truck, Receipt } from 'lucide-react';
import React from 'react';

import type { Sale } from '@/components/sales/SalesHero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SalesTableProps {
    sales: Sale[];
    isAdmin?: boolean;
    density?: 'compact' | 'comfortable';
    onSelectSale: (sale: Sale) => void;
    onOpenVoidModal: (sale: Sale) => void;
}

export function SalesTable({
    sales,
    isAdmin = false,
    density = 'comfortable',
    onSelectSale,
    onOpenVoidModal,
}: SalesTableProps) {
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
        <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden transition-colors duration-300 font-['Outfit']">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    
                    {/* Sticky Table Header */}
                    <thead>
                        <tr className="border-b border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                            <th className="py-4 px-6">Order Number</th>
                            <th className="py-4 px-6">Type & Items</th>
                            <th className="py-4 px-6">Branch & Cashier</th>
                            <th className="py-4 px-6">Total Amount</th>
                            <th className="py-4 px-6">Payment Method</th>
                            <th className="py-4 px-6">Date & Time</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>

                    {/* Table Body Rows */}
                    <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5 text-xs">
                        {sales.map((sale) => {
                            const isVoided = sale.status === 'cancelled';
                            const pyClass = density === 'compact' ? 'py-3 px-6' : 'py-4.5 px-6';

                            return (
                                <tr
                                    key={sale.id}
                                    className={cn(
                                        'transition-colors hover:bg-[#FFF5F7]/50 dark:hover:bg-white/5 group',
                                        isVoided && 'opacity-60 bg-rose-50/30 dark:bg-rose-950/10'
                                    )}
                                >
                                    {/* Order Number SKU */}
                                    <td className={pyClass}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] text-sm group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors">
                                                #{sale.order_number}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Order Type & Items Count */}
                                    <td className={pyClass}>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                {sale.type === 'dine-in' && <Utensils className="size-3.5 text-amber-500" />}
                                                {sale.type === 'take-out' && <ShoppingBag className="size-3.5 text-blue-500" />}
                                                {sale.type === 'delivery' && <Truck className="size-3.5 text-purple-500" />}
                                                <span className="font-bold capitalize text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                    {sale.type || 'In-Store'}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                                {sale.items ? sale.items.length : 0} line items
                                            </span>
                                        </div>
                                    </td>

                                    {/* Branch & Cashier */}
                                    <td className={pyClass}>
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {sale.cashier?.name || 'Staff User'}
                                            </p>
                                            <p className="text-[11px] font-mono text-[#7D6B6E] dark:text-[#94A3B8]">
                                                {sale.branch?.name || 'Main Branch'}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Total Amount */}
                                    <td className={pyClass}>
                                        <div className="space-y-0.5">
                                            <span className="font-mono font-black text-sm text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {formatCurrency(Number(sale.total || 0))}
                                            </span>
                                            {(() => {
                                                const fee = Number(sale.delivery_fee ?? sale.delivery?.delivery_fee ?? 0);
                                                if (sale.type === 'delivery' && fee > 0) {
                                                    const sub = sale.subtotal !== undefined && sale.subtotal !== null
                                                        ? Number(sale.subtotal)
                                                        : Math.max(0, Number(sale.total || 0) - fee);
                                                    return (
                                                        <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                                                            Sub: {formatCurrency(sub)} + {formatCurrency(fee)} fee
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </td>

                                    {/* Payment Method */}
                                    <td className={pyClass}>
                                        <Badge className="bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#3D2C2E] dark:text-[#E2E8F0] border border-[#F8C8DC]/60 dark:border-white/10 font-bold uppercase text-[10px]">
                                            {sale.payment_method || 'Cash'}
                                        </Badge>
                                    </td>

                                    {/* Date & Time */}
                                    <td className={pyClass}>
                                        <span className="font-mono text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                            {safeFormatDate(sale.created_at)}
                                        </span>
                                    </td>

                                    {/* Status Pill */}
                                    <td className={pyClass}>
                                        {sale.status === 'completed' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                                                Completed
                                            </span>
                                        )}
                                        {sale.status === 'preparing' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 animate-pulse">
                                                Preparing
                                            </span>
                                        )}
                                        {sale.status === 'pending' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                                                Pending
                                            </span>
                                        )}
                                        {sale.status === 'cancelled' && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                                                Voided / Cancelled
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions Trigger */}
                                    <td className={cn(pyClass, 'text-right')}>
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onSelectSale(sale)}
                                                className="h-8 px-3 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10 gap-1.5 cursor-pointer"
                                            >
                                                <Eye className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                                <span>Details</span>
                                            </Button>

                                            {isAdmin && !isVoided && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onOpenVoidModal(sale)}
                                                    className="h-8 px-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold gap-1 cursor-pointer"
                                                    title="Void Transaction"
                                                >
                                                    <ShieldAlert className="size-3.5" />
                                                    <span className="hidden sm:inline">Void</span>
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                </table>
            </div>
        </div>
    );
}
