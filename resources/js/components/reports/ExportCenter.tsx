import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, Download, Printer, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ExportCenter() {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleTriggerExport = (id: string, title: string) => {
        setDownloadingId(id);
        toast.info(`Preparing ${title}...`);
        setTimeout(() => {
            if (id === 'print') {
                window.print();
            } else {
                toast.success(`${title} generated and downloaded successfully!`);
            }
            setDownloadingId(null);
        }, 800);
    };

    const exportOptions = [
        {
            id: 'pdf',
            title: 'Executive PDF Report',
            description: 'Formatted executive summary including charts, revenue breakdown, and AI insights.',
            badge: 'PDF Document',
            icon: FileText,
            color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50',
        },
        {
            id: 'excel',
            title: 'Excel Workbook (.xlsx)',
            description: 'Multi-tab spreadsheet featuring itemized sales, ingredient stock balances, and cost breakdowns.',
            badge: 'XLSX Spreadsheet',
            icon: FileSpreadsheet,
            color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
        },
        {
            id: 'csv',
            title: 'Raw CSV Telemetry Data',
            description: 'Unfiltered CSV dataset ideal for importing into external ERP or business analytics tools.',
            badge: 'CSV Data',
            icon: Download,
            color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50',
        },
        {
            id: 'print',
            title: 'Thermal & Standard Print',
            description: 'Optimized page layout for direct printing or archiving physical copies.',
            badge: 'Print Ready',
            icon: Printer,
            color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50',
        },
    ];

    return (
        <div className="space-y-4 font-['Outfit']">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-2xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/50 dark:from-[#181824] dark:to-[#222232] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shadow-2xs">
                        <Download className="size-4.5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Export & Distribution Center
                        </h2>
                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Generate audit-ready reports in multiple document formats
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {exportOptions.map((opt, index) => {
                    const Icon = opt.icon;
                    const isDownloading = downloadingId === opt.id;

                    return (
                        <motion.div
                            key={opt.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: index * 0.04 }}
                            className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-6 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:border-[#E75480]/40 group"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className={cn('size-11 rounded-2xl flex items-center justify-center border shadow-2xs group-hover:scale-110 transition-transform', opt.color)}>
                                        <Icon className="size-5.5" />
                                    </div>
                                    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border', opt.color)}>
                                        {opt.badge}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        {opt.title}
                                    </h3>
                                    <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                                        {opt.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[#F8C8DC]/40 dark:border-white/10">
                                <Button
                                    type="button"
                                    onClick={() => handleTriggerExport(opt.id, opt.title)}
                                    disabled={isDownloading}
                                    className="w-full h-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#E75480] dark:hover:bg-[#E1062C] hover:text-white border border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold gap-2 cursor-pointer transition-all shadow-2xs"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Sparkles className="size-4 animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="size-4 text-[#E75480] dark:text-[#FF4F81] group-hover:text-white" />
                                            <span>Generate {opt.id.toUpperCase()}</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
