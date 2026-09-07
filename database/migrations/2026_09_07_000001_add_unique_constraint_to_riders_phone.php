<?php

use App\Models\Rider;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('riders') && Schema::hasColumn('riders', 'phone')) {
            // 1. Normalize existing phone numbers
            $riders = DB::table('riders')->whereNotNull('phone')->get();
            foreach ($riders as $rider) {
                $normalized = Rider::normalizePhone($rider->phone);
                if ($normalized !== $rider->phone) {
                    DB::table('riders')->where('id', $rider->id)->update(['phone' => $normalized]);
                }
            }

            // 2. Resolve any legacy duplicate active phone numbers before adding index
            $duplicates = DB::table('riders')
                ->whereNotNull('phone')
                ->whereNull('deleted_at')
                ->select('phone')
                ->groupBy('phone')
                ->havingRaw('COUNT(id) > 1')
                ->pluck('phone');

            foreach ($duplicates as $dupPhone) {
                $duplicateRiders = DB::table('riders')
                    ->where('phone', $dupPhone)
                    ->whereNull('deleted_at')
                    ->orderBy('id', 'asc')
                    ->get();

                // Keep the first rider's phone intact, append suffix to duplicates
                $duplicateRiders->slice(1)->each(function ($dup) {
                    DB::table('riders')
                        ->where('id', $dup->id)
                        ->update(['phone' => $dup->phone . '_dup_' . $dup->id]);
                });
            }

            // 3. Widen phone column and add unique constraint
            Schema::table('riders', function (Blueprint $table) {
                $table->string('phone', 50)->nullable()->change();
                $table->unique('phone', 'riders_phone_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('riders') && Schema::hasColumn('riders', 'phone')) {
            Schema::table('riders', function (Blueprint $table) {
                $table->dropUnique('riders_phone_unique');
                $table->string('phone', 20)->nullable()->change();
            });
        }
    }
};
