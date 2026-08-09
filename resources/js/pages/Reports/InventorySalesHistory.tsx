import { Head, usePage } from '@inertiajs/react';
import { Clock, FileText, ArrowLeft } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';

interface HistoryItem {
    id: number;
    created_at: string;
    item_name: string;
    quantity_sold: number;
    unit_sold: string;
    sale_price?: number | string;
}

interface InventorySalesHistoryProps {
    history?: HistoryItem[];
    [key: string]: unknown;
}

export default function InventorySalesHistory() {
    const rawProps = usePage().props;
    const pageProps = rawProps as unknown as InventorySalesHistoryProps;
    const historyList: HistoryItem[] = pageProps.history || [];

    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amt);

    return (
        <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }, { title: 'Sales History', href: '/inventory-sales-history' }]}>
            <Head title="Inventory Sales History" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-3xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/50 dark:from-[#181824] dark:to-[#222232] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shadow-2xs">
                            <Clock className="size-6 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                Weight & Volume Sales History
                            </h1>
                            <p className="text-xs sm:text-sm font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                                Historical audit logs of ingredient deductions triggered by sales
                            </p>
                        </div>
                    </div>

                    <a
                        href="/reports"
                        className="h-10 px-4 rounded-2xl bg-white dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] text-xs font-bold flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto shadow-2xs"
                    >
                        <ArrowLeft className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                        <span>Back to Reports Center</span>
                    </a>
                </div>

                {/* Glass History Table */}
                <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden transition-colors duration-300">
                    <div className="p-5 border-b border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                            <h3 className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                Deduction Logs ({historyList.length})
                            </h3>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/40 dark:bg-[#181824]/40 font-black uppercase text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                    <th className="py-4 px-6">Timestamp</th>
                                    <th className="py-4 px-6">Ingredient / Item</th>
                                    <th className="py-4 px-6">Quantity Deducted</th>
                                    <th className="py-4 px-6">Measurement Unit</th>
                                    <th className="py-4 px-6 text-right">Value (PHP)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                                {historyList.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-[#FFF5F7]/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6 font-mono text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                            {sale.created_at}
                                        </td>
                                        <td className="py-4 px-6 font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {sale.item_name}
                                        </td>
                                        <td className="py-4 px-6 font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {sale.quantity_sold.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge className="bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 font-bold uppercase text-[10px]">
                                                {sale.unit_sold}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                            {sale.sale_price ? formatCurrency(Number(sale.sale_price)) : '—'}
                                        </td>
                                    </tr>
                                ))}
                                {historyList.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center font-bold text-[#7D6B6E] dark:text-[#94A3B8] italic">
                                            No sales deduction records logged.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
