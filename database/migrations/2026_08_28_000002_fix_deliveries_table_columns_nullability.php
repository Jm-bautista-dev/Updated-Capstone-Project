<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            // 1. Ensure order_id is nullable (for POS counter sales)
            if (Schema::hasColumn('deliveries', 'order_id')) {
                $table->foreignId('order_id')->nullable()->change();
            }

            // 2. Ensure sale_id is nullable (for mobile app orders)
            if (Schema::hasColumn('deliveries', 'sale_id')) {
                $table->foreignId('sale_id')->nullable()->change();
            }

            // 3. Ensure status column is a string column to avoid ENUM truncation warnings
            if (Schema::hasColumn('deliveries', 'status')) {
                $table->string('status', 50)->default('pending')->change();
            }
        });
    }

    public function down(): void
    {
        // Safe no-op on rollback
    }
};
