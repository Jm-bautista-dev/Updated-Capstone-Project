<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\PosController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\DeliveryController;
use App\Http\Controllers\Admin\RiderController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\InventoryActionController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();
        if ($user->isSuperAdmin()) {
            return redirect('/super-admin');
        }
        return $user->isAdmin()
            ? redirect()->route('dashboard')
            : redirect()->route('pos.index');
    }
    return Inertia::render('Welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/menu', function () {
    return Inertia::render('Customer/Menu');
})->name('menu');

// Public asset & proof of delivery storage fallback handler
Route::get('/storage/{path}', function ($path) {
    // 1. Direct path in storage/app/public
    $fullPath = storage_path('app/public/' . $path);
    if (file_exists($fullPath) && is_file($fullPath)) {
        return response()->file($fullPath);
    }

    // 2. Subfolder fallback: proof_of_delivery
    $proofPath = storage_path('app/public/proof_of_delivery/' . $path);
    if (file_exists($proofPath) && is_file($proofPath)) {
        return response()->file($proofPath);
    }

    // 3. Subfolder fallback: delivery-proofs
    $deliveryProofPath = storage_path('app/public/delivery-proofs/' . $path);
    if (file_exists($deliveryProofPath) && is_file($deliveryProofPath)) {
        return response()->file($deliveryProofPath);
    }

    // 4. Subfolder fallback: products
    $productPath = storage_path('app/public/products/' . $path);
    if (file_exists($productPath) && is_file($productPath)) {
        return response()->file($productPath);
    }

    // 5. Direct path in public/storage
    $publicPath = public_path('storage/' . $path);
    if (file_exists($publicPath) && is_file($publicPath)) {
        return response()->file($publicPath);
    }

    abort(404);
})->where('path', '.*')->name('storage.fallback');

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Change Password (accessible even before password is changed) ──
    Route::get('/change-password', [App\Http\Controllers\Auth\ChangePasswordController::class, 'show'])->name('first-login.change');
    Route::post('/change-password', [App\Http\Controllers\Auth\ChangePasswordController::class, 'update'])->name('first-login.update');

    // ── All other routes require password to have been changed ────────
    Route::middleware(['must_change_password'])->group(function () {

        Route::post('/inventory/mass-stock-in', [App\Http\Controllers\StockInController::class, 'massStore'])->name('inventory.mass-stock-in');

        // Admin ONLY Routes
        Route::middleware(['role:admin'])->group(function () {
            Route::get('dashboard', [AnalyticsController::class, 'index'])->name('dashboard');
            Route::get('analytics/cashier-performance', [AnalyticsController::class, 'cashierPerformance'])->name('analytics.cashier-performance');
            Route::get('analytics/cashier-performance/export', [AnalyticsController::class, 'exportPerformance'])->name('analytics.cashier-performance.export');
            Route::get('analytics/sales-forecast', [AnalyticsController::class, 'salesForecast'])->name('analytics.sales-forecast');
            Route::get('analytics/forecast-benchmarking', [AnalyticsController::class, 'forecastBenchmarking'])->name('analytics.forecast-benchmarking');
            Route::post('analytics/forecast-benchmarking/run', [AnalyticsController::class, 'runBenchmark'])->name('analytics.forecast-benchmarking.run');
            Route::post('analytics/forecast-benchmarking/save', [AnalyticsController::class, 'saveForecast'])->name('analytics.forecast-benchmarking.save');
            Route::get('analytics/forecast-benchmarking/export', [AnalyticsController::class, 'exportBenchmarkReport'])->name('analytics.forecast-benchmarking.export');
            Route::get('analytics/restock-suggestions', [AnalyticsController::class, 'restockSuggestions'])->name('analytics.restock-suggestions');

            // Supplier Management
            Route::get('suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
            Route::post('suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
            Route::get('suppliers/{supplier}', [SupplierController::class, 'show'])->name('suppliers.show');
            Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
            Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
            Route::post('suppliers/{supplier}/restore', [SupplierController::class, 'restore'])->name('suppliers.restore');

            Route::resource('riders', RiderController::class);

            // Employee Management (Admin only)
            Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
            Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
            Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
            Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');

            // Branch location/settings update (Admin only)
            Route::put('branches/{id}', [BranchController::class, 'update'])->name('branches.update');

            // Administrative Inventory & Product Management
            Route::post('products', [App\Http\Controllers\ProductsController::class, 'store'])->name('products.store');
            Route::put('products/{id}', [App\Http\Controllers\ProductsController::class, 'update'])->name('products.update');
            Route::delete('products/{id}', [App\Http\Controllers\ProductsController::class, 'destroy'])->name('products.destroy');

            Route::match(['post', 'delete'], '/inventory/bulk-delete', [InventoryController::class, 'bulkDelete'])->name('inventory.bulk-delete');
            Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store');
            Route::put('/inventory/{id}', [InventoryController::class, 'update'])->name('inventory.update');
            Route::delete('/inventory/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy');

            // Sales Data Management (Admin only)
            Route::get('admin/sales-data', [App\Http\Controllers\Admin\SalesDataManagementController::class, 'index'])->name('admin.sales-data.index');
            Route::post('admin/sales-data/validate', [App\Http\Controllers\Admin\SalesDataManagementController::class, 'validateFile'])->name('admin.sales-data.validate');
            Route::post('admin/sales-data/import', [App\Http\Controllers\Admin\SalesDataManagementController::class, 'import'])->name('admin.sales-data.import');
            Route::post('admin/sales-data/restore/{backup}', [App\Http\Controllers\Admin\SalesDataManagementController::class, 'restore'])->name('admin.sales-data.restore');
            Route::delete('admin/sales-data/backup/{backup}', [App\Http\Controllers\Admin\SalesDataManagementController::class, 'destroyBackup'])->name('admin.sales-data.backup.destroy');
        }); // end role:admin

        // POS Routes (Cashier ONLY)
        Route::middleware(['role:cashier'])->group(function () {
            Route::get('pos', [PosController::class, 'index'])->name('pos.index');
            Route::post('pos', [PosController::class, 'store'])->name('pos.store');
            Route::post('pos/calculate-delivery-distance', [App\Http\Controllers\Api\PosDeliveryDistanceController::class, 'calculate'])->name('pos.calculate-distance');

            // Cashier Shift Management
            Route::post('shifts/open', [App\Http\Controllers\CashierShiftController::class, 'open'])->name('shifts.open');
            Route::post('shifts/close', [App\Http\Controllers\CashierShiftController::class, 'close'])->name('shifts.close');
            // Allow both to adjust if needed, but primarily cashier
            Route::post('shifts/adjust', [App\Http\Controllers\CashierShiftController::class, 'adjust'])->name('shifts.adjust');
        }); // end role:cashier

        // Shared Routes (Admin and Cashier — Full Access)
        Route::middleware(['role:admin,cashier'])->group(function () {

            // Products
            Route::get('products', [App\Http\Controllers\ProductsController::class, 'index'])->name('products.index');

            // Categories
            Route::get('categories', [CategoriesController::class, 'index'])->name('categories.index');
            Route::post('/categories', [CategoriesController::class, 'store'])->name('categories.store');
            Route::put('/categories/{id}', [CategoriesController::class, 'update'])->name('categories.update');
            Route::delete('/categories/{id}', [CategoriesController::class, 'destroy'])->name('categories.destroy');

            // Inventory
            Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
            Route::post('/inventory/stock-in', [App\Http\Controllers\StockInController::class, 'store'])->name('inventory.stock-in');
            Route::post('/inventory/wastage',  [\App\Http\Controllers\WastageController::class, 'store'])->name('inventory.wastage');
            Route::post('/inventory/scan-receipt/upload', [App\Http\Controllers\Api\ReceiptController::class, 'upload'])->name('inventory.scan-receipt.upload');
            Route::post('/inventory/scan-receipt/process', [App\Http\Controllers\Api\ReceiptController::class, 'process'])->name('inventory.scan-receipt.process');
            Route::post('/inventory/scan-receipt/confirm', [App\Http\Controllers\Api\ReceiptController::class, 'stockIn'])->name('inventory.scan-receipt.confirm');
            Route::get('/inventory/scan-receipt/history', [App\Http\Controllers\Api\ReceiptController::class, 'history'])->name('inventory.scan-receipt.history');
            Route::get('/inventory/scan-receipt/{id}', [App\Http\Controllers\Api\ReceiptController::class, 'show'])->name('inventory.scan-receipt.show');
            // Compatibility aliases
            Route::post('/inventory/scan-receipt', [App\Http\Controllers\Api\ReceiptController::class, 'upload']);
            Route::post('/inventory/apply-receipt-restock', [App\Http\Controllers\Api\ReceiptController::class, 'stockIn']);

            // Reports
            Route::get('reports', [App\Http\Controllers\Admin\ReportController::class, 'index'])->name('reports.index');
            Route::post('reports/export/prepare', [App\Http\Controllers\Admin\ReportController::class, 'prepareExport'])->name('reports.export.prepare');
            Route::get('reports/pdf', [App\Http\Controllers\Admin\ReportController::class, 'exportPdf'])->name('reports.pdf');
            Route::get('reports/excel', [App\Http\Controllers\Admin\ReportController::class, 'exportExcel'])->name('reports.excel');

            // Sales
            Route::get('sales', [App\Http\Controllers\SalesController::class, 'index'])->name('sales.index');
            Route::get('sales/export/summary', [App\Http\Controllers\SalesController::class, 'exportSummary'])->name('sales.export.summary');
            Route::get('sales/export', [App\Http\Controllers\SalesController::class, 'exportCsv'])->name('sales.export');
            Route::match(['put', 'patch'], 'sales/{sale}/status', [App\Http\Controllers\SalesController::class, 'updateStatus'])->name('sales.updateStatus');

            // Deliveries
            Route::get('deliveries', [DeliveryController::class, 'index'])->name('deliveries.index');
            Route::get('deliveries/live-riders', [DeliveryController::class, 'getLiveRiderLocations'])->name('deliveries.live-riders');
            Route::get('deliveries/{delivery}/route', [DeliveryController::class, 'getRoute'])->name('deliveries.route');
            Route::post('deliveries', [DeliveryController::class, 'store'])->name('deliveries.store');
            Route::put('deliveries/{delivery}/status', [DeliveryController::class, 'updateStatus'])->name('deliveries.update-status');
            Route::post('deliveries/{delivery}/cancel', [DeliveryController::class, 'cancel'])->name('deliveries.cancel');
            Route::post('deliveries/{delivery}/fail', [DeliveryController::class, 'failDelivery'])->name('deliveries.fail');
            Route::post('deliveries/{delivery}/assign-rider', [DeliveryController::class, 'assignRider'])->name('deliveries.assign-rider');
            Route::post('cancellation-requests/{id}/accept', [App\Http\Controllers\Api\CancellationRequestController::class, 'accept'])->name('cancellation-requests.accept');
            Route::post('cancellation-requests/{id}/reject', [App\Http\Controllers\Api\CancellationRequestController::class, 'reject'])->name('cancellation-requests.reject');

            // Pickups Management & Kitchen Preparation Queue
            Route::get('pickups', [App\Http\Controllers\Admin\PickupOrderController::class, 'index'])->name('pickups.index');
            Route::get('admin/pickups', [App\Http\Controllers\Admin\PickupOrderController::class, 'index'])->name('admin.pickups.index');
            Route::post('pickups/manual', [App\Http\Controllers\Admin\PickupOrderController::class, 'storeManual'])->name('pickups.manual');
            Route::post('pickups/{id}/status', [App\Http\Controllers\Admin\PickupOrderController::class, 'updateStatus'])->name('pickups.update-status');
            Route::post('pickups/{id}/verify-complete', [App\Http\Controllers\Admin\PickupOrderController::class, 'verifyComplete'])->name('pickups.verify-complete');
            Route::post('pickups/{id}/reschedule', [App\Http\Controllers\Admin\PickupOrderController::class, 'reschedule'])->name('pickups.reschedule');

            Route::get('customers', fn() => Inertia::render('Customers/Index'))->name('customers.index');

            // Reviews & Ratings Management
            Route::get('admin/reviews', [App\Http\Controllers\Admin\ReviewController::class, 'index'])->name('admin.reviews.index');
            Route::put('admin/reviews/{review}/status', [App\Http\Controllers\Admin\ReviewController::class, 'updateStatus'])->name('admin.reviews.update-status');
            Route::post('admin/reviews/{review}/respond', [App\Http\Controllers\Admin\ReviewController::class, 'respond'])->name('admin.reviews.respond');
            Route::post('admin/reviews/{review}/mark-seen', [App\Http\Controllers\Admin\ReviewController::class, 'markReviewSeen'])->name('admin.reviews.mark-seen');
            Route::post('admin/reviews/products/{product}/mark-seen', [App\Http\Controllers\Admin\ReviewController::class, 'markProductReviewsSeen'])->name('admin.reviews.products.mark-seen');
            Route::delete('admin/reviews/{review}', [App\Http\Controllers\Admin\ReviewController::class, 'destroy'])->name('admin.reviews.destroy');

            // Branches
            Route::get('branches', [BranchController::class, 'adminIndex'])->name('branches.index');
            Route::get('riders-available', [RiderController::class, 'available'])->name('riders.available');
            Route::get('deliveries/recommend', [App\Http\Controllers\Admin\DeliveryController::class, 'recommend'])->name('deliveries.recommend');

            // Notifications — Inertia page
            Route::get('inventory/activity', [NotificationController::class, 'activity'])->name('inventory.activity');
            // JSON API for axios calls (avoids Inertia 409 version conflict in production)
            Route::get('api/inventory/activity-logs', [NotificationController::class, 'activityLogs'])->name('inventory.activity-logs');

            // New Weight/Volume Inventory System
            Route::get('/inventory-items', [InventoryActionController::class, 'index'])->name('inventory-items.index');
            Route::post('/inventory-items', [InventoryActionController::class, 'store'])->name('inventory-items.store');
            Route::get('/pos/weight', [InventoryActionController::class, 'pos'])->name('pos.weight');
            Route::post('/pos/inventory-sale', [InventoryActionController::class, 'processSale'])->name('inventory-sale.store');
            Route::get('/inventory-sales-history', [InventoryActionController::class, 'history'])->name('inventory-sale.history');

            // Account Flagging / Reporting (Admins & Staff)
            Route::post('/accounts/flag', [App\Http\Controllers\Admin\AccountFlagController::class, 'store'])->name('admin.accounts.flag');
        }); // end role:admin,cashier

        // ─────────────────────────────────────────────────────────────────
        // SUPER ADMIN / DEVELOPER OPERATIONS ROUTES (Strict super_admin role)
        // ─────────────────────────────────────────────────────────────────
        Route::middleware(['super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
            Route::get('/', [App\Http\Controllers\SuperAdmin\DashboardController::class, 'index'])->name('dashboard');
            
            // System Health Diagnostics
            Route::get('/system-health', [App\Http\Controllers\SuperAdmin\SystemHealthController::class, 'index'])->name('health.index');
            Route::get('/system-health/check', [App\Http\Controllers\SuperAdmin\SystemHealthController::class, 'check'])->name('health.check');
            
            // Application Error Logs
            Route::get('/errors', [App\Http\Controllers\SuperAdmin\ErrorLogController::class, 'index'])->name('errors.index');
            Route::post('/errors/{id}/resolve', [App\Http\Controllers\SuperAdmin\ErrorLogController::class, 'toggleResolve'])->name('errors.resolve');
            Route::post('/errors/clear-resolved', [App\Http\Controllers\SuperAdmin\ErrorLogController::class, 'clearResolved'])->name('errors.clear-resolved');

            // Developer Log Viewer (Laravel logs, PHP logs, queue, scheduler)
            Route::get('/logs', [App\Http\Controllers\SuperAdmin\LogViewerController::class, 'index'])->name('logs.index');
            Route::get('/logs/entries', [App\Http\Controllers\SuperAdmin\LogViewerController::class, 'entries'])->name('logs.entries');
            Route::get('/logs/live', [App\Http\Controllers\SuperAdmin\LogViewerController::class, 'live'])->name('logs.live');
            Route::get('/logs/sources', [App\Http\Controllers\SuperAdmin\LogViewerController::class, 'sources'])->name('logs.sources');
            Route::get('/logs/download', [App\Http\Controllers\SuperAdmin\LogViewerController::class, 'download'])->name('logs.download');
            
            // Maintenance Mode Control Panel
            Route::get('/maintenance', [App\Http\Controllers\SuperAdmin\MaintenanceController::class, 'index'])->name('maintenance.index');
            Route::post('/maintenance/toggle', [App\Http\Controllers\SuperAdmin\MaintenanceController::class, 'toggle'])->name('maintenance.toggle');
            
            // Immutable Audit Logs
            Route::get('/audit-logs', [App\Http\Controllers\SuperAdmin\AuditLogController::class, 'index'])->name('audit.index');
            
            // API Performance Monitoring
            Route::get('/api-monitor', [App\Http\Controllers\SuperAdmin\ApiMonitorController::class, 'index'])->name('api-monitor.index');
            
            // Read-Only Database Health
            Route::get('/database', [App\Http\Controllers\SuperAdmin\DatabaseHealthController::class, 'index'])->name('database.index');
            
            // Controlled Feature Flags Matrix
            Route::get('/features', [App\Http\Controllers\SuperAdmin\FeatureFlagController::class, 'index'])->name('features.index');
            Route::post('/features/{id}/toggle', [App\Http\Controllers\SuperAdmin\FeatureFlagController::class, 'toggle'])->name('features.toggle');
            
            // Deployment & Version Information
            Route::get('/deployment', [App\Http\Controllers\SuperAdmin\DeploymentController::class, 'index'])->name('deployment.index');
            
            // Security Dashboard & Password Security
            Route::get('/security', [App\Http\Controllers\SuperAdmin\SecurityController::class, 'index'])->name('security.index');
            Route::post('/security/password', [App\Http\Controllers\SuperAdmin\SecurityController::class, 'updatePassword'])->name('security.password');
            
            // Developer System Settings
            Route::get('/settings', [App\Http\Controllers\SuperAdmin\SettingsController::class, 'index'])->name('settings.index');
            Route::post('/settings/update', [App\Http\Controllers\SuperAdmin\SettingsController::class, 'update'])->name('settings.update');

            // Customer COD Risk Management & Manual Overrides
            Route::get('/customer-risk', [App\Http\Controllers\SuperAdmin\CustomerRiskController::class, 'index'])->name('customer-risk.index');
            Route::get('/customer-risk/{id}', [App\Http\Controllers\SuperAdmin\CustomerRiskController::class, 'show'])->name('customer-risk.show');
            Route::post('/customer-risk/{id}/override', [App\Http\Controllers\SuperAdmin\CustomerRiskController::class, 'overrideCod'])->name('customer-risk.override');

            // Account Governance, Moderation, & Suspensions
            Route::get('/accounts', [App\Http\Controllers\SuperAdmin\AccountGovernanceController::class, 'index'])->name('accounts.index');
            Route::get('/accounts/{type}/{id}', [App\Http\Controllers\SuperAdmin\AccountGovernanceController::class, 'show'])->name('accounts.show');
            Route::post('/accounts/{type}/{id}/status', [App\Http\Controllers\SuperAdmin\AccountGovernanceController::class, 'updateStatus'])->name('accounts.update-status');
            Route::post('/accounts/{type}/{id}/restore', [App\Http\Controllers\SuperAdmin\AccountGovernanceController::class, 'restore'])->name('accounts.restore');
            Route::delete('/accounts/{type}/{id}', [App\Http\Controllers\SuperAdmin\AccountGovernanceController::class, 'destroy'])->name('accounts.destroy');

            // Moderation Cases Workflow
            Route::get('/moderation-cases', [App\Http\Controllers\SuperAdmin\ModerationCaseController::class, 'index'])->name('moderation-cases.index');
            Route::get('/moderation-cases/{id}', [App\Http\Controllers\SuperAdmin\ModerationCaseController::class, 'show'])->name('moderation-cases.show');
            Route::post('/moderation-cases/{id}/resolve', [App\Http\Controllers\SuperAdmin\ModerationCaseController::class, 'resolve'])->name('moderation-cases.resolve');
        });

    }); // end must_change_password

}); // end auth,verified

Route::post('/logout', \App\Http\Controllers\Auth\LogoutController::class)->name('logout');

// ── Root-Level API Route Fallbacks (for mobile app requests with leading slash) ──
Route::middleware(['auth:sanctum,web'])->group(function () {
    Route::get('/user', [App\Http\Controllers\Api\UserController::class, 'me']);
    Route::match(['patch', 'put', 'post'], '/user', [App\Http\Controllers\Api\UserController::class, 'update']);
    Route::match(['patch', 'put', 'post'], '/user/password', [App\Http\Controllers\Api\UserController::class, 'updatePassword']);
    
    // Order endpoints under root
    Route::get('orders/ready',     [App\Http\Controllers\Api\RiderController::class, 'getOrders']);
    Route::get('orders/pickup',    [App\Http\Controllers\Api\RiderController::class, 'getOrders']);
    Route::get('orders/pending',   [App\Http\Controllers\Api\RiderController::class, 'getOrders']);
    Route::get('orders/my',        [App\Http\Controllers\Api\RiderController::class, 'getMyOrders']);
    Route::get('orders/assigned',  [App\Http\Controllers\Api\RiderController::class, 'getMyOrders']);
    Route::get('orders/active',    [App\Http\Controllers\Api\RiderController::class, 'getMyOrders']);
    Route::get('orders/completed', [App\Http\Controllers\Api\RiderController::class, 'getCompletedOrders']);
    Route::get('orders/history',   [App\Http\Controllers\Api\RiderController::class, 'getCompletedOrders']);

    Route::prefix('rider')->group(function () {
        Route::get('orders', [App\Http\Controllers\Api\RiderController::class, 'getOrders']);
        Route::get('my-orders', [App\Http\Controllers\Api\RiderController::class, 'getMyOrders']);
        Route::get('completed-orders', [App\Http\Controllers\Api\RiderController::class, 'getCompletedOrders']);
        Route::get('history', [App\Http\Controllers\Api\RiderController::class, 'getCompletedOrders']);
        Route::get('cancellation-requests', [App\Http\Controllers\Api\Rider\RiderDeliveryController::class, 'cancellationRequests']);
        Route::post('orders/{id}/pickup', [App\Http\Controllers\Api\RiderController::class, 'pickupOrder']);
        Route::post('pickup/{id}', [App\Http\Controllers\Api\RiderController::class, 'pickupOrder']);
        Route::post('orders/{id}/transit', [App\Http\Controllers\Api\RiderController::class, 'startTransit']);
        Route::post('transit/{id}', [App\Http\Controllers\Api\RiderController::class, 'startTransit']);
        Route::post('orders/{id}/deliver', [App\Http\Controllers\Api\RiderController::class, 'deliverOrder']);
        Route::post('deliver/{id}', [App\Http\Controllers\Api\RiderController::class, 'deliverOrder']);
        Route::post('orders/{id}/reject', [App\Http\Controllers\Api\RiderController::class, 'rejectOrder']);
        Route::post('orders/{id}/cancel', [App\Http\Controllers\Api\RiderController::class, 'cancelOrder']);
        Route::post('location', [App\Http\Controllers\Api\RiderController::class, 'updateLocation']);
        Route::get('stats', [App\Http\Controllers\Api\RiderController::class, 'getStats']);
        Route::get('earnings', [App\Http\Controllers\Api\RiderController::class, 'getStats']);
        Route::get('transactions', [App\Http\Controllers\Api\RiderController::class, 'getCompletedOrders']);
        Route::get('past-transactions', [App\Http\Controllers\Api\RiderController::class, 'getCompletedOrders']);
        Route::patch('status', [App\Http\Controllers\Api\RiderController::class, 'updateStatus']);
        Route::match(['post', 'patch', 'put'], 'orders/{id}/status', [App\Http\Controllers\Api\RiderController::class, 'updateOrderStatus']);
    });

    Route::get('earnings', [App\Http\Controllers\Api\RiderController::class, 'getStats']);
    Route::get('transactions', [App\Http\Controllers\Api\RiderController::class, 'getCompletedOrders']);
    Route::get('past-transactions', [App\Http\Controllers\Api\RiderController::class, 'getCompletedOrders']);
});

require __DIR__.'/settings.php';

