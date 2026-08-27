<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add payment_method to orders table if not present
        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'payment_method')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('payment_method')->default('online')->after('total_amount');
            });
        }

        // 2. Modify sales table: Add order_id foreign key & remove global unique constraint on order_number
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                // Drop unique index on order_number if it exists
                try {
                    $table->dropUnique(['order_number']);
                } catch (\Throwable $e) {
                    // Unique index might not exist or be named differently
                }

                if (!Schema::hasColumn('sales', 'order_id')) {
                    $table->foreignId('order_id')->nullable()->after('id')->constrained('orders')->nullOnDelete();
                    $table->unique('order_id'); // 1-to-1 unique financial link between Order and Sale
                }

                // Add non-unique index on order_number for fast queries
                try {
                    $table->index('order_number');
                } catch (\Throwable $e) {
                    // Index may already exist
                }
            });
        }

        // 3. Deterministic Historical Backfill:
        // Find delivered deliveries that have an order_id but lack a sale_id
        try {
            $deliveredWithoutSale = Delivery::with(['order.items.product', 'order.branch'])
                ->where('status', Delivery::STATUS_DELIVERED)
                ->whereNotNull('order_id')
                ->whereNull('sale_id')
                ->get();

            foreach ($deliveredWithoutSale as $delivery) {
                $order = $delivery->order;
                if (!$order) {
                    continue;
                }

                // Double check if a sale with this order_id already exists
                $existingSale = Sale::where('order_id', $order->id)->first();
                if ($existingSale) {
                    $delivery->update(['sale_id' => $existingSale->id]);
                    continue;
                }

                $costTotal = 0;
                $itemsData = [];

                foreach ($order->items as $item) {
                    $product = $item->product;
                    $itemCost = $product ? (float) ($product->computeProductCost($order->branch_id) ?? 0) : 0;
                    $costTotal += ($itemCost * (float) $item->quantity);

                    $itemsData[] = [
                        'product_id' => $item->product_id,
                        'quantity'   => $item->quantity,
                        'unit_price' => $item->price,
                        'cost_price' => $itemCost,
                        'subtotal'   => $item->price * $item->quantity,
                        'profit'     => ($item->price - $itemCost) * $item->quantity,
                        'created_at' => $delivery->delivered_at ?? $delivery->updated_at ?? $order->created_at,
                        'updated_at' => now(),
                    ];
                }

                $profit = (float) $order->total_amount - $costTotal;
                $saleDate = $delivery->delivered_at ?? $delivery->updated_at ?? $order->created_at;

                $sale = Sale::create([
                    'order_id'       => $order->id,
                    'order_number'   => $order->order_number ?: ('ORD-' . $order->id),
                    'user_id'        => $order->user_id ?? 1,
                    'branch_id'      => $order->branch_id,
                    'type'           => 'delivery',
                    'total'          => $order->total_amount,
                    'cost_total'     => $costTotal,
                    'profit'         => $profit,
                    'paid_amount'    => $order->total_amount,
                    'change_amount'  => 0,
                    'payment_method' => $order->payment_method ?? 'online',
                    'status'         => 'completed',
                    'created_at'     => $saleDate,
                    'updated_at'     => now(),
                ]);

                foreach ($itemsData as $itemData) {
                    $itemData['sale_id'] = $sale->id;
                    SaleItem::create($itemData);
                }

                $delivery->update(['sale_id' => $sale->id]);
            }
        } catch (\Throwable $e) {
            // Log backfill exception without aborting migration
            \Illuminate\Support\Facades\Log::warning('Migration backfill warning: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (Schema::hasColumn('sales', 'order_id')) {
                    $table->dropForeign(['order_id']);
                    $table->dropColumn('order_id');
                }
            });
        }

        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'payment_method')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('payment_method');
            });
        }
    }
};
