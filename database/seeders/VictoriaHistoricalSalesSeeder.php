<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class VictoriaHistoricalSalesSeeder extends Seeder
{
    /**
     * Run the Victoria historical sales seeder.
     * Aligns Victoria historical sales and attendance with Victoria's authentic cashier account.
     */
    public function run(): void
    {
        $this->command?->info("========================================================================");
        $this->command?->info("   VICTORIA HISTORICAL SALES & CASHIER ATTENDANCE SYNCHRONIZATION       ");
        $this->command?->info("========================================================================");

        // 1. Resolve Victoria Branch & Sta Cruz Branch
        $victoriaBranch = Branch::where('id', 1)
            ->orWhere('name', 'like', '%Victoria%')
            ->first();

        if (!$victoriaBranch) {
            $this->command?->error("Victoria branch not found.");
            return;
        }

        $staCruzBranch = Branch::where('id', 2)
            ->orWhere('name', 'like', '%Sta Cruz%')
            ->orWhere('name', 'like', '%Santa Cruz%')
            ->first();

        if (!$staCruzBranch) {
            $this->command?->error("Sta Cruz branch not found.");
            return;
        }

        // 2. Resolve Victoria Cashier User Account
        // Prioritize active Victoria cashier named 'Victoria' (User ID 66), or any active cashier at Branch 1
        $victoriaCashier = User::where('branch_id', $victoriaBranch->id)
            ->where('role', 'cashier')
            ->where('name', 'Victoria')
            ->where(function ($q) {
                $q->whereNull('account_status')->orWhere('account_status', 'active');
            })
            ->first()
            ?? User::where('id', 66)->first()
            ?? User::where('branch_id', $victoriaBranch->id)
                ->where('role', 'cashier')
                ->where(function ($q) {
                    $q->whereNull('account_status')->orWhere('account_status', 'active');
                })
                ->first()
            ?? User::where('branch_id', $victoriaBranch->id)->where('role', 'cashier')->first();

        if (!$victoriaCashier) {
            $this->command?->error("No cashier account found for Victoria branch.");
            return;
        }

        $this->command?->info("Assigned Victoria Cashier: [ID: {$victoriaCashier->id}] {$victoriaCashier->name} ({$victoriaCashier->email})");

        // 3. Clear residual synthetic sales and their items for Victoria
        $residualSales = Sale::where('branch_id', $victoriaBranch->id)
            ->where(function ($q) {
                $q->where('source_system', 'Synthetic History (POS Unavailable)')
                  ->orWhere('order_number', 'like', 'POS-VIC-%');
            })
            ->pluck('id');

        if ($residualSales->isNotEmpty()) {
            DB::table('sale_items')->whereIn('sale_id', $residualSales)->delete();
            DB::table('sales')->whereIn('id', $residualSales)->delete();
            $this->command?->comment("Purged " . count($residualSales) . " prior synthetic Victoria sales.");
        }

        // 4. Analyze Sta Cruz Daily Volume across historical period
        $staCruzSales = Sale::where('branch_id', $staCruzBranch->id)
            ->whereBetween('created_at', ['2026-09-09 00:00:00', '2026-10-10 23:59:59'])
            ->with('items')
            ->orderBy('created_at')
            ->get();

        if ($staCruzSales->isEmpty()) {
            $this->command?->error("No Sta Cruz baseline sales found.");
            return;
        }

        $staCruzDaily = [];
        $staCruzTotalRevenue = 0.0;
        $staCruzTotalQty = 0;

        foreach ($staCruzSales as $scSale) {
            $manilaDate = $scSale->created_at->copy()->setTimezone('Asia/Manila')->format('Y-m-d');
            if (!isset($staCruzDaily[$manilaDate])) {
                $staCruzDaily[$manilaDate] = ['orders' => 0, 'revenue' => 0.0, 'qty' => 0];
            }
            $staCruzDaily[$manilaDate]['orders']++;
            $staCruzDaily[$manilaDate]['revenue'] += (float)$scSale->total;

            foreach ($scSale->items as $scItem) {
                $staCruzDaily[$manilaDate]['qty'] += (float)$scItem->quantity;
                $staCruzTotalQty += (float)$scItem->quantity;
            }
            $staCruzTotalRevenue += (float)$scSale->total;
        }

        $this->command?->info("Sta Cruz Baseline: " . count($staCruzDaily) . " operating days, ₱" . number_format($staCruzTotalRevenue, 2) . ", {$staCruzTotalQty} total items.");

        // 5. Fetch Active Catalog Products
        $products = Product::whereNull('deleted_at')->get();
        if ($products->isEmpty()) {
            $this->command?->error("No active catalog products found.");
            return;
        }

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
            elseif (str_contains($name, 'coke') || str_contains($name, 'sprite') || str_contains($name, 'royal') || str_contains($name, 'water') || str_contains($name, 'mismo')) $weight = 40;
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
                'cost' => (float)($p->cost_price ?? $p->manual_cost ?? 0.0),
            ];
        }

        // Fixed seed for deterministic, stable generation
        mt_srand(424242);

        $insertedSalesCount = 0;
        $insertedItemsCount = 0;
        $victoriaTotalRevenue = 0.0;
        $businessTz = 'Asia/Manila';
        $storageTz = config('app.timezone', 'UTC');

        DB::beginTransaction();

        try {
            foreach ($staCruzDaily as $dateStr => $scStat) {
                $scQty = $scStat['qty'];
                // Target ~88% - 96% of Sta Cruz daily volume with natural variance
                $scale = mt_rand(88, 96) / 100.0;
                $targetDayQty = max(8, (int)round($scQty * $scale));

                $dayQty = 0;
                $dayOrders = [];
                $dailyCashSales = 0.0;

                while ($dayQty < $targetDayQty) {
                    $numItems = mt_rand(1, 100) <= 65 ? 1 : (mt_rand(1, 100) <= 75 ? 2 : 3);
                    $orderItems = [];
                    $orderTotal = 0.0;
                    $orderCostTotal = 0.0;
                    $orderQty = 0;

                    for ($i = 0; $i < $numItems; $i++) {
                        $picked = $this->pickProduct($weightedProducts);
                        $p = $picked['product'];
                        $price = $picked['price'];
                        $cost = $picked['cost'];

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
                        $lineCost = round($cost * $itemQty, 2);
                        $lineProfit = max(0.0, round($lineTotal - $lineCost, 2));

                        $orderTotal += $lineTotal;
                        $orderCostTotal += $lineCost;
                        $orderQty += $itemQty;

                        $orderItems[] = [
                            'product_id' => $p->id,
                            'quantity'   => $itemQty,
                            'unit_price' => $price,
                            'cost_price' => $cost,
                            'subtotal'   => $lineTotal,
                            'profit'     => $lineProfit,
                        ];
                    }

                    $payMethodRand = mt_rand(1, 100);
                    $payMethod = $payMethodRand <= 80 ? 'cash' : ($payMethodRand <= 95 ? 'gcash' : 'maya');
                    $orderType = mt_rand(1, 100) <= 75 ? 'dine-in' : 'take-out';

                    // Generate timestamp strictly between 09:15:00 AM and 06:45:00 PM Asia/Manila
                    $orderTimeUtc = $this->generateOperatingTimestamp($dateStr, $businessTz, $storageTz);

                    $dayOrders[] = [
                        'time_utc'       => $orderTimeUtc,
                        'total'          => $orderTotal,
                        'cost_total'     => $orderCostTotal,
                        'profit'         => max(0.0, round($orderTotal - $orderCostTotal, 2)),
                        'quantity'       => $orderQty,
                        'payment_method' => $payMethod,
                        'type'           => $orderType,
                        'items'          => $orderItems,
                    ];

                    if ($payMethod === 'cash') {
                        $dailyCashSales += $orderTotal;
                    }

                    $dayQty += $orderQty;
                }

                // Sort orders chronologically within the day
                usort($dayOrders, fn($a, $b) => $a['time_utc'] <=> $b['time_utc']);

                // Insert day orders
                foreach ($dayOrders as $order) {
                    $utcTime = $order['time_utc'];
                    $localTime = $utcTime->copy()->setTimezone($businessTz);
                    $dateSlug = $localTime->format('Ymd');
                    $timeSlug = $localTime->format('His');
                    $uniqueSuffix = strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 4));
                    $orderNumber = "POS-VIC-{$dateSlug}-{$timeSlug}-{$uniqueSuffix}";

                    $sale = Sale::create([
                        'order_number'     => $orderNumber,
                        'user_id'          => $victoriaCashier->id,
                        'branch_id'        => $victoriaBranch->id,
                        'type'             => $order['type'],
                        'subtotal'         => $order['total'],
                        'discount'         => 0.00,
                        'discount_type'    => null,
                        'discount_details' => null,
                        'delivery_fee'     => 0.00,
                        'total'            => $order['total'],
                        'cost_total'       => $order['cost_total'],
                        'profit'           => $order['profit'],
                        'paid_amount'      => $order['total'],
                        'change_amount'    => 0.00,
                        'payment_method'   => $order['payment_method'],
                        'status'           => 'completed',
                        'source'           => 'pos',
                        'source_system'    => 'Synthetic History (POS Unavailable)',
                        'created_at'       => $utcTime,
                        'updated_at'       => $utcTime,
                    ]);

                    $sale->created_at = $utcTime;
                    $sale->updated_at = $utcTime;
                    $sale->saveQuietly();

                    foreach ($order['items'] as $item) {
                        $saleItem = SaleItem::create([
                            'sale_id'         => $sale->id,
                            'product_id'      => $item['product_id'],
                            'quantity'        => $item['quantity'],
                            'unit_price'      => $item['unit_price'],
                            'cost_price'      => $item['cost_price'],
                            'subtotal'        => $item['subtotal'],
                            'profit'          => $item['profit'],
                            'addon_total'     => 0.00,
                            'selected_addons' => null,
                            'created_at'      => $utcTime,
                            'updated_at'      => $utcTime,
                        ]);

                        $saleItem->created_at = $utcTime;
                        $saleItem->updated_at = $utcTime;
                        $saleItem->saveQuietly();
                        $insertedItemsCount++;
                    }

                    $insertedSalesCount++;
                    $victoriaTotalRevenue += (float)$order['total'];
                }

                // Synchronize CashierShift for Victoria Cashier on this date
                $openingFloat = 1500.00;
                $expectedBalance = $openingFloat + $dailyCashSales;
                $shiftOpenedUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$dateStr} 09:00:00", $businessTz)->setTimezone($storageTz);
                $shiftClosedUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$dateStr} 19:00:00", $businessTz)->setTimezone($storageTz);

                $dayStartUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$dateStr} 00:00:00", $businessTz)->setTimezone($storageTz);
                $dayEndUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$dateStr} 23:59:59", $businessTz)->setTimezone($storageTz);

                $existingShift = CashierShift::where('branch_id', $victoriaBranch->id)
                    ->whereBetween('opened_at', [$dayStartUtc, $dayEndUtc])
                    ->first();

                if ($existingShift) {
                    $existingShift->update([
                        'cashier_id'       => $victoriaCashier->id,
                        'opened_at'        => $shiftOpenedUtc,
                        'closed_at'        => $shiftClosedUtc,
                        'opening_balance'  => $openingFloat,
                        'closing_balance'  => $expectedBalance,
                        'expected_balance' => $expectedBalance,
                        'total_cash_sales' => $dailyCashSales,
                        'cash_in'          => 0.00,
                        'cash_out'         => 0.00,
                        'variance'         => 0.00,
                        'notes'            => 'Historical daily cashier shift aligned with ₱1,500 float (09:00:00 - 19:00:00 Manila)',
                        'status'           => 'closed',
                    ]);
                } else {
                    CashierShift::create([
                        'branch_id'        => $victoriaBranch->id,
                        'cashier_id'       => $victoriaCashier->id,
                        'opened_at'        => $shiftOpenedUtc,
                        'closed_at'        => $shiftClosedUtc,
                        'opening_balance'  => $openingFloat,
                        'closing_balance'  => $expectedBalance,
                        'expected_balance' => $expectedBalance,
                        'total_cash_sales' => $dailyCashSales,
                        'cash_in'          => 0.00,
                        'cash_out'         => 0.00,
                        'variance'         => 0.00,
                        'notes'            => 'Historical daily cashier shift aligned with ₱1,500 float (09:00:00 - 19:00:00 Manila)',
                        'status'           => 'closed',
                    ]);
                }
            }

            DB::commit();

            $ratio = $staCruzTotalRevenue > 0 ? ($victoriaTotalRevenue / $staCruzTotalRevenue) * 100 : 0;
            $this->command?->info(" Successfully seeded {$insertedSalesCount} Victoria transactions ({$insertedItemsCount} items) across " . count($staCruzDaily) . " days.");
            $this->command?->info("Victoria Total Revenue: ₱" . number_format($victoriaTotalRevenue, 2) . " (" . number_format($ratio, 2) . "% of Sta Cruz ₱" . number_format($staCruzTotalRevenue, 2) . ").");
            $this->command?->info("All Victoria sales and shifts strictly attributed to cashier {$victoriaCashier->name} (User ID {$victoriaCashier->id}).");

        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command?->error("Failed to seed Victoria historical sales: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Pick random weighted product from catalog.
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
     * Generate realistic operating timestamp strictly between 09:15:00 AM and 06:45:00 PM Asia/Manila,
     * converted to UTC storage timezone.
     */
    private function generateOperatingTimestamp(string $dateStr, string $businessTz, string $storageTz): Carbon
    {
        // Operating slots (minutes from midnight in Manila):
        // 09:15 is 555 mins
        // 18:45 is 1125 mins
        $slotRand = mt_rand(1, 100);
        if ($slotRand <= 38) {
            // Lunch peak: 11:30 - 13:30 (690 to 810 mins)
            $minute = mt_rand(690, 810);
        } elseif ($slotRand <= 58) {
            // Afternoon: 13:30 - 17:00 (810 to 1020 mins)
            $minute = mt_rand(810, 1020);
        } elseif ($slotRand <= 90) {
            // Dinner peak: 17:00 - 18:45 (1020 to 1125 mins)
            $minute = mt_rand(1020, 1125);
        } else {
            // Morning: 09:15 - 11:30 (555 to 690 mins)
            $minute = mt_rand(555, 690);
        }

        $sec = mt_rand(0, 59);
        $hour = intdiv($minute, 60);
        $min = $minute % 60;

        $localTimeString = sprintf('%02d:%02d:%02d', $hour, $min, $sec);
        $localCarbon = Carbon::createFromFormat('Y-m-d H:i:s', "{$dateStr} {$localTimeString}", $businessTz);

        return $localCarbon->copy()->setTimezone($storageTz);
    }
}
