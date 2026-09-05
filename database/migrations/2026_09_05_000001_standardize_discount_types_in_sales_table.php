<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Standardize historical discount_type values in the sales table
        if (Schema::hasTable('sales')) {
            DB::table('sales')
                ->whereIn('discount_type', ['senior_citizen', 'pwd', 'solo_parent', 'national_athlete', 'employee'])
                ->update(['discount_type' => 'twenty_percent']);

            DB::table('sales')
                ->whereIn('discount_type', ['custom_percentage', 'custom_fixed'])
                ->update(['discount_type' => 'custom']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive rollback: types remain valid
    }
};
