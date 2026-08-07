import { FileText, Printer, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReportRow {
    id: number;
    timestamp: string;
    item: string;
    qty: number;
    unit: string;
    value: number;
    status: string;
}

const RECENT_HISTORY_MOCK: ReportRow[] = [
    { id: 1, timestamp: '2024-04-14 10:24 AM', item: 'Premium Tonkotsu Ramen', qty: 2, unit: 'pcs', value: 760, status: 'Completed' },
    { id: 2, timestamp: '2024-04-14 10:30 AM', item: 'Spicy Salmon Roll', qty: 1, unit: 'pcs', value: 320, status: 'Completed' },
    { id: 3, timestamp: '2024-04-14 10:45 AM', item: 'Green Tea (Pot)', qty: 1, unit: 'pcs', value: 150, status: 'Completed' },
    { id: 4, timestamp: '2024-04-14 11:05 AM', item: 'Miso Soup Special', qty: 3, unit: 'pcs', value: 270, status: 'Refunded' },
    { id: 5, timestamp: '2024-04-14 11:15 AM', item: 'Gyoza (6pcs)', qty: 2, unit: 'pcs', value: 360, status: 'Completed' },
    { id: 6, timestamp: '2024-04-14 11:40 AM', item: 'Chicken Teriyaki Don', qty: 2, unit: 'pcs', value: 580, status: 'Completed' },
    { id: 7, timestamp: '2024-04-14 12:10 PM', item: 'Matcha Boba Tea', qty: 4, unit: 'pcs', value: 480, status: 'Completed' },
];

export function ReportsTable() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amt);

    const filteredRows = useMemo(() => {
        return RECENT_HISTORY_MOCK.filter(
            (row) =>
                row.item.toLowerCase().includes(search.toLowerCase()) ||
                row.status.toLowerCase().includes(search.toLowerCase()) ||
                row.timestamp.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    return (
        <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 p-6 sm:p-7 space-y-5 font-['Outfit']">
            
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-2xs">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            System Telemetry Audit Log
                        </h3>
                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Detailed transaction log and inventory activity record
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative w-48 sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-[#7D6B6E] dark:text-[#94A3B8]" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter telemetry..."
                            className="pl-9 h-10 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-10 px-3.5 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] text-xs font-bold gap-1.5 cursor-pointer"
                    >
                        <Printer className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                        <span>Print</span>
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/70 dark:bg-[#181824]/70 backdrop-blur-md font-black uppercase text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                            <th className="py-3.5 px-5">Timestamp</th>
                            <th className="py-3.5 px-5">Item Description</th>
                            <th className="py-3.5 px-5">Qty</th>
                            <th className="py-3.5 px-5">Net Value</th>
                            <th className="py-3.5 px-5">Status</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                        {filteredRows.map((row) => (
                            <tr key={row.id} className="hover:bg-[#FFF5F7]/40 dark:hover:bg-white/5 transition-colors">
                                <td className="py-3.5 px-5 font-mono text-[11px] font-bold text-[#7D6B6E] dark:text-[#94A3B8]">
                                    {row.timestamp}
                                </td>
                                <td className="py-3.5 px-5 font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {row.item}
                                </td>
                                <td className="py-3.5 px-5 font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {row.qty} {row.unit}
                                </td>
                                <td className="py-3.5 px-5 font-mono font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {formatCurrency(row.value)}
                                </td>
                                <td className="py-3.5 px-5">
                                    {row.status === 'Completed' ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                                            Completed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                                            Refunded
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] font-mono pt-1">
                <span>Showing {filteredRows.length} audit entries</span>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="size-8 rounded-xl border-[#F8C8DC]/60 dark:border-white/10">
                        <ChevronLeft className="size-3.5" />
                    </Button>
                    <span className="px-2">Page {page}</span>
                    <Button variant="outline" size="icon" disabled onClick={() => setPage(p => p + 1)} className="size-8 rounded-xl border-[#F8C8DC]/60 dark:border-white/10">
                        <ChevronRight className="size-3.5" />
                    </Button>
                </div>
            </div>

        </div>
    );
}
