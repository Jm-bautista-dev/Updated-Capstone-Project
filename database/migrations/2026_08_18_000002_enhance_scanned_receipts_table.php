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
        Schema::table('scanned_receipts', function (Blueprint $table) {
            $table->string('supplier_name')->nullable()->after('file_hash');
            $table->foreignId('supplier_id')->nullable()->after('supplier_name')->constrained('suppliers')->nullOnDelete();
            $table->string('invoice_number')->nullable()->after('supplier_id');
            $table->date('receipt_date')->nullable()->after('invoice_number');
            $table->string('currency', 10)->default('PHP')->after('receipt_date');
            $table->decimal('subtotal', 12, 2)->nullable()->after('currency');
            $table->decimal('tax', 12, 2)->default(0)->after('subtotal');
            $table->decimal('discount', 12, 2)->default(0)->after('tax');
            $table->decimal('grand_total', 12, 2)->nullable()->after('discount');
            $table->decimal('calculated_total', 12, 2)->nullable()->after('grand_total');
            $table->boolean('is_arithmetic_valid')->default(true)->after('calculated_total');
            $table->boolean('is_duplicate_warning')->default(false)->after('is_arithmetic_valid');
            $table->foreignId('duplicate_matched_receipt_id')->nullable()->after('is_duplicate_warning')->constrained('scanned_receipts')->nullOnDelete();
            $table->json('audit_trail')->nullable()->after('confirmed_data');
            $table->foreignId('processed_by')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable()->after('updated_at');

            $table->index(['invoice_number', 'supplier_name', 'branch_id'], 'idx_receipt_invoice_supplier_branch');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scanned_receipts', function (Blueprint $table) {
            $table->dropIndex('idx_receipt_invoice_supplier_branch');
            $table->dropForeign(['supplier_id']);
            $table->dropForeign(['duplicate_matched_receipt_id']);
            $table->dropForeign(['processed_by']);

            $table->dropColumn([
                'supplier_name',
                'supplier_id',
                'invoice_number',
                'receipt_date',
                'currency',
                'subtotal',
                'tax',
                'discount',
                'grand_total',
                'calculated_total',
                'is_arithmetic_valid',
                'is_duplicate_warning',
                'duplicate_matched_receipt_id',
                'audit_trail',
                'processed_by',
                'confirmed_at',
            ]);
        });
    }
};
