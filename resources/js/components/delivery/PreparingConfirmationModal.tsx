import React from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, AlertCircle, Loader2 } from 'lucide-react';

interface PreparingConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    processing: boolean;
}

export default function PreparingConfirmationModal({
    open,
    onClose,
    onConfirm,
    processing,
}: PreparingConfirmationModalProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="size-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                            <Package className="size-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Start Preparing?</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            This will <strong>deduct ingredients</strong> from your inventory. <br/>
                            Make sure you have enough stock before starting.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button 
                            variant="outline" 
                            className="h-12 rounded-2xl font-bold"
                            onClick={onClose}
                            disabled={processing}
                        >
                            CANCEL
                        </Button>
                        <Button
                            className="h-12 rounded-2xl font-black shadow-lg shadow-primary/20"
                            disabled={processing}
                            onClick={onConfirm}
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                'START PREPARING'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
