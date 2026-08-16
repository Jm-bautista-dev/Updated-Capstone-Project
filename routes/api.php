<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\MobileAuthController;
use App\Http\Middleware\ApiResponseWrapper;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\V1\ProductController as V1ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\VerificationController;
use App\Http\Controllers\Api\ApiOrderController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RiderController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\Api\DeliveryFeeController;
use App\Http\Controllers\Api\TopPickController;

// Direct Top-Picks API endpoint
Route::get('top-picks', [TopPickController::class, 'index']);

// External Operations API (Mobile App Entry)
Route::prefix('v1')->group(function () {

    // Public Routes (no auth required)
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('rider/login', [AuthController::class, 'login']);
    Route::post('send-otp', [VerificationController::class, 'sendOtp']);
    Route::post('verify-otp', [VerificationController::class, 'verifyOtp']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // Public Data & Top Picks
    Route::get('top-picks',      [TopPickController::class, 'index']);
    Route::get('branches',       [BranchController::class, 'apiIndex']);
    Route::get('products',       [ProductController::class, 'index']);
    Route::get('categories',     [CategoryController::class, 'index']);
    Route::get('customer/menu',  [ProductController::class, 'getUnifiedMenu']);
    Route::get('customer/products', [V1ProductController::class, 'getProductsByLocation']);
    
    // Delivery & Reviews (Public)
    Route::post('delivery/check-fee', [DeliveryFeeController::class, 'checkFee']);
    Route::get('products/{id}/reviews', [App\Http\Controllers\Api\ReviewController::class, 'getProductReviews']);

    // Protected Routes (Multi-Auth Support)
    Route::middleware('auth:sanctum')->group(function () {
        
        // Profile
        Route::get('user', [UserController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('token/refresh', [AuthController::class, 'refreshToken']);

        // Rider Module
        Route::prefix('rider')->group(function () {
            // First-login password change
            Route::post('change-password', [RiderController::class, 'changePassword']);

            // Status & Heartbeat
            Route::patch('status', [RiderController::class, 'updateStatus']);
            Route::post('ping',    [RiderController::class, 'ping']);
            Route::get('stats',    [RiderController::class, 'getStats']);

            // GPS location ping (fires every 5-10s while rider is active)
            Route::post('location', [RiderController::class, 'updateLocation']);

            // Order Feed Tabs
            Route::get('orders',           [RiderController::class, 'getOrders']);          // Available (ready_for_pickup)
            Route::get('my-orders',        [RiderController::class, 'getMyOrders']);        // Active (assigned/picking/transit)
            Route::get('completed-orders', [RiderController::class, 'getCompletedOrders']); // Done (paginated)

            // STRICT WORKFLOW ENDPOINTS
            Route::post('orders/{id}/accept',  [RiderController::class, 'acceptOrder']);  // assigned_to_rider
            Route::post('orders/{id}/pickup',  [RiderController::class, 'pickupOrder']);  // picked_up
            Route::post('orders/{id}/transit', [RiderController::class, 'startTransit']); // in_transit
            Route::post('orders/{id}/deliver', [RiderController::class, 'deliverOrder']); // delivered + proof upload
            Route::post('orders/{id}/reject',  [RiderController::class, 'rejectOrder']);  // back to ready_for_pickup
            Route::post('orders/{id}/cancel',  [RiderController::class, 'cancelOrder']);  // fully cancelled
        });

        // Deliveries Live Tracking
        Route::get('deliveries/live-riders', [App\Http\Controllers\Admin\DeliveryController::class, 'getLiveRiderLocations']);

        // Orders & Cart & Live Tracking
        Route::get('orders', [ApiOrderController::class, 'index']);
        Route::post('orders', [ApiOrderController::class, 'store']);
        Route::get('orders/{id}', [ApiOrderController::class, 'show']);
        Route::get('orders/{id}/tracking', [ApiOrderController::class, 'tracking']);
        Route::get('customer/orders/{id}/tracking', [ApiOrderController::class, 'tracking']);
        Route::get('cart', [CartController::class, 'index']);
        Route::post('cart/add', [CartController::class, 'addItem']);
        Route::delete('cart/clear', [CartController::class, 'clear']);
        Route::post('cart/validate', [CartController::class, 'validate']);
        
        // Product Reviews & Ratings (Customer)
        Route::get('customer/eligible-reviews', [App\Http\Controllers\Api\ReviewController::class, 'getEligibleReviews']);
        Route::get('customer/reviews', [App\Http\Controllers\Api\ReviewController::class, 'getCustomerReviews']);
        Route::post('reviews', [App\Http\Controllers\Api\ReviewController::class, 'store']);
        Route::put('reviews/{id}', [App\Http\Controllers\Api\ReviewController::class, 'update']);

        // Notifications
        Route::get('notifications', [App\Http\Controllers\NotificationController::class, 'index']);
        Route::post('notifications/mark-as-read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);
    });
});

// Staff & Admin Offline & Barcode Sync Module
Route::middleware('auth:sanctum')->group(function () {
    Route::post('transactions/sale', [App\Http\Controllers\Api\SyncApiController::class, 'storeSale']);
    Route::post('inventory/update', [App\Http\Controllers\Api\SyncApiController::class, 'updateInventory']);
    Route::post('restock/request', [App\Http\Controllers\Api\SyncApiController::class, 'requestRestock']);
    Route::post('sync', [App\Http\Controllers\Api\SyncApiController::class, 'sync']);
    
    // Receipt-based Inventory Scanner endpoints
    Route::post('receipts/upload', [App\Http\Controllers\Api\ReceiptController::class, 'upload']);
    Route::post('receipts/process', [App\Http\Controllers\Api\ReceiptController::class, 'process']);
    Route::post('inventory/stock-in', [App\Http\Controllers\Api\ReceiptController::class, 'stockIn']);
});
