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
        // 1. Create delivery_attempts table
        if (!Schema::hasTable('delivery_attempts')) {
            Schema::create('delivery_attempts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('delivery_id')->constrained('deliveries')->onDelete('cascade');
                $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('cascade');
                $table->foreignId('sale_id')->nullable()->constrained('sales')->onDelete('cascade');
                $table->foreignId('rider_id')->nullable()->constrained('riders')->onDelete('set null');
                $table->unsignedInteger('attempt_number')->default(1);
                $table->string('status', 30)->default('attempted'); // attempted, failed, delivered
                $table->string('failure_reason', 60)->nullable();   // CUSTOMER_REFUSED_ORDER, CUSTOMER_UNAVAILABLE, etc.
                $table->string('failure_category', 40)->nullable(); // customer_attributable, rider_issue, business_delay, system_issue, other
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->decimal('distance_from_customer', 8, 2)->nullable(); // Distance in km between rider and customer location
                $table->text('notes')->nullable();
                $table->string('proof_image_path')->nullable();
                $table->timestamps();

                $table->index(['delivery_id', 'attempt_number']);
                $table->index('failure_reason');
                $table->index('failure_category');
            });
        }

        // 2. Add security columns to orders table
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'idempotency_key')) {
                $table->string('idempotency_key', 64)->nullable()->index()->after('order_number');
            }
            if (!Schema::hasColumn('orders', 'is_cod')) {
                $table->boolean('is_cod')->default(false)->after('payment_method');
            }
            if (!Schema::hasColumn('orders', 'risk_level')) {
                $table->string('risk_level', 20)->default('LOW_RISK')->after('is_cod');
            }
        });

        // 3. Add security & trust columns to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'phone_verified_at')) {
                $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            }
            if (!Schema::hasColumn('users', 'cod_restricted')) {
                $table->boolean('cod_restricted')->default(false)->after('role');
            }
            if (!Schema::hasColumn('users', 'cod_restriction_reason')) {
                $table->string('cod_restriction_reason')->nullable()->after('cod_restricted');
            }
            if (!Schema::hasColumn('users', 'risk_level_override')) {
                $table->string('risk_level_override', 20)->nullable()->after('cod_restriction_reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_attempts');

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'idempotency_key')) {
                $table->dropColumn('idempotency_key');
            }
            if (Schema::hasColumn('orders', 'is_cod')) {
                $table->dropColumn('is_cod');
            }
            if (Schema::hasColumn('orders', 'risk_level')) {
                $table->dropColumn('risk_level');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'phone_verified_at')) {
                $table->dropColumn('phone_verified_at');
            }
            if (Schema::hasColumn('users', 'cod_restricted')) {
                $table->dropColumn('cod_restricted');
            }
            if (Schema::hasColumn('users', 'cod_restriction_reason')) {
                $table->dropColumn('cod_restriction_reason');
            }
            if (Schema::hasColumn('users', 'risk_level_override')) {
                $table->dropColumn('risk_level_override');
            }
        });
    }
};
