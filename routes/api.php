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

// ─── External Operations API (Mobile App Entry) ──────────────────
Route::prefix('v1')->group(function () {

    // ─── Public Routes (no auth required) ──────────────────
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('rider/login', [AuthController::class, 'login']);
    Route::post('send-otp', [VerificationController::class, 'sendOtp']);
    Route::post('verify-otp', [VerificationController::class, 'verifyOtp']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // Public Data
    Route::get('branches', [BranchController::class, 'apiIndex']);
    Route::get('products',       [ProductController::class, 'index']);
    Route::get('categories',     [CategoryController::class, 'index']);
    Route::get('customer/menu',  [ProductController::class, 'getUnifiedMenu']);
    Route::get('customer/products', [V1ProductController::class, 'getProductsByLocation']);

    // ─── Protected Routes (Multi-Auth Support) ──────────────────
    Route::middleware('auth:sanctum')->group(function () {
        
        // Profile
        Route::get('user', [UserController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('token/refresh', [AuthController::class, 'refreshToken']);

        // Rider Module
        Route::prefix('rider')->group(function () {
            // Status & Heartbeat
            Route::patch('status', [RiderController::class, 'updateStatus']);
            Route::post('ping',    [RiderController::class, 'ping']);
            Route::get('stats',    [RiderController::class, 'getStats']);

            // Order Tabs
            Route::get('orders',           [RiderController::class, 'getOrders']);          // Active (preparing)
            Route::get('my-orders',        [RiderController::class, 'getMyOrders']);        // Assigned/Delivering
            Route::get('completed-orders', [RiderController::class, 'getCompletedOrders']); // Done

            // Order Actions
            Route::post('orders/{id}/accept',        [RiderController::class, 'acceptOrder']);
            Route::post('orders/{id}/update-status', [RiderController::class, 'updateOrderStatus']);
            Route::post('orders/{id}/reject',        [RiderController::class, 'rejectOrder']);
        });

        // Orders & Cart
        Route::get('orders', [ApiOrderController::class, 'index']);
        Route::post('orders', [ApiOrderController::class, 'store']);
        Route::get('orders/{id}', [ApiOrderController::class, 'show']);
        Route::get('cart', [CartController::class, 'index']);
        Route::post('cart/add', [CartController::class, 'addItem']);
        Route::delete('cart/clear', [CartController::class, 'clear']);
        Route::post('cart/validate', [CartController::class, 'validate']);
        
        // Notifications
        Route::get('notifications', [App\Http\Controllers\NotificationController::class, 'index']);
    });
});
