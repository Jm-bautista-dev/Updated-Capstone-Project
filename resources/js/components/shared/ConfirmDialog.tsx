import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FiAlertTriangle } from 'react-icons/fi';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'default'
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background dark:bg-zinc-900 ring-1 ring-black/[0.05] dark:ring-white/[0.05]">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={cn(
                            "size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                            variant === 'destructive' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        )}>
                            <FiAlertTriangle className="size-6" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-black italic tracking-tighter uppercase leading-tight text-foreground dark:text-white">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-xs font-bold text-muted-foreground dark:text-zinc-400 uppercase opacity-70 leading-relaxed">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-muted/30 dark:bg-zinc-800/50 p-4 flex gap-2 sm:gap-0 border-t border-border/40 dark:border-zinc-800">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 h-11 rounded-xl font-bold text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        className={cn(
                            "flex-1 h-11 rounded-xl font-black italic tracking-tight shadow-lg active:scale-95 transition-all text-sm",
                            variant === 'destructive' ? "shadow-destructive/20" : "shadow-primary/20"
                        )}
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
