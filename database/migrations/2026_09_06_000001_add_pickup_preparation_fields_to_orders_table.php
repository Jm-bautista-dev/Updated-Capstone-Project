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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'prep_notified_at')) {
                $table->timestamp('prep_notified_at')->nullable()->after('prep_start_at')->index();
            }
            if (!Schema::hasColumn('orders', 'prep_due_notified_secondary_at')) {
                $table->timestamp('prep_due_notified_secondary_at')->nullable()->after('prep_notified_at');
            }
            if (!Schema::hasColumn('orders', 'is_early_prep_override')) {
                $table->boolean('is_early_prep_override')->default(false)->after('prep_due_notified_secondary_at');
            }
            if (!Schema::hasColumn('orders', 'early_prep_actor_id')) {
                $table->foreignId('early_prep_actor_id')->nullable()->after('is_early_prep_override')->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'early_prep_actor_id')) {
                $table->dropForeign(['early_prep_actor_id']);
                $table->dropColumn('early_prep_actor_id');
            }
            $colsToDrop = [];
            foreach (['prep_notified_at', 'prep_due_notified_secondary_at', 'is_early_prep_override'] as $col) {
                if (Schema::hasColumn('orders', $col)) {
                    $colsToDrop[] = $col;
                }
            }
            if (!empty($colsToDrop)) {
                $table->dropColumn($colsToDrop);
            }
        });
    }
};
