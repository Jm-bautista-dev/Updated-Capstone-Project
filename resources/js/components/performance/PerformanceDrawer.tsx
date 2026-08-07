import React from 'react';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export interface PerformanceDrawerCashier {
    id: number;
    name: string;
    branch_name: string;
    total_sales: string | number;
    total_transactions: number;
    avg_order_value: string | number;
}

interface PerformanceDrawerProps {
    cashier: PerformanceDrawerCashier | null;
    open: boolean;
    onClose: () => void;
}

export function PerformanceDrawer({ cashier, open, onClose }: PerformanceDrawerProps) {
    if (!cashier) return null;

    const formatCurrency = (amt: string | number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amt || 0));

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md border-l border-[#F8C8DC]/60 dark:border-white/10 bg-white/95 dark:bg-[#121218]/95 p-6 text-[#3D2C2E] dark:text-[#F8FAFC] font-['Outfit'] backdrop-blur-2xl shadow-2xl space-y-6">
                <SheetHeader className="pb-4 border-b border-[#F8C8DC]/40 dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-2xl bg-linear-to-tr from-[#E75480] to-[#FF4F81] p-0.5 shadow-md">
                                <div className="size-full rounded-[14px] bg-white dark:bg-[#121218] flex items-center justify-center text-xl font-black text-[#E75480] dark:text-[#FF4F81]">
                                    {cashier.name.charAt(0)}
                                </div>
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {cashier.name}
                                </SheetTitle>
                                <SheetDescription className="text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                    {cashier.branch_name || 'Assigned Branch'}
                                </SheetDescription>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                        Performance Telemetry Breakdown
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-[#FFF5F7]/80 dark:bg-[#181824]/80 border border-[#F8C8DC]/60 dark:border-white/10 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Gross Revenue</p>
                            <p className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(cashier.total_sales)}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FFF5F7]/80 dark:bg-[#181824]/80 border border-[#F8C8DC]/60 dark:border-white/10 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Transactions</p>
                            <p className="text-base font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {cashier.total_transactions}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FFF5F7]/80 dark:bg-[#181824]/80 border border-[#F8C8DC]/60 dark:border-white/10 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Average Basket Value</p>
                        <p className="text-base font-mono font-black text-[#E75480] dark:text-[#FF4F81]">
                            {formatCurrency(cashier.avg_order_value)}
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-[#7D6B6E] dark:text-[#94A3B8]">Target Fulfillment Rate</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">94.2%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#FFF5F7] dark:bg-[#1C1C28] overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 w-[94.2%]" />
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
