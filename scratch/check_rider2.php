<?php
$autoload = file_exists(__DIR__ . '/vendor/autoload.php') ? __DIR__ . '/vendor/autoload.php' : __DIR__ . '/../vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/bootstrap/app.php') ? __DIR__ . '/bootstrap/app.php' : __DIR__ . '/../bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== RIDER 2 (Mark Lumerio) DELIVERIES ===\n";
foreach (\App\Models\Delivery::where('rider_id', 2)->get() as $d) {
    echo "Delivery ID: {$d->id} | Order ID: {$d->order_id} | Status: {$d->status} | Fee: {$d->delivery_fee}\n";
}

echo "\n=== RIDER 2 (Mark Lumerio) ORDERS ===\n";
foreach (\App\Models\Order::where('rider_id', 2)->get() as $o) {
    echo "Order ID: {$o->id} | Order No: {$o->order_number} | Status: {$o->status}\n";
}
