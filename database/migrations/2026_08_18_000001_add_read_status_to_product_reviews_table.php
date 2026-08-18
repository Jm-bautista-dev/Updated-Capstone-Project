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
            if (!Schema::hasColumn('product_reviews', 'is_seen')) {
                $table->boolean('is_seen')->default(false)->after('status');
            }
            if (!Schema::hasColumn('product_reviews', 'seen_at')) {
                $table->timestamp('seen_at')->nullable()->after('is_seen');
            }
            if (!Schema::hasColumn('product_reviews', 'seen_by')) {
                $table->foreignId('seen_by')->nullable()->after('seen_at')->constrained('users')->onDelete('set null');
            }
            $table->index(['product_id', 'is_seen'], 'product_reviews_product_seen_idx');
            $table->index(['branch_id', 'is_seen'], 'product_reviews_branch_seen_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            try {
                $table->dropIndex('product_reviews_product_seen_idx');
                $table->dropIndex('product_reviews_branch_seen_idx');
            } catch (\Throwable $e) {}

            $dropCols = [];
            if (Schema::hasColumn('product_reviews', 'seen_by')) {
                $table->dropForeign(['seen_by']);
                $dropCols[] = 'seen_by';
            }
            if (Schema::hasColumn('product_reviews', 'seen_at')) {
                $dropCols[] = 'seen_at';
            }
            if (Schema::hasColumn('product_reviews', 'is_seen')) {
                $dropCols[] = 'is_seen';
            }
            if (!empty($dropCols)) {
                $table->dropColumn($dropCols);
            }
        });
    }
};
