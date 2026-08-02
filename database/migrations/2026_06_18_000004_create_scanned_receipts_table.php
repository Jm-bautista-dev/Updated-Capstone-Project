<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scanned_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('file_path');
            $table->string('file_hash', 64)->unique(); // Prevents duplicate uploads of the exact same file
            $table->longText('raw_ocr_text')->nullable();
            $table->json('parsed_data')->nullable(); // JSON list of extracted items: name, qty, unit
            $table->json('confirmed_data')->nullable(); // JSON list of final confirmed item adjustments
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('status')->default('pending'); // pending, processed, completed, failed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scanned_receipts');
    }
};
