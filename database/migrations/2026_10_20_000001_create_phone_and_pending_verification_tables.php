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
        // 1. Pending Customer Registrations Table
        if (!Schema::hasTable('pending_registrations')) {
            Schema::create('pending_registrations', function (Blueprint $table) {
                $table->id();
                $table->string('registration_token', 64)->unique();
                $table->string('first_name');
                $table->string('last_name');
                $table->string('name')->nullable();
                $table->string('email')->index();
                $table->string('mobile_number', 20)->index();
                $table->string('password'); // Strictly bcrypt/argon hashed, NEVER plaintext
                $table->string('verification_method', 20)->default('phone'); // phone, email
                $table->string('status', 20)->default('pending')->index();   // pending, completed, expired, cancelled
                $table->unsignedInteger('verification_attempts')->default(0);
                $table->unsignedInteger('resend_count')->default(0);
                $table->timestamp('last_sent_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamp('verified_at')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();

                $table->index(['email', 'status']);
                $table->index(['mobile_number', 'status']);
            });
        }

        // 2. Phone Verification Sessions Table (Standalone / Profile / Pre-registration)
        if (!Schema::hasTable('phone_verifications')) {
            Schema::create('phone_verifications', function (Blueprint $table) {
                $table->id();
                $table->string('phone_number', 20)->index();
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
                $table->string('registration_token', 64)->nullable()->index();
                $table->boolean('is_verified')->default(false)->index();
                $table->timestamp('verified_at')->nullable();
                $table->unsignedInteger('verification_attempts')->default(0);
                $table->unsignedInteger('resend_count')->default(0);
                $table->timestamp('last_sent_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();

                $table->index(['phone_number', 'is_verified']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phone_verifications');
        Schema::dropIfExists('pending_registrations');
    }
};
