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
        // 1. Deliveries table enhancements
        if (Schema::hasTable('deliveries')) {
            Schema::table('deliveries', function (Blueprint $table) {
                if (!Schema::hasColumn('deliveries', 'return_status')) {
                    $table->string('return_status')->nullable()->after('status');
                }
                if (!Schema::hasColumn('deliveries', 'return_reason')) {
                    $table->string('return_reason')->nullable()->after('return_status');
                }
                if (!Schema::hasColumn('deliveries', 'return_notes')) {
                    $table->text('return_notes')->nullable()->after('return_reason');
                }
                if (!Schema::hasColumn('deliveries', 'return_requested_at')) {
                    $table->timestamp('return_requested_at')->nullable()->after('return_notes');
                }
                if (!Schema::hasColumn('deliveries', 'return_reported_at')) {
                    $table->timestamp('return_reported_at')->nullable()->after('return_requested_at');
                }
                if (!Schema::hasColumn('deliveries', 'return_verified_at')) {
                    $table->timestamp('return_verified_at')->nullable()->after('return_reported_at');
                }
                if (!Schema::hasColumn('deliveries', 'return_verified_by')) {
                    $table->foreignId('return_verified_by')->nullable()->after('return_verified_at')->constrained('users')->nullOnDelete();
                }
                if (!Schema::hasColumn('deliveries', 'return_resolution')) {
                    $table->string('return_resolution')->nullable()->after('return_verified_by');
                }
                if (!Schema::hasColumn('deliveries', 'reassigned_at')) {
                    $table->timestamp('reassigned_at')->nullable()->after('return_resolution');
                }
            });
        }

        // 2. Order cancellation requests enhancements
        if (Schema::hasTable('order_cancellation_requests')) {
            Schema::table('order_cancellation_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('order_cancellation_requests', 'return_status')) {
                    $table->string('return_status')->nullable()->after('status');
                }
                if (!Schema::hasColumn('order_cancellation_requests', 'return_reported_at')) {
                    $table->timestamp('return_reported_at')->nullable()->after('return_status');
                }
                if (!Schema::hasColumn('order_cancellation_requests', 'return_verified_at')) {
                    $table->timestamp('return_verified_at')->nullable()->after('return_reported_at');
                }
                if (!Schema::hasColumn('order_cancellation_requests', 'return_verified_by')) {
                    $table->foreignId('return_verified_by')->nullable()->after('return_verified_at')->constrained('users')->nullOnDelete();
                }
                if (!Schema::hasColumn('order_cancellation_requests', 'action_type')) {
                    $table->string('action_type')->nullable()->after('return_verified_by');
                }
                if (!Schema::hasColumn('order_cancellation_requests', 'resolution_action')) {
                    $table->string('resolution_action')->nullable()->after('action_type');
                }
            });
        }

        // 3. Cancellation requests legacy table enhancements
        if (Schema::hasTable('cancellation_requests')) {
            Schema::table('cancellation_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('cancellation_requests', 'return_status')) {
                    $table->string('return_status')->nullable()->after('status');
                }
                if (!Schema::hasColumn('cancellation_requests', 'return_reported_at')) {
                    $table->timestamp('return_reported_at')->nullable()->after('return_status');
                }
                if (!Schema::hasColumn('cancellation_requests', 'return_verified_at')) {
                    $table->timestamp('return_verified_at')->nullable()->after('return_reported_at');
                }
                if (!Schema::hasColumn('cancellation_requests', 'return_verified_by')) {
                    $table->foreignId('return_verified_by')->nullable()->after('return_verified_at')->constrained('users')->nullOnDelete();
                }
                if (!Schema::hasColumn('cancellation_requests', 'action_type')) {
                    $table->string('action_type')->nullable()->after('return_verified_by');
                }
                if (!Schema::hasColumn('cancellation_requests', 'resolution_action')) {
                    $table->string('resolution_action')->nullable()->after('action_type');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('deliveries')) {
            Schema::table('deliveries', function (Blueprint $table) {
                $cols = [
                    'return_status', 'return_reason', 'return_notes', 'return_requested_at',
                    'return_reported_at', 'return_verified_at', 'return_verified_by',
                    'return_resolution', 'reassigned_at'
                ];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('deliveries', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('order_cancellation_requests')) {
            Schema::table('order_cancellation_requests', function (Blueprint $table) {
                $cols = ['return_status', 'return_reported_at', 'return_verified_at', 'return_verified_by', 'action_type', 'resolution_action'];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('order_cancellation_requests', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('cancellation_requests')) {
            Schema::table('cancellation_requests', function (Blueprint $table) {
                $cols = ['return_status', 'return_reported_at', 'return_verified_at', 'return_verified_by', 'action_type', 'resolution_action'];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('cancellation_requests', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
