import { format } from 'date-fns';
import { RotateCcw, Shield, Trash2 } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type BackupItem = {
    id: number;
    backup_name: string;
    file_path: string;
    records_count: number;
    created_at: string;
};

interface SafetyBackupsCardProps {
    backups: BackupItem[];
    isRestoring: boolean;
    isDeletingBackup: boolean;
    onRestore: (backupId: number) => void;
    onDelete: (backupId: number) => void;
}

export function SafetyBackupsCard({
    backups,
    isRestoring,
    isDeletingBackup,
    onRestore,
    onDelete,
}: SafetyBackupsCardProps) {
    return (
        <Card className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl transition-colors duration-300 flex flex-col">
            <CardHeader className="border-b border-[#F8C8DC]/40 dark:border-white/10 p-6 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Safety Backups
                    </CardTitle>
                    <CardDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                        Automatic snapshot rolls before dataset replacements
                    </CardDescription>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Shield className="size-4" />
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto max-h-80 divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                {backups.length === 0 ? (
                    <div className="p-10 text-center text-xs text-[#9E8B8E] dark:text-[#64748B] font-medium">
                        No database backup snapshots generated.
                    </div>
                ) : (
                    backups.map((bk) => (
                        <div key={bk.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#FFF5F7]/70 dark:hover:bg-white/5 transition-colors">
                            <div className="min-w-0">
                                <p className="font-bold text-xs text-[#3D2C2E] dark:text-[#F8FAFC] truncate font-mono">
                                    {bk.backup_name}
                                </p>
                                <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] font-medium mt-0.5">
                                    {format(new Date(bk.created_at), 'MMM dd, HH:mm')} — {bk.records_count.toLocaleString()} Records
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                    onClick={() => onRestore(bk.id)}
                                    disabled={isRestoring}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 rounded-xl border-emerald-300 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[10px] font-bold uppercase tracking-wider gap-1 cursor-pointer"
                                >
                                    <RotateCcw className="size-3" />
                                    <span>Restore</span>
                                </Button>
                                <Button
                                    onClick={() => onDelete(bk.id)}
                                    disabled={isDeletingBackup}
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
