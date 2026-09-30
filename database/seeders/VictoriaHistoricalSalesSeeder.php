<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class VictoriaHistoricalSalesSeeder extends Seeder
{
    /**
     * Run the synthetic Victoria historical sales seeder.
     */
    public function run(): void
    {
        // 1. Resolve Victoria Branch & Sta Cruz Branch
        $victoriaBranch = Branch::where('name', 'like', '%Victoria%')->first();
        if (!$victoriaBranch) {
            $victoriaBranch = Branch::create([
                'id'                 => 1,
                'name'               => 'Maki Desu Victoria',
                'code'               => 'VIC',
                'address'            => 'Victoria, Laguna',
                'latitude'           => 14.2280,
                'longitude'          => 121.3280,
                'delivery_radius_km' => 10,
            ]);
        }

        $staCruzBranch = Branch::where('name', 'like', '%Sta Cruz%')
            ->orWhere('name', 'like', '%Santa Cruz%')
            ->first();

        if (!$staCruzBranch) {
            $this->command->error("Sta Cruz branch not found. Please run SalesDatasetSeeder first.");
            return;
        }

        // 2. Analyze Sta Cruz exact daily figures (Sept 10 - Sept 30)
        $startDate = '2026-09-10 00:00:00';
        $endDate = '2026-09-30 23:59:59';

        $staCruzSales = Sale::where('branch_id', $staCruzBranch->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with('items')
            ->orderBy('created_at')
            ->get();

        if ($staCruzSales->isEmpty()) {
            $this->command->error("No Sta Cruz sales found for September 10-30. Please run SalesDatasetSeeder first.");
            return;
        }

        $staCruzTotalRevenue = (float)$staCruzSales->sum('total');
        $staCruzTotalOrders = $staCruzSales->count();
        $staCruzTotalQty = 0;
        $staCruzDaily = [];

        foreach ($staCruzSales as $scSale) {
            $d = substr($scSale->created_at->toDateTimeString(), 0, 10);
            if (!isset($staCruzDaily[$d])) {
                $staCruzDaily[$d] = ['orders' => 0, 'revenue' => 0.0, 'qty' => 0];
            }
            $staCruzDaily[$d]['orders']++;
            $staCruzDaily[$d]['revenue'] += (float)$scSale->total;
            foreach ($scSale->items as $scItem) {
                $staCruzDaily[$d]['qty'] += (float)$scItem->quantity;
                $staCruzTotalQty += (float)$scItem->quantity;
            }
        }

        // 3. Resolve Victoria Cashier Users
        $victoriaCashiers = User::where('branch_id', $victoriaBranch->id)
            ->whereIn('role', ['cashier', 'admin'])
            ->get();

        $cashierIds = $victoriaCashiers->isNotEmpty()
            ? $victoriaCashiers->pluck('id')->toArray()
            : [User::where('role', 'admin')->first()?->id ?? 1];

        // 4. Fetch Available Active Products for Victoria
        $products = Product::whereNull('deleted_at')->get();
        if ($products->isEmpty()) {
            $this->command->error("No active products found in catalog.");
            return;
        }

        // Fast-casual restaurant mix weights for realistic independent variation
        $weightedProducts = [];
        foreach ($products as $p) {
            $name = strtolower($p->name);
            $price = (float)$p->selling_price;
            if ($price <= 0) continue;

            $weight = 10;
            if (str_contains($name, 'student meal')) $weight = 55;
            elseif (str_contains($name, 'classic california maki (4pcs)')) $weight = 40;
            elseif (str_contains($name, 'crazy maki (4pcs)')) $weight = 35;
            elseif (str_contains($name, 'kani maki with salted egg (4pcs)')) $weight = 30;
            elseif (str_contains($name, 'torched salmon (4pcs)')) $weight = 25;
            elseif (str_contains($name, 'coke') || str_contains($name, 'sprite') || str_contains($name, 'royal') || str_contains($name, 'water')) $weight = 40;
            elseif (str_contains($name, 'classic california maki (8pcs)')) $weight = 22;
            elseif (str_contains($name, 'crazy maki (8pcs)')) $weight = 20;
            elseif (str_contains($name, 'california maki (bento)')) $weight = 20;
            elseif (str_contains($name, 'torched salmon (bento)')) $weight = 16;
            elseif (str_contains($name, 'crazy fireworks overload (bento)')) $weight = 15;
            elseif (str_contains($name, 'tonkatsu (pork broth)')) $weight = 20;
            elseif (str_contains($name, 'spicy tonkatsu')) $weight = 18;
            elseif (str_contains($name, 'tan-tan')) $weight = 16;
            elseif (str_contains($name, 'shoyu') || str_contains($name, 'shio') || str_contains($name, 'black garlic')) $weight = 15;
            elseif (str_contains($name, 'kani salad (solo)')) $weight = 18;
            elseif (str_contains($name, 'chicken katsu') || str_contains($name, 'pork katsudon') || str_contains($name, 'katsu curry')) $weight = 16;
            elseif (str_contains($name, 'boat') || str_contains($name, 'platter')) $weight = 1;
            elseif (str_contains($name, 'sashimi')) $weight = 3;

            $weightedProducts[] = [
                'product' => $p,
                'weight' => $weight,
                'price' => $price,
            ];
        }

        // 5. Duplicate Protection: Remove existing synthetic Victoria sales in target range before re-seeding
        $existingSyntheticSales = Sale::where('branch_id', $victoriaBranch->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('order_number', 'like', 'POS-VIC-%')
            ->pluck('id');

        if ($existingSyntheticSales->isNotEmpty()) {
            DB::table('sale_items')->whereIn('sale_id', $existingSyntheticSales)->delete();
            DB::table('sales')->whereIn('id', $existingSyntheticSales)->delete();
            $this->command->info("Cleared " . count($existingSyntheticSales) . " previous synthetic Victoria sales for re-generation.");
        }

        // 6. Generate Synthetic Dataset (Controlled Seed for reproducibility)
        mt_srand(987654);

        $insertedSalesCount = 0;
        $insertedItemsCount = 0;
        $victoriaTotalRevenue = 0.0;
        $victoriaTotalQty = 0;

        DB::beginTransaction();

        try {
            foreach ($staCruzDaily as $dateStr => $scStat) {
                $scQty = $scStat['qty'];
                $scale = mt_rand(88, 96) / 100.0;
                $targetDayQty = max(8, (int)round($scQty * $scale));

                $dayQty = 0;
                $dayOrders = [];

                while ($dayQty < $targetDayQty) {
                    $numItems = mt_rand(1, 100) <= 65 ? 1 : (mt_rand(1, 100) <= 75 ? 2 : 3);
                    $orderItems = [];
                    $orderTotal = 0.0;
                    $orderQty = 0;

                    for ($i = 0; $i < $numItems; $i++) {
                        // Pick random weighted product
                        $picked = $this->pickProduct($weightedProducts);
                        $p = $picked['product'];
                        $price = $picked['price'];

                        $itemQty = 1;
                        $qtyRand = mt_rand(1, 100);
                        if (str_contains(strtolower($p->name), 'student meal')) {
                            $itemQty = $qtyRand <= 60 ? 1 : ($qtyRand <= 85 ? 2 : ($qtyRand <= 95 ? 3 : 4));
                        } elseif (str_contains(strtolower($p->name), 'mismo') || str_contains(strtolower($p->name), 'water')) {
                            $itemQty = $qtyRand <= 70 ? 1 : ($qtyRand <= 90 ? 2 : 3);
                        } elseif ($price >= 1000) {
                            $itemQty = 1;
                        } else {
                            $itemQty = $qtyRand <= 80 ? 1 : ($qtyRand <= 95 ? 2 : 3);
                        }

                        $lineTotal = round($price * $itemQty, 2);
                        $orderTotal += $lineTotal;
                        $orderQty += $itemQty;

                        $orderItems[] = [
                            'product_id'   => $p->id,
                            'quantity'     => $itemQty,
                            'unit_price'   => $price,
                            'subtotal'     => $lineTotal,
                        ];
                    }

                    $transTime = $this->generateVictoriaTime($dateStr);
                    $payMethod = mt_rand(1, 100) <= 82 ? 'cash' : (mt_rand(1, 100) <= 60 ? 'gcash' : 'maya');
                    $orderType = mt_rand(1, 100) <= 75 ? 'dine-in' : 'take-out';
                    $cashierId = $cashierIds[array_rand($cashierIds)];

                    $dayOrders[] = [
                        'time'           => $transTime,
                        'total'          => $orderTotal,
                        'quantity'       => $orderQty,
                        'payment_method' => $payMethod,
                        'type'           => $orderType,
                        'cashier_id'     => $cashierId,
                        'items'          => $orderItems,
                    ];

                    $dayQty += $orderQty;
                }

                // Sort transactions chronologically within the day
                usort($dayOrders, fn($a, $b) => $a['time'] <=> $b['time']);

                foreach ($dayOrders as $order) {
                    $tTime = $order['time'];
                    $dateSlug = $tTime->format('Ymd');
                    $timeSlug = $tTime->format('His');
                    $uniqueSuffix = strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 4));
                    $orderNumber = "POS-VIC-{$dateSlug}-{$timeSlug}-{$uniqueSuffix}";

                    // Create Sale (without triggering current inventory deduction)
                    $sale = Sale::create([
                        'order_number'     => $orderNumber,
                        'user_id'          => $order['cashier_id'],
                        'branch_id'        => $victoriaBranch->id,
                        'type'             => $order['type'],
                        'subtotal'         => $order['total'],
                        'discount'         => 0.00,
                        'discount_type'    => null,
                        'discount_details' => null,
                        'delivery_fee'     => 0.00,
                        'total'            => $order['total'],
                        'cost_total'       => 0.00,
                        'profit'           => $order['total'],
                        'paid_amount'      => $order['total'],
                        'change_amount'    => 0.00,
                        'payment_method'   => $order['payment_method'],
                        'status'           => 'completed',
                        'source'           => 'pos',
                        'source_system'    => 'Synthetic History (POS Unavailable)',
                        'created_at'       => $tTime,
                        'updated_at'       => $tTime,
                    ]);

                    $sale->created_at = $tTime;
                    $sale->updated_at = $tTime;
                    $sale->saveQuietly();

                    foreach ($order['items'] as $item) {
                        $saleItem = SaleItem::create([
                            'sale_id'         => $sale->id,
                            'product_id'      => $item['product_id'],
                            'quantity'        => $item['quantity'],
                            'unit_price'      => $item['unit_price'],
                            'cost_price'      => 0.00,
                            'subtotal'        => $item['subtotal'],
                            'profit'          => $item['subtotal'],
                            'addon_total'     => 0.00,
                            'selected_addons' => null,
                            'created_at'      => $tTime,
                            'updated_at'      => $tTime,
                        ]);

                        $saleItem->created_at = $tTime;
                        $saleItem->updated_at = $tTime;
                        $saleItem->saveQuietly();
                        $insertedItemsCount++;
                    }

                    $insertedSalesCount++;
                    $victoriaTotalRevenue += (float)$order['total'];
                    $victoriaTotalQty += (int)$order['quantity'];
                }
            }

            DB::commit();

            $ratio = $staCruzTotalRevenue > 0 ? ($victoriaTotalRevenue / $staCruzTotalRevenue) * 100 : 0;
            $this->command->info("Successfully seeded {$insertedSalesCount} transactions ({$insertedItemsCount} items) for Victoria branch.");
            $this->command->info("Victoria Total Revenue: ₱" . number_format($victoriaTotalRevenue, 2) . " (" . number_format($ratio, 2) . "% of Sta Cruz ₱" . number_format($staCruzTotalRevenue, 2) . ").");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Failed to seed Victoria sales: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Pick random weighted product.
     */
    private function pickProduct(array $weightedProducts): array
    {
        $totalWeight = array_sum(array_column($weightedProducts, 'weight'));
        $rand = mt_rand(1, $totalWeight);
        $cur = 0;
        foreach ($weightedProducts as $item) {
            $cur += $item['weight'];
            if ($rand <= $cur) {
                return $item;
            }
        }
        return $weightedProducts[0];
    }

    /**
     * Generate realistic time within Victoria operating hours (10:00 AM - 8:00 PM).
     */
    private function generateVictoriaTime(string $dateStr): Carbon
    {
        $slotRand = mt_rand(1, 100);
        if ($slotRand <= 35) {
            // Lunch peak: 11:30 - 13:30 (690 to 810 mins from midnight)
            $minute = mt_rand(690, 810);
        } elseif ($slotRand <= 55) {
            // Afternoon: 13:30 - 17:00 (810 to 1020 mins)
            $minute = mt_rand(810, 1020);
        } elseif ($slotRand <= 90) {
            // Dinner peak: 17:00 - 19:30 (1020 to 1170 mins)
            $minute = mt_rand(1020, 1170);
        } elseif ($slotRand <= 95) {
            // Morning: 10:00 - 11:30 (600 to 690 mins)
            $minute = mt_rand(600, 690);
        } else {
            // Evening close: 19:30 - 19:55 (1170 to 1195 mins)
            $minute = mt_rand(1170, 1195);
        }

        $sec = mt_rand(0, 59);
        $hour = intdiv($minute, 60);
        $min = $minute % 60;

        return Carbon::createFromFormat('Y-m-d H:i:s', "{$dateStr} " . sprintf('%02d:%02d:%02d', $hour, $min, $sec));
    }
}
