<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use App\Models\Product;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReviewController extends Controller
{
    /**
     * Display admin reviews & ratings management dashboard.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = ProductReview::with([
            'user:id,name,email',
            'product:id,name,selling_price,image_path',
            'order:id,total_amount,status,created_at',
            'orderItem:id,quantity,price',
            'branch:id,name',
            'responder:id,name',
        ]);

        // Branch Isolation for cashiers
        if (!$user->isAdmin() && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filters
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('rating') && $request->rating !== 'all') {
            $query->where('rating', (int) $request->rating);
        }

        if ($request->filled('product_id') && $request->product_id !== 'all') {
            $query->where('product_id', (int) $request->product_id);
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $query->where('branch_id', (int) $request->branch_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('user', fn($uq) => $uq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('product', fn($pq) => $pq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('order', fn($oq) => $oq->where('id', 'like', "%{$search}%"));
            });
        }

        // Pagination
        $reviews = $query->latest()->paginate(25)->withQueryString();

        // System-wide Review Statistics
        $baseQuery = ProductReview::query();
        if (!$user->isAdmin() && $user->branch_id) {
            $baseQuery->where('branch_id', $user->branch_id);
        }

        $totalCount = (clone $baseQuery)->count();
        $publishedCount = (clone $baseQuery)->where('status', ProductReview::STATUS_PUBLISHED)->count();
        $avgRating = $publishedCount > 0 ? (float) round((clone $baseQuery)->where('status', ProductReview::STATUS_PUBLISHED)->avg('rating'), 1) : 0.0;
        
        $fiveStarCount = (clone $baseQuery)->where('rating', 5)->count();
        $fourStarCount = (clone $baseQuery)->where('rating', 4)->count();
        $threeStarCount = (clone $baseQuery)->where('rating', 3)->count();
        $twoStarCount = (clone $baseQuery)->where('rating', 2)->count();
        $oneStarCount = (clone $baseQuery)->where('rating', 1)->count();

        $flaggedCount = (clone $baseQuery)->whereIn('status', [ProductReview::STATUS_FLAGGED, ProductReview::STATUS_PENDING])->count();

        $distribution = [
            '5' => [
                'count' => $fiveStarCount,
                'percentage' => $totalCount > 0 ? (int) round(($fiveStarCount / $totalCount) * 100) : 0,
            ],
            '4' => [
                'count' => $fourStarCount,
                'percentage' => $totalCount > 0 ? (int) round(($fourStarCount / $totalCount) * 100) : 0,
            ],
            '3' => [
                'count' => $threeStarCount,
                'percentage' => $totalCount > 0 ? (int) round(($threeStarCount / $totalCount) * 100) : 0,
            ],
            '2' => [
                'count' => $twoStarCount,
                'percentage' => $totalCount > 0 ? (int) round(($twoStarCount / $totalCount) * 100) : 0,
            ],
            '1' => [
                'count' => $oneStarCount,
                'percentage' => $totalCount > 0 ? (int) round(($oneStarCount / $totalCount) * 100) : 0,
            ],
        ];

        $stats = [
            'average_rating' => $avgRating,
            'total_reviews'  => $totalCount,
            'five_star'      => $fiveStarCount,
            'one_star'       => $oneStarCount,
            'flagged'        => $flaggedCount,
            'distribution'   => $distribution,
        ];

        return Inertia::render('Admin/Reviews', [
            'reviews'    => $reviews,
            'stats'      => $stats,
            'filters'    => $request->only(['status', 'rating', 'product_id', 'branch_id', 'search']),
            'products'   => Product::orderBy('name')->get(['id', 'name']),
            'branches'   => Branch::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update review status (publish, hide, flag).
     */
    public function updateStatus(Request $request, ProductReview $review)
    {
        $request->validate([
            'status' => 'required|in:published,hidden,flagged,pending',
        ]);

        $review->update(['status' => $request->status]);

        return back()->with('success', "Review status changed to {$request->status}.");
    }

    /**
     * Respond to a review as admin.
     */
    public function respond(Request $request, ProductReview $review)
    {
        $request->validate([
            'response' => 'required|string|max:1000',
        ]);

        $review->update([
            'admin_response'      => $request->response,
            'admin_response_by'   => Auth::id(),
            'admin_responded_at'  => now(),
        ]);

        return back()->with('success', 'Response saved successfully.');
    }

    /**
     * Delete a review.
     */
    public function destroy(ProductReview $review)
    {
        $review->delete();

        return back()->with('success', 'Review deleted successfully.');
    }
}
