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
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_item_id')->unique()->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');

            $table->unsignedTinyInteger('rating'); // 1 to 5 stars
            $table->text('comment')->nullable();
            $table->enum('status', ['published', 'hidden', 'flagged', 'pending'])->default('published');

            // Admin Moderation / Response
            $table->text('admin_response')->nullable();
            $table->foreignId('admin_response_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('admin_responded_at')->nullable();

            $table->timestamps();

            // Indexes for production query performance
            $table->index(['product_id', 'status']);
            $table->index('user_id');
            $table->index('order_id');
            $table->index('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};
