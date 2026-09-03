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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'consecutive_cancellations')) {
                $table->unsignedInteger('consecutive_cancellations')->default(0)->after('is_order_restricted');
            }
            if (!Schema::hasColumn('users', 'restriction_source')) {
                $table->string('restriction_source', 20)->nullable()->after('consecutive_cancellations');
            }
            if (!Schema::hasColumn('users', 'restriction_reason')) {
                $table->text('restriction_reason')->nullable()->after('restriction_source');
            }
            if (!Schema::hasColumn('users', 'restriction_removed_at')) {
                $table->timestamp('restriction_removed_at')->nullable()->after('restriction_reason');
            }
            if (!Schema::hasColumn('users', 'restriction_removed_by')) {
                $table->foreignId('restriction_removed_by')->nullable()->constrained('users')->nullOnDelete()->after('restriction_removed_at');
            }
        });

        Schema::table('riders', function (Blueprint $table) {
            if (!Schema::hasColumn('riders', 'consecutive_delivery_failures')) {
                $table->unsignedInteger('consecutive_delivery_failures')->default(0)->after('is_delivery_restricted');
            }
            if (!Schema::hasColumn('riders', 'restriction_source')) {
                $table->string('restriction_source', 20)->nullable()->after('consecutive_delivery_failures');
            }
            if (!Schema::hasColumn('riders', 'restriction_reason')) {
                $table->text('restriction_reason')->nullable()->after('restriction_source');
            }
            if (!Schema::hasColumn('riders', 'restriction_removed_at')) {
                $table->timestamp('restriction_removed_at')->nullable()->after('restriction_reason');
            }
            if (!Schema::hasColumn('riders', 'restriction_removed_by')) {
                $table->foreignId('restriction_removed_by')->nullable()->constrained('users')->nullOnDelete()->after('restriction_removed_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('riders', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('riders', 'restriction_removed_by')) {
                $table->dropForeign(['restriction_removed_by']);
                $cols[] = 'restriction_removed_by';
            }
            if (Schema::hasColumn('riders', 'restriction_removed_at')) $cols[] = 'restriction_removed_at';
            if (Schema::hasColumn('riders', 'restriction_reason')) $cols[] = 'restriction_reason';
            if (Schema::hasColumn('riders', 'restriction_source')) $cols[] = 'restriction_source';
            if (Schema::hasColumn('riders', 'consecutive_delivery_failures')) $cols[] = 'consecutive_delivery_failures';
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });

        Schema::table('users', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('users', 'restriction_removed_by')) {
                $table->dropForeign(['restriction_removed_by']);
                $cols[] = 'restriction_removed_by';
            }
            if (Schema::hasColumn('users', 'restriction_removed_at')) $cols[] = 'restriction_removed_at';
            if (Schema::hasColumn('users', 'restriction_reason')) $cols[] = 'restriction_reason';
            if (Schema::hasColumn('users', 'restriction_source')) $cols[] = 'restriction_source';
            if (Schema::hasColumn('users', 'consecutive_cancellations')) $cols[] = 'consecutive_cancellations';
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
