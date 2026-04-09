<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('riders', function (Blueprint $table) {
            $table->timestamp('last_active_at')->nullable()->after('status');
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->index(['status', 'created_at']);
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
