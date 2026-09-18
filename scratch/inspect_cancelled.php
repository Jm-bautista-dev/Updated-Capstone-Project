<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Sale;

echo "=== INSPECTING THE 80 CANCELLED / VOIDED SALES ===\n\n";

$cancelledSales = Sale::where('status', 'cancelled')
    ->with(['items', 'delivery', 'order'])
    ->get();

echo "Total: " . $cancelledSales->count() . "\n\n";

foreach ($cancelledSales->take(10) as $s) {
    echo sprintf(
        "ID: %d | Order #: %-20s | Type: %-10s | Total: ₱%-8.2f | Has Delivery: %s | Has Order: %s | Items Count: %d | Date: %s\n",
        $s->id,
        $s->order_number,
        $s->type ?? 'N/A',
        (float)$s->total,
        $s->delivery ? "Yes (ID {$s->delivery->id}, status: {$s->delivery->status})" : "No",
        $s->order ? "Yes (ID {$s->order->id}, status: {$s->order->status})" : "No",
        $s->items ? $s->items->count() : 0,
        $s->created_at
    );
}

// Check how many have deliveries or orders
$withDelivery = $cancelledSales->filter(fn($s) => $s->delivery !== null)->count();
$withOrder = $cancelledSales->filter(fn($s) => $s->order !== null)->count();

echo "\nSummary of 80 Cancelled/Voided Sales:\n";
echo " - Linked to Delivery: {$withDelivery}\n";
echo " - Linked to Order: {$withOrder}\n";
echo " - Completed Sales Count: " . Sale::where('status', 'completed')->count() . "\n";
echo " - Pending Sales Count: " . Sale::where('status', 'pending')->count() . "\n";
echo " - Preparing Sales Count: " . Sale::where('status', 'preparing')->count() . "\n";
