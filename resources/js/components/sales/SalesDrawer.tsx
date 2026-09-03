import axios from 'axios';
import { format, parseISO } from 'date-fns';
import {
    Receipt,
    UserCheck,
    Store,
    Printer,
    ShoppingBag,
    Utensils,
    Truck,
    ShieldAlert,
    X,
    RotateCw
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import type { Sale } from '@/components/sales/SalesHero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
} from '@/components/ui/sheet';
import { sendToLocalPrintBridge } from '@/lib/pos-print-bridge';
import { cn, formatReceiptBranchHeading } from '@/lib/utils';

interface SalesDrawerProps {
    sale: Sale | null;
    open: boolean;
    onClose: () => void;
    isAdmin?: boolean;
    onOpenVoidModal?: (sale: Sale) => void;
}

export function SalesDrawer({
    sale,
    open,
    onClose,
    isAdmin = false,
    onOpenVoidModal,
}: SalesDrawerProps) {
    const [tab, setTab] = useState<'items' | 'receipt'>('items');
    const [reprinting, setReprinting] = useState(false);

    const handleThermalReprint = async () => {
        if (!sale?.id) return;
        setReprinting(true);
        try {
            const res = await axios.post('/api/v1/pos/print-jobs/reprint', {
                sale_id: sale.id,
                reason: 'Reprinted from Sales History Drawer',
            });
            if (res.data?.success && res.data?.print_job) {
                const printJob = res.data.print_job;
                const result = await sendToLocalPrintBridge(printJob);
                if (result.success) {
                    toast.success(`✓ Thermal receipt sent to printer for #${sale.order_number || sale.id}`);
                } else {
                    toast.warning(`Receipt queued for printing (Printer bridge offline)`);
                }
            } else {
                toast.error('Failed to create reprint job');
            }
        } catch {
            toast.error('Error requesting receipt reprint');
        } finally {
            setReprinting(false);
        }
    };

    if (!sale) return null;

    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amt);

    const safeFormatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            return format(parseISO(dateStr), 'MMMM dd, yyyy • hh:mm a');
        } catch {
            return dateStr;
        }
    };

    const isVoided = sale.status === 'cancelled';

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent className="w-full sm:max-w-md p-0 bg-white dark:bg-[#121218] border-l border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit'] flex flex-col justify-between shadow-2xl">
                
                {/* Header */}
                <div className="p-6 bg-[#FFF5F7]/80 dark:bg-[#181824]/80 border-b border-[#F8C8DC]/60 dark:border-white/10 backdrop-blur-md space-y-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-white dark:bg-[#20202C] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-xs">
                                <Receipt className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    #{sale.order_number}
                                </h2>
                                <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                    {safeFormatDate(sale.created_at)}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="size-8 rounded-xl bg-white dark:bg-[#20202C] text-[#7D6B6E] dark:text-[#94A3B8] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center hover:text-[#E75480] dark:hover:text-[#FF4F81] transition-colors cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    {/* Status & Type Bar */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                            {sale.type === 'dine-in' && <Utensils className="size-4 text-amber-500" />}
                            {sale.type === 'take-out' && <ShoppingBag className="size-4 text-blue-500" />}
                            {sale.type === 'delivery' && <Truck className="size-4 text-purple-500" />}
                            <span className="text-xs font-bold capitalize text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {sale.type || 'In-Store'} Order
                            </span>
                        </div>

                        <div>
                            {sale.status === 'completed' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                                    Completed
                                </span>
                            )}
                            {sale.status === 'preparing' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 animate-pulse">
                                    Preparing
                                </span>
                            )}
                            {sale.status === 'pending' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                                    Pending
                                </span>
                            )}
                            {sale.status === 'cancelled' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                                    Voided
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center p-1 rounded-2xl bg-white/70 dark:bg-[#121218]/70 border border-[#F8C8DC]/60 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setTab('items')}
                            className={cn(
                                'flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-center',
                                tab === 'items'
                                    ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E]'
                            )}
                        >
                            Order Breakdown
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('receipt')}
                            className={cn(
                                'flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-center',
                                tab === 'receipt'
                                    ? 'bg-[#E75480] dark:bg-[#E1062C] text-white shadow-xs'
                                    : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E]'
                            )}
                        >
                            Receipt Preview
                        </button>
                    </div>
                </div>

                {/* Tab Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {tab === 'items' ? (
                        <>
                            {/* Cashier & Branch Telemetry */}
                            <div className="p-4 rounded-3xl bg-[#FFF5F7]/60 dark:bg-[#181820]/60 border border-[#F8C8DC]/40 dark:border-white/10 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8] font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <UserCheck className="size-3.5" />
                                        Cashier
                                    </span>
                                    <span className="text-[#3D2C2E] dark:text-[#F8FAFC] font-extrabold">{sale.cashier?.name || 'Staff User'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8] font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <Store className="size-3.5" />
                                        Register Branch
                                    </span>
                                    <span className="text-[#3D2C2E] dark:text-[#F8FAFC] font-mono font-bold">{sale.branch?.name || 'Main Branch'}</span>
                                </div>
                            </div>

                            {/* Itemized Purchased List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Purchased Line Items ({sale.items ? sale.items.length : 0})
                                </h3>

                                <div className="rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 overflow-hidden divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                                    {sale.items && sale.items.length > 0 ? (
                                        sale.items.map((item) => (
                                            <div key={item.id} className="p-3.5 bg-white dark:bg-[#181820] flex items-center justify-between gap-3 text-xs">
                                                <div>
                                                    <p className="font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                        {item.product?.name || 'Product'}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-[#7D6B6E] dark:text-[#94A3B8]">
                                                        {item.quantity} x {formatCurrency(Number(item.unit_price))}
                                                    </p>
                                                </div>
                                                <span className="font-mono font-bold text-sm text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                    {formatCurrency(Number(item.subtotal))}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                            No item details available.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div className="p-4 rounded-3xl bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 space-y-2.5 font-mono text-xs">
                                <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8]">
                                    <span>Payment Method</span>
                                    <Badge className="bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#E2E8F0] border border-[#F8C8DC]/60 dark:border-white/10 font-bold uppercase text-[10px]">
                                        {sale.payment_method || 'Cash'}
                                    </Badge>
                                </div>
                                {(() => {
                                    const fee = Number(sale.delivery_fee ?? sale.delivery?.delivery_fee ?? 0);
                                    const disc = Number(sale.discount ?? 0);
                                    const sub = sale.subtotal !== undefined && sale.subtotal !== null
                                        ? Number(sale.subtotal)
                                        : (sale.items && sale.items.length > 0
                                            ? sale.items.reduce((acc, it) => acc + Number(it.subtotal || 0), 0)
                                            : Math.max(0, Number(sale.total || 0) + disc - fee));

                                    const details = typeof sale.discount_details === 'string'
                                        ? (() => { try { return JSON.parse(sale.discount_details); } catch { return null; } })()
                                        : sale.discount_details;

                                    return (
                                        <>
                                            <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8]">
                                                <span>Product Subtotal</span>
                                                <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(sub)}</span>
                                            </div>
                                            {disc > 0 && (
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                                                        <span>Discount {sale.discount_type ? `(${sale.discount_type.replace('_', ' ').toUpperCase()})` : ''}</span>
                                                        <span>-{formatCurrency(disc)}</span>
                                                    </div>
                                                    {details?.customer_name && (
                                                        <div className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] text-right">
                                                            {details.customer_name} {details.id_number ? `• ID: ${details.id_number}` : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {fee > 0 && (
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8]">
                                                        <span className="flex items-center gap-1">
                                                            <Truck className="size-3 text-purple-500" />
                                                            <span>Delivery Fee</span>
                                                            {sale.delivery_fee_breakdown?.actual_distance_km ? (
                                                                <span className="text-[10px] font-normal text-slate-500">
                                                                    ({sale.delivery_fee_breakdown.actual_distance_km} km)
                                                                </span>
                                                            ) : null}
                                                        </span>
                                                        <span className="font-bold text-purple-600 dark:text-purple-400">+{formatCurrency(fee)}</span>
                                                    </div>
                                                    {sale.delivery_fee_breakdown?.formula_description && (
                                                        <div className="text-[10px] text-[#7D6B6E] dark:text-[#94A3B8] bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-xl border border-purple-200/40 dark:border-purple-900/30 space-y-1">
                                                            <div className="flex items-center justify-between font-medium">
                                                                <span>Calculation Breakdown:</span>
                                                                <span className="font-bold">₱{Number(fee).toFixed(2)}</span>
                                                            </div>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                                                                {sale.delivery_fee_breakdown.formula_description}
                                                            </p>
                                                            {sale.delivery_fee_breakdown.is_high_fee_ratio && (
                                                                <div className="pt-0.5 text-[9px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                                                                    <span>ℹ️ High fee-to-subtotal ratio ({sale.delivery_fee_breakdown.fee_to_subtotal_pct}%) due to distance ({sale.delivery_fee_breakdown.rounded_distance_km} km).</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                                <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8]">
                                    <span>Paid Amount</span>
                                    <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(Number(sale.paid_amount || 0))}</span>
                                </div>
                                <div className="flex items-center justify-between text-[#7D6B6E] dark:text-[#94A3B8]">
                                    <span>Change</span>
                                    <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{formatCurrency(Number(sale.change_amount || 0))}</span>
                                </div>
                                <div className="pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-between text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    <span>Net Total Paid</span>
                                    <span className="text-base text-[#E75480] dark:text-[#FF4F81]">{formatCurrency(Number(sale.total || 0))}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Receipt Thermal View */
                        <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-[#181824] border border-amber-200/60 dark:border-white/10 text-slate-800 dark:text-slate-200 font-mono text-xs space-y-4 shadow-inner">
                            <div className="text-center space-y-1">
                                <h4 className="font-black text-sm uppercase tracking-widest">
                                    {formatReceiptBranchHeading(sale.branch?.name || sale.order?.branch?.name)}
                                </h4>
                                {(sale.branch?.address || sale.order?.branch?.address) && (
                                    <p className="text-[10px] text-slate-500">
                                        {sale.branch?.address || sale.order?.branch?.address}
                                    </p>
                                )}
                                <p className="text-[10px] text-slate-400">================================</p>
                            </div>

                            <div className="space-y-1 text-[11px]">
                                <p>Receipt #: {sale.order_number}</p>
                                <p>Date: {safeFormatDate(sale.created_at)}</p>
                                <p>Cashier: {sale.cashier?.name || 'Staff'}</p>
                                <p>Type: {sale.type?.toUpperCase() || 'IN-STORE'}</p>
                                {(() => {
                                    const details = typeof sale.discount_details === 'string'
                                        ? (() => { try { return JSON.parse(sale.discount_details); } catch { return null; } })()
                                        : sale.discount_details;
                                    if (details?.customer_name || details?.id_number) {
                                        return (
                                            <div className="text-[10px] text-slate-600 dark:text-slate-400 pt-0.5">
                                                <p>Customer: {details.customer_name || 'N/A'}</p>
                                                {details.id_number && <p>ID Ref: {details.id_number}</p>}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <p className="text-[10px] text-slate-400">--------------------------------</p>

                            <div className="space-y-2">
                                {sale.items?.map((i) => (
                                    <div key={i.id} className="flex justify-between text-[11px]">
                                        <span>{i.product?.name} x{i.quantity}</span>
                                        <span>₱{Number(i.subtotal).toFixed(2)}</span>
                                    </div>
                                ))}
                                {(() => {
                                    const disc = Number(sale.discount ?? 0);
                                    if (disc > 0) {
                                        return (
                                            <div className="flex justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                                                <span>DISCOUNT ({sale.discount_type ? sale.discount_type.replace('_', ' ').toUpperCase() : 'APPLIED'})</span>
                                                <span>-₱{disc.toFixed(2)}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                {(() => {
                                    const fee = Number(sale.delivery_fee ?? sale.delivery?.delivery_fee ?? 0);
                                    if (fee > 0) {
                                        return (
                                            <div className="flex justify-between text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                                                <span>Delivery Fee</span>
                                                <span>₱{fee.toFixed(2)}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <p className="text-[10px] text-slate-400">--------------------------------</p>

                            <div className="space-y-1 text-right text-[11px] font-bold">
                                <p>TOTAL: ₱{Number(sale.total).toFixed(2)}</p>
                                <p>PAID ({sale.payment_method?.toUpperCase()}): ₱{Number(sale.paid_amount || 0).toFixed(2)}</p>
                                <p>CHANGE: ₱{Number(sale.change_amount || 0).toFixed(2)}</p>
                            </div>

                            <div className="text-center pt-2 space-y-1 text-[10px] text-slate-500">
                                <p>Thank you for dining with us!</p>
                                <p>Please come again.</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-[#FFF5F7]/80 dark:bg-[#181824]/80 border-t border-[#F8C8DC]/60 dark:border-white/10 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleThermalReprint}
                        disabled={reprinting}
                        className="flex-1 h-11 rounded-2xl border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-bold gap-2 cursor-pointer"
                    >
                        <RotateCw className={cn("size-4", reprinting && "animate-spin")} />
                        <span>{reprinting ? 'Spooling...' : 'Thermal Reprint'}</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.print()}
                        className="h-11 px-3 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] text-xs font-bold gap-1.5 cursor-pointer"
                        title="Browser Print Preview"
                    >
                        <Printer className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                        <span className="hidden sm:inline">Browser</span>
                    </Button>

                    {isAdmin && !isVoided && onOpenVoidModal && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => onOpenVoidModal(sale)}
                            className="h-11 px-4 rounded-2xl bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                        >
                            <ShieldAlert className="size-4" />
                            <span>Void Sale</span>
                        </Button>
                    )}
                </div>

            </SheetContent>
        </Sheet>
    );
}
