import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, Building2, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { Branch } from './BranchCard';

interface DeleteBranchModalProps {
    branch: Branch | null;
    open: boolean;
    onClose: () => void;
}

export function DeleteBranchModal({ branch, open, onClose }: DeleteBranchModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleClose = () => {
        if (isDeleting) return;
        setErrorMessage(null);
        setIsDeleting(false);
        onClose();
    };

    if (!branch) return null;

    const handleDelete = () => {
        if (isDeleting) return;

        setIsDeleting(true);
        setErrorMessage(null);

        router.delete(`/branches/${branch.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setErrorMessage(null);
                onClose();
            },
            onError: (errors) => {
                setIsDeleting(false);
                const firstError = errors?.error || errors?.message || Object.values(errors)[0] || 'Unable to delete branch. Please try again.';
                setErrorMessage(String(firstError));
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleClose();
                }
            }}
        >
            <DialogContent
                showCloseButton={true}
                className="w-[94vw] max-w-lg sm:max-w-lg p-0 overflow-hidden flex flex-col gap-0 bg-white dark:bg-[#121218] border border-rose-100 dark:border-rose-950/40 shadow-2xl rounded-3xl font-['Outfit']"
            >
                {/* Header with Red/Danger Accent Banner */}
                <div className="p-6 pr-14 min-w-0 w-full bg-linear-to-br from-rose-50 via-white to-rose-50/30 dark:from-rose-950/30 dark:via-[#181824] dark:to-[#121218] border-b border-rose-100 dark:border-rose-950/40 shrink-0">
                    <div className="flex items-start gap-4 min-w-0">
                        <div className="size-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-sm">
                            <Trash2 className="size-6" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                            <DialogTitle className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                Delete Branch
                            </DialogTitle>
                            <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium leading-relaxed">
                                Confirm removal of store location and operational hub
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4 min-w-0 w-full">
                    {/* Error Notice */}
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-700 dark:text-rose-300 min-w-0 w-full"
                        >
                            <AlertCircle className="size-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                            <div className="text-xs space-y-1 min-w-0 flex-1">
                                <p className="font-bold">Deletion Blocked</p>
                                <p className="leading-relaxed font-medium wrap-break-word">{errorMessage}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Branch Summary Box */}
                    <div className="p-4 rounded-2xl bg-[#FFF5F7]/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 space-y-2 min-w-0 w-full">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Building2 className="size-4 text-[#E75480] dark:text-[#FF4F81] shrink-0" />
                                <span className="font-bold text-sm text-[#3D2C2E] dark:text-[#F8FAFC] truncate">
                                    {branch.name}
                                </span>
                            </div>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-[#252532] text-[#7D6B6E] dark:text-[#94A3B8] border border-[#F8C8DC]/40 dark:border-white/10 shrink-0">
                                ID: #{branch.id}
                            </span>
                        </div>
                        {branch.address && (
                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium leading-relaxed pl-6 wrap-break-word">
                                {branch.address}
                            </p>
                        )}
                    </div>

                    {/* Warning Notice */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-800 dark:text-amber-300 min-w-0 w-full">
                        <ShieldAlert className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div className="text-xs space-y-1 min-w-0 flex-1">
                            <p className="font-bold">Important Safeguard Note</p>
                            <p className="leading-relaxed font-medium text-amber-700 dark:text-amber-300/90 wrap-break-word">
                                Unused branches with no historical sales, active inventory, or assigned staff can be safely removed. Operational branches with existing business records are protected to preserve audit and financial history.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="p-4 sm:p-6 bg-[#FFF5F7]/40 dark:bg-[#181824]/40 border-t border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-end gap-3 min-w-0 w-full shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isDeleting}
                        onClick={handleClose}
                        className="h-11 px-5 rounded-2xl font-bold text-xs border-[#F8C8DC]/60 dark:border-white/10 hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] cursor-pointer"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDelete}
                        className="h-11 px-6 rounded-2xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="size-4" />
                                <span>Confirm Delete</span>
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
