import { motion } from 'framer-motion';
import { FileText, Download, Eye, Clock, FileSpreadsheet } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RecentReport {
    id: string;
    name: string;
    category: string;
    generatedBy: string;
    generatedAt: string;
    fileType: 'pdf' | 'xlsx' | 'csv';
    fileSize: string;
    status: 'ready' | 'processing';
}

interface RecentReportsCardProps {
    onInspectReport: (report: RecentReport) => void;
}

export function RecentReportsCard({ onInspectReport }: RecentReportsCardProps) {
    const reports: RecentReport[] = [
        {
            id: 'REP-2026-001',
            name: 'Weekly Sales & Operational Telemetry',
            category: 'Sales Intelligence',
            generatedBy: 'System AI Engine',
            generatedAt: '2026-08-05 10:30 AM',
            fileType: 'pdf',
            fileSize: '2.4 MB',
            status: 'ready',
        },
        {
            id: 'REP-2026-002',
            name: 'Inventory Valuation & Reorder Audit',
            category: 'Inventory Telemetry',
            generatedBy: 'Admin User',
            generatedAt: '2026-08-05 09:15 AM',
            fileType: 'xlsx',
            fileSize: '1.1 MB',
            status: 'ready',
        },
        {
            id: 'REP-2026-003',
            name: 'Monthly Revenue & Cost Margin Breakdown',
            category: 'Financial Intelligence',
            generatedBy: 'System AI Engine',
            generatedAt: '2026-08-04 06:00 PM',
            fileType: 'pdf',
            fileSize: '3.8 MB',
            status: 'ready',
        },
        {
            id: 'REP-2026-004',
            name: 'Supplier Receipt OCR Restock Log',
            category: 'Procurement',
            generatedBy: 'Inventory Manager',
            generatedAt: '2026-08-04 02:45 PM',
            fileType: 'csv',
            fileSize: '450 KB',
            status: 'ready',
        },
    ];

    const handleDownload = (name: string) => {
        toast.success(`Downloading ${name}...`);
    };

    return (
        <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 p-6 sm:p-7 space-y-5 font-['Outfit']">
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shadow-2xs">
                        <Clock className="size-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Recent Generated Intelligence Reports
                        </h2>
                        <p className="text-xs font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            Previously generated audit files ready for instant inspection and download
                        </p>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((rep, index) => (
                    <motion.div
                        key={rep.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        className="p-4 rounded-3xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/40 dark:border-white/10 hover:border-[#E75480]/40 transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    'size-10 rounded-2xl flex items-center justify-center border shrink-0 font-bold text-xs shadow-2xs',
                                    rep.fileType === 'pdf' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50' :
                                    rep.fileType === 'xlsx' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' :
                                    'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
                                )}>
                                    {rep.fileType === 'xlsx' ? <FileSpreadsheet className="size-5" /> : <FileText className="size-5" />}
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="font-extrabold text-sm text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors line-clamp-1">
                                        {rep.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#7D6B6E] dark:text-[#94A3B8]">
                                        <span>{rep.category}</span>
                                        <span>•</span>
                                        <span>{rep.fileSize}</span>
                                    </div>
                                </div>
                            </div>

                            <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 font-bold uppercase text-[10px] shrink-0">
                                Ready
                            </Badge>
                        </div>

                        {/* Footer Meta & Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#F8C8DC]/30 dark:border-white/5 text-[11px] font-medium text-[#7D6B6E] dark:text-[#94A3B8]">
                            <span className="font-mono">By {rep.generatedBy} • {rep.generatedAt}</span>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onInspectReport(rep)}
                                    className="h-8 px-2.5 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] gap-1 cursor-pointer"
                                >
                                    <Eye className="size-3 text-[#E75480] dark:text-[#FF4F81]" />
                                    <span>Inspect</span>
                                </Button>

                                <Button
                                    size="sm"
                                    onClick={() => handleDownload(rep.name)}
                                    className="h-8 px-2.5 rounded-xl bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold gap-1 cursor-pointer shadow-2xs"
                                >
                                    <Download className="size-3" />
                                    <span>Download</span>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

        </div>
    );
}
