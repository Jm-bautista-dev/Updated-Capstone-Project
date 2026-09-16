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

$productsController = app(\App\Http\Controllers\ProductsController::class);

// Warmup connection
$productsController->index(makeRequest());

// Profile Admin All Branches
DB::flushQueryLog();
DB::enableQueryLog();

$startTime = microtime(true);
$response = $productsController->index(makeRequest());
$httpResponse = $response->toResponse(makeRequest());
$content = $httpResponse->getContent();
$endTime = microtime(true);

$queriesAll = DB::getQueryLog();
DB::disableQueryLog();

$timeAllMs = round(($endTime - $startTime) * 1000, 2);
$queryCountAll = count($queriesAll);
$payloadAllKb = round(strlen($content) / 1024, 2);

// Profile Admin Single Branch
DB::flushQueryLog();
DB::enableQueryLog();

$startTime = microtime(true);
$response = $productsController->index(makeRequest(['branch_id' => 1]));
$httpResponse = $response->toResponse(makeRequest(['branch_id' => 1]));
$contentBranch = $httpResponse->getContent();
$endTime = microtime(true);

$queriesBranch = DB::getQueryLog();
DB::disableQueryLog();

$timeBranchMs = round(($endTime - $startTime) * 1000, 2);
$queryCountBranch = count($queriesBranch);
$payloadBranchKb = round(strlen($contentBranch) / 1024, 2);

echo "=========================================================\n";
echo "FINAL BENCHMARK RESULTS (AFTER OPTIMIZATION)\n";
echo "=========================================================\n";
echo "Products Page (Admin - All Branches):\n";
echo "  - Response Time: {$timeAllMs} ms\n";
echo "  - DB Query Count: {$queryCountAll}\n";
echo "  - Payload Size: {$payloadAllKb} KB\n\n";

echo "Products Page (Admin - Single Branch):\n";
echo "  - Response Time: {$timeBranchMs} ms\n";
echo "  - DB Query Count: {$queryCountBranch}\n";
echo "  - Payload Size: {$payloadBranchKb} KB\n\n";

echo "Executed SQL Queries (All Branches):\n";
foreach ($queriesAll as $i => $q) {
    echo "  [" . ($i + 1) . "] (" . $q['time'] . "ms) " . substr($q['query'], 0, 110) . "...\n";
}
