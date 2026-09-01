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
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'discount')) {
                $table->decimal('discount', 10, 2)->default(0.00)->after('subtotal');
            }
            if (!Schema::hasColumn('sales', 'discount_type')) {
                $table->string('discount_type', 100)->nullable()->after('discount');
            }
            if (!Schema::hasColumn('sales', 'discount_details')) {
                $table->json('discount_details')->nullable()->after('discount_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'discount_details')) {
                $table->dropColumn('discount_details');
            }
            if (Schema::hasColumn('sales', 'discount_type')) {
                $table->dropColumn('discount_type');
            }
            if (Schema::hasColumn('sales', 'discount')) {
                $table->dropColumn('discount');
            }
        });
    }
};
