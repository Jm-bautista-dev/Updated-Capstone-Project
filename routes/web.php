<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\PosController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\CategoriesController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('Dashboard/Index');
    })->name('dashboard');

    Route::get('products', [App\Http\Controllers\ProductsController::class, 'index'])->name('products.index');
    Route::post('products', [App\Http\Controllers\ProductsController::class, 'store'])->name('products.store');
    Route::put('products/{id}', [App\Http\Controllers\ProductsController::class, 'update'])->name('products.update');
    Route::delete('products/{id}', [App\Http\Controllers\ProductsController::class, 'destroy'])->name('products.destroy');

    Route::get('suppliers', function () {
        return Inertia::render('Suppliers/Index');
    })->name('suppliers.index');

    Route::get('categories', function () {
        return Inertia::render('Categories/Index');
    })->name('categories.index');

    Route::get('customers', function () {
        return Inertia::render('Customers/Index');
    })->name('customers.index');

    Route::get('sales', function () {
        return Inertia::render('Sales/Index');
    })->name('sales.index');

    Route::get('reports', function () {
        return Inertia::render('Reports/Index');
    })->name('reports.index');

    Route::get('delivery', function () {
        return Inertia::render('Delivery/Index');
    })->name('delivery.index');

    // Inventory Routes (dynamic)
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store');
    Route::put('/inventory/{id}', [InventoryController::class, 'update'])->name('inventory.update');
    Route::delete('/inventory/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy');

    // POS Routes
    Route::get('pos', [PosController::class, 'index'])->name('pos.index');
    Route::post('pos', [PosController::class, 'store'])->name('pos.store');

    Route::get('/categories', [CategoriesController::class, 'index'])->name('categories.index');
    Route::post('/categories', [CategoriesController::class, 'store'])->name('categories.store');
    Route::put('/categories/{id}', [CategoriesController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{id}', [CategoriesController::class, 'destroy'])->name('categories.destroy');
});

require __DIR__.'/settings.php';
