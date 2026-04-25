<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fix coordinates precision to allow 3 digits before the decimal point (e.g., 121.xxxx)
        // DECIMAL(11, 8) allows for 3 digits before and 8 digits after the decimal point
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE deliveries MODIFY latitude DECIMAL(11, 8) NULL, MODIFY longitude DECIMAL(11, 8) NULL');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders MODIFY latitude DECIMAL(11, 8) NULL, MODIFY longitude DECIMAL(11, 8) NULL');
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE deliveries MODIFY latitude DECIMAL(10, 8) NULL, MODIFY longitude DECIMAL(10, 8) NULL');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders MODIFY latitude DECIMAL(10, 8) NULL, MODIFY longitude DECIMAL(10, 8) NULL');
    }
};
