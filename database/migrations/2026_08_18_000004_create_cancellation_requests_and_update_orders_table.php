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
        // 1. Update orders table with cancellation flags
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'is_cancellation_pending')) {
                $table->boolean('is_cancellation_pending')->default(false)->after('status');
            }
            if (!Schema::hasColumn('orders', 'cancellation_status')) {
                $table->string('cancellation_status')->nullable()->after('is_cancellation_pending'); // 'pending', 'approved', 'rejected'
            }
        });

        // 2. Ensure cancellation_requests table exists
        if (!Schema::hasTable('cancellation_requests')) {
            Schema::create('cancellation_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
                $table->unsignedBigInteger('rider_id')->nullable();
                $table->string('reason');
                $table->text('notes')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('manager_notes')->nullable();
                $table->timestamps();

                $table->index(['order_id', 'status']);
                $table->index(['rider_id', 'status']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'cancellation_status')) {
                $table->dropColumn('cancellation_status');
            }
            if (Schema::hasColumn('orders', 'is_cancellation_pending')) {
                $table->dropColumn('is_cancellation_pending');
            }
        });

        Schema::dropIfExists('cancellation_requests');
    }
};
