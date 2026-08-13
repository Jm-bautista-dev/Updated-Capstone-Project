<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReviewController extends Controller
{
    /**
     * GET /api/v1/products/{id}/reviews
     * Public endpoint: Get product rating stats & paginated reviews.
     */
    public function getProductReviews(Request $request, $productId): JsonResponse
    {
        try {
            $product = Product::findOrFail($productId);

            $reviews = ProductReview::with('user:id,name')
                ->where('product_id', $product->id)
                ->published()
                ->latest()
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => [
                    'product_id'          => $product->id,
                    'product_name'        => $product->name,
                    'average_rating'      => $product->average_rating,
                    'review_count'        => $product->review_count,
                    'rating_distribution' => $product->rating_distribution,
                    'reviews'             => collect($reviews->items())->map(fn($r) => [
                        'id'             => $r->id,
                        'customer_name'  => $r->user?->name ?? 'Verified Customer',
                        'rating'         => $r->rating,
                        'comment'        => $r->comment,
                        'admin_response' => $r->admin_response,
                        'created_at'     => $r->created_at?->toIso8601String(),
                    ]),
                    'pagination' => [
                        'current_page' => $reviews->currentPage(),
                        'last_page'    => $reviews->lastPage(),
                        'total'        => $reviews->total(),
                    ],
                ]
            ]);
        } catch (\Throwable $e) {
            Log::error('API getProductReviews error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Product not found.'], 404);
        }
    }

    /**
     * GET /api/v1/customer/eligible-reviews
     * Protected endpoint: List products from customer's DELIVERED orders that can be rated.
     */
    public function getEligibleReviews(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Fetch delivered order items for this customer
            $deliveredOrderItems = OrderItem::with(['order:id,status,created_at', 'product:id,name,selling_price,image_path'])
                ->whereHas('order', function ($q) use ($user) {
                    $q->where('user_id', $user->id)->where('status', 'delivered');
                })
                ->latest()
                ->get();

            // Map each item to see if it's already reviewed
            $reviewedItemIds = ProductReview::where('user_id', $user->id)
                ->pluck('order_item_id')
                ->toArray();

            $data = $deliveredOrderItems->map(function ($item) use ($reviewedItemIds) {
                $isReviewed = in_array($item->id, $reviewedItemIds);
                $review = $isReviewed ? ProductReview::where('order_item_id', $item->id)->first() : null;

                return [
                    'order_item_id' => $item->id,
                    'order_id'      => $item->order_id,
                    'product_id'    => $item->product_id,
                    'product_name'  => $item->product?->name ?? 'Product',
                    'image_url'     => $item->product?->image_url,
                    'quantity'      => $item->quantity,
                    'price'         => (float) $item->price,
                    'delivered_at'  => $item->order?->created_at?->toIso8601String(),
                    'is_reviewed'   => $isReviewed,
                    'review'        => $review ? [
                        'id'         => $review->id,
                        'rating'     => $review->rating,
                        'comment'    => $review->comment,
                        'created_at' => $review->created_at?->toIso8601String(),
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $data,
            ]);
        } catch (\Throwable $e) {
            Log::error('API getEligibleReviews error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch eligible products.'], 500);
        }
    }

    /**
     * POST /api/v1/reviews
     * Protected endpoint: Submit a review for a verified purchase.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'order_id'      => 'required|exists:orders,id',
            'order_item_id' => 'required|exists:order_items,id',
            'product_id'    => 'required|exists:products,id',
            'rating'        => 'required|integer|min:1|max:5',
            'comment'       => 'nullable|string|max:1000',
        ]);

        try {
            // ── VERIFIED PURCHASE GUARD 1: Order Ownership ──────────────────
            $order = Order::where('id', $validated['order_id'])
                ->where('user_id', $user->id)
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: You can only review products from your own orders.',
                ], 403);
            }

            // ── VERIFIED PURCHASE GUARD 2: Terminal Delivered Status ─────────
            if ($order->status !== 'delivered') {
                return response()->json([
                    'success' => false,
                    'message' => "Only completed (delivered) orders can be reviewed. Current status is '{$order->status}'.",
                ], 422);
            }

            // ── VERIFIED PURCHASE GUARD 3: Order Item Match ──────────────────
            $orderItem = OrderItem::where('id', $validated['order_item_id'])
                ->where('order_id', $order->id)
                ->where('product_id', $validated['product_id'])
                ->first();

            if (!$orderItem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order item mismatch: This product was not found in the specified order.',
                ], 422);
            }

            // ── ONE REVIEW PER PURCHASE (Update or Create) ────────────────────
            $review = ProductReview::updateOrCreate(
                ['order_item_id' => $orderItem->id],
                [
                    'user_id'    => $user->id,
                    'product_id' => $validated['product_id'],
                    'order_id'   => $order->id,
                    'branch_id'  => $order->branch_id,
                    'rating'     => (int) $validated['rating'],
                    'comment'    => $validated['comment'] ?? null,
                    'status'     => ProductReview::STATUS_PUBLISHED,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Thank you! Your review has been submitted successfully.',
                'data'    => [
                    'id'            => $review->id,
                    'product_id'    => $review->product_id,
                    'order_id'      => $review->order_id,
                    'order_item_id' => $review->order_item_id,
                    'rating'        => $review->rating,
                    'comment'       => $review->comment,
                    'status'        => $review->status,
                    'created_at'    => $review->created_at?->toIso8601String(),
                ]
            ], 201);
        } catch (\Throwable $e) {
            Log::error('API Review store error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to submit review.'], 500);
        }
    }

    /**
     * PUT /api/v1/reviews/{id}
     * Protected endpoint: Edit customer's own review.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        try {
            /** @var ProductReview $review */
            $review = ProductReview::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $review->update([
                'rating'  => (int) $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Review updated successfully.',
                'data'    => [
                    'id'         => $review->id,
                    'rating'     => $review->rating,
                    'comment'    => $review->comment,
                    'updated_at' => $review->updated_at?->toIso8601String(),
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Review not found or unauthorized.'], 404);
        }
    }

    /**
     * GET /api/v1/customer/reviews
     * Protected endpoint: Retrieve all reviews submitted by the customer.
     */
    public function getCustomerReviews(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $reviews = ProductReview::with(['product:id,name,selling_price,image_path', 'order:id,created_at'])
                ->where('user_id', $user->id)
                ->latest()
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => collect($reviews->items())->map(fn($r) => [
                    'id'             => $r->id,
                    'product_id'     => $r->product_id,
                    'product_name'   => $r->product?->name,
                    'product_image'  => $r->product?->image_url,
                    'order_id'       => $r->order_id,
                    'rating'         => $r->rating,
                    'comment'        => $r->comment,
                    'status'         => $r->status,
                    'admin_response' => $r->admin_response,
                    'created_at'     => $r->created_at?->toIso8601String(),
                ]),
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'last_page'    => $reviews->lastPage(),
                    'total'        => $reviews->total(),
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch reviews.'], 500);
        }
    }
}
