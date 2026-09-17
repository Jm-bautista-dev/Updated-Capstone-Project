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
            if (!Schema::hasColumn('users', 'google_id')) {
                $table->string('google_id')->nullable()->index()->after('email');
            }
            if (!Schema::hasColumn('users', 'avatar_id')) {
                $table->unsignedInteger('avatar_id')->default(1)->after('profile_photo_path');
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('account_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('users', 'google_id')) {
                $cols[] = 'google_id';
            }
            if (Schema::hasColumn('users', 'avatar_id')) {
                $cols[] = 'avatar_id';
            }
            if (Schema::hasColumn('users', 'is_active')) {
                $cols[] = 'is_active';
            }
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
