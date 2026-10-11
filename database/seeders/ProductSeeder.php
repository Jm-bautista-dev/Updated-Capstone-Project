<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * ProductSeeder guard:
     * Never insert unauthorized mock products (such as 'Spicy Tuna Maki', 'Dragon Roll', 'Tonkotsu Ramen') into production.
     * The official MAKI DESU menu catalog is preserved as the single source of truth.
     */
    public function run(): void
    {
        $this->command?->info("ProductSeeder: Guarded. Authentic MAKI DESU catalog products are preserved and not overwritten.");
    }
}
