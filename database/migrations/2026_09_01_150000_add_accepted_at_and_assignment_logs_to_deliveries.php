<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            if (!Schema::hasColumn('deliveries', 'accepted_at')) {
                $table->timestamp('accepted_at')->nullable()->after('status');
            }
        });

        if (!Schema::hasTable('delivery_assignment_logs')) {
            Schema::create('delivery_assignment_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('delivery_id')->constrained('deliveries')->cascadeOnDelete();
                $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
                $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
                $table->foreignId('rider_id')->constrained('riders')->cascadeOnDelete();
                $table->string('assigned_by_type')->default('rider_self_accept'); // 'rider_self_accept', 'admin_manual', 'system'
                $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('previous_status')->nullable();
                $table->string('new_status');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['delivery_id', 'created_at']);
                $table->index(['rider_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_assignment_logs');

        Schema::table('deliveries', function (Blueprint $table) {
            if (Schema::hasColumn('deliveries', 'accepted_at')) {
                $table->dropColumn('accepted_at');
            }
        });
    }
};
