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
        return auth()->user()->isAdmin()
            ? redirect()->route('dashboard')
            : redirect()->route('pos.index');
    }
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/menu', function () {
    return Inertia::render('Customer/Menu');
})->name('menu');

Route::middleware(['auth', 'verified'])->group(function () {

    // Admin ONLY Routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('dashboard', [AnalyticsController::class, 'index'])->name('dashboard');
        Route::get('analytics/cashier-performance', [AnalyticsController::class, 'cashierPerformance'])->name('analytics.cashier-performance');
        Route::get('analytics/sales-forecast', [AnalyticsController::class, 'salesForecast'])->name('analytics.sales-forecast');
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

        // Administrative Inventory & Product Management
        Route::post('products', [App\Http\Controllers\ProductsController::class, 'store'])->name('products.store');
        Route::put('products/{id}', [App\Http\Controllers\ProductsController::class, 'update'])->name('products.update');
        Route::delete('products/{id}', [App\Http\Controllers\ProductsController::class, 'destroy'])->name('products.destroy');

        Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store');
        Route::put('/inventory/{id}', [InventoryController::class, 'update'])->name('inventory.update');
        Route::delete('/inventory/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy');
    });

    // POS Routes (Cashier ONLY)
    Route::middleware(['role:cashier'])->group(function () {
        Route::get('pos', [PosController::class, 'index'])->name('pos.index');
        Route::post('pos', [PosController::class, 'store'])->name('pos.store');
    });

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

        // Reports
        Route::get('reports', [App\Http\Controllers\Admin\ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/pdf', [App\Http\Controllers\Admin\ReportController::class, 'exportPdf'])->name('reports.pdf');
        Route::get('reports/excel', [App\Http\Controllers\Admin\ReportController::class, 'exportExcel'])->name('reports.excel');

        // Sales
        Route::get('sales', [App\Http\Controllers\SalesController::class, 'index'])->name('sales.index');
        Route::put('sales/{sale}/status', [App\Http\Controllers\SalesController::class, 'updateStatus'])->name('sales.updateStatus');

        // Deliveries
        Route::get('delivery', [DeliveryController::class, 'index'])->name('delivery.index');
        Route::post('deliveries', [DeliveryController::class, 'store'])->name('deliveries.store');
        Route::put('deliveries/{delivery}/status', [DeliveryController::class, 'updateStatus'])->name('deliveries.update-status');


        Route::get('customers', fn() => Inertia::render('Customers/Index'))->name('customers.index');

        // Branches (for dropdowns)
        Route::get('branches', [BranchController::class, 'index'])->name('branches.index');
        Route::get('riders-available', [RiderController::class, 'available'])->name('riders.available');
        Route::get('deliveries/recommend', [App\Http\Controllers\Admin\DeliveryController::class, 'recommend'])->name('deliveries.recommend');

        // Notifications
        Route::get('api/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('api/notifications/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
        Route::get('inventory/activity', [NotificationController::class, 'activity'])->name('inventory.activity');

        // New Weight/Volume Inventory System
        Route::get('/inventory-items', [InventoryActionController::class, 'index'])->name('inventory-items.index');
        Route::post('/inventory-items', [InventoryActionController::class, 'store'])->name('inventory-items.store');
        Route::get('/pos/weight', [InventoryActionController::class, 'pos'])->name('pos.weight');
        Route::post('/pos/inventory-sale', [InventoryActionController::class, 'processSale'])->name('inventory-sale.store');
        Route::get('/inventory-sales-history', [InventoryActionController::class, 'history'])->name('inventory-sale.history');
    });
});

require __DIR__.'/settings.php';

Route::get('/fix-my-db', function () {
    try {
        // Just run migrate instead of migrate:fresh (safer)
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        // Then try to seed
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        
        $output = \Illuminate\Support\Facades\Artisan::output();
        return "<h1>Migration Result:</h1><pre>" . $output . "</pre><br><a href='/login'>Go to Login</a>";
    } catch (\Exception $e) {
        return "<h1>Migration Failed!</h1><p>Error: " . $e->getMessage() . "</p>";
    }
});
