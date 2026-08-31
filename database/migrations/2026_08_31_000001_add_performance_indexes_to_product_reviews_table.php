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
        Schema::table('product_reviews', function (Blueprint $table) {
            // Composite index for fast product-specific pagination & sorting
            $table->index(['product_id', 'created_at'], 'prod_reviews_prod_created_idx');
            // Composite index for rating filtering
            $table->index(['product_id', 'rating'], 'prod_reviews_prod_rating_idx');
            // Index for status and date ordering
            $table->index(['status', 'created_at'], 'prod_reviews_status_created_idx');
            // Single column rating index for global queries
            $table->index('rating', 'prod_reviews_rating_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            try {
                $table->dropIndex('prod_reviews_prod_created_idx');
                $table->dropIndex('prod_reviews_prod_rating_idx');
                $table->dropIndex('prod_reviews_status_created_idx');
                $table->dropIndex('prod_reviews_rating_idx');
            } catch (\Throwable $e) {
                // Ignore if indices don't exist
            }
        });
    }
};
