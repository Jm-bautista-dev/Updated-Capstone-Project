import React from 'react';
import { 
    XCircle, 
    AlertTriangle, 
    ChevronRight, 
    ArrowRight 
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

interface ValidationErrorModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'error' | 'warning';
}

export function ValidationErrorModal({
    open,
    onClose,
    title = 'Validation Failed',
    message,
    type = 'error'
}: ValidationErrorModalProps) {
    
    const handleGoToInventory = () => {
        onClose();
        router.visit('/inventory');
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent
                className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl"
            >
                {/* Header Decoration */}
                <div className={cn(
                    "h-2 w-full",
                    type === 'error' ? "bg-destructive" : "bg-amber-500"
                )} />

                <div className="p-8 flex flex-col items-center text-center">
                    {/* Icon with pulsing background */}
                    <div className="relative mb-6">
                        <div className={cn(
                            "absolute inset-0 rounded-full animate-ping opacity-20",
                            type === 'error' ? "bg-destructive" : "bg-amber-500"
                        )} />
                        <div className={cn(
                            "relative rounded-full p-5 border-4",
                            type === 'error' 
                                ? "bg-destructive/10 border-destructive/20 text-destructive" 
                                : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        )}>
                            {type === 'error' ? (
                                <XCircle className="size-12" strokeWidth={1.5} />
                            ) : (
                                <AlertTriangle className="size-12" strokeWidth={1.5} />
                            )}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-3 mb-8">
                        <DialogTitle className="text-2xl font-black tracking-tight uppercase italic flex items-center justify-center gap-2">
                            {type === 'error' && <span className="text-destructive">ERR.</span>}
                            {title}
                        </DialogTitle>
                        <div className="relative">
                            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-destructive/10 rounded-full hidden sm:block" />
                            <p className="text-sm font-bold text-muted-foreground leading-relaxed px-2">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* Action Palette */}
                    <div className="w-full space-y-3">
                        <Button
                            onClick={onClose}
                            className={cn(
                                "w-full h-12 font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg",
                                type === 'error' 
                                    ? "bg-slate-900 hover:bg-slate-800 text-white" 
                                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30"
                            )}
                        >
                            Got it, I'll Fix it
                        </Button>
                        
                        <Button
                            variant="ghost"
                            onClick={handleGoToInventory}
                            className="w-full h-12 flex items-center justify-center gap-2 font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all text-xs uppercase tracking-widest"
                        >
                            Manage Inventory <ArrowRight className="size-3" />
                        </Button>
                    </div>
                </div>

                {/* Footer contextual help */}
                <div className="bg-muted/30 px-8 py-4 border-t">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter text-center">
                        POS Validation Shield &bull; Cross-Branch Verification Active
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
