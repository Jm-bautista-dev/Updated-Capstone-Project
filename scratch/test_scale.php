<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Branch;
use App\Models\Ingredient;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

$adminUser = User::where('role', 'admin')->first() ?: User::first();
Auth::login($adminUser);

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

// Check how many queries run per product currently
DB::flushQueryLog();
DB::enableQueryLog();

$startTime = microtime(true);
$productsController = app(\App\Http\Controllers\ProductsController::class);
$response = $productsController->index(makeRequest());
$httpResponse = $response->toResponse(makeRequest());
$content = $httpResponse->getContent();
$endTime = microtime(true);

$queries = DB::getQueryLog();
DB::disableQueryLog();

$productCount = Product::count();
echo "Current Product Count: $productCount\n";
echo "Total Queries for index() with serialization: " . count($queries) . "\n";
echo "Queries per product ratio: " . (count($queries) / max(1, $productCount)) . "\n";
echo "Execution time: " . round(($endTime - $startTime) * 1000, 2) . " ms\n";
echo "Response size: " . round(strlen($content) / 1024, 2) . " KB\n";

echo "\nAll Queries Executed:\n";
foreach ($queries as $i => $q) {
    echo "[" . ($i + 1) . "] (" . $q['time'] . "ms) " . substr($q['query'], 0, 120) . " (Bindings: " . json_encode($q['bindings']) . ")\n";
}
