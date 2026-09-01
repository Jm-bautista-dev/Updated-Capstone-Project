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
        // 1. Add Pickup and Source fields to Orders table
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'fulfillment_type')) {
                $table->string('fulfillment_type', 20)->default('delivery')->after('idempotency_key')->index();
            }
            if (!Schema::hasColumn('orders', 'order_source')) {
                $table->string('order_source', 30)->default('mobile_app')->after('fulfillment_type')->index();
            }
            if (!Schema::hasColumn('orders', 'source_reference')) {
                $table->string('source_reference', 255)->nullable()->after('order_source');
            }
            if (!Schema::hasColumn('orders', 'payment_status')) {
                $table->string('payment_status', 20)->default('unpaid')->after('payment_method')->index();
            }
            if (!Schema::hasColumn('orders', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('payment_status');
            }
            if (!Schema::hasColumn('orders', 'scheduled_pickup_at')) {
                $table->timestamp('scheduled_pickup_at')->nullable()->after('paid_at')->index();
            }
            if (!Schema::hasColumn('orders', 'estimated_prep_time_minutes')) {
                $table->integer('estimated_prep_time_minutes')->default(20)->after('scheduled_pickup_at');
            }
            if (!Schema::hasColumn('orders', 'prep_start_at')) {
                $table->timestamp('prep_start_at')->nullable()->after('estimated_prep_time_minutes')->index();
            }
            if (!Schema::hasColumn('orders', 'actual_customer_arrival_at')) {
                $table->timestamp('actual_customer_arrival_at')->nullable()->after('prep_start_at');
            }
            if (!Schema::hasColumn('orders', 'pickup_completed_at')) {
                $table->timestamp('pickup_completed_at')->nullable()->after('actual_customer_arrival_at');
            }
            if (!Schema::hasColumn('orders', 'pickup_verification_code')) {
                $table->string('pickup_verification_code', 10)->nullable()->after('pickup_completed_at')->index();
            }
            if (!Schema::hasColumn('orders', 'pickup_notes')) {
                $table->text('pickup_notes')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('orders', 'internal_notes')) {
                $table->text('internal_notes')->nullable()->after('pickup_notes');
            }
        });

        // 2. Add Pickup configurations to Branches table
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'pickup_enabled')) {
                $table->boolean('pickup_enabled')->default(true)->after('name');
            }
            if (!Schema::hasColumn('branches', 'pickup_lead_time_minutes')) {
                $table->integer('pickup_lead_time_minutes')->default(20)->after('pickup_enabled');
            }
            if (!Schema::hasColumn('branches', 'pickup_slot_interval_minutes')) {
                $table->integer('pickup_slot_interval_minutes')->default(15)->after('pickup_lead_time_minutes');
            }
            if (!Schema::hasColumn('branches', 'pickup_max_orders_per_slot')) {
                $table->integer('pickup_max_orders_per_slot')->default(10)->after('pickup_slot_interval_minutes');
            }
            if (!Schema::hasColumn('branches', 'pickup_opening_time')) {
                $table->time('pickup_opening_time')->default('09:00:00')->after('pickup_max_orders_per_slot');
            }
            if (!Schema::hasColumn('branches', 'pickup_closing_time')) {
                $table->time('pickup_closing_time')->default('21:00:00')->after('pickup_opening_time');
            }
            if (!Schema::hasColumn('branches', 'pickup_cutoff_before_close_minutes')) {
                $table->integer('pickup_cutoff_before_close_minutes')->default(30)->after('pickup_closing_time');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $columns = [
                'fulfillment_type',
                'order_source',
                'source_reference',
                'payment_status',
                'paid_at',
                'scheduled_pickup_at',
                'estimated_prep_time_minutes',
                'prep_start_at',
                'actual_customer_arrival_at',
                'pickup_completed_at',
                'pickup_verification_code',
                'pickup_notes',
                'internal_notes',
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('branches', function (Blueprint $table) {
            $columns = [
                'pickup_enabled',
                'pickup_lead_time_minutes',
                'pickup_slot_interval_minutes',
                'pickup_max_orders_per_slot',
                'pickup_opening_time',
                'pickup_closing_time',
                'pickup_cutoff_before_close_minutes',
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('branches', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
