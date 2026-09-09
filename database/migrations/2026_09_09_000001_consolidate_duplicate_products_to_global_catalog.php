<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Artisan::call('makidesu:consolidate-products', ['--force' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Consolidation is an intentional normalization and data migration.
    }
};
