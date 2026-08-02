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
            $driverName = Illuminate\Support\Facades\DB::connection()->getDriverName();
            if ($driverName === 'sqlite') {
                $indexExists = collect(Schema::getIndexes('deliveries'))->contains(fn($index) => ($index['name'] ?? '') === 'deliveries_status_created_at_index');
            } else {
                $indexExists = collect(Illuminate\Support\Facades\DB::select("SHOW INDEX FROM deliveries"))->contains(fn($index) => (($index->Key_name ?? $index['Key_name'] ?? '') === 'deliveries_status_created_at_index'));
            }
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
