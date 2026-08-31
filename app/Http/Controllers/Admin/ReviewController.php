<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use App\Models\Product;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * Display admin reviews & ratings management dashboard.
     * Shows ALL products in master catalog with aggregate review metrics,
     * coupled with high-performance server-side paginated review feed.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $isAdmin = method_exists($user, 'isAdmin') ? $user->isAdmin() : (($user->role ?? '') === 'admin');
        $userBranchId = !$isAdmin ? (int) $user->branch_id : null;

        // Validated pagination parameters
        $perPage = (int) $request->input('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $page = max(1, (int) $request->input('page', 1));

        $selectedProductId = $request->filled('product_id') && $request->product_id !== 'all'
            ? (int) $request->product_id
            : null;

        $search = trim((string) $request->input('search', ''));
        $ratingFilter = (string) $request->input('rating', 'all');
        $statusFilter = (string) $request->input('status', 'all');
        $seenFilter = (string) $request->input('seen_status', 'all');
        $verifiedFilter = (string) $request->input('verified_purchase', 'all');
        $branchFilter = $isAdmin ? (string) $request->input('branch_id', 'all') : ($userBranchId ? (string) $userBranchId : 'all');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // 1. Master Products List with aggregated review statistics (Lightweight, No N+1)
        $productList = $this->buildProductList($userBranchId, $search, $branchFilter, $isAdmin);

        // 2. Server-side Paginated Filtered Reviews List
        $reviews = $this->buildFilteredReviews(
            $selectedProductId,
            $userBranchId,
            $ratingFilter,
            $statusFilter,
            $seenFilter,
            $verifiedFilter,
            $branchFilter,
            $dateFrom,
            $dateTo,
            $search,
            $perPage,
            $page
        );

        // 3. System-wide Overall Statistics
        $stats = $this->buildOverallStats($userBranchId, $branchFilter, $isAdmin, $productList->count());

        // 4. Branches List for Admin Filter
        $branches = $isAdmin
            ? Branch::orderBy('name')->get(['id', 'name'])
            : ($userBranchId ? Branch::where('id', $userBranchId)->get(['id', 'name']) : collect([]));

        return Inertia::render('Admin/Reviews', [
            'productList'        => $productList,
            'reviews'            => $reviews,
            'stats'              => $stats,
            'selectedProductId'  => $selectedProductId,
            'filters'            => [
                'status'            => $statusFilter,
                'rating'            => $ratingFilter,
                'product_id'        => $selectedProductId ? (string) $selectedProductId : 'all',
                'seen_status'       => $seenFilter,
                'verified_purchase' => $verifiedFilter,
                'branch_id'         => $branchFilter,
                'search'            => $search,
                'date_from'         => $dateFrom,
                'date_to'           => $dateTo,
                'per_page'          => $perPage,
                'page'              => $page,
            ],
            'branches'           => $branches,
            'isAdmin'            => $isAdmin,
        ]);
    }

    /**
     * Build the master product list with review metric aggregations.
     * Uses efficient single aggregate query and avoids heavy Product model appends.
     */
    private function buildProductList(?int $userBranchId, string $search, string $branchFilter, bool $isAdmin)
    {
        $productsQuery = Product::query()
            ->select(['id', 'name', 'sku', 'selling_price', 'category_id', 'branch_id', 'image_path'])
            ->with([
                'category:id,name',
                'branch:id,name',
            ])
            ->when($userBranchId, function ($q) use ($userBranchId) {
                $q->where(function ($sub) use ($userBranchId) {
                    $sub->where('branch_id', $userBranchId)
                        ->orWhereNull('branch_id')
                        ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $userBranchId));
                });
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->orderBy('name');

        $allProducts = $productsQuery->get();

        // Single aggregation query for all review metrics using SQL standard single-quotes for string literals
        $reviewAggQuery = ProductReview::query()
            ->when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))
            ->when($branchFilter && $branchFilter !== 'all' && $isAdmin, fn($q) => $q->where('branch_id', (int) $branchFilter))
            ->selectRaw("
                product_id,
                COUNT(*) as total_reviews,
                SUM(CASE WHEN is_seen = 0 THEN 1 ELSE 0 END) as unseen_count,
                AVG(CASE WHEN status = 'published' THEN rating ELSE NULL END) as avg_rating,
                SUM(CASE WHEN rating = 5 AND status = 'published' THEN 1 ELSE 0 END) as stars_5,
                SUM(CASE WHEN rating = 4 AND status = 'published' THEN 1 ELSE 0 END) as stars_4,
                SUM(CASE WHEN rating = 3 AND status = 'published' THEN 1 ELSE 0 END) as stars_3,
                SUM(CASE WHEN rating = 2 AND status = 'published' THEN 1 ELSE 0 END) as stars_2,
                SUM(CASE WHEN rating = 1 AND status = 'published' THEN 1 ELSE 0 END) as stars_1
            ")
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        return $allProducts->map(function ($product) use ($reviewAggQuery) {
            $agg = $reviewAggQuery->get($product->id);
            $totalReviews = $agg ? (int) $agg->total_reviews : 0;
            $unseenCount = $agg ? (int) $agg->unseen_count : 0;
            $avgRating = $agg && $agg->avg_rating ? (float) round((float) $agg->avg_rating, 1) : 0.0;

            return [
                'id'                  => (int) $product->id,
                'name'                => (string) $product->name,
                'sku'                 => $product->sku,
                'selling_price'       => (float) $product->selling_price,
                'category_name'       => $product->category?->name ?? 'Uncategorized',
                'branch_name'         => $product->branch?->name ?? 'Global',
                'image_url'           => \App\Utils\ImageHelper::resolveUrl($product->image_path, 'products'),
                'total_reviews'       => $totalReviews,
                'unseen_count'        => $unseenCount,
                'average_rating'      => $avgRating,
                'rating_distribution' => [
                    '5' => $agg ? (int) $agg->stars_5 : 0,
                    '4' => $agg ? (int) $agg->stars_4 : 0,
                    '3' => $agg ? (int) $agg->stars_3 : 0,
                    '2' => $agg ? (int) $agg->stars_2 : 0,
                    '1' => $agg ? (int) $agg->stars_1 : 0,
                ],
            ];
        });
    }

    /**
     * Build the filtered reviews paginator with eager loaded relationships.
     */
    private function buildFilteredReviews(
        ?int $selectedProductId,
        ?int $userBranchId,
        string $ratingFilter,
        string $statusFilter,
        string $seenFilter,
        string $verifiedFilter,
        string $branchFilter,
        ?string $dateFrom,
        ?string $dateTo,
        string $search,
        int $perPage = 10,
        int $page = 1
    ) {
        $reviewsQuery = ProductReview::with([
            'user:id,name,email',
            'product:id,name,selling_price,image_path',
            'order:id,order_number,total_amount,status,created_at',
            'branch:id,name',
            'responder:id,name',
            'seenBy:id,name',
        ]);

        if ($userBranchId) {
            $reviewsQuery->where('branch_id', $userBranchId);
        } elseif ($branchFilter && $branchFilter !== 'all') {
            $reviewsQuery->where('branch_id', (int) $branchFilter);
        }

        if ($selectedProductId) {
            $reviewsQuery->where('product_id', $selectedProductId);
        }

        if ($statusFilter && $statusFilter !== 'all') {
            $reviewsQuery->where('status', $statusFilter);
        }

        if ($ratingFilter && $ratingFilter !== 'all') {
            $reviewsQuery->where('rating', (int) $ratingFilter);
        }

        if ($seenFilter === 'unseen') {
            $reviewsQuery->where('is_seen', false);
        } elseif ($seenFilter === 'seen') {
            $reviewsQuery->where('is_seen', true);
        }

        if ($verifiedFilter === 'verified') {
            $reviewsQuery->whereNotNull('order_id');
        } elseif ($verifiedFilter === 'unverified') {
            $reviewsQuery->whereNull('order_id');
        }

        if ($dateFrom) {
            $reviewsQuery->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $reviewsQuery->whereDate('created_at', '<=', $dateTo);
        }

        if ($search) {
            $reviewsQuery->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('user', fn($uq) => $uq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('product', fn($pq) => $pq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('order', function ($oq) use ($search) {
                        $oq->where('order_number', 'like', "%{$search}%")
                           ->orWhere('id', 'like', "%{$search}%");
                    });
            });
        }

        // Execute server-side pagination with sanitized page parameter
        $paginator = $reviewsQuery->latest('id')->paginate($perPage, ['*'], 'page', $page)->withQueryString();

        // If requested page is beyond last page (e.g. after deletion), fetch the last valid page
        if ($paginator->isEmpty() && $paginator->total() > 0 && $page > $paginator->lastPage()) {
            $paginator = $reviewsQuery->latest('id')->paginate($perPage, ['*'], 'page', $paginator->lastPage())->withQueryString();
        }

        $transformedItems = collect($paginator->items())->map(function ($review) {
            $orderNum = $review->order?->order_number ?? ($review->order_id ? "ORD-{$review->order_id}" : null);
            $productImg = $review->product?->image_path
                ? \App\Utils\ImageHelper::resolveUrl($review->product->image_path, 'products')
                : null;

            return [
                'id'                   => (int) $review->id,
                'user_id'              => (int) $review->user_id,
                'product_id'           => (int) $review->product_id,
                'order_id'             => $review->order_id ? (int) $review->order_id : null,
                'order_number'         => $orderNum,
                'branch_id'            => $review->branch_id ? (int) $review->branch_id : null,
                'rating'               => (int) $review->rating,
                'comment'              => $review->comment,
                'status'               => (string) $review->status,
                'is_seen'              => (bool) $review->is_seen,
                'seen_at'              => $review->seen_at instanceof \DateTimeInterface ? $review->seen_at->toIso8601String() : ($review->seen_at ? (string) $review->seen_at : null),
                'is_verified_purchase' => !empty($review->order_id),
                'admin_response'       => $review->admin_response,
                'admin_responded_at'   => $review->admin_responded_at instanceof \DateTimeInterface ? $review->admin_responded_at->toIso8601String() : ($review->admin_responded_at ? (string) $review->admin_responded_at : null),
                'created_at'           => $review->created_at instanceof \DateTimeInterface ? $review->created_at->toIso8601String() : ($review->created_at ? (string) $review->created_at : null),
                'user'                 => $review->user ? [
                    'id'    => (int) $review->user->id,
                    'name'  => (string) $review->user->name,
                    'email' => (string) $review->user->email,
                ] : null,
                'product'              => $review->product ? [
                    'id'         => (int) $review->product->id,
                    'name'       => (string) $review->product->name,
                    'image_path' => $productImg,
                ] : null,
                'branch'               => $review->branch ? [
                    'id'   => (int) $review->branch->id,
                    'name' => (string) $review->branch->name,
                ] : null,
                'responder'            => $review->responder ? [
                    'id'   => (int) $review->responder->id,
                    'name' => (string) $review->responder->name,
                ] : null,
                'seen_by'              => $review->seenBy ? [
                    'id'   => (int) $review->seenBy->id,
                    'name' => (string) $review->seenBy->name,
                ] : null,
            ];
        });

        return [
            'data'         => $transformedItems->values()->all(),
            'current_page' => (int) $paginator->currentPage(),
            'last_page'    => (int) $paginator->lastPage(),
            'per_page'     => (int) $paginator->perPage(),
            'total'        => (int) $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
            'links'        => $paginator->linkCollection()->toArray(),
        ];
    }

    /**
     * Compute system-wide overall review statistics.
     */
    private function buildOverallStats(?int $userBranchId, string $branchFilter, bool $isAdmin, int $totalProducts): array
    {
        $baseStatsQuery = ProductReview::query()
            ->when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))
            ->when($branchFilter && $branchFilter !== 'all' && $isAdmin, fn($q) => $q->where('branch_id', (int) $branchFilter));

        $totalReviewCount = (clone $baseStatsQuery)->count();
        $unseenReviewCount = (clone $baseStatsQuery)->where('is_seen', false)->count();
        $publishedReviewCount = (clone $baseStatsQuery)->where('status', ProductReview::STATUS_PUBLISHED)->count();
        $avgRatingAll = $publishedReviewCount > 0
            ? (float) round((float) (clone $baseStatsQuery)->where('status', ProductReview::STATUS_PUBLISHED)->avg('rating'), 1)
            : 0.0;

        return [
            'total_products'  => $totalProducts,
            'total_reviews'   => $totalReviewCount,
            'unseen_reviews'  => $unseenReviewCount,
            'average_rating'  => $avgRatingAll,
            'published_count' => $publishedReviewCount,
            'flagged_count'   => (clone $baseStatsQuery)->whereIn('status', [ProductReview::STATUS_FLAGGED, ProductReview::STATUS_PENDING])->count(),
        ];
    }

    /**
     * Mark all unseen reviews for a specific product as seen.
     */
    public function markProductReviewsSeen(Request $request, Product $product)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $isAdmin = method_exists($user, 'isAdmin') ? $user->isAdmin() : (($user->role ?? '') === 'admin');
        $userBranchId = !$isAdmin ? (int) $user->branch_id : null;

        $updatedCount = ProductReview::where('product_id', $product->id)
            ->where('is_seen', false)
            ->when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))
            ->update([
                'is_seen' => true,
                'seen_at' => now(),
                'seen_by' => $user->id,
            ]);

        return response()->json([
            'success'       => true,
            'product_id'    => $product->id,
            'updated_count' => $updatedCount,
            'message'       => "Reviews for {$product->name} marked as viewed.",
        ]);
    }

    /**
     * Mark a specific single review as seen.
     */
    public function markReviewSeen(Request $request, ProductReview $review)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $isAdmin = method_exists($user, 'isAdmin') ? $user->isAdmin() : (($user->role ?? '') === 'admin');
        if (!$isAdmin && $user->branch_id && $review->branch_id && (int) $review->branch_id !== (int) $user->branch_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized for this branch.'], 403);
        }

        $review->update([
            'is_seen' => true,
            'seen_at' => now(),
            'seen_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'review'  => [
                'id'      => $review->id,
                'is_seen' => true,
                'seen_at' => $review->seen_at?->toIso8601String(),
                'seen_by' => $user->name,
            ],
            'message' => 'Review marked as viewed.',
        ]);
    }

    /**
     * Update review status (publish, hide, flag).
     */
    public function updateStatus(Request $request, ProductReview $review)
    {
        $user = Auth::user();
        if (!$user) {
            return back()->with('error', 'Unauthenticated.');
        }

        $isAdmin = method_exists($user, 'isAdmin') ? $user->isAdmin() : (($user->role ?? '') === 'admin');
        if (!$isAdmin && $user->branch_id && $review->branch_id && (int) $review->branch_id !== (int) $user->branch_id) {
            return back()->with('error', 'Unauthorized for this branch.');
        }

        $request->validate([
            'status' => 'required|in:published,hidden,flagged,pending',
        ]);

        $review->update(['status' => $request->status]);

        return back()->with('success', "Review status changed to {$request->status}.");
    }

    /**
     * Respond to a review as admin/reviewer.
     */
    public function respond(Request $request, ProductReview $review)
    {
        $user = Auth::user();
        if (!$user) {
            return back()->with('error', 'Unauthenticated.');
        }

        $isAdmin = method_exists($user, 'isAdmin') ? $user->isAdmin() : (($user->role ?? '') === 'admin');
        if (!$isAdmin && $user->branch_id && $review->branch_id && (int) $review->branch_id !== (int) $user->branch_id) {
            return back()->with('error', 'Unauthorized for this branch.');
        }

        $request->validate([
            'response' => 'required|string|max:1000',
        ]);

        $review->update([
            'admin_response'     => $request->response,
            'admin_response_by'  => $user->id,
            'admin_responded_at' => now(),
        ]);

        return back()->with('success', 'Official response saved successfully.');
    }

    /**
     * Delete a review.
     */
    public function destroy(ProductReview $review)
    {
        $user = Auth::user();
        if (!$user) {
            return back()->with('error', 'Unauthenticated.');
        }

        $isAdmin = method_exists($user, 'isAdmin') ? $user->isAdmin() : (($user->role ?? '') === 'admin');
        if (!$isAdmin && $user->branch_id && $review->branch_id && (int) $review->branch_id !== (int) $user->branch_id) {
            return back()->with('error', 'Unauthorized for this branch.');
        }

        $review->delete();

        return back()->with('success', 'Review deleted successfully.');
    }
}
