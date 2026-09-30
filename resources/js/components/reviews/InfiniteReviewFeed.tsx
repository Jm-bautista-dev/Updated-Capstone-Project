import React, { useState } from 'react';
import { Star, RefreshCw, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useInfiniteReviews } from '@/hooks/use-infinite-reviews';
import { RatingStars } from '@/components/reviews/RatingStars';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface InfiniteReviewFeedProps {
    productId: number | string;
    perPage?: number;
    showFilter?: boolean;
    className?: string;
}

export const InfiniteReviewFeed: React.FC<InfiniteReviewFeedProps> = ({
    productId,
    perPage = 10,
    showFilter = true,
    className = '',
}) => {
    const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

    const {
        reviews,
        stats,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        refresh,
        retryLastPage,
        sentinelRef,
    } = useInfiniteReviews({
        productId,
        perPage,
        ratingFilter,
    });

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header / Aggregate Metrics */}
            {stats.reviewCount > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#12131A] border border-slate-200/80 dark:border-white/8">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
                            {Number(stats.averageRating).toFixed(1)}
                        </div>
                        <div>
                            <RatingStars rating={stats.averageRating} size="sm" showScore={false} />
                            <p className="text-xs text-slate-400 mt-0.5">
                                Based on {stats.reviewCount} verified review{stats.reviewCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Rating Filter Pills */}
                    {showFilter && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setRatingFilter('all')}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    ratingFilter === 'all'
                                        ? 'bg-[#FF3366] text-white shadow-xs'
                                        : 'bg-white dark:bg-[#181924] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/8 hover:bg-slate-100'
                                }`}
                            >
                                All ({stats.reviewCount})
                            </button>
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = stats.ratingDistribution[String(stars)] || 0;
                                return (
                                    <button
                                        key={stars}
                                        type="button"
                                        onClick={() => setRatingFilter(stars)}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                            ratingFilter === stars
                                                ? 'bg-[#FF3366] text-white shadow-xs'
                                                : 'bg-white dark:bg-[#181924] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/8 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span>{stars}★</span>
                                        <span className="text-[10px] opacity-75">({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Initial Loading Skeleton */}
            {isLoading && reviews.length === 0 && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Card
                            key={i}
                            className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/8 animate-pulse space-y-3 bg-white dark:bg-[#12131A]"
                        >
                            <div className="flex justify-between">
                                <div className="h-4 w-28 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                                <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                            </div>
                            <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded-md" />
                            <div className="h-3 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && reviews.length === 0 && (
                <Card className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/8 bg-white dark:bg-[#12131A]">
                    <MessageSquare className="size-8 mx-auto mb-2 text-slate-400 opacity-50" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Reviews Yet</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        {ratingFilter !== 'all'
                            ? `No ${ratingFilter}-star ratings available for this item.`
                            : 'Be the first to review this product after your order!'}
                    </p>
                </Card>
            )}

            {/* Reviews List */}
            {reviews.length > 0 && (
                <div className="space-y-3">
                    {reviews.map((r) => (
                        <Card
                            key={r.id}
                            className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#12131A] shadow-2xs space-y-2.5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                        {r.customer_name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <RatingStars rating={r.rating} size="xs" showScore={false} />
                                        {r.created_at && (
                                            <span className="text-[10px] text-slate-400">
                                                • {new Date(r.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {r.comment ? (
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {r.comment}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-400 italic">
                                    Rating submitted without written comment.
                                </p>
                            )}

                            {r.admin_response && (
                                <div className="mt-2 pl-3 py-1.5 border-l-2 border-[#FF3366] bg-rose-50/50 dark:bg-rose-950/20 rounded-r-xl">
                                    <p className="text-[10px] font-bold text-[#FF3366] dark:text-[#FF4F81] uppercase tracking-wider">
                                        Store Response
                                    </p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                                        {r.admin_response}
                                    </p>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Error banner when next page fails (Preserves previous reviews) */}
            {error && (
                <Card className="p-4 text-center rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
                    <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold mb-2">
                        <AlertCircle className="size-4" />
                        <span>{error}</span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={retryLastPage}
                        className="rounded-xl text-xs font-bold gap-1.5 h-7 cursor-pointer"
                    >
                        <RefreshCw className="size-3" /> Retry Loading
                    </Button>
                </Card>
            )}

            {/* Loading More Indicator */}
            {isLoadingMore && (
                <div className="flex items-center justify-center py-4 gap-2 text-xs font-bold text-slate-500">
                    <Loader2 className="size-4 animate-spin text-[#FF3366]" />
                    <span>Loading more reviews...</span>
                </div>
            )}

            {/* End of list banner */}
            {!hasMore && reviews.length > 0 && !isLoading && (
                <p className="text-center text-[11px] font-medium text-slate-400 py-3">
                    ✓ You have reached the end of the reviews.
                </p>
            )}

            {/* Invisible Intersection Sentinel */}
            {hasMore && !isLoading && !isLoadingMore && (
                <div ref={sentinelRef} className="h-6 w-full pointer-events-none" aria-hidden="true" />
            )}
        </div>
    );
};
