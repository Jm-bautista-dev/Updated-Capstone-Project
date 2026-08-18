<?php
$autoload = file_exists(__DIR__ . '/vendor/autoload.php') ? __DIR__ . '/vendor/autoload.php' : __DIR__ . '/../vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/bootstrap/app.php') ? __DIR__ . '/bootstrap/app.php' : __DIR__ . '/../bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== RIDERS ===\n";
foreach (\App\Models\Rider::all() as $r) {
    echo "Rider ID: {$r->id} | Name: {$r->name} | Email: {$r->email}\n";
}

echo "\n=== USERS (Rider/Brent/Mark) ===\n";
foreach (\App\Models\User::all() as $u) {
    echo "User ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Role: {$u->role}\n";
}

echo "\n=== ALL ORDERS (DELIVERED / RECENT) ===\n";
foreach (\App\Models\Order::latest()->take(20)->get() as $o) {
    echo "Order ID: {$o->id} | No: {$o->order_number} | Status: {$o->status} | Rider ID: {$o->rider_id} | Total: {$o->total_amount} | Delivery Fee: {$o->delivery_fee}\n";
}

echo "\n=== ALL DELIVERIES ===\n";
foreach (\App\Models\Delivery::latest()->take(20)->get() as $d) {
    echo "Delivery ID: {$d->id} | Order ID: {$d->order_id} | Status: {$d->status} | Rider ID: {$d->rider_id} | Fee: {$d->delivery_fee}\n";
}
