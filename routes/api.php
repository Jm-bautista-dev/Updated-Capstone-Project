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
use App\Http\Controllers\BranchController;

// Compatibility route for mobile app (some apps hit /api/orders directly)
Route::post('orders', [ApiOrderController::class, 'store']);

// Standard non-versioned pattern
Route::middleware(['throttle:60,1', ApiResponseWrapper::class])
    ->post('mobile/login', [MobileAuthController::class, 'login']);

// ─── External Operations API (Mobile App Entry) ──────────────────
Route::prefix('v1')->group(function () {

    // ─── SAFE MOBILE API LAYER (STEP 1 & 5) ───
    Route::middleware(['throttle:60,1', ApiResponseWrapper::class])->prefix('mobile')->group(function () {
        Route::post('login', [MobileAuthController::class, 'login']);
    });

    // ─── Public Routes (no auth required) ────────────────────────────────────────
    
    // Auth
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('rider/login', [AuthController::class, 'login']);
    Route::post('send-otp', [VerificationController::class, 'sendOtp']);
    Route::post('verify-otp', [VerificationController::class, 'verifyOtp']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // Branches — public
    Route::get('branches', [BranchController::class, 'apiIndex']);

    // Public Menu
    Route::get('products',       [ProductController::class, 'index']);
    Route::get('products/{id}',  [ProductController::class, 'show']);
    Route::get('categories',     [CategoryController::class, 'index']);
    Route::get('customer/menu',  [ProductController::class, 'getUnifiedMenu']);
    Route::get('customer/products', [V1ProductController::class, 'getProductsByLocation']);

    // ─── Protected Routes (Sanctum token required) ────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        // Auth (Common for both Customers and Riders)
        Route::get('user',           [AuthController::class, 'user']);
        Route::post('logout',        [AuthController::class, 'logout']);
        Route::post('token/refresh', [AuthController::class, 'refreshToken']);

        // ─── Rider-Specific Operations (requires role:rider) ──────────────────
        Route::middleware('role:rider')->group(function () {
            Route::get('rider/orders',   [App\Http\Controllers\Api\RiderController::class, 'orders']);
            Route::get('rider/stats',    [App\Http\Controllers\Api\RiderController::class, 'stats']);
            Route::patch('rider/status', [App\Http\Controllers\Api\RiderController::class, 'updateStatus']);
            Route::post('rider/ping',    [App\Http\Controllers\Api\RiderController::class, 'ping']);
        });

        // Orders System (Customer focus)
        Route::get('orders', [ApiOrderController::class, 'index']);
        Route::post('orders', [ApiOrderController::class, 'store']);
        Route::get('orders/{id}', [ApiOrderController::class, 'show']);

        // Cart System
        Route::get('cart', [CartController::class, 'index']);
        Route::post('cart/validate', [CartController::class, 'validate']);
        Route::post('cart/add', [CartController::class, 'addItem']);
        Route::put('cart/items/{itemId}', [CartController::class, 'updateItem']);
        Route::delete('cart/items/{itemId}', [CartController::class, 'removeItem']);
        Route::delete('cart/clear', [CartController::class, 'clear']);

        // Branch location update
        Route::patch('branches/{id}/location', [BranchController::class, 'updateLocation']);

        // Notifications
        Route::get('notifications', [App\Http\Controllers\NotificationController::class, 'index']);
        Route::post('notifications/mark-as-read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);

        // Rider Operations (also accessible here for compatibility)
        Route::patch('rider/status', [App\Http\Controllers\Api\RiderController::class, 'updateStatus']);
        Route::post('rider/ping', [App\Http\Controllers\Api\RiderController::class, 'ping']);
    });
});


/*
|--------------------------------------------------------------------------
| API Route Summary
|--------------------------------------------------------------------------
|
| Public:
|   POST  /api/v1/register   → Register a new user (returns token)
|   POST  /api/v1/login      → Login (returns token)
|
| Protected (Bearer token required):
|   GET   /api/v1/user                  → Get authenticated user
|   POST  /api/v1/logout                → Revoke token
|   GET   /api/v1/products              → List products (?category_id=&search=&branch_id=)
|   GET   /api/v1/products/{id}         → Single product detail
|   GET   /api/v1/categories            → List categories (?branch_id=&search=)
|
*/

// ─── Customer App Shorthand Aliases ──────────────────────────────────────────
Route::prefix('customer')->group(function () {
    Route::get('categories', [\App\Http\Controllers\Customer\CategoryController::class, 'index']);
    Route::get('products',   [\App\Http\Controllers\Customer\ProductController::class, 'index']);
});
