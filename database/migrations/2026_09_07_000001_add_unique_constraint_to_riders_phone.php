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

            // 2. Handle soft-deleted riders: append suffix so they never conflict with active phone numbers
            $softDeleted = DB::table('riders')
                ->whereNotNull('phone')
                ->whereNotNull('deleted_at')
                ->get();

            foreach ($softDeleted as $delRider) {
                if (!str_contains($delRider->phone, '_del_') && !str_contains($delRider->phone, '_dup_')) {
                    DB::table('riders')
                        ->where('id', $delRider->id)
                        ->update(['phone' => $delRider->phone . '_del_' . $delRider->id]);
                }
            }

            // 3. Resolve any remaining duplicate phone numbers across the entire table
            $duplicates = DB::table('riders')
                ->whereNotNull('phone')
                ->select('phone')
                ->groupBy('phone')
                ->havingRaw('COUNT(id) > 1')
                ->pluck('phone');

            foreach ($duplicates as $dupPhone) {
                $duplicateRiders = DB::table('riders')
                    ->where('phone', $dupPhone)
                    ->orderBy('id', 'asc')
                    ->get();

                // Keep the first rider's phone intact, append suffix to duplicates
                $duplicateRiders->slice(1)->each(function ($dup) {
                    DB::table('riders')
                        ->where('id', $dup->id)
                        ->update(['phone' => $dup->phone . '_dup_' . $dup->id]);
                });
            }

            // 4. Widen phone column and add unique constraint
            Schema::table('riders', function (Blueprint $table) {
                $table->string('phone', 50)->nullable()->change();
            });

            if (!Schema::hasIndex('riders', 'riders_phone_unique')) {
                Schema::table('riders', function (Blueprint $table) {
                    $table->unique('phone', 'riders_phone_unique');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('riders') && Schema::hasColumn('riders', 'phone')) {
            if (Schema::hasIndex('riders', 'riders_phone_unique')) {
                Schema::table('riders', function (Blueprint $table) {
                    $table->dropUnique('riders_phone_unique');
                });
            }
            Schema::table('riders', function (Blueprint $table) {
                $table->string('phone', 20)->nullable()->change();
            });
        }
    }
};
