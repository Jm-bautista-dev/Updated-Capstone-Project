<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ingredient_logs', function (Blueprint $table) {
            // `foreignId()->constrained()` already creates an index for ingredient_id,
            // so we avoid re-creating it here to prevent sqlite conflicts during tests.
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingredient_logs', function (Blueprint $table) {
            // The index on ingredient_id is created by the foreign key constraint,
            // so we don't drop it here.
            $table->dropIndex(['user_id']);
            $table->dropIndex(['created_at']);
        });
    }
};
