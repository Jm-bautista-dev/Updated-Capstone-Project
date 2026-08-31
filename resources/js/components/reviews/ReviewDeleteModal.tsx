import { AlertTriangle, Trash2 } from 'lucide-react';
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
import type { ReviewItem } from './types';

interface ReviewDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    review: ReviewItem | null;
    onConfirm: (review: ReviewItem) => void;
    isDeleting?: boolean;
}

export const ReviewDeleteModal: React.FC<ReviewDeleteModalProps> = ({
    open,
    onOpenChange,
    review,
    onConfirm,
    isDeleting = false,
}) => {
    if (!review) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-slate-200 dark:border-white/8 shadow-2xl bg-white dark:bg-[#12131A] backdrop-blur-2xl">
                <DialogHeader className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <AlertTriangle className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Delete Customer Review?
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                This action will remove the review from the public menu and catalog.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Review Snippet Context */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-[#181924] border-y border-slate-200/70 dark:border-white/6 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{review.user?.name || 'Customer'}</span>
                        <span className="font-mono text-amber-500">{review.rating} ★</span>
                    </div>
                    {review.product && (
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                            Product: {review.product.name}
                        </p>
                    )}
                    {review.comment && (
                        <p className="text-slate-600 dark:text-slate-300 italic line-clamp-2 mt-1">
                            "{review.comment}"
                        </p>
                    )}
                </div>

                <DialogFooter className="p-4 sm:p-6 bg-transparent flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => onConfirm(review)}
                        disabled={isDeleting}
                        className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer gap-1.5"
                    >
                        <Trash2 className="size-3.5" />
                        {isDeleting ? 'Deleting...' : 'Delete Review'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
