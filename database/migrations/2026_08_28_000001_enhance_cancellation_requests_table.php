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
        if (Schema::hasTable('cancellation_requests')) {
            Schema::table('cancellation_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('cancellation_requests', 'delivery_id')) {
                    $table->foreignId('delivery_id')->nullable()->after('order_id')->constrained('deliveries')->nullOnDelete();
                }
                if (!Schema::hasColumn('cancellation_requests', 'idempotency_key')) {
                    $table->string('idempotency_key')->nullable()->unique()->after('status');
                }
                if (!Schema::hasColumn('cancellation_requests', 'requested_at')) {
                    $table->timestamp('requested_at')->useCurrent()->after('idempotency_key');
                }
                if (!Schema::hasColumn('cancellation_requests', 'reviewed_by_name')) {
                    $table->string('reviewed_by_name')->nullable()->after('reviewed_by');
                }
                if (!Schema::hasColumn('cancellation_requests', 'resolution_notes')) {
                    $table->text('resolution_notes')->nullable()->after('reviewed_by_name');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('cancellation_requests')) {
            Schema::table('cancellation_requests', function (Blueprint $table) {
                $columns = ['delivery_id', 'idempotency_key', 'requested_at', 'reviewed_by_name', 'resolution_notes'];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('cancellation_requests', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
