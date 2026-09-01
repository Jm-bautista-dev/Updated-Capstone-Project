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
        // 1. Create print_jobs table
        if (!Schema::hasTable('print_jobs')) {
            Schema::create('print_jobs', function (Blueprint $table) {
                $table->id();
                $table->uuid('job_uuid')->unique();
                $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
                $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
                $table->string('order_number')->index();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->string('terminal_id')->nullable()->index();
                $table->string('job_type', 30)->default('receipt')->index(); // receipt, reprint, kitchen_ticket, waybill
                $table->integer('paper_width')->default(80); // 58 or 80 mm
                $table->string('status', 20)->default('pending')->index(); // pending, printing, printed, failed
                $table->json('receipt_data')->nullable();
                $table->longText('formatted_text')->nullable();
                $table->longText('raw_escpos_base64')->nullable();
                $table->integer('attempts')->default(0);
                $table->text('last_error')->nullable();
                $table->string('reprint_reason')->nullable();
                $table->foreignId('reprinted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('printed_at')->nullable()->index();
                $table->string('idempotency_key')->nullable()->index();
                $table->timestamps();
            });
        }

        // 2. Add printer settings to branches table if not present
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'receipt_printer_name')) {
                $table->string('receipt_printer_name')->nullable()->after('pickup_cutoff_before_close_minutes');
            }
            if (!Schema::hasColumn('branches', 'receipt_paper_width')) {
                $table->integer('receipt_paper_width')->default(80)->after('receipt_printer_name');
            }
            if (!Schema::hasColumn('branches', 'receipt_auto_print')) {
                $table->boolean('receipt_auto_print')->default(true)->after('receipt_paper_width');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('print_jobs');

        Schema::table('branches', function (Blueprint $table) {
            if (Schema::hasColumn('branches', 'receipt_auto_print')) {
                $table->dropColumn('receipt_auto_print');
            }
            if (Schema::hasColumn('branches', 'receipt_paper_width')) {
                $table->dropColumn('receipt_paper_width');
            }
            if (Schema::hasColumn('branches', 'receipt_printer_name')) {
                $table->dropColumn('receipt_printer_name');
            }
        });
    }
};
