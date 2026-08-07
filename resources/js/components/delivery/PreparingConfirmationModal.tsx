import { Loader2, Package } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent,
} from '@/components/ui/dialog';

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
            <DialogContent className="sm:max-w-[425px] rounded-[32px] p-0 overflow-hidden border border-white/90 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl">
                <div className="p-8 space-y-6 font-['Outfit']">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="size-16 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-2 border border-blue-200 dark:border-blue-900/50">
                            <Package className="size-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-[#3D2C2E] dark:text-[#F8FAFC]">Start Preparing?</h2>
                        <p className="text-sm text-[#7D6B6E] dark:text-[#94A3B8] leading-relaxed font-medium">
                            This will <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">deduct ingredients</strong> from your inventory. <br/>
                            Make sure you have enough stock before starting.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button 
                            variant="outline" 
                            className="h-12 rounded-2xl font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]"
                            onClick={onClose}
                            disabled={processing}
                        >
                            CANCEL
                        </Button>
                        <Button
                            className="h-12 rounded-2xl font-black shadow-lg bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white"
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
