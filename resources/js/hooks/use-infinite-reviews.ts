import { useState, useEffect, useRef, useCallback } from 'react';

export interface PublicReviewItem {
    id: number;
    customer_name: string;
    rating: number;
    comment: string | null;
    admin_response: string | null;
    created_at: string | null;
}

export interface ProductReviewStats {
    productId?: number;
    productName?: string;
    averageRating: number;
    reviewCount: number;
    ratingDistribution: Record<string, number>;
}

export interface UseInfiniteReviewsOptions {
    productId: number | string | null | undefined;
    perPage?: number;
    ratingFilter?: number | string | 'all';
    mode?: 'page' | 'cursor';
    enabled?: boolean;
}

export interface UseInfiniteReviewsReturn {
    reviews: PublicReviewItem[];
    stats: ProductReviewStats;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    currentPage: number;
    nextPage: number | null;
    nextCursor: string | null;
    error: string | null;
    isRefreshing: boolean;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    retryLastPage: () => Promise<void>;
    sentinelRef: (node: HTMLElement | null) => void;
}

export function useInfiniteReviews({
    productId,
    perPage = 15,
    ratingFilter = 'all',
    mode = 'page',
    enabled = true,
}: UseInfiniteReviewsOptions): UseInfiniteReviewsReturn {
    const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
    const [stats, setStats] = useState<ProductReviewStats>({
        averageRating: 0,
        reviewCount: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [nextPage, setNextPage] = useState<number | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Concurrency and duplication guards
    const isFetchingRef = useRef<boolean>(false);
    const fetchedKeysRef = useRef<Set<string | number>>(new Set());
    const abortControllerRef = useRef<AbortController | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelNodeRef = useRef<HTMLElement | null>(null);

    // Helper to merge and deduplicate review records by id
    const mergeReviews = (prev: PublicReviewItem[], incoming: PublicReviewItem[]): PublicReviewItem[] => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newUnique = incoming.filter((r) => !existingIds.has(r.id));
        return [...prev, ...newUnique];
    };

    // Core fetch routine
    const fetchPage = useCallback(
        async (targetPage: number, targetCursor: string | null, isInitial: boolean = false) => {
            if (!productId || !enabled) return;

            const pageKey = mode === 'cursor' ? (targetCursor || 'initial') : targetPage;

            // Prevent duplicate requests for already fetched page/cursor
            if (!isInitial && fetchedKeysRef.current.has(pageKey)) {
                return;
            }

            // Concurrency guard
            if (isFetchingRef.current) {
                return;
            }

            isFetchingRef.current = true;
            if (isInitial) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }
            setError(null);

            // Abort prior in-flight request if starting initial fetch
            if (isInitial && abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            try {
                const params = new URLSearchParams();
                params.set('per_page', String(perPage));

                if (ratingFilter && ratingFilter !== 'all') {
                    params.set('rating', String(ratingFilter));
                }

                if (mode === 'cursor') {
                    if (targetCursor) {
                        params.set('cursor', targetCursor);
                    }
                } else {
                    params.set('page', String(targetPage));
                }

                const response = await fetch(`/api/v1/products/${productId}/reviews?${params.toString()}`, {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Server returned status ${response.status}`);
                }

                const json = await response.json();

                if (!json.success || !json.data) {
                    throw new Error(json.message || 'Failed to fetch reviews data.');
                }

                const incomingReviews: PublicReviewItem[] = json.data.reviews || [];
                const pagination = json.data.pagination || {};

                // Update aggregate stats
                setStats({
                    productId: json.data.product_id,
                    productName: json.data.product_name,
                    averageRating: Number(json.data.average_rating) || 0,
                    reviewCount: Number(json.data.review_count) || 0,
                    ratingDistribution: json.data.rating_distribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
                });

                // Record successfully fetched key
                fetchedKeysRef.current.add(pageKey);

                if (isInitial) {
                    setReviews(incomingReviews);
                } else {
                    setReviews((prev) => mergeReviews(prev, incomingReviews));
                }

                // Update pagination navigation state
                const hasMorePages = Boolean(pagination.has_more);
                setHasMore(hasMorePages);

                if (mode === 'cursor') {
                    setNextCursor(pagination.next_cursor || null);
                } else {
                    setCurrentPage(pagination.current_page || targetPage);
                    setNextPage(hasMorePages ? (pagination.next_page || targetPage + 1) : null);
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return; // Ignore aborted requests
                }
                const msg = err instanceof Error ? err.message : 'Unable to load reviews.';
                setError(msg);
                // Note: Already loaded reviews are intentionally PRESERVED
            } finally {
                isFetchingRef.current = false;
                setIsLoading(false);
                setIsLoadingMore(false);
                setIsRefreshing(false);
            }
        },
        [productId, perPage, ratingFilter, mode, enabled]
    );

    // Load next page
    const loadMore = useCallback(async () => {
        if (!hasMore || isLoading || isLoadingMore || isFetchingRef.current) {
            return;
        }

        if (mode === 'cursor') {
            if (!nextCursor) return;
            await fetchPage(1, nextCursor, false);
        } else {
            if (!nextPage) return;
            await fetchPage(nextPage, null, false);
        }
    }, [hasMore, isLoading, isLoadingMore, mode, nextCursor, nextPage, fetchPage]);

    // Refresh from page 1
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        fetchedKeysRef.current.clear();
        setNextPage(null);
        setNextCursor(null);
        setHasMore(true);
        await fetchPage(1, null, true);
    }, [fetchPage]);

    // Retry failed page without destroying state
    const retryLastPage = useCallback(async () => {
        if (reviews.length === 0) {
            await refresh();
        } else {
            await loadMore();
        }
    }, [reviews.length, refresh, loadMore]);

    // Reset and refetch whenever context / filters change
    useEffect(() => {
        fetchedKeysRef.current.clear();
        setReviews([]);
        setCurrentPage(1);
        setNextPage(null);
        setNextCursor(null);
        setHasMore(true);
        setError(null);

        if (productId && enabled) {
            fetchPage(1, null, true);
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [productId, ratingFilter, perPage, mode, enabled, fetchPage]);

    // IntersectionObserver sentinel ref
    const sentinelRef = useCallback(
        (node: HTMLElement | null) => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            sentinelNodeRef.current = node;

            if (!node || !hasMore || isLoading || isLoadingMore) {
                return;
            }

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const first = entries[0];
                    if (first.isIntersecting && !isFetchingRef.current && hasMore) {
                        loadMore();
                    }
                },
                { threshold: 0.1, rootMargin: '200px' }
            );

            observerRef.current.observe(node);
        },
        [hasMore, isLoading, isLoadingMore, loadMore]
    );

    return {
        reviews,
        stats,
        isLoading,
        isLoadingMore,
        hasMore,
        currentPage,
        nextPage,
        nextCursor,
        error,
        isRefreshing,
        loadMore,
        refresh,
        retryLastPage,
        sentinelRef,
    };
}
