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
            if (!Schema::hasColumn('users', 'cod_restriction_source')) {
                $table->string('cod_restriction_source', 20)->nullable()->after('cod_restriction_reason');
            }
            if (!Schema::hasColumn('users', 'cod_restricted_at')) {
                $table->timestamp('cod_restricted_at')->nullable()->after('cod_restriction_source');
            }
            if (!Schema::hasColumn('users', 'cod_restriction_expires_at')) {
                $table->timestamp('cod_restriction_expires_at')->nullable()->after('cod_restricted_at');
            }
            if (!Schema::hasColumn('users', 'cod_restricted_by')) {
                $table->unsignedBigInteger('cod_restricted_by')->nullable()->after('cod_restriction_expires_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('users', 'cod_restriction_source')) {
                $columnsToDrop[] = 'cod_restriction_source';
            }
            if (Schema::hasColumn('users', 'cod_restricted_at')) {
                $columnsToDrop[] = 'cod_restricted_at';
            }
            if (Schema::hasColumn('users', 'cod_restriction_expires_at')) {
                $columnsToDrop[] = 'cod_restriction_expires_at';
            }
            if (Schema::hasColumn('users', 'cod_restricted_by')) {
                $columnsToDrop[] = 'cod_restricted_by';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
