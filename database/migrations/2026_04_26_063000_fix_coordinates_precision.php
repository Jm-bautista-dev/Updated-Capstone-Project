<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Illuminate\Support\Facades\DB::connection()->getDriverName() !== 'sqlite') {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE deliveries MODIFY latitude DECIMAL(11, 8) NULL, MODIFY longitude DECIMAL(11, 8) NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders MODIFY latitude DECIMAL(11, 8) NULL, MODIFY longitude DECIMAL(11, 8) NULL');
        }
    }

    public function down(): void
    {
        if (Illuminate\Support\Facades\DB::connection()->getDriverName() !== 'sqlite') {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE deliveries MODIFY latitude DECIMAL(10, 8) NULL, MODIFY longitude DECIMAL(10, 8) NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders MODIFY latitude DECIMAL(10, 8) NULL, MODIFY longitude DECIMAL(10, 8) NULL');
        }
    }
};
