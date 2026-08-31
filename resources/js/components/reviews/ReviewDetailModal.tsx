import { CheckCircle2, UserCheck } from 'lucide-react';
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
import { CustomerAvatar } from './CustomerAvatar';
import { RatingStars } from './RatingStars';
import { StatusBadge } from './StatusBadge';
import type { ReviewItem } from './types';

interface ReviewDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    review: ReviewItem | null;
}

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
    open,
    onOpenChange,
    review,
}) => {
    if (!review) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-slate-200 dark:border-white/8 shadow-2xl bg-white dark:bg-[#12131A] backdrop-blur-2xl">
                {/* Header Banner */}
                <div className="bg-linear-to-r from-[#FF3366] to-[#E1062C] p-5 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-white">
                            Review Audit Record
                        </DialogTitle>
                        <DialogDescription className="text-white/80 font-medium text-xs mt-0.5">
                            Complete verified transaction details and review history.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-4 text-xs">
                    {/* Customer & Rating Overview */}
                    <div className="flex items-center justify-between border-b pb-3.5 border-slate-100 dark:border-white/6">
                        <div className="flex items-center gap-3">
                            <CustomerAvatar name={review.user?.name} size="md" />
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                    {review.user?.name || 'Customer'}
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">
                                    {review.user?.email || 'No email provided'}
                                </p>
                            </div>
                        </div>
                        <RatingStars rating={review.rating} size="md" showScore />
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">
                                Product
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                {review.product?.name || 'Unknown Product'}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">
                                Branch
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                {review.branch?.name || 'Global Catalog'}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">
                                Order Reference
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {review.order_number || (review.order_id ? `ORD-${review.order_id}` : 'Unlinked')}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">
                                Submitted Date
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                {review.created_at
                                    ? new Date(review.created_at).toLocaleString('en-US', {
                                          dateStyle: 'medium',
                                          timeStyle: 'short',
                                      })
                                    : 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">
                                Publication Status
                            </span>
                            <StatusBadge status={review.status} />
                        </div>
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">
                                Verification Status
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                {review.is_verified_purchase ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <UserCheck className="size-3" /> Verified Purchase
                                    </span>
                                ) : (
                                    <span className="text-slate-400">Unverified</span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Customer Written Comment */}
                    <div className="bg-slate-50 dark:bg-[#181924] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/6">
                        <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400 block mb-1.5">
                            Customer Review Comment
                        </span>
                        {review.comment ? (
                            <p className="text-slate-800 dark:text-slate-200 font-medium italic text-xs leading-relaxed">
                                "{review.comment}"
                            </p>
                        ) : (
                            <p className="text-slate-400 italic text-xs">
                                Rating submitted without written comment.
                            </p>
                        )}
                    </div>

                    {/* Official Response Section (if exists) */}
                    {review.admin_response && (
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 space-y-1">
                            <span className="font-extrabold text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> Official Response by{' '}
                                {review.responder?.name || 'Review Manager'}
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 font-medium text-xs leading-relaxed">
                                {review.admin_response}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 bg-slate-50 dark:bg-[#161722] border-t border-slate-200/70 dark:border-white/6">
                    <Button
                        variant="ghost"
                        className="rounded-xl font-bold text-xs cursor-pointer ml-auto text-slate-600 dark:text-slate-300"
                        onClick={() => onOpenChange(false)}
                    >
                        Close Record
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
