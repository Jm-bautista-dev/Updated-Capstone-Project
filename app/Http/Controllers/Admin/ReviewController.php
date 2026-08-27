<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use App\Models\Product;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReviewController extends Controller
{
    /**
     * Display admin reviews & ratings management dashboard.
     * Shows ALL products as the master list (even with 0 reviews),
     * with seen/unseen counts, average ratings, and review details.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $isAdmin = method_exists($user, 'isAdmin') ? $user->isAdmin() : (($user->role ?? '') === 'admin');
        $userBranchId = !$isAdmin ? (int) $user->branch_id : null;

        $selectedProductId = $request->filled('product_id') && $request->product_id !== 'all'
            ? (int) $request->product_id
            : null;

        $search = $request->input('search', '');
        $ratingFilter = $request->input('rating', 'all');
        $statusFilter = $request->input('status', 'all');
        $seenFilter = $request->input('seen_status', 'all');
        $branchFilter = $isAdmin ? $request->input('branch_id', 'all') : ($userBranchId ? (string) $userBranchId : 'all');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // 1. Master Products List with review aggregations
        $productList = $this->buildProductList($userBranchId, $search, $branchFilter, $isAdmin);

        // 2. Filtered Reviews List
        $reviews = $this->buildFilteredReviews($selectedProductId, $userBranchId, $ratingFilter, $statusFilter, $seenFilter, $branchFilter, $dateFrom, $dateTo, $search);

        // 3. System-wide Overall Statistics
        $stats = $this->buildOverallStats($userBranchId, $branchFilter, $isAdmin, $productList->count());

        return Inertia::render('Admin/Reviews', [
            'productList'        => $productList,
            'reviews'            => $reviews,
            'stats'              => $stats,
            'selectedProductId'  => $selectedProductId,
            'filters'            => [
                'status'      => $statusFilter,
                'rating'      => $ratingFilter,
                'product_id'  => $selectedProductId ? (string) $selectedProductId : 'all',
                'seen_status' => $seenFilter,
                'branch_id'   => $branchFilter,
                'search'      => $search,
                'date_from'   => $dateFrom,
                'date_to'     => $dateTo,
            ],
            'branches'           => $isAdmin ? Branch::orderBy('name')->get(['id', 'name']) : Branch::where('id', $userBranchId)->get(['id', 'name']),
            'isAdmin'            => $isAdmin,
        ]);
    }

    /**
     * Build the product list with review metric aggregations.
     */
    private function buildProductList(?int $userBranchId, string $search, string $branchFilter, bool $isAdmin)
    {
        $productsQuery = Product::with(['category', 'branch'])
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

        $reviewAggQuery = ProductReview::query()
            ->when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))
            ->when($branchFilter && $branchFilter !== 'all' && $isAdmin, fn($q) => $q->where('branch_id', (int) $branchFilter))
            ->selectRaw('
                product_id,
                COUNT(*) as total_reviews,
                SUM(CASE WHEN is_seen = 0 THEN 1 ELSE 0 END) as unseen_count,
                AVG(CASE WHEN status = "published" THEN rating ELSE NULL END) as avg_rating,
                SUM(CASE WHEN rating = 5 AND status = "published" THEN 1 ELSE 0 END) as stars_5,
                SUM(CASE WHEN rating = 4 AND status = "published" THEN 1 ELSE 0 END) as stars_4,
                SUM(CASE WHEN rating = 3 AND status = "published" THEN 1 ELSE 0 END) as stars_3,
                SUM(CASE WHEN rating = 2 AND status = "published" THEN 1 ELSE 0 END) as stars_2,
                SUM(CASE WHEN rating = 1 AND status = "published" THEN 1 ELSE 0 END) as stars_1
            ')
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        return $allProducts->map(function (Product $product) use ($reviewAggQuery) {
            $agg = $reviewAggQuery->get($product->id);
            $totalReviews = $agg ? (int) $agg->total_reviews : 0;
            $unseenCount = $agg ? (int) $agg->unseen_count : 0;
            $avgRating = $agg && $agg->avg_rating ? (float) round($agg->avg_rating, 1) : 0.0;

            return [
                'id'                  => $product->id,
                'name'                => $product->name,
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
     * Build the filtered reviews paginator.
     */
    private function buildFilteredReviews(
        ?int $selectedProductId,
        ?int $userBranchId,
        string $ratingFilter,
        string $statusFilter,
        string $seenFilter,
        string $branchFilter,
        ?string $dateFrom,
        ?string $dateTo,
        string $search
    ) {
        $reviewsQuery = ProductReview::with([
            'user:id,name,email',
            'product:id,name,selling_price,image_path',
            'order:id,order_number,total_amount,status,created_at',
            'orderItem:id,quantity,price',
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

        $reviews = $reviewsQuery->latest()->paginate(20)->withQueryString();

        $reviews->getCollection()->transform(function ($review) {
            $orderNum = $review->order?->order_number ?? ($review->order_id ? "ORD-{$review->order_id}" : null);
            return [
                'id'                   => $review->id,
                'user_id'              => $review->user_id,
                'product_id'           => $review->product_id,
                'order_id'             => $review->order_id,
                'order_number'         => $orderNum,
                'branch_id'            => $review->branch_id,
                'rating'               => (int) $review->rating,
                'comment'              => $review->comment,
                'status'               => $review->status,
                'is_seen'              => (bool) $review->is_seen,
                'seen_at'              => $review->seen_at ? $review->seen_at->toIso8601String() : null,
                'is_verified_purchase' => !empty($review->order_id),
                'admin_response'       => $review->admin_response,
                'admin_responded_at'   => $review->admin_responded_at ? $review->admin_responded_at->toIso8601String() : null,
                'created_at'           => $review->created_at ? $review->created_at->toIso8601String() : null,
                'user'                 => $review->user ? ['id' => $review->user->id, 'name' => $review->user->name, 'email' => $review->user->email] : null,
                'product'              => $review->product ? ['id' => $review->product->id, 'name' => $review->product->name, 'image_path' => $review->product->image_path] : null,
                'branch'               => $review->branch ? ['id' => $review->branch->id, 'name' => $review->branch->name] : null,
                'responder'            => $review->responder ? ['id' => $review->responder->id, 'name' => $review->responder->name] : null,
                'seen_by'              => $review->seenBy ? ['id' => $review->seenBy->id, 'name' => $review->seenBy->name] : null,
            ];
        });

        return $reviews;
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
            ? (float) round((clone $baseStatsQuery)->where('status', ProductReview::STATUS_PUBLISHED)->avg('rating'), 1)
            : 0.0;

        return [
            'total_products'     => $totalProducts,
            'total_reviews'      => $totalReviewCount,
            'unseen_reviews'     => $unseenReviewCount,
            'average_rating'     => $avgRatingAll,
            'published_count'    => $publishedReviewCount,
            'flagged_count'      => (clone $baseStatsQuery)->whereIn('status', [ProductReview::STATUS_FLAGGED, ProductReview::STATUS_PENDING])->count(),
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

        $userBranchId = !$user->isAdmin() ? $user->branch_id : null;

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
            'message'       => "Reviews for {$product->name} marked as seen.",
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

        if (!$user->isAdmin() && $user->branch_id && $review->branch_id !== $user->branch_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized for this branch.'], 403);
        }

        $review->update([
            'is_seen' => true,
            'seen_at' => now(),
            'seen_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'review'  => $review->fresh(),
            'message' => 'Review marked as seen.',
        ]);
    }

    /**
     * Update review status (publish, hide, flag).
     */
    public function updateStatus(Request $request, ProductReview $review)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && $user->branch_id && $review->branch_id !== $user->branch_id) {
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
        if (!$user->isAdmin() && $user->branch_id && $review->branch_id !== $user->branch_id) {
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

        return back()->with('success', 'Response saved successfully.');
    }

    /**
     * Delete a review.
     */
    public function destroy(ProductReview $review)
    {
        $user = Auth::user();
        if (!$user->isAdmin() && $user->branch_id && $review->branch_id !== $user->branch_id) {
            return back()->with('error', 'Unauthorized for this branch.');
        }

        $review->delete();

        return back()->with('success', 'Review deleted successfully.');
    }
}
