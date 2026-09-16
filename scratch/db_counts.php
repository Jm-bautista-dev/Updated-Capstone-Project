<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\Category;
use App\Models\Branch;
use App\Models\AddOn;
use Illuminate\Support\Facades\DB;

echo "Database Record Counts:\n";
echo "Products: " . Product::count() . "\n";
echo "Ingredients: " . Ingredient::count() . "\n";
echo "Categories: " . Category::count() . "\n";
echo "Branches: " . Branch::count() . "\n";
echo "AddOns: " . AddOn::count() . "\n";
echo "Menu Item Ingredients (Recipes): " . DB::table('menu_item_ingredients')->count() . "\n";
echo "Ingredient Stocks: " . DB::table('ingredient_stocks')->count() . "\n";
echo "Branch Products: " . DB::table('branch_product')->count() . "\n";
echo "Reviews: " . DB::table('product_reviews')->count() . "\n";
echo "Order Items: " . DB::table('order_items')->count() . "\n";
