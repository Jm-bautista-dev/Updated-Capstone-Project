<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add SoftDeletes to core models
        Schema::table('products',   fn (Blueprint $table) => $table->softDeletes());
        Schema::table('categories', fn (Blueprint $table) => $table->softDeletes());
        Schema::table('ingredients', fn (Blueprint $table) => $table->softDeletes());
        Schema::table('branches',   fn (Blueprint $table) => $table->softDeletes());

        // 2. Add WAC (Weighted Average Cost) fields to ingredient_stocks
        Schema::table('ingredient_stocks', function (Blueprint $table) {
            $table->decimal('total_stock_value', 15, 4)->default(0)->after('cost_per_unit');
            $table->decimal('last_purchase_price', 15, 4)->nullable()->after('total_stock_value');
            $table->softDeletes();
        });

        // 3. Create Wastages table for audit-ready loss tracking
        Schema::create('wastages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->morphs('wastable'); // ingredient or product
            $table->decimal('quantity', 15, 4);
            $table->string('unit');
            $table->decimal('cost_at_loss', 15, 4);
            $table->string('reason'); // 'expired', 'spilled', 'damaged', 'other'
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wastages');
        
        Schema::table('ingredient_stocks', function (Blueprint $table) {
            $table->dropColumn(['total_stock_value', 'last_purchase_price', 'deleted_at']);
        });

        Schema::table('products',   fn (Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('categories', fn (Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('ingredients', fn (Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('branches',   fn (Blueprint $table) => $table->dropSoftDeletes());
    }
};
