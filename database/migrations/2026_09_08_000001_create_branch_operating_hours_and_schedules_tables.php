<?php

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
        // 1. Add operating mode and override fields to branches table
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'operating_mode')) {
                $table->string('operating_mode', 32)->default('automatic')->after('delivery_radius_km');
            }
            if (!Schema::hasColumn('branches', 'mode_override_reason')) {
                $table->string('mode_override_reason', 255)->nullable()->after('operating_mode');
            }
            if (!Schema::hasColumn('branches', 'mode_override_until')) {
                $table->dateTime('mode_override_until')->nullable()->after('mode_override_reason');
            }
            if (!Schema::hasColumn('branches', 'mode_override_at')) {
                $table->dateTime('mode_override_at')->nullable()->after('mode_override_until');
            }
            if (!Schema::hasColumn('branches', 'mode_override_by')) {
                $table->foreignId('mode_override_by')->nullable()->after('mode_override_at')->constrained('users')->nullOnDelete();
            }
        });

        // 2. Create regular weekly branch schedules table (Monday to Sunday)
        if (!Schema::hasTable('branch_schedules')) {
            Schema::create('branch_schedules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->unsignedTinyInteger('day_of_week'); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                $table->time('open_time')->default('10:00:00');
                $table->time('close_time')->default('20:00:00');
                $table->boolean('is_closed')->default(false);
                $table->timestamps();

                $table->unique(['branch_id', 'day_of_week']);
            });
        }

        // 3. Create special date schedules table (Holidays, 24h events, custom hours)
        if (!Schema::hasTable('branch_special_schedules')) {
            Schema::create('branch_special_schedules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->date('date');
                $table->boolean('is_closed_all_day')->default(false);
                $table->boolean('is_open_24_hours')->default(false);
                $table->time('open_time')->nullable();
                $table->time('close_time')->nullable();
                $table->string('reason', 255)->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->unique(['branch_id', 'date']);
            });
        }

        // 4. Seed default regular weekly schedules for existing branches safely
        $existingBranches = DB::table('branches')->get();
        foreach ($existingBranches as $branch) {
            $isStaCruz = (str_contains(strtolower($branch->name), 'sta') && str_contains(strtolower($branch->name), 'cruz')) || $branch->id == 2;
            $openTime = '10:00:00';
            $closeTime = $isStaCruz ? '19:45:00' : '20:00:00';

            for ($day = 0; $day <= 6; $day++) {
                DB::table('branch_schedules')->updateOrInsert(
                    [
                        'branch_id'   => $branch->id,
                        'day_of_week' => $day,
                    ],
                    [
                        'open_time'   => $openTime,
                        'close_time'  => $closeTime,
                        'is_closed'   => false,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_special_schedules');
        Schema::dropIfExists('branch_schedules');

        Schema::table('branches', function (Blueprint $table) {
            if (Schema::hasColumn('branches', 'mode_override_by')) {
                $table->dropForeign(['mode_override_by']);
                $table->dropColumn('mode_override_by');
            }
            $columnsToDrop = [
                'operating_mode',
                'mode_override_reason',
                'mode_override_until',
                'mode_override_at',
            ];
            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('branches', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
