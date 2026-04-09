<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->softDeletes();
            $table->foreignId('created_by')->nullable()->after('branch_id')->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();

            // Performance indexes
            $table->index('status');
            $table->index('branch_id');
            $table->index(['name', 'branch_id']);
        });

        // Add cost_price to ingredients if it doesn't exist
        if (!Schema::hasColumn('ingredients', 'cost_price')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->decimal('cost_price', 10, 2)->default(0)->after('unit');
            });
        }

        // Add indexes to the pivot table for faster joins
        Schema::table('supplier_ingredient', function (Blueprint $table) {
            $table->unique(['supplier_id', 'ingredient_id'], 'supplier_ingredient_unique');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            $table->dropColumn(['created_by', 'updated_by']);
            $table->dropIndex(['status']);
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['name', 'branch_id']);
        });

        if (Schema::hasColumn('ingredients', 'cost_price')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->dropColumn('cost_price');
            });
        }

        Schema::table('supplier_ingredient', function (Blueprint $table) {
            $table->dropUnique('supplier_ingredient_unique');
        });
    }
};
