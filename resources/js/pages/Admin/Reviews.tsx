import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Calendar,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    MessageSquare,
    Package,
    RefreshCw,
    Search,
    ShieldAlert,
    Star,
    Trash2,
    UserCheck,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

export interface ProductItem {
    id: number;
    name: string;
    sku: string | null;
    selling_price: number;
    category_name: string;
    branch_name: string;
    image_url: string | null;
    total_reviews: number;
    unseen_count: number;
    average_rating: number;
    rating_distribution: Record<string, number>;
}

export interface ReviewItem {
    id: number;
    user_id: number;
    product_id: number;
    order_id: number | null;
    order_number: string | null;
    branch_id: number | null;
    rating: number;
    comment: string | null;
    status: 'published' | 'hidden' | 'flagged' | 'pending';
    is_seen: boolean;
    seen_at: string | null;
    is_verified_purchase: boolean;
    admin_response: string | null;
    admin_responded_at: string | null;
    created_at: string | null;
    user: { id: number; name: string; email: string } | null;
    product: { id: number; name: string; image_path?: string | null } | null;
    branch: { id: number; name: string } | null;
    responder: { id: number; name: string } | null;
    seen_by: { id: number; name: string } | null;
}

export interface ReviewStats {
    total_products: number;
    total_reviews: number;
    unseen_reviews: number;
    average_rating: number;
    published_count: number;
    flagged_count: number;
}

interface Props {
    productList: ProductItem[];
    reviews: {
        data: ReviewItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: ReviewStats;
    selectedProductId: number | null;
    filters: {
        status?: string;
        rating?: string;
        product_id?: string;
        seen_status?: string;
        branch_id?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
    };
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
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [ratingFilter, setRatingFilter] = useState(filters.rating || 'all');
    const [seenFilter, setSeenFilter] = useState(filters.seen_status || 'all');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || 'all');

    // Modals
    const [activeReviewDetail, setActiveReviewDetail] = useState<ReviewItem | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyingReview, setReplyingReview] = useState<ReviewItem | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    // Sync props updates during render (React recommended pattern)
    const [prevProps, setPrevProps] = useState({ productList, reviews, selectedProductId });
    if (prevProps.productList !== productList || prevProps.reviews !== reviews || prevProps.selectedProductId !== selectedProductId) {
        setPrevProps({ productList, reviews, selectedProductId });
        setLocalProductList(productList);
        setLocalReviews(reviews.data);
        if (selectedProductId) {
            setSelectedProduct(productList.find((p) => p.id === selectedProductId) || null);
        }
    }

    // Apply Filter
    const applyFilter = (key: string, val: string) => {
        const newFilters = {
            search,
            status: statusFilter,
            rating: ratingFilter,
            seen_status: seenFilter,
            branch_id: branchFilter,
            product_id: selectedProduct ? String(selectedProduct.id) : 'all',
            [key]: val,
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
        setStatusFilter('all');
        setRatingFilter('all');
        setSeenFilter('all');
        setBranchFilter('all');
        setSelectedProduct(null);
        router.get('/admin/reviews', {}, { replace: true });
    };

    // Selecting a Product
    const handleSelectProduct = (product: ProductItem | null) => {
        setSelectedProduct(product);
        const pid = product ? String(product.id) : 'all';

        router.get(
            '/admin/reviews',
            {
                search,
                status: statusFilter,
                rating: ratingFilter,
                seen_status: seenFilter,
                branch_id: branchFilter,
                product_id: pid,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );

        // If product has unseen reviews, mark them as seen
        if (product && product.unseen_count > 0) {
            markProductAsSeen(product.id);
        }
    };

    // Mark Product Reviews As Seen
    const markProductAsSeen = async (productId: number) => {
        try {
            const res = await axios.post(`/admin/reviews/products/${productId}/mark-seen`);
            if (res.data.success) {
                // Optimistically clear unseen count on product
                setLocalProductList((prev) =>
                    prev.map((p) => (p.id === productId ? { ...p, unseen_count: 0 } : p))
                );
                // Mark reviews as seen
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

    // Reply to Review
    const openReplyModal = (review: ReviewItem) => {
        setReplyingReview(review);
        setReplyText(review.admin_response || '');
        setReplyModalOpen(true);
    };

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyingReview || !replyText.trim()) return;

        setSubmittingReply(true);
        router.post(
            `/admin/reviews/${replyingReview.id}/respond`,
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

    // Delete Review
    const handleDeleteReview = (review: ReviewItem) => {
        if (confirm('Are you sure you want to permanently delete this customer review?')) {
            router.delete(`/admin/reviews/${review.id}`, {
                preserveScroll: true,
                onSuccess: () => toast.success('Review deleted.'),
            });
        }
    };

    // Helper: Star rendering
    const renderStars = (rating: number, size = 'size-4') => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${size} ${
                            star <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 dark:fill-slate-800 text-slate-300 dark:text-slate-700'
                        }`}
                    />
                ))}
            </div>
        );
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return (
                    <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 uppercase text-[10px] font-black"
                    >
                        <CheckCircle2 className="size-3 mr-1 text-emerald-500" /> Published
                    </Badge>
                );
            case 'hidden':
                return (
                    <Badge
                        variant="outline"
                        className="bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-slate-200 dark:border-slate-800 uppercase text-[10px] font-black"
                    >
                        <EyeOff className="size-3 mr-1 text-slate-500" /> Hidden
                    </Badge>
                );
            case 'flagged':
                return (
                    <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 uppercase text-[10px] font-black"
                    >
                        <ShieldAlert className="size-3 mr-1 text-rose-500" /> Flagged
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 uppercase text-[10px] font-black"
                    >
                        <AlertTriangle className="size-3 mr-1 text-amber-500" /> Pending
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout>
            <Head title="Reviews & Ratings — Operations Management" />

            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 font-['Outfit']">
                {/* ── HEADER BANNER ────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#E75480] via-[#FF4F81] to-[#E75480] p-6 sm:p-8 text-white shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Star className="size-6 text-white fill-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                        Reviews & Ratings Management
                                    </h1>
                                    <p className="text-white/80 font-medium text-xs sm:text-sm mt-0.5">
                                        Monitor product customer satisfaction, unread reviews, and verified purchase feedback.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Unseen reviews alert badge in header */}
                        {stats.unseen_reviews > 0 && (
                            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-lg">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                </span>
                                <div>
                                    <p className="text-xs font-black text-white uppercase tracking-wider">
                                        {stats.unseen_reviews} Unread Review{stats.unseen_reviews > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-[10px] text-white/80 font-semibold">Requires reviewer attention</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── KPI CARDS ────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-4 pb-1">
                            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Total Products
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex items-baseline justify-between">
                            <span className="text-2xl sm:text-3xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {stats.total_products}
                            </span>
                            <Package className="size-5 text-blue-500 opacity-30" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-4 pb-1">
                            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Total Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex items-baseline justify-between">
                            <span className="text-2xl sm:text-3xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {stats.total_reviews}
                            </span>
                            <MessageSquare className="size-5 text-emerald-500 opacity-30" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-rose-200 dark:border-rose-900/40 shadow-lg bg-rose-50/40 dark:bg-rose-950/20 backdrop-blur-xl">
                        <CardHeader className="p-4 pb-1">
                            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                                Unseen Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex items-baseline justify-between">
                            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                                {stats.unseen_reviews}
                            </span>
                            <span className="text-xs font-bold text-rose-500">🔴 Unread</span>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-4 pb-1">
                            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Average Rating
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex items-baseline justify-between">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl sm:text-3xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {stats.average_rating}
                                </span>
                                <span className="text-xs font-bold text-amber-500">★</span>
                            </div>
                            <Star className="size-5 text-amber-400 fill-amber-400 opacity-30" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-4 pb-1">
                            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Published
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex items-baseline justify-between">
                            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {stats.published_count}
                            </span>
                            <CheckCircle2 className="size-5 text-emerald-500 opacity-30" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-4 pb-1">
                            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Moderation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex items-baseline justify-between">
                            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                                {stats.flagged_count}
                            </span>
                            <ShieldAlert className="size-5 text-amber-500 opacity-30" />
                        </CardContent>
                    </Card>
                </div>

                {/* ── SEARCH & FILTER TOOLBAR ───────────────────────────────── */}
                <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-xl bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl p-5">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        {/* Search Input */}
                        <div className="relative lg:col-span-2">
                            <Search className="absolute left-3.5 top-3 size-4 text-slate-400" />
                            <Input
                                placeholder="Search product, customer, order #, comment..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800 text-xs"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(val) => {
                                setStatusFilter(val);
                                applyFilter('status', val);
                            }}
                        >
                            <SelectTrigger className="rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800 text-xs font-semibold">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="hidden">Hidden</SelectItem>
                                <SelectItem value="flagged">Flagged</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Rating Filter */}
                        <Select
                            value={ratingFilter}
                            onValueChange={(val) => {
                                setRatingFilter(val);
                                applyFilter('rating', val);
                            }}
                        >
                            <SelectTrigger className="rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800 text-xs font-semibold">
                                <SelectValue placeholder="All Ratings" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Ratings</SelectItem>
                                <SelectItem value="5">5 Stars ★★★★★</SelectItem>
                                <SelectItem value="4">4 Stars ★★★★</SelectItem>
                                <SelectItem value="3">3 Stars ★★★</SelectItem>
                                <SelectItem value="2">2 Stars ★★</SelectItem>
                                <SelectItem value="1">1 Star ★</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Seen / Unseen Filter */}
                        <Select
                            value={seenFilter}
                            onValueChange={(val) => {
                                setSeenFilter(val);
                                applyFilter('seen_status', val);
                            }}
                        >
                            <SelectTrigger className="rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800 text-xs font-semibold">
                                <SelectValue placeholder="All Read States" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Read States</SelectItem>
                                <SelectItem value="unseen">🔴 Unseen (New)</SelectItem>
                                <SelectItem value="seen">✓ Viewed</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Branch Filter (Admin only) */}
                        {isAdmin ? (
                            <Select
                                value={branchFilter}
                                onValueChange={(val) => {
                                    setBranchFilter(val);
                                    applyFilter('branch_id', val);
                                }}
                            >
                                <SelectTrigger className="rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800 text-xs font-semibold">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl font-bold flex items-center justify-center gap-2 text-xs"
                                onClick={clearFilters}
                            >
                                <RefreshCw className="size-3.5" /> Reset Filters
                            </Button>
                        )}

                        {isAdmin && (
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl font-bold flex items-center justify-center gap-2 text-xs"
                                onClick={clearFilters}
                            >
                                <RefreshCw className="size-3.5" /> Reset
                            </Button>
                        )}
                    </form>
                </Card>

                {/* ── MASTER-DETAIL LAYOUT: ALL PRODUCTS + REVIEWS ──────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ── LEFT COLUMN: MASTER PRODUCT LIST (ALL PRODUCTS VISIBLE) ── */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    Product Catalog
                                </h2>
                                <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Showing all {localProductList.length} products
                                </p>
                            </div>
                            {selectedProduct && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSelectProduct(null)}
                                    className="text-xs font-bold text-[#E75480] dark:text-[#FF4F81] hover:bg-[#FFF5F7] dark:hover:bg-white/5 rounded-xl h-8"
                                >
                                    View All Reviews
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2.5 max-h-195 overflow-y-auto pr-1">
                            {localProductList.length === 0 ? (
                                <Card className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <Package className="size-8 mx-auto mb-2 text-slate-300 opacity-40" />
                                    <p className="text-xs font-bold text-slate-400">No products found matching criteria.</p>
                                </Card>
                            ) : (
                                localProductList.map((product) => {
                                    const isSelected = selectedProduct?.id === product.id;
                                    const hasUnseen = product.unseen_count > 0;

                                    return (
                                        <motion.div
                                            key={product.id}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => handleSelectProduct(product)}
                                            className={cn(
                                                'p-3.5 rounded-3xl border transition-all duration-200 cursor-pointer relative overflow-hidden backdrop-blur-xl',
                                                isSelected
                                                    ? 'bg-linear-to-r from-[#FFF5F7] to-[#FADADD]/50 dark:from-[#201824] dark:to-[#2A1828] border-[#E75480] dark:border-[#FF4F81] shadow-md ring-2 ring-[#E75480]/30'
                                                    : 'bg-white/80 dark:bg-[#121218]/80 hover:bg-[#FFF5F7]/40 dark:hover:bg-[#181824] border-white/80 dark:border-white/10 shadow-sm'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Product Image / Icon */}
                                                <div className="size-12 rounded-2xl bg-[#FFF5F7] dark:bg-[#181824] border border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="size-6 text-[#E75480]/50" />
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                                        <span className="text-[10px] font-bold text-[#E75480] dark:text-[#FF4F81] uppercase tracking-wider truncate">
                                                            {product.category_name}
                                                        </span>

                                                        {/* 🔴 RED UNSEEN INDICATOR BADGE */}
                                                        {hasUnseen && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs animate-bounce shrink-0">
                                                                🔴 {product.unseen_count} new
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="font-extrabold text-xs sm:text-sm text-[#3D2C2E] dark:text-[#F8FAFC] truncate">
                                                        {product.name}
                                                    </h3>

                                                    {/* Rating & Review Count */}
                                                    <div className="flex items-center justify-between gap-2 mt-1.5 text-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            {product.total_reviews > 0 ? (
                                                                <>
                                                                    <span className="font-black text-amber-500 font-mono text-xs">
                                                                        {product.average_rating} ★
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                                        ({product.total_reviews} review{product.total_reviews > 1 ? 's' : ''})
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-[11px] font-bold text-slate-400 italic">
                                                                    No reviews yet
                                                                </span>
                                                            )}
                                                        </div>

                                                        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                                            ₱{product.selling_price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: REVIEWS DETAIL PANEL ──────────────────── */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Selected Product Summary Header Card */}
                        {selectedProduct ? (
                            <Card className="rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 shadow-xl bg-linear-to-br from-white via-[#FFF5F7]/30 to-white dark:from-[#121218] dark:via-[#181824] dark:to-[#121218] backdrop-blur-xl p-5 relative overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="size-14 rounded-2xl bg-white dark:bg-[#1C1C28] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                                            {selectedProduct.image_url ? (
                                                <img
                                                    src={selectedProduct.image_url}
                                                    alt={selectedProduct.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package className="size-7 text-[#E75480]" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-[#E75480] dark:text-[#FF4F81]">
                                                    {selectedProduct.category_name}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400">
                                                    SKU: {selectedProduct.sku || 'N/A'}
                                                </span>
                                            </div>
                                            <h2 className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {selectedProduct.name}
                                            </h2>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {renderStars(Math.round(selectedProduct.average_rating), 'size-3.5')}
                                                <span className="text-xs font-black text-amber-500">
                                                    {selectedProduct.average_rating}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    • {selectedProduct.total_reviews} total reviews
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => markProductAsSeen(selectedProduct.id)}
                                            className="rounded-2xl text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <Check className="size-3.5 mr-1 text-emerald-500" /> Mark Seen
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSelectProduct(null)}
                                            className="rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <X className="size-3.5 mr-1" /> Close
                                        </Button>
                                    </div>
                                </div>

                                {/* Rating Distribution Bars for Selected Product */}
                                {selectedProduct.total_reviews > 0 && (
                                    <div className="mt-4 pt-4 border-t border-[#F8C8DC]/30 dark:border-white/10 grid grid-cols-5 gap-2">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = selectedProduct.rating_distribution[String(star)] || 0;
                                            const pct =
                                                selectedProduct.total_reviews > 0
                                                    ? Math.round((count / selectedProduct.total_reviews) * 100)
                                                    : 0;
                                            return (
                                                <div key={star} className="text-center space-y-1">
                                                    <div className="flex items-center justify-center gap-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                        <span>{star}</span>
                                                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono block">
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
                                <h2 className="text-base font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    Customer Feedback & Reviews
                                </h2>
                                <span className="text-xs text-slate-400 font-bold">
                                    {reviews.total} review{reviews.total > 1 ? 's' : ''} found
                                </span>
                            </div>
                        )}

                        {/* Reviews List */}
                        <div className="space-y-3">
                            {localReviews.length === 0 ? (
                                <Card className="p-12 text-center rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                                    <MessageSquare className="size-10 mx-auto mb-3 text-slate-300 opacity-40" />
                                    <h3 className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] mb-1">
                                        No Reviews Found
                                    </h3>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                        {selectedProduct
                                            ? `There are no reviews matching your current filters for ${selectedProduct.name}.`
                                            : 'No customer reviews match your active filter and search options.'}
                                    </p>
                                </Card>
                            ) : (
                                localReviews.map((review) => (
                                    <motion.div
                                        key={review.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            'p-4 sm:p-5 rounded-3xl border shadow-sm backdrop-blur-xl transition-all',
                                            !review.is_seen
                                                ? 'bg-white dark:bg-[#161622] border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-400/20'
                                                : 'bg-white/80 dark:bg-[#121218]/80 border-white/80 dark:border-white/10 hover:border-slate-300'
                                        )}
                                    >
                                        <div className="flex flex-col gap-3">
                                            {/* Top Row: Customer Info, Star Rating, Status Badges */}
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-full bg-linear-to-br from-[#E75480] to-[#FF4F81] text-white flex items-center justify-center font-black text-xs shadow-xs">
                                                        {review.user?.name.charAt(0).toUpperCase() || 'C'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-xs sm:text-sm text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                                {review.user?.name || 'Customer'}
                                                            </span>
                                                            {review.is_verified_purchase && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] font-black px-1.5 py-0"
                                                                    title="Verified Customer Purchase"
                                                                >
                                                                    <UserCheck className="size-2.5 mr-0.5" /> Verified Purchase
                                                                </Badge>
                                                            )}
                                                            {!review.is_seen && (
                                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50">
                                                                    🔴 Unread
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 flex items-center gap-2">
                                                            <span>{review.user?.email || `Order #${review.order_number || review.order_id}`}</span>
                                                            {review.branch && (
                                                                <span className="font-semibold text-slate-500">
                                                                    • {review.branch.name}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {renderStars(review.rating, 'size-4')}
                                                    <span className="font-mono font-black text-xs text-amber-500">
                                                        {review.rating}.0
                                                    </span>
                                                    {statusBadge(review.status)}
                                                </div>
                                            </div>

                                            {/* Product Tag (if browsing all products) */}
                                            {!selectedProduct && review.product && (
                                                <div className="flex items-center gap-2 bg-[#FFF5F7] dark:bg-white/5 px-2.5 py-1 rounded-xl w-fit border border-[#F8C8DC]/40 dark:border-white/10 text-xs">
                                                    <Package className="size-3 text-[#E75480]" />
                                                    <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                        {review.product.name}
                                                    </span>
                                                    {review.order_number && (
                                                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                                                            ({review.order_number})
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Customer Written Comment */}
                                            <div className="bg-slate-50/80 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200">
                                                {review.comment ? (
                                                    <p className="font-medium italic leading-relaxed">
                                                        "{review.comment}"
                                                    </p>
                                                ) : (
                                                    <span className="italic text-slate-400">
                                                        Rating submitted without written comment.
                                                    </span>
                                                )}
                                            </div>

                                            {/* Official Admin Response Block */}
                                            {review.admin_response && (
                                                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 text-xs space-y-1">
                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle2 className="size-3" /> Official Response by{' '}
                                                            {review.responder?.name || 'Review Manager'}
                                                        </span>
                                                        <span>
                                                            {review.admin_responded_at
                                                                ? new Date(review.admin_responded_at).toLocaleDateString()
                                                                : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700 dark:text-slate-200 font-medium">
                                                        {review.admin_response}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Bottom Row: Date & Action Controls */}
                                            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                                                <span className="text-[11px] font-medium flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    {review.created_at
                                                        ? new Date(review.created_at).toLocaleDateString('en-US', {
                                                              month: 'short',
                                                              day: 'numeric',
                                                              year: 'numeric',
                                                          })
                                                        : ''}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {/* Mark as seen button */}
                                                    {!review.is_seen && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleMarkReviewSeen(review)}
                                                            className="h-7 px-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                                                        >
                                                            <Eye className="size-3 mr-1" /> Mark Viewed
                                                        </Button>
                                                    )}

                                                    {/* View Detail Modal */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setActiveReviewDetail(review);
                                                            setDetailModalOpen(true);
                                                        }}
                                                        className="h-7 px-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                                                    >
                                                        <Eye className="size-3 mr-1" /> Details
                                                    </Button>

                                                    {/* Toggle Visibility */}
                                                    {review.status === 'published' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleStatusToggle(review, 'hidden')}
                                                            className="h-7 px-2 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                                                            title="Hide from public menu"
                                                        >
                                                            <EyeOff className="size-3 mr-1" /> Hide
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleStatusToggle(review, 'published')}
                                                            className="h-7 px-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl"
                                                            title="Publish to public menu"
                                                        >
                                                            <Eye className="size-3 mr-1" /> Publish
                                                        </Button>
                                                    )}

                                                    {/* Reply Button */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openReplyModal(review)}
                                                        className="h-7 px-2 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl"
                                                    >
                                                        <MessageSquare className="size-3 mr-1" /> Respond
                                                    </Button>

                                                    {/* Delete */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteReview(review)}
                                                        className="h-7 px-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}

                            {/* Pagination */}
                            {reviews.links && reviews.links.length > 3 && (
                                <div className="flex items-center justify-center gap-1.5 pt-4">
                                    {reviews.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => link.url && router.visit(link.url)}
                                            disabled={!link.url}
                                            className={cn(
                                                'px-3 py-1 rounded-xl text-xs font-bold transition-all',
                                                link.active
                                                    ? 'bg-[#E75480] text-white shadow-xs'
                                                    : 'bg-white dark:bg-[#181824] text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                                            )}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── EXPANDED REVIEW DETAIL MODAL ────────────────────────────── */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border border-white/90 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl font-['Outfit']">
                    <div className="bg-linear-to-r from-[#E75480] to-[#FF4F81] p-6 text-white">
                        <DialogTitle className="text-xl font-black text-white">Review Audit Record</DialogTitle>
                        <DialogDescription className="text-white/80 font-medium mt-0.5 text-xs">
                            Complete verified transaction details and review history.
                        </DialogDescription>
                    </div>

                    <div className="p-6 space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="font-black text-[#3D2C2E] dark:text-[#F8FAFC] text-sm">
                                    {activeReviewDetail?.user?.name || 'Customer'}
                                </p>
                                <p className="text-slate-400">{activeReviewDetail?.user?.email}</p>
                            </div>
                            {activeReviewDetail && renderStars(activeReviewDetail.rating, 'size-5')}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                            <div>
                                <span className="font-bold text-slate-400 uppercase text-[10px] block">Product</span>
                                <span className="font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {activeReviewDetail?.product?.name}
                                </span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-400 uppercase text-[10px] block">Branch</span>
                                <span className="font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {activeReviewDetail?.branch?.name || 'Global'}
                                </span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-400 uppercase text-[10px] block">Order #</span>
                                <span className="font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {activeReviewDetail?.order_number || `ORD-${activeReviewDetail?.order_id}`}
                                </span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-400 uppercase text-[10px] block">Date</span>
                                <span className="font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {activeReviewDetail?.created_at
                                        ? new Date(activeReviewDetail.created_at).toLocaleString()
                                        : ''}
                                </span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-400 uppercase text-[10px] block">Status</span>
                                <div>{activeReviewDetail && statusBadge(activeReviewDetail.status)}</div>
                            </div>
                            <div>
                                <span className="font-bold text-slate-400 uppercase text-[10px] block">Read Status</span>
                                <span className="font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {activeReviewDetail?.is_seen ? '✓ Viewed' : '🔴 Unread'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <span className="font-black text-[10px] uppercase text-slate-400 block mb-1">Customer Written Review</span>
                            <p className="text-slate-700 dark:text-slate-200 font-medium italic">
                                "{activeReviewDetail?.comment || 'No written comment'}"
                            </p>
                        </div>

                        {activeReviewDetail?.admin_response && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
                                <span className="font-black text-[10px] uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                                    Official Response by {activeReviewDetail.responder?.name || 'Review Manager'}
                                </span>
                                <p className="text-slate-700 dark:text-slate-200 font-medium">
                                    {activeReviewDetail.admin_response}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                        <Button
                            variant="ghost"
                            className="rounded-xl font-bold text-xs"
                            onClick={() => setDetailModalOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── ADMIN REPLY MODAL ───────────────────────────────────────── */}
            <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border border-white/90 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl font-['Outfit']">
                    <div className="bg-linear-to-r from-[#E75480] to-[#FF4F81] p-6 text-white">
                        <DialogTitle className="text-xl font-black text-white">Reply to Customer Review</DialogTitle>
                        <DialogDescription className="text-white/80 font-medium mt-0.5 text-xs">
                            Respond to {replyingReview?.user?.name}'s review for {replyingReview?.product?.name}.
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleReplySubmit} className="p-6 space-y-4 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="font-black text-xs text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {replyingReview?.user?.name}
                                </span>
                                {replyingReview && renderStars(replyingReview.rating, 'size-3.5')}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 italic">
                                "{replyingReview?.comment || 'No written comment'}"
                            </p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8] tracking-wider mb-1.5 block">
                                Official Response
                            </label>
                            <Textarea
                                rows={4}
                                placeholder="Thank the customer or address their feedback..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800 text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="rounded-xl font-bold text-xs"
                                onClick={() => setReplyModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submittingReply || !replyText.trim()}
                                className="rounded-xl font-black bg-[#E75480] hover:bg-[#D43F6B] text-white px-5 text-xs shadow-md"
                            >
                                {submittingReply ? 'Saving...' : 'Post Response'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
