<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Seed categories guard:
     * Never insert unauthorized mock categories (such as 'Maki & Rolls', 'Donburi') into production.
     * The official MAKI DESU catalog categories are managed via database migrations and administrative catalog tools.
     */
    public function run(): void
    {
        $this->command?->info("CategorySeeder: Guarded. Authentic MAKI DESU catalog categories are preserved and not overwritten.");
    }
}
