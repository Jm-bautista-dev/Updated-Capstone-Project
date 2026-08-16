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
        Schema::table('deliveries', function (Blueprint $table) {
            if (!Schema::hasColumn('deliveries', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable()->after('status');
            }
        });

        // Backfill delivered_at for existing delivered records using updated_at / created_at
        DB::table('deliveries')
            ->where('status', 'delivered')
            ->whereNull('delivered_at')
            ->update([
                'delivered_at' => DB::raw('COALESCE(updated_at, created_at)')
            ]);

        Schema::table('deliveries', function (Blueprint $table) {
            $table->index(['delivered_at', 'status'], 'deliveries_delivered_at_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            try {
                $table->dropIndex('deliveries_delivered_at_status_idx');
            } catch (\Throwable $e) {}
            if (Schema::hasColumn('deliveries', 'delivered_at')) {
                $table->dropColumn('delivered_at');
            }
        });
    }
};
