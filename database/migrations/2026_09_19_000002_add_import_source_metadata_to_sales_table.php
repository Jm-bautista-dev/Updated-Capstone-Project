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
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'source')) {
                $table->string('source', 50)->nullable()->default(null)->index()->after('status');
            }
            if (!Schema::hasColumn('sales', 'source_system')) {
                $table->string('source_system', 50)->nullable()->default(null)->after('source');
            }
            if (!Schema::hasColumn('sales', 'sales_import_id')) {
                $table->foreignId('sales_import_id')->nullable()->after('source_system')->constrained('sales_imports')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'sales_import_id')) {
                $table->dropForeign(['sales_import_id']);
                $table->dropColumn('sales_import_id');
            }
            if (Schema::hasColumn('sales', 'source_system')) {
                $table->dropColumn('source_system');
            }
            if (Schema::hasColumn('sales', 'source')) {
                $table->dropColumn('source');
            }
        });
    }
};
