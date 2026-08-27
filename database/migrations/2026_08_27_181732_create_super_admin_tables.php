<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. System Settings Table
        if (!Schema::hasTable('system_settings')) {
            Schema::create('system_settings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->string('group')->default('general')->index();
                $table->string('type')->default('string'); // string, boolean, json, integer
                $table->text('description')->nullable();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        // 2. Feature Flags Table
        if (!Schema::hasTable('feature_flags')) {
            Schema::create('feature_flags', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('is_enabled')->default(true);
                $table->json('rules')->nullable(); // targeting rules or conditions
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        // 3. Audit Logs Table (Immutable developer audit log)
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('actor_name')->nullable();
                $table->string('actor_role')->nullable()->index();
                $table->string('action')->index(); // e.g. 'maintenance.enabled', 'feature_flag.toggled'
                $table->string('target')->nullable();
                $table->json('before_state')->nullable();
                $table->json('after_state')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();
            });
        }

        // 4. System Error Logs Table
        if (!Schema::hasTable('system_error_logs')) {
            Schema::create('system_error_logs', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->string('error_fingerprint')->index(); // Hash of exception_class + file + line for grouping
                $table->enum('severity', ['info', 'warning', 'error', 'critical'])->default('error')->index();
                $table->string('exception_class')->index();
                $table->text('message');
                $table->integer('status_code')->default(500)->index();
                $table->string('endpoint')->nullable()->index();
                $table->string('method', 10)->nullable();
                $table->string('file')->nullable();
                $table->integer('line')->nullable();
                $table->longText('trace')->nullable();
                $table->string('request_id')->nullable()->index();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('user_role')->nullable();
                $table->unsignedInteger('occurrences')->default(1);
                $table->timestamp('first_seen_at')->useCurrent();
                $table->timestamp('last_seen_at')->useCurrent()->index();
                $table->boolean('is_resolved')->default(false)->index();
                $table->text('developer_notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_error_logs');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('system_settings');
    }
};
