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
        // 1. Create print_bridges table
        if (!Schema::hasTable('print_bridges')) {
            Schema::create('print_bridges', function (Blueprint $table) {
                $table->id();
                $table->string('bridge_uuid', 64)->unique();
                $table->string('name', 100);
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->string('terminal_id', 50)->nullable()->index();
                $table->string('device_type', 30)->default('android')->index(); // android, windows, network
                $table->string('paired_printer_name', 100)->nullable();
                $table->string('paired_printer_address', 100)->nullable(); // Bluetooth MAC address or IP
                $table->string('connection_type', 30)->default('bluetooth_spp'); // bluetooth_spp, bluetooth_ble, usb, tcp
                $table->string('status', 20)->default('online')->index(); // online, offline, printing
                $table->integer('battery_level')->nullable();
                $table->string('api_token', 80)->nullable()->index();
                $table->timestamp('last_heartbeat_at')->nullable()->index();
                $table->timestamps();
            });
        }

        // 2. Add claimed_by_bridge_id and claimed_at to print_jobs table
        Schema::table('print_jobs', function (Blueprint $table) {
            if (!Schema::hasColumn('print_jobs', 'claimed_by_bridge_id')) {
                $table->foreignId('claimed_by_bridge_id')->nullable()->after('terminal_id')->constrained('print_bridges')->nullOnDelete();
            }
            if (!Schema::hasColumn('print_jobs', 'claimed_at')) {
                $table->timestamp('claimed_at')->nullable()->after('claimed_by_bridge_id')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('print_jobs', function (Blueprint $table) {
            if (Schema::hasColumn('print_jobs', 'claimed_by_bridge_id')) {
                $table->dropForeign(['claimed_by_bridge_id']);
                $table->dropColumn('claimed_by_bridge_id');
            }
            if (Schema::hasColumn('print_jobs', 'claimed_at')) {
                $table->dropColumn('claimed_at');
            }
        });

        Schema::dropIfExists('print_bridges');
    }
};
