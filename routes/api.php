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
use App\Http\Controllers\Api\CustomerOrderController;

// Direct Top-Picks & Branches API endpoints
Route::get('top-picks', [TopPickController::class, 'index']);
Route::get('branches',  [BranchController::class, 'apiIndex']);
Route::post('pos/calculate-delivery-distance', [App\Http\Controllers\Api\PosDeliveryDistanceController::class, 'calculate']);

// External Operations API (Mobile App Entry)
Route::prefix('v1')->group(function () {

    // Public Routes (no auth required)
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('rider/login', [AuthController::class, 'login']);
    Route::post('send-otp', [VerificationController::class, 'sendOtp']);
    Route::post('verify-otp', [VerificationController::class, 'verifyOtp']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // Public System Status & Maintenance API
    Route::get('system/status', [App\Http\Controllers\Api\SystemStatusController::class, 'status']);
    Route::get('system/health', [App\Http\Controllers\Api\SystemStatusController::class, 'status']);

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
        
        // Profile & User Management
        Route::get('user', [UserController::class, 'me']);
        Route::match(['patch', 'put', 'post'], 'user', [UserController::class, 'update']);
        Route::match(['patch', 'put', 'post'], 'user/password', [UserController::class, 'updatePassword']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('token/refresh', [AuthController::class, 'refreshToken']);

        // Direct Rider Orders Aliases
        Route::get('orders/ready', [RiderController::class, 'getOrders']);
        Route::get('orders/my',    [RiderController::class, 'getMyOrders']);

        // Rider Module
        Route::prefix('rider')->group(function () {
            // First-login password change
            Route::post('change-password', [RiderController::class, 'changePassword']);

            // Status & Heartbeat
            Route::match(['patch', 'put', 'post'], 'status', [RiderController::class, 'updateStatus']);
            Route::post('ping',    [RiderController::class, 'ping']);
            Route::get('stats',    [RiderController::class, 'getStats']);

            // GPS location ping (fires every 5-10s while rider is active)
            Route::post('location', [RiderController::class, 'updateLocation']);

            // Order Feed Tabs & History
            Route::get('available-deliveries', [RiderController::class, 'availableDeliveries']); // Available jobs (ready_for_pickup)
            Route::get('orders',               [RiderController::class, 'getOrders']);          // Available (ready_for_pickup)
            Route::get('my-orders',            [RiderController::class, 'getMyOrders']);        // Active (assigned/picking/transit)
            Route::get('completed-orders',     [RiderController::class, 'getCompletedOrders']); // Done (paginated)
            Route::get('history',              [RiderController::class, 'getCompletedOrders']); // Alias
            Route::get('transactions',         [RiderController::class, 'getCompletedOrders']);
            Route::get('past-transactions',    [RiderController::class, 'getCompletedOrders']);
            Route::get('stats',                [RiderController::class, 'getStats']);
            // Cancellation Requests for Rider
            Route::get('cancellation-requests', [App\Http\Controllers\Api\CancellationRequestController::class, 'riderRequests']);

            // WORKFLOW ENDPOINTS (Both strict actions and generic status transitions)
            Route::post('deliveries/{id}/accept',     [RiderController::class, 'acceptOrder']);
            Route::post('orders/{id}/accept',         [RiderController::class, 'acceptOrder']);
            Route::post('accept/{id}',                [RiderController::class, 'acceptOrder']);
            Route::post('orders/{id}/pickup',         [RiderController::class, 'pickupOrder']);
            Route::post('pickup/{id}',                [RiderController::class, 'pickupOrder']);
            Route::post('deliveries/{id}/pickup',     [RiderController::class, 'pickupOrder']);
            Route::post('orders/{id}/transit',        [RiderController::class, 'startTransit']);
            Route::post('orders/{id}/start-transit',  [RiderController::class, 'startTransit']);
            Route::post('transit/{id}',               [RiderController::class, 'startTransit']);
            Route::post('deliveries/{id}/transit',    [RiderController::class, 'startTransit']);
            Route::post('orders/{id}/deliver',        [RiderController::class, 'deliverOrder']);
            Route::post('orders/{id}/delivered',      [RiderController::class, 'deliverOrder']);
            Route::post('deliver/{id}',               [RiderController::class, 'deliverOrder']);
            Route::post('deliveries/{id}/deliver',    [RiderController::class, 'deliverOrder']);
            Route::post('orders/{id}/reject',         [RiderController::class, 'rejectOrder']);
            Route::post('reject/{id}',                [RiderController::class, 'rejectOrder']);
            Route::post('orders/{id}/cancel',         [RiderController::class, 'cancelOrder']);
            Route::post('orders/{id}/cancel-request', [RiderController::class, 'cancelOrder']);

            // Generic status updates for older APK versions
            Route::match(['post', 'patch', 'put'], 'orders/{id}/status', [RiderController::class, 'updateOrderStatus']);
            Route::match(['post', 'patch', 'put'], 'orders/{id}/update-status', [RiderController::class, 'updateOrderStatus']);
            Route::match(['post', 'patch', 'put'], 'deliveries/{id}/status', [RiderController::class, 'updateOrderStatus']);
            Route::match(['post', 'patch', 'put'], 'deliveries/{id}/update-status', [RiderController::class, 'updateOrderStatus']);
        });

        // Cancellation Requests (Cashier/Admin Approval)
        Route::get('cancellation-requests/pending', [App\Http\Controllers\Api\CancellationRequestController::class, 'pending']);
        Route::post('cancellation-requests/{id}/accept', [App\Http\Controllers\Api\CancellationRequestController::class, 'accept']);
        Route::post('cancellation-requests/{id}/reject', [App\Http\Controllers\Api\CancellationRequestController::class, 'reject']);
        Route::post('cancellation-requests/{id}/resolve', [App\Http\Controllers\Api\CancellationRequestController::class, 'resolve']);
        Route::post('pos/cancellation-requests/{id}/resolve', [App\Http\Controllers\Api\CancellationRequestController::class, 'resolve']);
        Route::post('pos/calculate-delivery-distance', [App\Http\Controllers\Api\PosDeliveryDistanceController::class, 'calculate']);

        // POS / Branch Manager Routes
        Route::prefix('branch')->group(function () {
            Route::post('cancellation-requests/{id}/reject', [App\Http\Controllers\Api\Branch\CancellationRequestController::class, 'reject']);
            Route::post('cancellation-requests/{id}/approve', [App\Http\Controllers\Api\Branch\CancellationRequestController::class, 'approve']);
        });

        // Rider Cancellation Requests Ledger
        Route::get('rider/cancellation-requests', [App\Http\Controllers\Api\Rider\RiderDeliveryController::class, 'cancellationRequests']);

        // Deliveries Live Tracking
        Route::get('deliveries/live-riders', [App\Http\Controllers\Admin\DeliveryController::class, 'getLiveRiderLocations']);

        // Orders & Cart & Live Tracking & Road Routing
        // Rider order alias endpoints (prevent collision with orders/{id})
        Route::get('orders/ready',     [RiderController::class, 'getOrders']);
        Route::get('orders/pickup',    [RiderController::class, 'getOrders']);
        Route::get('orders/pending',   [RiderController::class, 'getOrders']);
        Route::get('orders/my',        [RiderController::class, 'getMyOrders']);
        Route::get('orders/assigned',  [RiderController::class, 'getMyOrders']);
        Route::get('orders/active',    [RiderController::class, 'getMyOrders']);
        Route::get('orders/completed', [RiderController::class, 'getCompletedOrders']);
        Route::get('orders/history',   [RiderController::class, 'getCompletedOrders']);

        Route::get('orders', [ApiOrderController::class, 'index']);
        Route::get('customer/orders', [ApiOrderController::class, 'index']);
        Route::post('orders', [ApiOrderController::class, 'store']);
        Route::post('customer/orders', [ApiOrderController::class, 'store']);
        Route::get('orders/{id}', [ApiOrderController::class, 'show'])->whereNumber('id');
        // Customer-scoped order detail (strict user_id scope + full Buy Again snapshots)
        Route::get('customer/orders/{id}', [CustomerOrderController::class, 'show'])->whereNumber('id');
        Route::get('orders/{id}/tracking', [ApiOrderController::class, 'tracking'])->whereNumber('id');
        Route::get('customer/orders/{id}/tracking', [ApiOrderController::class, 'tracking'])->whereNumber('id');
        Route::get('orders/{id}/route', [ApiOrderController::class, 'route'])->whereNumber('id');
        Route::get('customer/orders/{id}/route', [ApiOrderController::class, 'route'])->whereNumber('id');
        Route::post('orders/{orderId}/cancel', [CustomerOrderController::class, 'cancel']);
        Route::post('customer/orders/{orderId}/cancel', [CustomerOrderController::class, 'cancel']);
        // Buy Again / Reorder validation
        Route::post('customer/orders/{id}/reorder-check', [CustomerOrderController::class, 'checkReorder'])->whereNumber('id');
        Route::get('deliveries/{id}/route', [App\Http\Controllers\Admin\DeliveryController::class, 'getRoute']);
        Route::get('cart', [CartController::class, 'index']);
        Route::post('cart/add', [CartController::class, 'addItem']);
        Route::delete('cart/clear', [CartController::class, 'clear']);
        Route::post('cart/validate', [CartController::class, 'validate']);
        
        // Product Reviews & Ratings (Customer)
        Route::get('customer/eligible-reviews', [App\Http\Controllers\Api\ReviewController::class, 'getEligibleReviews']);
        Route::get('customer/reviews', [App\Http\Controllers\Api\ReviewController::class, 'getCustomerReviews']);
        Route::post('reviews', [App\Http\Controllers\Api\ReviewController::class, 'store']);
        Route::put('reviews/{id}', [App\Http\Controllers\Api\ReviewController::class, 'update']);

        // Notifications (legacy Laravel model notifications)
        Route::get('notifications', [App\Http\Controllers\NotificationController::class, 'index']);
        Route::post('notifications/mark-as-read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);

        // ── Customer Push Notification Device Tokens ──
        Route::post('customer/device-token',          [App\Http\Controllers\Api\CustomerNotificationController::class, 'registerDeviceToken']);
        Route::post('notifications/push-token',        [App\Http\Controllers\Api\CustomerNotificationController::class, 'registerDeviceToken']);
        Route::post('notifications/push-token/remove', [App\Http\Controllers\Api\CustomerNotificationController::class, 'removeDeviceToken']);

        // ── Customer Notification Ledger ──
        Route::get('customer/notifications',                     [App\Http\Controllers\Api\CustomerNotificationController::class, 'index']);
        Route::get('customer/notifications/unread-count',        [App\Http\Controllers\Api\CustomerNotificationController::class, 'unreadCount']);
        Route::post('customer/notifications/read-all',           [App\Http\Controllers\Api\CustomerNotificationController::class, 'markAllAsRead']);
        Route::post('customer/notifications/{id}/read',          [App\Http\Controllers\Api\CustomerNotificationController::class, 'markAsRead']);
    });
});

// Staff & Admin Offline & Barcode Sync Module
Route::middleware(['auth:sanctum,web'])->group(function () {
    Route::post('transactions/sale', [App\Http\Controllers\Api\SyncApiController::class, 'storeSale']);
    Route::post('inventory/update', [App\Http\Controllers\Api\SyncApiController::class, 'updateInventory']);
    Route::post('restock/request', [App\Http\Controllers\Api\SyncApiController::class, 'requestRestock']);
    Route::post('sync', [App\Http\Controllers\Api\SyncApiController::class, 'sync']);
    
    // Receipt-based Inventory Scanner endpoints
    Route::post('receipts/upload', [App\Http\Controllers\Api\ReceiptController::class, 'upload']);
    Route::post('receipts/process', [App\Http\Controllers\Api\ReceiptController::class, 'process']);
    Route::post('receipts/confirm-stock-in', [App\Http\Controllers\Api\ReceiptController::class, 'stockIn']);
    Route::get('receipts/history', [App\Http\Controllers\Api\ReceiptController::class, 'history']);
    Route::get('receipts/{id}', [App\Http\Controllers\Api\ReceiptController::class, 'show']);
    Route::post('inventory/stock-in', [App\Http\Controllers\Api\ReceiptController::class, 'stockIn']);
});

// ── POS / Branch Manager Routes ──
Route::middleware(['auth:sanctum,web'])->prefix('branch')->group(function () {
    Route::post('cancellation-requests/{id}/reject', [App\Http\Controllers\Api\Branch\CancellationRequestController::class, 'reject']);
    Route::post('cancellation-requests/{id}/approve', [App\Http\Controllers\Api\Branch\CancellationRequestController::class, 'approve']);
});

// ── Rider Routes (v1 & non-v1 aliases) ──
Route::middleware(['auth:sanctum,web'])->prefix('rider')->group(function () {
    Route::post('change-password', [RiderController::class, 'changePassword']);
    Route::patch('status', [RiderController::class, 'updateStatus']);
    Route::post('ping',    [RiderController::class, 'ping']);
    Route::get('stats',    [RiderController::class, 'getStats']);
    Route::post('location', [RiderController::class, 'updateLocation']);

    Route::get('available-deliveries', [RiderController::class, 'availableDeliveries']);
    Route::get('orders',               [RiderController::class, 'getOrders']);
    Route::get('my-orders',            [RiderController::class, 'getMyOrders']);
    Route::get('completed-orders',     [RiderController::class, 'getCompletedOrders']);
    Route::get('history',              [RiderController::class, 'getCompletedOrders']);
    Route::post('deliveries/{id}/accept',     [RiderController::class, 'acceptOrder']);
    Route::post('orders/{id}/accept',         [RiderController::class, 'acceptOrder']);
    Route::post('accept/{id}',                [RiderController::class, 'acceptOrder']);
    Route::post('orders/{id}/pickup',         [RiderController::class, 'pickupOrder']);
    Route::post('pickup/{id}',                [RiderController::class, 'pickupOrder']);
    Route::post('deliveries/{id}/pickup',     [RiderController::class, 'pickupOrder']);
    Route::post('orders/{id}/transit',        [RiderController::class, 'startTransit']);
    Route::post('orders/{id}/start-transit',  [RiderController::class, 'startTransit']);
    Route::post('transit/{id}',               [RiderController::class, 'startTransit']);
    Route::post('deliveries/{id}/transit',    [RiderController::class, 'startTransit']);
    Route::post('orders/{id}/deliver',        [RiderController::class, 'deliverOrder']);
    Route::post('orders/{id}/delivered',      [RiderController::class, 'deliverOrder']);
    Route::post('deliver/{id}',               [RiderController::class, 'deliverOrder']);
    Route::post('deliveries/{id}/deliver',    [RiderController::class, 'deliverOrder']);
    Route::post('orders/{id}/reject',         [RiderController::class, 'rejectOrder']);
    Route::post('reject/{id}',                [RiderController::class, 'rejectOrder']);
    Route::post('orders/{id}/cancel',         [RiderController::class, 'cancelOrder']);
    Route::post('orders/{id}/cancel-request', [RiderController::class, 'cancelOrder']);

    // Generic status updates for older APK versions
    Route::match(['post', 'patch', 'put'], 'orders/{id}/status', [RiderController::class, 'updateOrderStatus']);
    Route::match(['post', 'patch', 'put'], 'orders/{id}/update-status', [RiderController::class, 'updateOrderStatus']);
    Route::match(['post', 'patch', 'put'], 'deliveries/{id}/status', [RiderController::class, 'updateOrderStatus']);
    Route::match(['post', 'patch', 'put'], 'deliveries/{id}/update-status', [RiderController::class, 'updateOrderStatus']);

    Route::get('cancellation-requests', [App\Http\Controllers\Api\Rider\RiderDeliveryController::class, 'cancellationRequests']);

    // ── RiderCancellationController aliases (Master Prompt routes) ──
    Route::post('orders/{id}/cancel-request', [App\Http\Controllers\Api\RiderCancellationController::class, 'requestCancellation']);
});

// ── POS Cancellation Routes (Master Prompt) ──
Route::middleware(['auth:sanctum,web'])->
    prefix('pos')->group(function () {
    Route::post('cancellation-requests/{id}/resolve', [App\Http\Controllers\Api\POSCancellationController::class, 'resolve']);
    Route::post('cancellation-requests/{id}/approve', [App\Http\Controllers\Api\POSCancellationController::class, 'approve']);
    Route::post('cancellation-requests/{id}/reject',  [App\Http\Controllers\Api\POSCancellationController::class, 'reject']);
    Route::post('calculate-delivery-distance', [App\Http\Controllers\Api\PosDeliveryDistanceController::class, 'calculate']);
});

// ── Non-v1 Order & User Aliases ──
Route::middleware(['auth:sanctum,web'])->group(function () {
    Route::get('user',             [UserController::class, 'me']);
    Route::get('orders/ready',     [RiderController::class, 'getOrders']);
    Route::get('orders/pickup',    [RiderController::class, 'getOrders']);
    Route::get('orders/pending',   [RiderController::class, 'getOrders']);
    Route::get('orders/my',        [RiderController::class, 'getMyOrders']);
    Route::get('orders/assigned',  [RiderController::class, 'getMyOrders']);
    Route::get('orders/active',    [RiderController::class, 'getMyOrders']);
    Route::get('orders/completed', [RiderController::class, 'getCompletedOrders']);
    Route::get('orders/history',   [RiderController::class, 'getCompletedOrders']);
});
