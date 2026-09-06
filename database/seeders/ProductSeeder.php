<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // Maki & Rolls
            ['category' => 'Maki & Rolls', 'name' => 'California Maki', 'description' => 'Crab stick, mango, cucumber, and ebiko.', 'price' => 180.00, 'image' => null],
            ['category' => 'Maki & Rolls', 'name' => 'Spicy Tuna Maki', 'description' => 'Fresh tuna with spicy mayo and tempura bits.', 'price' => 220.00, 'image' => null],
            ['category' => 'Maki & Rolls', 'name' => 'Dragon Roll', 'description' => 'Ebi tempura roll topped with unagi and avocado.', 'price' => 350.00, 'image' => null],
            
            // Sashimi & Nigiri
            ['category' => 'Sashimi & Nigiri', 'name' => 'Salmon Sashimi', 'description' => '5 slices of premium fresh salmon.', 'price' => 280.00, 'image' => null],
            ['category' => 'Sashimi & Nigiri', 'name' => 'Tuna Nigiri', 'description' => 'Fresh tuna over vinegared rice (2pcs).', 'price' => 150.00, 'image' => null],
            ['category' => 'Sashimi & Nigiri', 'name' => 'Ebi Nigiri', 'description' => 'Sweet shrimp over vinegared rice (2pcs).', 'price' => 140.00, 'image' => null],
            
            // Ramen & Noodles
            ['category' => 'Ramen & Noodles', 'name' => 'Tonkotsu Ramen', 'description' => 'Rich pork broth ramen with chashu.', 'price' => 380.00, 'image' => null],
            ['category' => 'Ramen & Noodles', 'name' => 'Miso Ramen', 'description' => 'Savory miso broth with corn and butter.', 'price' => 350.00, 'image' => null],
            ['category' => 'Ramen & Noodles', 'name' => 'Yaki Udon', 'description' => 'Stir-fried thick udon noodles with pork and veggies.', 'price' => 290.00, 'image' => null],
            
            // Donburi
            ['category' => 'Donburi', 'name' => 'Katsudon', 'description' => 'Breaded pork cutlet and egg over rice.', 'price' => 250.00, 'image' => null],
            ['category' => 'Donburi', 'name' => 'Gyudon', 'description' => 'Thinly sliced beef and onions simmered in soy sauce over rice.', 'price' => 280.00, 'image' => null],
            ['category' => 'Donburi', 'name' => 'Oyakodon', 'description' => 'Chicken and egg simmered in sweet soy sauce over rice.', 'price' => 240.00, 'image' => null],
            
            // Sides & Beverages
            ['category' => 'Sides & Beverages', 'name' => 'Edamame', 'description' => 'Steamed soybeans with sea salt.', 'price' => 90.00, 'image' => null],
            ['category' => 'Sides & Beverages', 'name' => 'Pork Gyoza', 'description' => 'Pan-fried Japanese dumplings (5pcs).', 'price' => 150.00, 'image' => null],
            ['category' => 'Sides & Beverages', 'name' => 'Matcha Iced Tea', 'description' => 'Refreshing iced green tea.', 'price' => 85.00, 'image' => null],
        ];

        $categoryMap = DB::table('categories')->pluck('id', 'name')->all();

        $hasPrice = Schema::hasColumn('products', 'price');
        $hasSellingPrice = Schema::hasColumn('products', 'selling_price');
        $hasImageUrl = Schema::hasColumn('products', 'image_url');
        $hasImagePath = Schema::hasColumn('products', 'image_path');
        $hasDescription = Schema::hasColumn('products', 'description');
        $hasCategoryId = Schema::hasColumn('products', 'category_id');
        $hasSku = Schema::hasColumn('products', 'sku');
        $hasBarcode = Schema::hasColumn('products', 'barcode');

        foreach ($products as $key => $prod) {
            $catId = $categoryMap[$prod['category']] ?? null;
            $existing = DB::table('products')->where('name', $prod['name'])->first();

            $data = [
                'name' => $prod['name'],
                'updated_at' => now(),
            ];
            if (!$existing) {
                $data['created_at'] = now();
            }

            if ($hasDescription) $data['description'] = $prod['description'];
            if ($hasCategoryId && $catId) $data['category_id'] = $catId;

            if ($hasPrice) $data['price'] = $prod['price'];
            if ($hasSellingPrice) $data['selling_price'] = $prod['price'];

            // Only set initial seeder image if the product is brand new or has no image
            if (!$existing || empty($existing->image_path)) {
                if ($hasImageUrl) $data['image_url'] = $prod['image'];
                if ($hasImagePath) $data['image_path'] = $prod['image'];
            }

            if ($hasSku) {
                $data['sku'] = $existing->sku ?? (strtoupper(substr($prod['category'], 0, 3)) . str_pad($key + 1, 3, '0', STR_PAD_LEFT));
            }
            if ($hasBarcode) {
                $data['barcode'] = $existing->barcode ?? ('888' . str_pad(mt_rand(0, 999999999), 9, '0', STR_PAD_LEFT));
            }

            DB::table('products')->updateOrInsert(['name' => $prod['name']], $data);
        }

        // --- Seed Pivot tables: Associate all categories & products with all branches ---
        $branches = DB::table('branches')->pluck('id')->toArray();
        $dbProducts = DB::table('products')->pluck('id')->toArray();
        $dbCategories = DB::table('categories')->pluck('id')->toArray();

        foreach ($branches as $branchId) {
            // Seed branch_category
            foreach ($dbCategories as $categoryId) {
                DB::table('branch_category')->updateOrInsert(
                    ['branch_id' => $branchId, 'category_id' => $categoryId],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }

            // Seed branch_product
            foreach ($dbProducts as $productId) {
                DB::table('branch_product')->updateOrInsert(
                    ['branch_id' => $branchId, 'product_id' => $productId],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }
}
