<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ingredient_logs', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('user_id')->constrained()->cascadeOnDelete();
        });

        // Try to backfill branch_id from the reason string "Branch #1" or similar
        $logs = DB::table('ingredient_logs')->where('reason', 'like', '%Branch #%')->get();
        foreach ($logs as $log) {
            if (preg_match('/Branch #(\d+)/', $log->reason, $matches)) {
                DB::table('ingredient_logs')->where('id', $log->id)->update(['branch_id' => $matches[1]]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingredient_logs', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
