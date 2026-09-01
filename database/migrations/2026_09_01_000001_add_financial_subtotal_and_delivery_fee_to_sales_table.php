<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\Delivery;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (!Schema::hasColumn('sales', 'subtotal')) {
                    $table->decimal('subtotal', 10, 2)->nullable()->after('type');
                }
                if (!Schema::hasColumn('sales', 'delivery_fee')) {
                    $table->decimal('delivery_fee', 8, 2)->default(0.00)->after('subtotal');
                }
            });
        }

        // Safe Non-Destructive Historical Backfill
        try {
            DB::transaction(function () {
                $sales = Sale::with(['items', 'delivery'])->get();

                foreach ($sales as $sale) {
                    $itemsSubtotal = $sale->items->sum('subtotal');
                    $deliveryFee = 0.00;

                    if ($sale->type === 'delivery') {
                        $deliveryFee = (float) ($sale->delivery?->delivery_fee ?? 0.00);
                        if ($itemsSubtotal > 0) {
                            $subtotal = (float) $itemsSubtotal;
                        } else {
                            $subtotal = max(0.00, (float) $sale->total - $deliveryFee);
                        }
                    } else {
                        $subtotal = $itemsSubtotal > 0 ? (float) $itemsSubtotal : (float) $sale->total;
                        $deliveryFee = 0.00;
                    }

                    // Product profit = product subtotal - COGS
                    $cogs = (float) ($sale->cost_total ?? 0.00);
                    $profit = $subtotal - $cogs;

                    $sale->updateQuietly([
                        'subtotal'     => $subtotal,
                        'delivery_fee' => $deliveryFee,
                        'profit'       => $profit,
                    ]);
                }
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Sales financial migration backfill notice: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (Schema::hasColumn('sales', 'delivery_fee')) {
                    $table->dropColumn('delivery_fee');
                }
                if (Schema::hasColumn('sales', 'subtotal')) {
                    $table->dropColumn('subtotal');
                }
            });
        }
    }
};
