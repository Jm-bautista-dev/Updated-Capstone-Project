<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('delivery_radius_km', 5, 2)->default(5.00)->after('longitude');
            $table->boolean('has_internal_riders')->default(false)->after('delivery_radius_km');
            $table->decimal('base_delivery_fee', 8, 2)->default(49.00)->after('has_internal_riders');
            $table->decimal('per_km_fee', 8, 2)->default(15.00)->after('base_delivery_fee');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn([
                'latitude', 'longitude', 'delivery_radius_km',
                'has_internal_riders', 'base_delivery_fee', 'per_km_fee',
            ]);
        });
    }
};
