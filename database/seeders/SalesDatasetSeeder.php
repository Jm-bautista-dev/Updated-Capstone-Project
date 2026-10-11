<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class SalesDatasetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Guarded to prevent inventing or creating unauthorized products or categories.
     * Uses the official makidesu:import-historical-sales command which validates against authentic catalog.
     */
    public function run(): void
    {
        $this->command?->info("SalesDatasetSeeder: Delegating to official makidesu:import-historical-sales command with strict catalog validation...");
        Artisan::call('makidesu:import-historical-sales', [
            '--branch' => 'Sta Cruz',
            '--cashier-float' => 1500.00,
        ], $this->command?->getOutput());
    }
}
