<?php
$autoload = file_exists(__DIR__ . '/vendor/autoload.php') ? __DIR__ . '/vendor/autoload.php' : __DIR__ . '/../vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/bootstrap/app.php') ? __DIR__ . '/bootstrap/app.php' : __DIR__ . '/../bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (\App\Models\Rider::all() as $rider) {
    echo "Rider ID: {$rider->id} | Name: {$rider->name} | Email: {$rider->email}\n";
    $delCount = \App\Models\Delivery::where('rider_id', $rider->id)->count();
    $ordCount = \App\Models\Order::where('rider_id', $rider->id)->count();
    $completedCount = \App\Models\Delivery::where('rider_id', $rider->id)->where('status', 'delivered')->count();
    $earnings = \App\Models\Delivery::where('rider_id', $rider->id)->where('status', 'delivered')->sum('delivery_fee');
    echo "  - Total Deliveries: {$delCount} | Orders: {$ordCount} | Completed: {$completedCount} | Earnings: {$earnings}\n\n";
}
