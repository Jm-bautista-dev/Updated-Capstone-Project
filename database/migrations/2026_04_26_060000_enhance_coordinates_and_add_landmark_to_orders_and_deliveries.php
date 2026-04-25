<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update deliveries table
        Schema::table('deliveries', function (Blueprint $table) {
            // Modify existing latitude/longitude to 10,8
            $table->decimal('latitude', 10, 8)->nullable()->change();
            $table->decimal('longitude', 10, 8)->nullable()->change();
            
            // Add indices
            $table->index(['latitude', 'longitude'], 'deliveries_coordinates_index');

            if (!Schema::hasColumn('deliveries', 'landmark')) {
                $table->string('landmark')->nullable()->after('customer_address');
            }
            if (!Schema::hasColumn('deliveries', 'notes')) {
                $table->text('notes')->nullable()->after('landmark');
            }
        });

        // Update orders table
        Schema::table('orders', function (Blueprint $table) {
            // Modify existing latitude/longitude to 10,8
            $table->decimal('latitude', 10, 8)->nullable()->change();
            $table->decimal('longitude', 10, 8)->nullable()->change();

            // Add indices
            $table->index(['latitude', 'longitude'], 'orders_coordinates_index');

            if (!Schema::hasColumn('orders', 'landmark')) {
                $table->string('landmark')->nullable()->after('address');
            }
            if (!Schema::hasColumn('orders', 'notes')) {
                $table->text('notes')->nullable()->after('landmark');
            }
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropIndex('deliveries_coordinates_index');
            $table->decimal('latitude', 10, 7)->nullable()->change();
            $table->decimal('longitude', 10, 7)->nullable()->change();
            $table->dropColumn(['landmark', 'notes']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_coordinates_index');
            $table->decimal('latitude', 10, 7)->nullable()->change();
            $table->decimal('longitude', 10, 7)->nullable()->change();
            $table->dropColumn(['landmark', 'notes']);
        });
    }
};
