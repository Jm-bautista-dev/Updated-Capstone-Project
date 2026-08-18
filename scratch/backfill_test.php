<?php
$autoload = file_exists(__DIR__ . '/vendor/autoload.php') ? __DIR__ . '/vendor/autoload.php' : __DIR__ . '/../vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/bootstrap/app.php') ? __DIR__ . '/bootstrap/app.php' : __DIR__ . '/../bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Ensure any delivered delivery without a fee has 50.00
\App\Models\Delivery::where('status', 'delivered')->where(function($q){
    $q->whereNull('delivery_fee')->orWhere('delivery_fee', '<=', 0);
})->update(['delivery_fee' => 50.00]);

// Test Rider 1 stats
$rider = \App\Models\Rider::find(1);
$req = \Illuminate\Http\Request::create('/api/v1/rider/stats', 'GET');
$req->setUserResolver(fn() => $rider);

$controller = app(\App\Http\Controllers\Api\RiderController::class);
$statsRes = $controller->getStats($req);
$historyRes = $controller->getCompletedOrders($req);

echo "=== RIDER 1 STATS RESPONSE ===\n";
echo json_encode($statsRes->getData(), JSON_PRETTY_PRINT) . "\n\n";

echo "=== RIDER 1 HISTORY COUNT ===\n";
$historyData = $historyRes->getData();
echo "History Total: " . count($historyData->data ?? []) . " items\n";
if (!empty($historyData->data)) {
    echo "First 3 items:\n";
    foreach (array_slice($historyData->data, 0, 3) as $item) {
        echo " - Order: {$item->order_number} (ID: {$item->id}) | Fee: {$item->delivery_fee} | Total: {$item->total_amount} | Date: {$item->created_at}\n";
    }
}
