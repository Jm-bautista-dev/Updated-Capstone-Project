import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    MessageSquare,
    Package,
    RefreshCw,
    Search,
    ShieldAlert,
    Star,
    X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

import { CategoryBadge } from '@/components/reviews/CategoryBadge';
import { ProductCard } from '@/components/reviews/ProductCard';
import { RatingStars } from '@/components/reviews/RatingStars';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewDeleteModal } from '@/components/reviews/ReviewDeleteModal';
import { ReviewDetailModal } from '@/components/reviews/ReviewDetailModal';
import { ReviewPagination } from '@/components/reviews/ReviewPagination';
import { ReviewRespondModal } from '@/components/reviews/ReviewRespondModal';
import { ReviewCardSkeleton } from '@/components/reviews/ReviewSkeleton';
import type {
    PaginatedReviews,
    ProductItem,
    ReviewFilters,
    ReviewItem,
    ReviewStats,
} from '@/components/reviews/types';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

interface Props {
    productList: ProductItem[];
    reviews: PaginatedReviews;
    stats: ReviewStats;
    selectedProductId: number | null;
    filters: ReviewFilters;
    branches: Array<{ id: number; name: string }>;
    isAdmin: boolean;
}

export default function Reviews({
    productList,
    reviews,
    stats,
    selectedProductId,
    filters,
    branches,
    isAdmin,
}: Props) {
    const [localProductList, setLocalProductList] = useState<ProductItem[]>(productList);
    const [localReviews, setLocalReviews] = useState<ReviewItem[]>(reviews.data);
    const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(() => {
        if (selectedProductId) {
            return productList.find((p) => p.id === selectedProductId) || null;
        }
        return null;
    });

    const [search, setSearch] = useState(filters.search || '');
    const [productSearch, setProductSearch] = useState('');
    const [productListPage, setProductListPage] = useState(1);
    const productsPerPage = 6;
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [ratingFilter, setRatingFilter] = useState(filters.rating || 'all');
    const [seenFilter, setSeenFilter] = useState(filters.seen_status || 'all');
    const [verifiedFilter, setVerifiedFilter] = useState(filters.verified_purchase || 'all');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || 'all');
    const [perPage, setPerPage] = useState(filters.per_page || 10);

    // Pagination & Loading States
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const reviewsListRef = useRef<HTMLDivElement>(null);

    // Modals
    const [activeReviewDetail, setActiveReviewDetail] = useState<ReviewItem | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyingReview, setReplyingReview] = useState<ReviewItem | null>(null);
    const [submittingReply, setSubmittingReply] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Sync props updates during render
    const [prevProps, setPrevProps] = useState({ productList, reviews, selectedProductId });
    if (
        prevProps.productList !== productList ||
        prevProps.reviews !== reviews ||
        prevProps.selectedProductId !== selectedProductId
    ) {
        setPrevProps({ productList, reviews, selectedProductId });
        setLocalProductList(productList);
        setLocalReviews(reviews.data);
        if (selectedProductId) {
            setSelectedProduct(productList.find((p) => p.id === selectedProductId) || null);
        }
    }

    // Pagination handler
    const handlePageChange = (targetPage: number, newPerPage?: number) => {
        const pageSize = newPerPage ?? perPage;
        if (
            targetPage < 1 ||
            (targetPage > reviews.last_page && !newPerPage) ||
            (targetPage === reviews.current_page && pageSize === perPage && !pageError) ||
            isPageLoading
        ) {
            return;
        }

        setIsPageLoading(true);
        setPageError(null);

        const params = {
            search,
            status: statusFilter,
            rating: ratingFilter,
            seen_status: seenFilter,
            verified_purchase: verifiedFilter,
            branch_id: branchFilter,
            product_id: selectedProduct ? String(selectedProduct.id) : 'all',
            per_page: pageSize,
            page: targetPage,
        };

        router.get('/admin/reviews', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['reviews', 'productList', 'stats', 'selectedProductId', 'filters'],
            onSuccess: () => {
                setIsPageLoading(false);
                setPageError(null);
                reviewsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            },
            onError: (errors) => {
                setIsPageLoading(false);
                setPageError('Unable to load reviews. Please try again.');
                console.error('Failed to load reviews page:', errors);
            },
            onFinish: () => {
                setIsPageLoading(false);
            },
        });
    };

    // Apply Filter
    const applyFilter = (key: string, val: string) => {
        setPageError(null);
        const newFilters = {
            search,
            status: statusFilter,
            rating: ratingFilter,
            seen_status: seenFilter,
            verified_purchase: verifiedFilter,
            branch_id: branchFilter,
            product_id: selectedProduct ? String(selectedProduct.id) : 'all',
            per_page: perPage,
            [key]: val,
            page: 1,
        };

        router.get('/admin/reviews', newFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter('search', search);
    };

    const clearFilters = () => {
        setSearch('');
        setProductSearch('');
        setProductListPage(1);
        setStatusFilter('all');
        setRatingFilter('all');
        setSeenFilter('all');
        setVerifiedFilter('all');
        setBranchFilter('all');
        setSelectedProduct(null);
        setPerPage(10);
        setPageError(null);
        router.get('/admin/reviews', { page: 1, per_page: 10 }, { replace: true });
    };

    // Selecting a Product
    const handleSelectProduct = (product: ProductItem | null) => {
        setSelectedProduct(product);
        setPageError(null);
        const pid = product ? String(product.id) : 'all';

        router.get(
            '/admin/reviews',
            {
                search,
                status: statusFilter,
                rating: ratingFilter,
                seen_status: seenFilter,
                verified_purchase: verifiedFilter,
                branch_id: branchFilter,
                product_id: pid,
                per_page: perPage,
                page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );

        if (product && product.unseen_count > 0) {
            markProductAsSeen(product.id);
        }
    };

    // Mark Product Reviews As Seen
    const markProductAsSeen = async (productId: number) => {
        try {
            const res = await axios.post(`/admin/reviews/products/${productId}/mark-seen`);
            if (res.data.success) {
                setLocalProductList((prev) =>
                    prev.map((p) => (p.id === productId ? { ...p, unseen_count: 0 } : p))
                );
                setLocalReviews((prev) =>
                    prev.map((r) => (r.product_id === productId ? { ...r, is_seen: true } : r))
                );
            }
        } catch (err) {
            console.error('Failed to mark product reviews as seen:', err);
        }
    };

    // Mark Single Review As Seen
    const handleMarkReviewSeen = async (review: ReviewItem) => {
        try {
            const res = await axios.post(`/admin/reviews/${review.id}/mark-seen`);
            if (res.data.success) {
                setLocalReviews((prev) =>
                    prev.map((r) => (r.id === review.id ? { ...r, is_seen: true } : r))
                );
                setLocalProductList((prev) =>
                    prev.map((p) =>
                        p.id === review.product_id
                            ? { ...p, unseen_count: Math.max(0, p.unseen_count - 1) }
                            : p
                    )
                );
                toast.success('Review marked as viewed.');
            }
        } catch {
            toast.error('Failed to mark review as viewed.');
        }
    };

    // Toggle Review Status
    const handleStatusToggle = (review: ReviewItem, newStatus: string) => {
        router.put(
            `/admin/reviews/${review.id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLocalReviews((prev) =>
                        prev.map((r) =>
                            r.id === review.id
                                ? { ...r, status: newStatus as ReviewItem['status'] }
                                : r
                        )
                    );
                    toast.success(`Review status updated to ${newStatus}.`);
                },
            }
        );
    };

    // Open Reply Modal
    const openReplyModal = (review: ReviewItem) => {
        setReplyingReview(review);
        setReplyModalOpen(true);
    };

    // Submit Reply
    const handleReplySubmit = (review: ReviewItem, replyText: string) => {
        setSubmittingReply(true);
        router.post(
            `/admin/reviews/${review.id}/respond`,
            { response: replyText },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReplyModalOpen(false);
                    setSubmittingReply(false);
                    toast.success('Official response posted successfully.');
                },
                onError: () => setSubmittingReply(false),
            }
        );
    };

    // Open Delete Modal
    const openDeleteModal = (review: ReviewItem) => {
        setDeletingReview(review);
        setDeleteModalOpen(true);
    };

    // Confirm Delete Review
    const handleConfirmDelete = (review: ReviewItem) => {
        setIsDeleting(true);
        const isLastOnPage = localReviews.length === 1 && reviews.current_page > 1;
        const nextPage = isLastOnPage ? reviews.current_page - 1 : reviews.current_page;

        router.delete(`/admin/reviews/${review.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                toast.success('Review deleted successfully.');
                if (isLastOnPage) {
                    handlePageChange(nextPage);
                }
            },
            onError: () => {
                setIsDeleting(false);
                toast.error('Failed to delete review.');
            },
        });
    };

    // Local Product Filtering
    const filteredProductList = localProductList.filter((p) => {
        if (!productSearch.trim()) return true;
        const q = productSearch.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            p.category_name.toLowerCase().includes(q)
        );
    });

    const totalProductPages = Math.max(1, Math.ceil(filteredProductList.length / productsPerPage));
    const paginatedProducts = filteredProductList.slice(
        (productListPage - 1) * productsPerPage,
        productListPage * productsPerPage
    );

    return (
        <AppLayout>
            <Head title="Reviews & Ratings — Operations Management" />

            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-['Outfit']">
                {/* ── HEADER BANNER ────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#FF3366] via-[#E1062C] to-[#FF3366] p-6 sm:p-7 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                                <Star className="size-6 text-white fill-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                    Customer Feedback & Reviews
                                </h1>
                                <p className="text-white/85 font-medium text-xs sm:text-sm mt-0.5">
                                    Monitor product satisfaction, manage verified buyer ratings, and post official responses.
                                </p>
                            </div>
                        </div>

                        {/* Unseen reviews alert badge in header */}
                        {stats.unseen_reviews > 0 && (
                            <div className="flex items-center gap-2.5 bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 shadow-md self-start md:self-auto">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                </span>
                                <div>
                                    <p className="text-xs font-black text-white uppercase tracking-wider">
                                        {stats.unseen_reviews} Unread Review{stats.unseen_reviews > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-[10px] text-white/80 font-medium">Requires manager attention</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── KPI METRICS CARDS ────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card className="rounded-2xl border border-slate-200/80 dark:border-white/8 shadow-2xs bg-white dark:bg-[#12131A]">
                        <CardHeader className="p-3.5 pb-1">
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Total Products
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                                {stats.total_products}
                            </span>
                            <Package className="size-4 text-slate-400 opacity-60" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-slate-200/80 dark:border-white/8 shadow-2xs bg-white dark:bg-[#12131A]">
                        <CardHeader className="p-3.5 pb-1">
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Total Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                                {stats.total_reviews}
                            </span>
                            <MessageSquare className="size-4 text-emerald-500 opacity-60" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-2xs bg-rose-50/40 dark:bg-rose-950/20">
                        <CardHeader className="p-3.5 pb-1">
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                                Unseen Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                                {stats.unseen_reviews}
                            </span>
                            <span className="text-[11px] font-bold text-rose-500">Unread</span>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-slate-200/80 dark:border-white/8 shadow-2xs bg-white dark:bg-[#12131A]">
                        <CardHeader className="p-3.5 pb-1">
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Average Rating
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 flex items-baseline justify-between">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                                    {Number(stats.average_rating).toFixed(1)}
                                </span>
                                <span className="text-xs font-bold text-amber-500">★</span>
                            </div>
                            <Star className="size-4 text-amber-400 fill-amber-400 opacity-60" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-slate-200/80 dark:border-white/8 shadow-2xs bg-white dark:bg-[#12131A]">
                        <CardHeader className="p-3.5 pb-1">
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Published
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {stats.published_count}
                            </span>
                            <CheckCircle2 className="size-4 text-emerald-500 opacity-60" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-slate-200/80 dark:border-white/8 shadow-2xs bg-white dark:bg-[#12131A]">
                        <CardHeader className="p-3.5 pb-1">
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Moderation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                                {stats.flagged_count}
                            </span>
                            <ShieldAlert className="size-4 text-amber-500 opacity-60" />
                        </CardContent>
                    </Card>
                </div>

                {/* ── SEARCH & FILTER TOOLBAR ───────────────────────────────── */}
                <Card className="rounded-2xl border border-slate-200/80 dark:border-white/8 shadow-sm bg-white dark:bg-[#12131A] p-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-55">
                            <Search className="absolute left-3.5 top-2.5 size-4 text-slate-400" />
                            <Input
                                placeholder="Search product, customer, order #, comment..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9.5 h-9 rounded-xl bg-slate-50 dark:bg-[#181924] border-slate-200/80 dark:border-white/8 text-xs focus-visible:ring-1 focus-visible:ring-[#FF3366]"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="w-full sm:w-36">
                            <Select
                                value={statusFilter}
                                onValueChange={(val) => {
                                    setStatusFilter(val);
                                    applyFilter('status', val);
                                }}
                            >
                                <SelectTrigger className="h-9 w-full rounded-xl bg-slate-50 dark:bg-[#181924] border-slate-200/80 dark:border-white/8 text-xs font-semibold">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="hidden">Hidden</SelectItem>
                                    <SelectItem value="flagged">Flagged</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Rating Filter */}
                        <div className="w-full sm:w-36">
                            <Select
                                value={ratingFilter}
                                onValueChange={(val) => {
                                    setRatingFilter(val);
                                    applyFilter('rating', val);
                                }}
                            >
                                <SelectTrigger className="h-9 w-full rounded-xl bg-slate-50 dark:bg-[#181924] border-slate-200/80 dark:border-white/8 text-xs font-semibold">
                                    <SelectValue placeholder="All Ratings" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Ratings</SelectItem>
                                    <SelectItem value="5">5 Stars ★★★★★</SelectItem>
                                    <SelectItem value="4">4 Stars ★★★★</SelectItem>
                                    <SelectItem value="3">3 Stars ★★★</SelectItem>
                                    <SelectItem value="2">2 Stars ★★</SelectItem>
                                    <SelectItem value="1">1 Star ★</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Read Status Filter */}
                        <div className="w-full sm:w-36">
                            <Select
                                value={seenFilter}
                                onValueChange={(val) => {
                                    setSeenFilter(val);
                                    applyFilter('seen_status', val);
                                }}
                            >
                                <SelectTrigger className="h-9 w-full rounded-xl bg-slate-50 dark:bg-[#181924] border-slate-200/80 dark:border-white/8 text-xs font-semibold">
                                    <SelectValue placeholder="All Read States" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Read States</SelectItem>
                                    <SelectItem value="unseen">Unread (New)</SelectItem>
                                    <SelectItem value="seen">Viewed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Verified Purchase Filter */}
                        <div className="w-full sm:w-40">
                            <Select
                                value={verifiedFilter}
                                onValueChange={(val) => {
                                    setVerifiedFilter(val);
                                    applyFilter('verified_purchase', val);
                                }}
                            >
                                <SelectTrigger className="h-9 w-full rounded-xl bg-slate-50 dark:bg-[#181924] border-slate-200/80 dark:border-white/8 text-xs font-semibold">
                                    <SelectValue placeholder="All Purchases" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Purchases</SelectItem>
                                    <SelectItem value="verified">Verified Purchases</SelectItem>
                                    <SelectItem value="unverified">Unverified Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Branch Filter (Admin only) */}
                        {isAdmin && (
                            <div className="w-full sm:w-36">
                                <Select
                                    value={branchFilter}
                                    onValueChange={(val) => {
                                        setBranchFilter(val);
                                        applyFilter('branch_id', val);
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-full rounded-xl bg-slate-50 dark:bg-[#181924] border-slate-200/80 dark:border-white/8 text-xs font-semibold">
                                        <SelectValue placeholder="All Branches" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {branches.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Reset Button */}
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs px-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 border-slate-200/80 dark:border-white/8 shrink-0"
                            onClick={clearFilters}
                            title="Reset all filters"
                        >
                            <RefreshCw className="size-3.5" /> Reset
                        </Button>
                    </form>
                </Card>

                {/* ── TWO-COLUMN MASTER-DETAIL LAYOUT ───────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ── LEFT COLUMN: PRODUCT LIST (5 COLS) ─────────────────── */}
                    <div className="lg:col-span-5 space-y-3.5 min-w-0">
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-1">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        Product Catalog
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        {filteredProductList.length} of {localProductList.length} products
                                    </p>
                                </div>
                                {selectedProduct && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleSelectProduct(null)}
                                        className="text-xs font-bold text-[#FF3366] dark:text-[#FF4F81] hover:bg-rose-50 dark:hover:bg-white/5 rounded-xl h-7 px-2.5 cursor-pointer"
                                    >
                                        View All Reviews
                                    </Button>
                                )}
                            </div>

                            {/* Quick Product Filter Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                                <Input
                                    placeholder="Filter catalog products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-8.5 h-8.5 rounded-xl bg-slate-50 dark:bg-[#181924] border-slate-200/80 dark:border-white/8 text-xs focus-visible:ring-1 focus-visible:ring-[#FF3366]"
                                />
                                {productSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setProductSearch('')}
                                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Product Cards Stack */}
                        <div className="space-y-2.5">
                            {paginatedProducts.length === 0 ? (
                                <Card className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/8 bg-white dark:bg-[#12131A]">
                                    <Package className="size-8 mx-auto mb-2 text-slate-400 opacity-50" />
                                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                        No products found
                                    </h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        No items match the current search query.
                                    </p>
                                </Card>
                            ) : (
                                paginatedProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        isSelected={selectedProduct?.id === product.id}
                                        onSelect={handleSelectProduct}
                                    />
                                ))
                            )}
                        </div>

                        {/* Product Catalog Pagination */}
                        <ReviewPagination
                            currentPage={productListPage}
                            lastPage={totalProductPages}
                            total={filteredProductList.length}
                            perPage={productsPerPage}
                            label="products"
                            compact
                            onPageChange={(page) => setProductListPage(page)}
                        />
                    </div>

                    {/* ── RIGHT COLUMN: REVIEW MANAGEMENT (7 COLS) ──────────── */}
                    <div ref={reviewsListRef} className="lg:col-span-7 space-y-4 min-w-0">
                        {/* Selected Product Summary Banner */}
                        {selectedProduct ? (
                            <Card className="rounded-2xl border border-slate-200/80 dark:border-white/8 shadow-sm bg-white dark:bg-[#12131A] p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="size-14 rounded-xl bg-slate-100 dark:bg-[#181924] border border-slate-200/70 dark:border-white/8 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                            <ImageWithFallback
                                                src={selectedProduct.image_url}
                                                alt={selectedProduct.name}
                                                className="w-full h-full object-cover"
                                                fallbackIcon={<Package className="size-6 text-slate-400" />}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <CategoryBadge category={selectedProduct.category_name} />
                                                <span className="text-[10px] font-mono text-slate-400">
                                                    SKU: {selectedProduct.sku || 'N/A'}
                                                </span>
                                            </div>
                                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                {selectedProduct.name}
                                            </h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <RatingStars
                                                    rating={selectedProduct.average_rating}
                                                    size="xs"
                                                    showScore
                                                    reviewCount={selectedProduct.total_reviews}
                                                />
                                                {selectedProduct.unseen_count > 0 && (
                                                    <span className="text-xs font-bold text-rose-500">
                                                        ({selectedProduct.unseen_count} unread)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        {selectedProduct.unseen_count > 0 && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => markProductAsSeen(selectedProduct.id)}
                                                className="rounded-xl text-xs font-bold border-slate-200 dark:border-white/8 hover:bg-slate-100 dark:hover:bg-white/5 h-8 cursor-pointer"
                                            >
                                                <Check className="size-3 mr-1 text-emerald-500" /> Mark Seen
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSelectProduct(null)}
                                            className="rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 h-8 cursor-pointer"
                                        >
                                            <X className="size-3.5 mr-1" /> Close
                                        </Button>
                                    </div>
                                </div>

                                {/* Rating Distribution Bars */}
                                {selectedProduct.total_reviews > 0 && (
                                    <div className="pt-3.5 border-t border-slate-100 dark:border-white/6 grid grid-cols-5 gap-2.5">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = selectedProduct.rating_distribution[String(star)] || 0;
                                            const pct =
                                                selectedProduct.total_reviews > 0
                                                    ? Math.round((count / selectedProduct.total_reviews) * 100)
                                                    : 0;
                                            return (
                                                <div key={star} className="text-center space-y-1">
                                                    <div className="flex items-center justify-center gap-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                        <span>{star}</span>
                                                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-[#181924] overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-slate-400 font-mono block">
                                                        {count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        ) : (
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Customer Feedback & Reviews
                                </h2>
                                <span className="text-xs text-slate-400 font-medium">
                                    {reviews.total} review{reviews.total !== 1 ? 's' : ''} found
                                </span>
                            </div>
                        )}

                        {/* Error State with Retry Button */}
                        {pageError && (
                            <Card className="p-6 text-center rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
                                <AlertCircle className="size-8 mx-auto mb-2 text-rose-500" />
                                <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
                                    {pageError}
                                </h3>
                                <p className="text-[11px] text-slate-500 mb-3">
                                    An error occurred while communicating with the server.
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => handlePageChange(reviews.current_page)}
                                    className="rounded-xl text-xs font-bold bg-[#FF3366] hover:bg-[#E1062C] text-white px-4 cursor-pointer"
                                >
                                    <RefreshCw className="size-3 mr-1.5" /> Retry
                                </Button>
                            </Card>
                        )}

                        {/* Reviews List */}
                        <div className="space-y-3">
                            {isPageLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <ReviewCardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : localReviews.length === 0 ? (
                                <Card className="p-12 text-center rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#12131A] shadow-2xs">
                                    <MessageSquare className="size-10 mx-auto mb-2.5 text-slate-400 opacity-40" />
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                                        No Reviews Found
                                    </h3>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                        {selectedProduct
                                            ? `There are currently no reviews matching your filters for ${selectedProduct.name}.`
                                            : 'No customer reviews match your active filter and search options.'}
                                    </p>
                                </Card>
                            ) : (
                                localReviews.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        showProductBadge={!selectedProduct}
                                        onViewDetails={(r) => {
                                            setActiveReviewDetail(r);
                                            setDetailModalOpen(true);
                                        }}
                                        onToggleStatus={handleStatusToggle}
                                        onOpenRespond={openReplyModal}
                                        onOpenDelete={openDeleteModal}
                                        onMarkSeen={handleMarkReviewSeen}
                                    />
                                ))
                            )}
                        </div>

                        {/* Review Server-side Pagination & Page-Size */}
                        <ReviewPagination
                            currentPage={reviews.current_page}
                            lastPage={reviews.last_page}
                            total={reviews.total}
                            perPage={perPage}
                            from={reviews.from}
                            to={reviews.to}
                            label="reviews"
                            isLoading={isPageLoading}
                            onPageChange={(page) => handlePageChange(page)}
                            perPageOptions={[10, 25, 50]}
                            onPerPageChange={(size) => {
                                setPerPage(size);
                                handlePageChange(1, size);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── AUDIT DETAIL MODAL ──────────────────────────────────────── */}
            <ReviewDetailModal
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
                review={activeReviewDetail}
            />

            {/* ── ADMIN REPLY MODAL ───────────────────────────────────────── */}
            <ReviewRespondModal
                open={replyModalOpen}
                onOpenChange={setReplyModalOpen}
                review={replyingReview}
                onSubmit={handleReplySubmit}
                isSubmitting={submittingReply}
            />

            {/* ── DELETE CONFIRMATION MODAL ───────────────────────────────── */}
            <ReviewDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                review={deletingReview}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </AppLayout>
    );
}
