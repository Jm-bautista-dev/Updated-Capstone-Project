<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            if (!Schema::hasColumn('deliveries', 'picked_up_at')) {
                $table->timestamp('picked_up_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('deliveries', 'transit_at')) {
                $table->timestamp('transit_at')->nullable()->after('picked_up_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            if (Schema::hasColumn('deliveries', 'transit_at')) {
                $table->dropColumn('transit_at');
            }
            if (Schema::hasColumn('deliveries', 'picked_up_at')) {
                $table->dropColumn('picked_up_at');
            }
        });
    }
};
