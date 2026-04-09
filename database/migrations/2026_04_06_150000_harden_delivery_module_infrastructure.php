<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('riders', function (Blueprint $table) {
            if (!Schema::hasColumn('riders', 'last_active_at')) {
                $table->timestamp('last_active_at')->nullable()->after('status');
            }
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $indexExists = collect(DB::select("SHOW INDEX FROM deliveries"))->contains('Key_name', 'deliveries_status_created_at_index');
            if (!$indexExists) {
                $table->index(['status', 'created_at']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('riders', function (Blueprint $table) {
            $table->dropColumn('last_active_at');
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
        });
    }
};
