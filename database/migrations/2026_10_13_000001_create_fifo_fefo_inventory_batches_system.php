<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add expiration tracking preferences to ingredients table
        Schema::table('ingredients', function (Blueprint $table) {
            if (!Schema::hasColumn('ingredients', 'requires_expiration_tracking')) {
                $table->boolean('requires_expiration_tracking')->default(true)->after('unit');
            }
            if (!Schema::hasColumn('ingredients', 'default_expiry_days')) {
                $table->integer('default_expiry_days')->nullable()->after('requires_expiration_tracking');
            }
            if (!Schema::hasColumn('ingredients', 'expiry_warning_days')) {
                $table->integer('expiry_warning_days')->nullable()->default(7)->after('default_expiry_days');
            }
        });

        // 2. Create ingredient_batches table
        if (!Schema::hasTable('ingredient_batches')) {
            Schema::create('ingredient_batches', function (Blueprint $table) {
                $table->id();
                $table->string('batch_code', 64)->index();
                $table->string('lot_number', 100)->nullable();
                $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
                $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
                $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
                $table->string('supplier_name', 150)->nullable();
                $table->timestamp('received_at');
                $table->date('manufacture_date')->nullable();
                $table->dateTime('expiration_date')->nullable()->index();
                $table->string('expiration_type', 30)->default('use_by'); // 'use_by', 'best_before', 'none'
                $table->decimal('initial_quantity', 15, 4);
                $table->decimal('current_quantity', 15, 4)->default(0);
                $table->string('unit', 20);
                $table->decimal('cost_per_base_unit', 15, 4)->default(0);
                $table->decimal('purchase_price', 15, 2)->default(0);
                $table->string('status', 30)->default('available')->index(); // 'available', 'depleted', 'expired', 'quarantined', 'recalled', 'damaged'
                $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('reference', 255)->nullable();
                $table->text('notes')->nullable();
                $table->boolean('is_legacy')->default(false);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['branch_id', 'ingredient_id', 'status'], 'idx_batch_branch_ing_status');
                $table->index(['branch_id', 'status', 'expiration_date'], 'idx_batch_branch_status_exp');
                $table->index(['received_at', 'id'], 'idx_batch_rec_id');
            });
        }

        // 3. Create ingredient_batch_movements table
        if (!Schema::hasTable('ingredient_batch_movements')) {
            Schema::create('ingredient_batch_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('batch_id')->constrained('ingredient_batches')->onDelete('cascade');
                $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
                $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('movement_type', 50)->index(); // 'stock_in', 'pos_consumption', 'order_consumption', 'waste', 'damage', 'expired_removal', 'adjustment', 'transfer_out', 'transfer_in', 'reversal', 'supplier_return'
                $table->decimal('quantity', 15, 4);
                $table->decimal('quantity_base', 15, 4);
                $table->string('unit', 20);
                $table->decimal('previous_batch_quantity', 15, 4);
                $table->decimal('new_batch_quantity', 15, 4);
                $table->decimal('cost_at_movement', 15, 4)->default(0);
                $table->string('reference_type', 150)->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->string('reference_number', 100)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['batch_id', 'created_at'], 'idx_mov_batch_created');
                $table->index(['ingredient_id', 'branch_id', 'movement_type'], 'idx_mov_ing_branch_type');
                $table->index(['reference_type', 'reference_id'], 'idx_mov_ref');
            });
        }

        // 4. Create batch_allocations table
        if (!Schema::hasTable('batch_allocations')) {
            Schema::create('batch_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('batch_id')->constrained('ingredient_batches')->onDelete('cascade');
                $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
                $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
                $table->string('allocatable_type', 150)->index();
                $table->unsignedBigInteger('allocatable_id')->index();
                $table->decimal('quantity_base', 15, 4);
                $table->string('unit', 20);
                $table->decimal('unit_cost', 15, 4)->default(0);
                $table->decimal('total_cost', 15, 4)->default(0);
                $table->decimal('reversed_quantity_base', 15, 4)->default(0);
                $table->boolean('is_reversed')->default(false);
                $table->timestamps();

                $table->index(['allocatable_type', 'allocatable_id', 'batch_id'], 'idx_alloc_type_id_batch');
            });
        }

        // 5. Backfill existing ingredient stock into opening balance legacy batches
        if (Schema::hasTable('ingredient_stocks')) {
            $existingStocks = DB::table('ingredient_stocks')
                ->where('stock', '>', 0)
                ->get();

            foreach ($existingStocks as $stockRow) {
                $ingredient = DB::table('ingredients')->where('id', $stockRow->ingredient_id)->first();
                $unit = $ingredient ? ($ingredient->unit ?? 'g') : 'g';
                $batchCode = sprintf('LEGACY-B%d-I%d-%s', $stockRow->branch_id, $stockRow->ingredient_id, strtoupper(substr(uniqid(), -4)));

                $batchId = DB::table('ingredient_batches')->insertGetId([
                    'batch_code'          => $batchCode,
                    'lot_number'          => 'OPENING-BALANCE',
                    'ingredient_id'       => $stockRow->ingredient_id,
                    'branch_id'           => $stockRow->branch_id,
                    'received_at'         => $stockRow->created_at ?? now(),
                    'manufacture_date'    => null,
                    'expiration_date'     => null, // Unknown expiration date labeled as unknown
                    'expiration_type'     => 'none',
                    'initial_quantity'    => $stockRow->stock,
                    'current_quantity'    => $stockRow->stock,
                    'unit'                => $unit,
                    'cost_per_base_unit'  => $stockRow->cost_per_unit ?? 0,
                    'purchase_price'      => $stockRow->total_stock_value ?? 0,
                    'status'              => 'available',
                    'reference'           => 'Initial inventory migration',
                    'notes'               => 'Legacy opening balance with unknown expiration date',
                    'is_legacy'           => true,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ]);

                DB::table('ingredient_batch_movements')->insert([
                    'batch_id'                => $batchId,
                    'ingredient_id'           => $stockRow->ingredient_id,
                    'branch_id'               => $stockRow->branch_id,
                    'movement_type'           => 'stock_in',
                    'quantity'                => $stockRow->stock,
                    'quantity_base'           => $stockRow->stock,
                    'unit'                    => $unit,
                    'previous_batch_quantity' => 0,
                    'new_batch_quantity'      => $stockRow->stock,
                    'cost_at_movement'        => $stockRow->cost_per_unit ?? 0,
                    'reference_number'        => 'MIGRATION-OPENING',
                    'notes'                   => 'Opening balance ledger creation',
                    'created_at'              => now(),
                    'updated_at'              => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('batch_allocations');
        Schema::dropIfExists('ingredient_batch_movements');
        Schema::dropIfExists('ingredient_batches');

        Schema::table('ingredients', function (Blueprint $table) {
            if (Schema::hasColumn('ingredients', 'expiry_warning_days')) {
                $table->dropColumn('expiry_warning_days');
            }
            if (Schema::hasColumn('ingredients', 'default_expiry_days')) {
                $table->dropColumn('default_expiry_days');
            }
            if (Schema::hasColumn('ingredients', 'requires_expiration_tracking')) {
                $table->dropColumn('requires_expiration_tracking');
            }
        });
    }
};
