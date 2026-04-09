<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            $table->enum('delivery_type', ['internal', 'external']);
            $table->enum('external_service', ['grab', 'lalamove'])->nullable();
            $table->string('tracking_number')->nullable();
            $table->foreignId('rider_id')->nullable()->constrained()->nullOnDelete();

            // Customer info
            $table->string('customer_name');
            $table->string('customer_phone', 20)->nullable();
            $table->text('customer_address');
            $table->decimal('distance_km', 8, 2)->nullable();

            // Fees (Grab-style)
            $table->decimal('delivery_fee', 8, 2)->default(0);
            $table->text('delivery_notes')->nullable();

            // Status flow
            $table->string('status')->default('pending');

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('delivery_type');
            $table->index('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
