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
        Schema::table('deliveries', function (Blueprint $table) {
            // Add order_id for mobile orders
            if (!Schema::hasColumn('deliveries', 'order_id')) {
                $table->foreignId('order_id')->nullable()->after('sale_id')->constrained()->nullOnDelete();
            }
            
            // Make sale_id nullable since mobile orders don't have a sale_id yet
            $table->foreignId('sale_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('order_id');
            $table->foreignId('sale_id')->nullable(false)->change();
        });
    }
};
