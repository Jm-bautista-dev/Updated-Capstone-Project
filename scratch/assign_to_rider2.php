<?php
$autoload = file_exists(__DIR__ . '/vendor/autoload.php') ? __DIR__ . '/vendor/autoload.php' : __DIR__ . '/../vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/bootstrap/app.php') ? __DIR__ . '/bootstrap/app.php' : __DIR__ . '/../bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Assign delivered orders and deliveries to Rider 2 (Mark Lumerio)
$updatedDeliveries = \App\Models\Delivery::where('status', 'delivered')->update(['rider_id' => 2]);
$updatedOrders = \App\Models\Order::where('status', 'delivered')->update(['rider_id' => 2]);

echo "Assigned {$updatedDeliveries} delivered deliveries and {$updatedOrders} delivered orders to Rider 2 (Mark Lumerio)!\n";

// Verify Rider 2 Stats
$rider2 = \App\Models\Rider::find(2);
$req = \Illuminate\Http\Request::create('/api/v1/rider/stats', 'GET');
$req->setUserResolver(fn() => $rider2);

$controller = app(\App\Http\Controllers\Api\RiderController::class);
$statsRes = $controller->getStats($req);
$historyRes = $controller->getCompletedOrders($req);

echo "=== RIDER 2 (Mark) STATS ===\n";
echo json_encode($statsRes->getData(), JSON_PRETTY_PRINT) . "\n\n";

echo "=== RIDER 2 (Mark) HISTORY ===\n";
$data = $historyRes->getData();
echo "Total Completed: " . count($data->data ?? []) . " orders.\n";
