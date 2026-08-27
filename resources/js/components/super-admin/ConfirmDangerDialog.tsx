import { AlertOctagon } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDangerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    isLoading?: boolean;
}

export const ConfirmDangerDialog: React.FC<ConfirmDangerDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm Operational Change',
    cancelText = 'Cancel',
    isDangerous = true,
    isLoading = false,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-2xl">
                <DialogHeader className="space-y-3">
                    <div className={`size-12 rounded-2xl flex items-center justify-center ${
                        isDangerous
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                        <AlertOctagon className="size-6" />
                    </div>

                    <div>
                        <DialogTitle className="text-lg font-black tracking-tight">{title}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {description}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1 my-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Impact Notice</span>
                    <p>This action takes immediate effect across Web, API, and Mobile app endpoints.</p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`rounded-xl text-xs font-black shadow-lg transition-all ${
                            isDangerous
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                        }`}
                    >
                        {isLoading ? 'Executing...' : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
