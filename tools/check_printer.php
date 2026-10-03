<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\ReceiptFormatterService;

echo "sale_items product_name column: " . (Schema::hasColumn('sale_items', 'product_name') ? 'YES' : 'NO') . PHP_EOL;
echo "order_items product_name column: " . (Schema::hasColumn('order_items', 'product_name') ? 'YES' : 'NO') . PHP_EOL;

// Check latest sale
$latestSale = Sale::with(['items.product', 'branch', 'user', 'delivery'])->latest()->first();
if ($latestSale) {
    echo "Latest Sale ID: " . $latestSale->id . ", order_number: " . $latestSale->order_number . PHP_EOL;
    echo "Items count: " . $latestSale->items->count() . PHP_EOL;
    foreach ($latestSale->items as $item) {
        echo " - Item ID: {$item->id}, product_id: {$item->product_id}, product rel: " . ($item->product?->name ?? 'NULL') . ", qty: {$item->quantity}, price: {$item->unit_price}" . PHP_EOL;
    }
    
    $formatter = app(ReceiptFormatterService::class);
    $data = $formatter->buildReceiptData($latestSale);
    echo "Formatted Items:" . PHP_EOL;
    foreach ($data['items'] as $it) {
        echo "   * Name: [{$it['name']}], Qty: {$it['quantity']}, Unit: {$it['unit_price']}, Subtotal: {$it['subtotal']}" . PHP_EOL;
    }
    echo "Plain Text Preview (58mm):" . PHP_EOL;
    echo $formatter->formatPlainText($data, 58) . PHP_EOL;
}
