<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('synced_operations', function (Blueprint $table) {
            $table->id();
            $table->string('client_op_id')->unique()->index();
            $table->string('status'); // 'success', 'conflict'
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('synced_operations');
    }
};
