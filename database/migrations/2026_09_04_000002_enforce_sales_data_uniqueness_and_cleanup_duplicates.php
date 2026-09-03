<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('sales')) {
            // 1. Identify & Safely Clean up duplicate order_number records in sales table
            $duplicateOrderNumbers = DB::table('sales')
                ->whereNull('order_id')
                ->select('order_number')
                ->groupBy('order_number')
                ->havingRaw('COUNT(order_number) > 1')
                ->pluck('order_number');

            foreach ($duplicateOrderNumbers as $orderNumber) {
                if (empty($orderNumber)) {
                    continue;
                }

                // Fetch all sales for this order_number ordered by earliest ID
                $sales = DB::table('sales')
                    ->whereNull('order_id')
                    ->where('order_number', $orderNumber)
                    ->orderBy('id', 'asc')
                    ->get();

                if ($sales->count() <= 1) {
                    continue;
                }

                // Canonical record is the earliest (first) record
                $canonical = $sales->first();
                $duplicates = $sales->slice(1);

                foreach ($duplicates as $dup) {
                    // True duplicate: delete dependent sale items & sale
                    DB::table('sale_items')->where('sale_id', $dup->id)->delete();

                    // Reassign foreign references to canonical sale ID
                    if (Schema::hasTable('deliveries') && Schema::hasColumn('deliveries', 'sale_id')) {
                        DB::table('deliveries')->where('sale_id', $dup->id)->update(['sale_id' => $canonical->id]);
                    }
                    if (Schema::hasTable('print_jobs') && Schema::hasColumn('print_jobs', 'sale_id')) {
                        DB::table('print_jobs')->where('sale_id', $dup->id)->update(['sale_id' => $canonical->id]);
                    }
                    if (Schema::hasTable('delivery_attempts') && Schema::hasColumn('delivery_attempts', 'sale_id')) {
                        DB::table('delivery_attempts')->where('sale_id', $dup->id)->update(['sale_id' => $canonical->id]);
                    }

                    DB::table('sales')->where('id', $dup->id)->delete();
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe rollback
    }
};
