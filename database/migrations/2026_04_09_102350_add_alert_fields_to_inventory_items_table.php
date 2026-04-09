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
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->decimal('low_stock_threshold', 15, 4)->default(1.0)->after('unit');
            $table->string('last_alert_type')->nullable()->after('low_stock_threshold');
            $table->timestamp('last_alert_sent_at')->nullable()->after('last_alert_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn(['low_stock_threshold', 'last_alert_type', 'last_alert_sent_at']);
        });
    }
};
