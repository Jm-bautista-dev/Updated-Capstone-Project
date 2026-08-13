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
        Schema::table('riders', function (Blueprint $table) {
            if (!Schema::hasColumn('riders', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('status');
            }
            if (!Schema::hasColumn('riders', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
            if (!Schema::hasColumn('riders', 'accuracy')) {
                $table->decimal('accuracy', 8, 2)->nullable()->after('longitude');
            }
            if (!Schema::hasColumn('riders', 'speed')) {
                $table->decimal('speed', 8, 2)->nullable()->after('accuracy');
            }
            if (!Schema::hasColumn('riders', 'heading')) {
                $table->decimal('heading', 8, 2)->nullable()->after('speed');
            }
            if (!Schema::hasColumn('riders', 'location_updated_at')) {
                $table->timestamp('location_updated_at')->nullable()->after('heading');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('riders', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['latitude', 'longitude', 'accuracy', 'speed', 'heading', 'location_updated_at'] as $column) {
                if (Schema::hasColumn('riders', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
