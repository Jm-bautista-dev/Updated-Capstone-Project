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
        Schema::table('scanned_receipts', function (Blueprint $table) {
            $table->dropUnique(['file_hash']);
            $table->index('file_hash', 'idx_scanned_receipts_file_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scanned_receipts', function (Blueprint $table) {
            $table->dropIndex('idx_scanned_receipts_file_hash');
            $table->unique('file_hash');
        });
    }
};
