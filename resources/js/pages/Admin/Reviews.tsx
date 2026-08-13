import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    Filter,
    MessageSquare,
    RefreshCw,
    Search,
    ShieldAlert,
    Star,
    Trash2,
    UserCheck,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
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

interface ReviewUser {
    id: number;
    name: string;
    email: string;
}

interface ReviewProduct {
    id: number;
    name: string;
    selling_price: number;
    image_path?: string | null;
}

interface ReviewOrder {
    id: number;
    total_amount: number;
    status: string;
    created_at: string;
}

interface ReviewOrderItem {
    id: number;
    quantity: number;
    price: number;
}

interface ReviewBranch {
    id: number;
    name: string;
}

interface ProductReview {
    id: number;
    user_id: number;
    product_id: number;
    order_id: number;
    order_item_id: number;
    branch_id?: number | null;
    rating: number;
    comment?: string | null;
    status: 'published' | 'hidden' | 'flagged' | 'pending';
    admin_response?: string | null;
    admin_responded_at?: string | null;
    created_at: string;
    user?: ReviewUser | null;
    product?: ReviewProduct | null;
    order?: ReviewOrder | null;
    order_item?: ReviewOrderItem | null;
    branch?: ReviewBranch | null;
    responder?: ReviewUser | null;
}

interface RatingDist {
    count: number;
    percentage: number;
}

interface ReviewStats {
    average_rating: number;
    total_reviews: number;
    five_star: number;
    one_star: number;
    flagged: number;
    distribution: Record<string, RatingDist>;
}

interface Props {
    reviews: {
        data: ProductReview[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: ReviewStats;
    filters: {
        status?: string;
        rating?: string;
        product_id?: string;
        branch_id?: string;
        search?: string;
    };
    products: Array<{ id: number; name: string }>;
    branches: Array<{ id: number; name: string }>;
}

export default function Reviews({ reviews, stats, filters, products, branches }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [ratingFilter, setRatingFilter] = useState(filters.rating || 'all');
    const [productFilter, setProductFilter] = useState(filters.product_id || 'all');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || 'all');

    // Modals state
    const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    // Apply filters
    const handleFilterChange = (key: string, val: string) => {
        const newFilters = {
            search,
            status: statusFilter,
            rating: ratingFilter,
            product_id: productFilter,
            branch_id: branchFilter,
            [key]: val,
        };

        router.get('/admin/reviews', newFilters, { preserveState: true, replace: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('search', search);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setRatingFilter('all');
        setProductFilter('all');
        setBranchFilter('all');
        router.get('/admin/reviews', {}, { replace: true });
    };

    // Toggle Review Status
    const handleStatusToggle = (review: ProductReview, newStatus: string) => {
        router.put(`/admin/reviews/${review.id}/status`, { status: newStatus }, { preserveScroll: true });
    };

    // Open reply modal
    const openReplyModal = (review: ProductReview) => {
        setSelectedReview(review);
        setReplyText(review.admin_response || '');
        setReplyModalOpen(true);
    };

    // Submit reply
    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReview || !replyText.trim()) return;

        setSubmittingReply(true);
        router.post(
            `/admin/reviews/${selectedReview.id}/respond`,
            { response: replyText },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReplyModalOpen(false);
                    setSubmittingReply(false);
                },
                onError: () => setSubmittingReply(false),
            }
        );
    };

    // Delete review
    const handleDelete = (review: ProductReview) => {
        if (confirm('Are you sure you want to delete this customer review?')) {
            router.delete(`/admin/reviews/${review.id}`, { preserveScroll: true });
        }
    };

    // Helper: Star rating display
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
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 uppercase text-[10px] font-black">
                        <CheckCircle2 className="size-3 mr-1 text-emerald-500" /> Published
                    </Badge>
                );
            case 'hidden':
                return (
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-slate-200 dark:border-slate-800 uppercase text-[10px] font-black">
                        <EyeOff className="size-3 mr-1 text-slate-500" /> Hidden
                    </Badge>
                );
            case 'flagged':
                return (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 uppercase text-[10px] font-black">
                        <ShieldAlert className="size-3 mr-1 text-rose-500" /> Flagged
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 uppercase text-[10px] font-black">
                        <AlertTriangle className="size-3 mr-1 text-amber-500" /> Pending
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout>
            <Head title="Reviews & Ratings — Operations Gateway" />

            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-['Outfit']">
                {/* ── HEADER BANNER ────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#E75480] via-[#FF4F81] to-[#E75480] p-8 text-white shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Star className="size-6 text-white fill-white" />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-white">Reviews & Ratings</h1>
                            </div>
                            <p className="text-white/80 font-medium max-w-2xl text-sm">
                                Moderate customer feedback, track product rating performance, and manage verified purchase reviews across all branches.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── KPI CARDS GRID ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-5 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Average Rating
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {stats.average_rating}
                                </span>
                                <span className="text-xs font-bold text-amber-500">★ ★ ★ ★ ★</span>
                            </div>
                            <Star className="size-6 text-amber-400 fill-amber-400 opacity-20" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-5 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Total Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 flex items-baseline justify-between">
                            <span className="text-3xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {stats.total_reviews}
                            </span>
                            <MessageSquare className="size-6 text-blue-500 opacity-20" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-5 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                5-Star Ratings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                    {stats.five_star}
                                </span>
                                <span className="text-xs font-bold text-slate-500">
                                    ({stats.distribution['5']?.percentage || 0}%)
                                </span>
                            </div>
                            <CheckCircle2 className="size-6 text-emerald-500 opacity-20" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-5 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                1-Star Ratings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                                    {stats.one_star}
                                </span>
                                <span className="text-xs font-bold text-slate-500">
                                    ({stats.distribution['1']?.percentage || 0}%)
                                </span>
                            </div>
                            <AlertTriangle className="size-6 text-rose-500 opacity-20" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl">
                        <CardHeader className="p-5 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                Moderation Queue
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 flex items-baseline justify-between">
                            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                                {stats.flagged}
                            </span>
                            <ShieldAlert className="size-6 text-amber-500 opacity-20" />
                        </CardContent>
                    </Card>
                </div>

                {/* ── RATING DISTRIBUTION BAR VISUALIZER ───────────────────── */}
                <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-xl bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl p-6">
                    <h3 className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC] mb-4">Rating Breakdown</h3>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const dist = stats.distribution[String(star)] || { count: 0, percentage: 0 };
                            return (
                                <div key={star} className="flex items-center gap-4 text-xs font-bold">
                                    <div className="w-12 flex items-center gap-1 text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        <span>{star}</span>
                                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                    </div>
                                    <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div
                                            className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                            style={{ width: `${dist.percentage}%` }}
                                        />
                                    </div>
                                    <div className="w-20 text-right text-slate-500">
                                        {dist.count} ({dist.percentage}%)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* ── SEARCH & FILTER TOOLBAR ───────────────────────────────── */}
                <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-xl bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl p-6">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        {/* Search Input */}
                        <div className="relative lg:col-span-2">
                            <Search className="absolute left-3.5 top-3 size-4 text-slate-400" />
                            <Input
                                placeholder="Search customer, product, comment..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); handleFilterChange('status', val); }}>
                            <SelectTrigger className="rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800">
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
                        <Select value={ratingFilter} onValueChange={(val) => { setRatingFilter(val); handleFilterChange('rating', val); }}>
                            <SelectTrigger className="rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800">
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

                        {/* Product Filter */}
                        <Select value={productFilter} onValueChange={(val) => { setProductFilter(val); handleFilterChange('product_id', val); }}>
                            <SelectTrigger className="rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800">
                                <SelectValue placeholder="All Products" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl max-h-60">
                                <SelectItem value="all">All Products</SelectItem>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        <Button type="button" variant="outline" className="rounded-2xl font-bold flex items-center justify-center gap-2" onClick={clearFilters}>
                            <RefreshCw className="size-4" /> Reset
                        </Button>
                    </form>
                </Card>

                {/* ── REVIEWS MANAGEMENT TABLE ─────────────────────────────── */}
                <Card className="rounded-3xl border border-white/80 dark:border-white/10 shadow-xl bg-white/80 dark:bg-[#121218]/80 backdrop-blur-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#FFF5F7] dark:bg-[#181824] border-b border-[#F8C8DC]/40 dark:border-white/10 text-[#7D6B6E] dark:text-[#94A3B8] font-black uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Customer</th>
                                    <th className="p-4">Product</th>
                                    <th className="p-4">Rating</th>
                                    <th className="p-4">Comment</th>
                                    <th className="p-4">Branch</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F8C8DC]/20 dark:divide-white/5 font-medium">
                                {reviews.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-500 font-bold">
                                            <MessageSquare className="size-10 mx-auto mb-3 text-slate-300 opacity-30" />
                                            No customer reviews found matching your filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    reviews.data.map((review) => (
                                        <tr key={review.id} className="hover:bg-[#FFF5F7]/40 dark:hover:bg-[#1C1C28]/40 transition-colors">
                                            {/* Customer */}
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-full bg-[#E75480] text-white flex items-center justify-center font-black">
                                                        {review.user?.name.charAt(0).toUpperCase() || 'C'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-1">
                                                            {review.user?.name || 'Customer'}
                                                            <UserCheck className="size-3.5 text-emerald-500" title="Verified Purchase" />
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">{review.user?.email || `Order #${review.order_id}`}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Product */}
                                            <td className="p-4 font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {review.product?.name || 'Unknown Product'}
                                            </td>

                                            {/* Rating */}
                                            <td className="p-4">
                                                {renderStars(review.rating)}
                                            </td>

                                            {/* Comment */}
                                            <td className="p-4 max-w-xs">
                                                <p className="line-clamp-2 text-slate-600 dark:text-slate-300">
                                                    {review.comment || <span className="italic text-slate-400">No written comment</span>}
                                                </p>
                                                {review.admin_response && (
                                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                                                        ✓ Admin Responded
                                                    </p>
                                                )}
                                            </td>

                                            {/* Branch */}
                                            <td className="p-4 text-slate-500 font-bold">
                                                {review.branch?.name || 'Global'}
                                            </td>

                                            {/* Date */}
                                            <td className="p-4 text-slate-500 text-[11px]">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                {statusBadge(review.status)}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Toggle Publish/Hide */}
                                                    {review.status === 'published' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="size-8 p-0 rounded-xl text-slate-500 hover:text-slate-800"
                                                            title="Hide Review"
                                                            onClick={() => handleStatusToggle(review, 'hidden')}
                                                        >
                                                            <EyeOff className="size-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="size-8 p-0 rounded-xl text-emerald-600 hover:bg-emerald-50"
                                                            title="Publish Review"
                                                            onClick={() => handleStatusToggle(review, 'published')}
                                                        >
                                                            <Eye className="size-4" />
                                                        </Button>
                                                    )}

                                                    {/* Admin Reply */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="size-8 p-0 rounded-xl text-blue-600 hover:bg-blue-50"
                                                        title="Reply to Review"
                                                        onClick={() => openReplyModal(review)}
                                                    >
                                                        <MessageSquare className="size-4" />
                                                    </Button>

                                                    {/* Delete */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="size-8 p-0 rounded-xl text-rose-600 hover:bg-rose-50"
                                                        title="Delete Review"
                                                        onClick={() => handleDelete(review)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* ── ADMIN REPLY MODAL ────────────────────────────────────────── */}
            <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
                <DialogContent className="sm:max-w-125 rounded-3xl p-0 overflow-hidden border border-white/90 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl font-['Outfit']">
                    <div className="bg-linear-to-r from-[#E75480] to-[#FF4F81] p-6 text-white">
                        <DialogTitle className="text-xl font-black text-white">Reply to Customer Review</DialogTitle>
                        <DialogDescription className="text-white/80 font-medium mt-1">
                            Respond to {selectedReview?.user?.name}'s review for {selectedReview?.product?.name}.
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleReplySubmit} className="p-6 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-xs text-[#3D2C2E] dark:text-[#F8FAFC]">
                                    {selectedReview?.user?.name}
                                </span>
                                {selectedReview && renderStars(selectedReview.rating)}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                                "{selectedReview?.comment || 'No written comment'}"
                            </p>
                        </div>

                        <div>
                            <label className="text-xs font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8] tracking-wider mb-2 block">
                                Official Response
                            </label>
                            <Textarea
                                rows={4}
                                placeholder="Thank the customer or address their feedback..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="rounded-2xl bg-white dark:bg-[#181824] border-slate-200 dark:border-slate-800"
                            />
                        </div>

                        <DialogFooter className="pt-2 flex justify-end gap-2">
                            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setReplyModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submittingReply || !replyText.trim()}
                                className="rounded-xl font-black bg-[#E75480] hover:bg-[#D43F6B] text-white px-6"
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
