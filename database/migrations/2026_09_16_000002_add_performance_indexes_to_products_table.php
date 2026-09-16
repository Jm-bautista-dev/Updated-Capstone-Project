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
        Schema::table('products', function (Blueprint $table) {
            // Index for soft-deleted filtered listings ordered by name
            $table->index(['deleted_at', 'name'], 'products_deleted_at_name_idx');
            // Index for category filtering with soft deletes
            $table->index(['category_id', 'deleted_at'], 'products_category_id_deleted_at_idx');
            // Index for branch filtering with soft deletes
            $table->index(['branch_id', 'deleted_at'], 'products_branch_id_deleted_at_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_deleted_at_name_idx');
            $table->dropIndex('products_category_id_deleted_at_idx');
            $table->dropIndex('products_branch_id_deleted_at_idx');
        });
    }
};
