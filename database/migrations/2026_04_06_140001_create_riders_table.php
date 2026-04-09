<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('riders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 20)->nullable();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['available', 'busy', 'offline'])->default('available');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('riders');
    }
};
