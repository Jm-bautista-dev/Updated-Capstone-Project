<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Harden status column to string to prevent MySQL strict ENUM truncation warnings
            if (Schema::hasColumn('sales', 'status')) {
                $table->string('status', 50)->default('completed')->change();
            }
        });
    }

    public function down(): void
    {
        // Safe no-op on rollback
    }
};
