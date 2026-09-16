<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

// Find an admin user
$adminUser = User::where('role', 'admin')->first() ?: User::first();
Auth::login($adminUser);

echo "Logged in as: " . $adminUser->name . " (Role: " . $adminUser->role . ", Branch: " . ($adminUser->branch_id ?? 'All') . ")\n\n";

function makeRequest(array $params = []): Request {
    $req = Request::create('/products', 'GET', $params, [], [], [
        'REMOTE_ADDR' => '127.0.0.1',
        'HTTP_HOST' => 'localhost',
        'HTTP_USER_AGENT' => 'PerformanceProfiler',
        'HTTP_ACCEPT' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    ]);
    $req->setUserResolver(fn() => Auth::user());
    return $req;
}

function profileController(string $name, callable $callable) {
    DB::flushQueryLog();
    DB::enableQueryLog();
    
    $startMemory = memory_get_usage();
    $startTime = microtime(true);
    
    $result = $callable();
    
    $endTime = microtime(true);
    $endMemory = memory_get_usage();
    $queries = DB::getQueryLog();
    DB::disableQueryLog();
    
    $durationMs = round(($endTime - $startTime) * 1000, 2);
    $queryCount = count($queries);
    $memoryMb = round(($endMemory - $startMemory) / 1024 / 1024, 2);
    
    // Estimate payload size if Inertia response
    $payloadBytes = 0;
    if ($result instanceof \Inertia\Response) {
        $httpResponse = $result->toResponse(makeRequest());
        $payloadBytes = strlen($httpResponse->getContent());
    }
    
    echo "========================================\n";
    echo "Page: $name\n";
    echo "Execution Time: {$durationMs} ms\n";
    echo "Query Count: {$queryCount}\n";
    echo "Memory Used: {$memoryMb} MB\n";
    echo "Payload Size: " . round($payloadBytes / 1024, 2) . " KB\n";
    echo "========================================\n";
    
    // Group queries by base pattern
    $querySummary = [];
    foreach ($queries as $q) {
        $sql = preg_replace('/=\s*\d+/', '= ?', $q['query']);
        $sql = preg_replace('/in\s*\([^\)]+\)/i', 'in (...)', $sql);
        $querySummary[$sql] = ($querySummary[$sql] ?? 0) + 1;
    }
    
    // Sort and show top repeated queries
    arsort($querySummary);
    echo "Top queries executed:\n";
    $topCount = 0;
    foreach ($querySummary as $sql => $count) {
        if ($topCount++ > 8) break;
        echo "  [x{$count}] " . substr($sql, 0, 100) . "...\n";
    }
    echo "\n";
    
    return [
        'name' => $name,
        'time_ms' => $durationMs,
        'query_count' => $queryCount,
        'payload_kb' => round($payloadBytes / 1024, 2),
        'queries' => $queries
    ];
}

// 1. Benchmark Products (All branches)
$productsController = app(\App\Http\Controllers\ProductsController::class);
profileController("Products (Admin - All Branches)", function() use ($productsController) {
    return $productsController->index(makeRequest());
});

// 2. Benchmark Products (Single Branch)
profileController("Products (Admin - Branch 1)", function() use ($productsController) {
    return $productsController->index(makeRequest(['branch_id' => 1]));
});

// 3. Benchmark Categories
$categoriesController = app(\App\Http\Controllers\CategoriesController::class);
profileController("Categories", function() use ($categoriesController) {
    return $categoriesController->index(makeRequest());
});

// 4. Benchmark Inventory
$inventoryController = app(\App\Http\Controllers\InventoryController::class);
profileController("Inventory", function() use ($inventoryController) {
    return $inventoryController->index(makeRequest());
});

// 5. Benchmark Sales
$salesController = app(\App\Http\Controllers\SalesController::class);
profileController("Sales", function() use ($salesController) {
    return $salesController->index(makeRequest());
});
