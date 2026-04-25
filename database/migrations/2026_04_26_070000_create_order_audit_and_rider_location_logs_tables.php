<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->nullable(); // Admin or customer who triggered
            $table->unsignedBigInteger('rider_id')->nullable(); // Rider who triggered
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->string('device_ip')->nullable();
            $table->string('user_agent')->nullable();
            $table->text('reason')->nullable(); // e.g. cancellation reason
            $table->timestamps();
        });

        Schema::create('rider_location_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rider_id')->constrained()->cascadeOnDelete();
            $table->foreignId('delivery_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('latitude', 11, 8);
            $table->decimal('longitude', 11, 8);
            $table->decimal('speed', 8, 2)->nullable();
            $table->decimal('heading', 8, 2)->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rider_location_logs');
        Schema::dropIfExists('order_audit_logs');
    }
};
