import { motion } from 'framer-motion';
import {
    Calendar,
    CheckCircle2,
    Eye,
    EyeOff,
    MessageSquare,
    Trash2,
} from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CustomerAvatar } from './CustomerAvatar';
import { ProductRefBadge } from './ProductRefBadge';
import { RatingStars } from './RatingStars';
import { StatusBadge } from './StatusBadge';
import type { ReviewItem } from './types';
import { VerifiedBadge } from './VerifiedBadge';

interface ReviewCardProps {
    review: ReviewItem;
    showProductBadge?: boolean;
    onViewDetails: (review: ReviewItem) => void;
    onToggleStatus: (review: ReviewItem, nextStatus: string) => void;
    onOpenRespond: (review: ReviewItem) => void;
    onOpenDelete: (review: ReviewItem) => void;
    onMarkSeen?: (review: ReviewItem) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
    review,
    showProductBadge = true,
    onViewDetails,
    onToggleStatus,
    onOpenRespond,
    onOpenDelete,
    onMarkSeen,
}) => {
    const formattedDate = review.created_at
        ? new Date(review.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : null;

    const formattedResponseDate = review.admin_responded_at
        ? new Date(review.admin_responded_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-2xs',
                !review.is_seen
                    ? 'bg-white dark:bg-[#151620] border-rose-400/50 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : 'bg-white dark:bg-[#12131A] border-slate-200/80 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/14'
            )}
        >
            <div className="space-y-3.5">
                {/* ── HEADER ROW ── */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Customer Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                        <CustomerAvatar name={review.user?.name} size="md" />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                    {review.user?.name || 'Anonymous Customer'}
                                </h4>

                                {!review.is_seen && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shadow-2xs">
                                        <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        Unread
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                                <span className="truncate">
                                    {review.user?.email || (review.order_number ? `Order #${review.order_number}` : 'Registered User')}
                                </span>
                                {review.branch && (
                                    <span className="text-slate-400 dark:text-slate-400 font-medium shrink-0">
                                        • {review.branch.name}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Rating & Status Badge */}
                    <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                        <RatingStars rating={review.rating} size="sm" showScore />
                        <StatusBadge status={review.status} />
                    </div>
                </div>

                {/* ── METADATA ROW (Badges) ── */}
                <div className="flex flex-wrap items-center gap-2">
                    {review.is_verified_purchase && <VerifiedBadge />}

                    {showProductBadge && review.product && (
                        <ProductRefBadge
                            productName={review.product.name}
                            orderNumber={review.order_number}
                        />
                    )}
                </div>

                {/* ── CUSTOMER REVIEW CONTENT ── */}
                <div className="bg-slate-50 dark:bg-[#181924] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/6 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {review.comment && review.comment.trim().length > 0 ? (
                        <p className="italic font-medium">"{review.comment}"</p>
                    ) : (
                        <p className="italic text-slate-400 dark:text-slate-400">
                            Rating submitted without written comment.
                        </p>
                    )}
                </div>

                {/* ── OFFICIAL ADMIN RESPONSE / AUTO-REPLY ── */}
                {review.admin_response && (
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                            <span className="flex items-center gap-1.5 flex-wrap">
                                <CheckCircle2 className="size-3 text-emerald-500" />
                                {review.is_auto_reply ? (
                                    <>
                                        <span>Automated System Response</span>
                                        <span className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                                            Auto-reply
                                        </span>
                                    </>
                                ) : (
                                    <span>Official Response by {review.responder?.name || 'Review Manager'}</span>
                                )}
                            </span>
                            {formattedResponseDate && (
                                <span className="font-mono text-emerald-600/80 dark:text-emerald-400/80">
                                    {formattedResponseDate}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 font-medium text-xs leading-relaxed">
                            {review.admin_response}
                        </p>
                    </div>
                )}
            </div>

            {/* ── FOOTER & ACTION BUTTONS ── */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3.5 mt-3 border-t border-slate-100 dark:border-white/6">
                {/* Review Date */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400 font-medium">
                    <Calendar className="size-3.5 text-slate-400" />
                    <span>{formattedDate || 'Recent'}</span>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1 flex-wrap">
                    {/* Mark Seen Action (for unread items) */}
                    {!review.is_seen && onMarkSeen && (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onMarkSeen(review)}
                            className="h-7.5 px-2.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                        >
                            <Eye className="size-3.5 mr-1" /> Mark Viewed
                        </Button>
                    )}

                    {/* Details Modal Trigger */}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetails(review)}
                        className="h-7.5 px-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 cursor-pointer"
                    >
                        <Eye className="size-3.5 mr-1 text-slate-400" /> Details
                    </Button>

                    {/* Publish / Hide Toggle */}
                    {review.status === 'published' ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggleStatus(review, 'hidden')}
                            className="h-7.5 px-2.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 cursor-pointer"
                            title="Hide from public view"
                        >
                            <EyeOff className="size-3.5 mr-1" /> Hide
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggleStatus(review, 'published')}
                            className="h-7.5 px-2.5 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer"
                            title="Publish to public view"
                        >
                            <Eye className="size-3.5 mr-1" /> Publish
                        </Button>
                    )}

                    {/* Respond Action */}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenRespond(review)}
                        className="h-7.5 px-2.5 rounded-lg text-xs font-bold text-[#FF3366] dark:text-[#FF4F81] hover:bg-rose-50 dark:hover:bg-[#FF3366]/10 cursor-pointer"
                    >
                        <MessageSquare className="size-3.5 mr-1" /> Respond
                    </Button>

                    {/* Delete Action */}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenDelete(review)}
                        className="h-7.5 px-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                        title="Delete review"
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};
