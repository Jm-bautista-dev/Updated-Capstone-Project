<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Product;

echo "=== PRODUCTS IN DB ===" . PHP_EOL;
$products = Product::all();
foreach ($products as $p) {
    echo sprintf(
        "ID: %d | Code: %s | Name: %s | image_path: %s | image_url: %s",
        $p->id,
        $p->product_code,
        $p->name,
        $p->image_path ?? 'NULL',
        $p->image_url ?? 'NULL'
    ) . PHP_EOL;
}
