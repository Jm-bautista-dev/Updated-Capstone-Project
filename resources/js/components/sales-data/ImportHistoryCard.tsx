import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type ImportHistoryItem = {
    id: number;
    uploaded_by: number;
    file_name: string;
    import_mode: string;
    records_imported: number;
    records_updated: number;
    records_skipped: number;
    status: 'success' | 'failed' | 'rolled_back' | string;
    created_at: string;
    user?: {
        name: string;
    };
};

interface ImportHistoryCardProps {
    importsHistory: ImportHistoryItem[];
}

export function ImportHistoryCard({ importsHistory }: ImportHistoryCardProps) {
    return (
        <Card className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl transition-colors duration-300 flex flex-col">
            <CardHeader className="border-b border-[#F8C8DC]/40 dark:border-white/10 p-6 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Import History
                    </CardTitle>
                    <CardDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                        Audit trail of uploaded sales dataset files
                    </CardDescription>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                    <Clock className="size-4" />
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse table-auto text-xs">
                    <thead className="bg-[#FFF9FA]/60 dark:bg-[#181820]/60 border-b border-[#F8C8DC]/40 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] sticky top-0 backdrop-blur-md">
                        <tr>
                            <th className="py-3.5 px-5">File Name</th>
                            <th className="py-3.5 px-5">User</th>
                            <th className="py-3.5 px-5">Mode</th>
                            <th className="py-3.5 px-5 text-right">Processed</th>
                            <th className="py-3.5 px-5 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                        {importsHistory.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-10 px-5 text-center text-[#9E8B8E] dark:text-[#64748B] font-medium">
                                    No import history recorded yet.
                                </td>
                            </tr>
                        ) : (
                            importsHistory.map((hItem) => (
                                <tr key={hItem.id} className="hover:bg-[#FFF5F7]/70 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3.5 px-5">
                                        <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC] block truncate max-w-48 font-mono">
                                            {hItem.file_name}
                                        </span>
                                        <span className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] font-medium">
                                            {format(new Date(hItem.created_at), 'yyyy-MM-dd HH:mm')}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-5 font-bold text-[#3D2C2E] dark:text-[#E2E8F0]">
                                        {hItem.user?.name || 'System'}
                                    </td>
                                    <td className="py-3.5 px-5">
                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-white/80 dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#3D2C2E] dark:text-[#E2E8F0]">
                                            {hItem.import_mode.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-5 text-right font-mono text-xs">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{hItem.records_imported}</span> ·{' '}
                                        <span className="text-amber-600 dark:text-amber-400 font-bold">*{hItem.records_updated}</span> ·{' '}
                                        <span className="text-[#9E8B8E] dark:text-[#64748B]">#{hItem.records_skipped}</span>
                                    </td>
                                    <td className="py-3.5 px-5 text-center">
                                        <Badge
                                            className={cn(
                                                'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border',
                                                hItem.status === 'success'
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                            )}
                                        >
                                            {hItem.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}
