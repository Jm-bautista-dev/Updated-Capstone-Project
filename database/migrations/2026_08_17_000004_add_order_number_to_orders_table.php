<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'order_number')) {
                $table->string('order_number')->nullable()->after('id');
            }
        });

        // Backfill existing orders with ORD-{id}
        $concatExpr = DB::getDriverName() === 'sqlite' ? "'ORD-' || id" : "CONCAT('ORD-', id)";
        DB::table('orders')
            ->whereNull('order_number')
            ->update([
                'order_number' => DB::raw($concatExpr)
            ]);

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['branch_id', 'status', 'order_number'], 'orders_branch_status_number_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            try {
                $table->dropIndex('orders_branch_status_number_idx');
            } catch (\Throwable $e) {}
            if (Schema::hasColumn('orders', 'order_number')) {
                $table->dropColumn('order_number');
            }
        });
    }
};
