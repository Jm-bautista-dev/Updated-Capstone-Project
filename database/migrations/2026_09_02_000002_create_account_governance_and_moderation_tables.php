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
        // 1. Add governance & moderation columns to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'account_status')) {
                $table->string('account_status', 30)->default('active')->index()->after('role');
            }
            if (!Schema::hasColumn('users', 'status_reason')) {
                $table->text('status_reason')->nullable()->after('account_status');
            }
            if (!Schema::hasColumn('users', 'restricted_at')) {
                $table->timestamp('restricted_at')->nullable()->after('status_reason');
            }
            if (!Schema::hasColumn('users', 'suspended_at')) {
                $table->timestamp('suspended_at')->nullable()->after('restricted_at');
            }
            if (!Schema::hasColumn('users', 'deactivated_at')) {
                $table->timestamp('deactivated_at')->nullable()->after('suspended_at');
            }
            if (!Schema::hasColumn('users', 'status_changed_by')) {
                $table->foreignId('status_changed_by')->nullable()->constrained('users')->nullOnDelete()->after('deactivated_at');
            }
            if (!Schema::hasColumn('users', 'is_order_restricted')) {
                $table->boolean('is_order_restricted')->default(false)->after('status_changed_by');
            }
        });

        // 2. Add governance & moderation columns to riders table
        Schema::table('riders', function (Blueprint $table) {
            if (!Schema::hasColumn('riders', 'account_status')) {
                $table->string('account_status', 30)->default('active')->index()->after('role');
            }
            if (!Schema::hasColumn('riders', 'status_reason')) {
                $table->text('status_reason')->nullable()->after('account_status');
            }
            if (!Schema::hasColumn('riders', 'restricted_at')) {
                $table->timestamp('restricted_at')->nullable()->after('status_reason');
            }
            if (!Schema::hasColumn('riders', 'suspended_at')) {
                $table->timestamp('suspended_at')->nullable()->after('restricted_at');
            }
            if (!Schema::hasColumn('riders', 'deactivated_at')) {
                $table->timestamp('deactivated_at')->nullable()->after('suspended_at');
            }
            if (!Schema::hasColumn('riders', 'status_changed_by')) {
                $table->foreignId('status_changed_by')->nullable()->constrained('users')->nullOnDelete()->after('deactivated_at');
            }
            if (!Schema::hasColumn('riders', 'is_delivery_restricted')) {
                $table->boolean('is_delivery_restricted')->default(false)->after('status_changed_by');
            }
        });

        // 3. Create moderation_cases table
        if (!Schema::hasTable('moderation_cases')) {
            Schema::create('moderation_cases', function (Blueprint $table) {
                $table->id();
                $table->string('case_number', 50)->unique();
                $table->string('target_type', 30); // 'user' or 'rider'
                $table->unsignedBigInteger('target_id');
                $table->foreignId('reported_by_id')->constrained('users')->cascadeOnDelete();
                $table->string('reason_category', 60); // 'suspected_fraud', 'fake_delivery', 'cod_abuse', etc.
                $table->string('title', 255);
                $table->text('description');
                $table->text('evidence_notes')->nullable();
                $table->string('status', 30)->default('open')->index(); // 'open', 'under_review', 'resolved', 'dismissed'
                $table->string('resolution_decision', 30)->nullable(); // 'clear', 'warning', 'restrict', 'suspend', 'deactivate', 'dismiss'
                $table->text('resolution_notes')->nullable();
                $table->foreignId('resolved_by_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();

                $table->index(['target_type', 'target_id']);
                $table->index('reason_category');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('moderation_cases');

        Schema::table('riders', function (Blueprint $table) {
            $table->dropForeign(['status_changed_by']);
            $table->dropColumn([
                'account_status',
                'status_reason',
                'restricted_at',
                'suspended_at',
                'deactivated_at',
                'status_changed_by',
                'is_delivery_restricted'
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['status_changed_by']);
            $table->dropColumn([
                'account_status',
                'status_reason',
                'restricted_at',
                'suspended_at',
                'deactivated_at',
                'status_changed_by',
                'is_order_restricted'
            ]);
        });
    }
};
