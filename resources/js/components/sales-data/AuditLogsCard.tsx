import { format } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type AuditLogItem = {
    id: number;
    user_id: number;
    ip_address: string | null;
    action: string;
    details: string;
    created_at: string;
    user?: {
        name: string;
    };
};

interface AuditLogsCardProps {
    auditLogs: AuditLogItem[];
}

export function AuditLogsCard({ auditLogs }: AuditLogsCardProps) {
    return (
        <Card className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl transition-colors duration-300">
            <CardHeader className="border-b border-[#F8C8DC]/40 dark:border-white/10 p-6 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Administrative Audit Trail
                    </CardTitle>
                    <CardDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                        Immutable security ledger for file syncs, data wipes, and snapshots
                    </CardDescription>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-100/60 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <ShieldCheck className="size-4" />
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-left border-collapse table-auto text-xs">
                        <thead className="bg-[#FFF9FA]/60 dark:bg-[#181820]/60 border-b border-[#F8C8DC]/40 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="py-3.5 px-5">Timestamp</th>
                                <th className="py-3.5 px-5">Operator</th>
                                <th className="py-3.5 px-5">Action</th>
                                <th className="py-3.5 px-5">IP Address</th>
                                <th className="py-3.5 px-5">Execution Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                            {auditLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 px-5 text-center text-[#9E8B8E] dark:text-[#64748B] font-medium">
                                        No audit trail recorded.
                                    </td>
                                </tr>
                            ) : (
                                auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-[#FFF5F7]/70 dark:hover:bg-white/5 transition-colors">
                                        <td className="py-3.5 px-5 font-mono text-[11px] text-[#9E8B8E] dark:text-[#64748B]">
                                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                                        </td>
                                        <td className="py-3.5 px-5 font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {log.user?.name || 'System'}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <Badge variant="outline" className="bg-white/80 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg">
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 px-5 font-mono text-[11px] text-[#9E8B8E] dark:text-[#64748B]">
                                            {log.ip_address || 'Localhost'}
                                        </td>
                                        <td className="py-3.5 px-5 text-[#7D6B6E] dark:text-[#94A3B8] italic font-medium">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
