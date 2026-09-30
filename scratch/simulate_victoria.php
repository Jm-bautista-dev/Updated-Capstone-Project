<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

$staCruzBranch = Branch::where('name', 'like', '%Sta Cruz%')
    ->orWhere('name', 'like', '%Santa Cruz%')
    ->first();

$victoriaBranch = Branch::where('name', 'like', '%Victoria%')
    ->first();

// 1. Analyze Sta Cruz exact daily figures for reference
$startDate = '2026-09-10 00:00:00';
$endDate = '2026-09-30 23:59:59';

$staCruzSales = Sale::where('branch_id', $staCruzBranch->id)
    ->whereBetween('created_at', [$startDate, $endDate])
    ->with('items')
    ->orderBy('created_at')
    ->get();

$staCruzTotalRevenue = (float)$staCruzSales->sum('total');
$staCruzTotalOrders = $staCruzSales->count();
$staCruzTotalQty = 0;
$staCruzDaily = [];

foreach ($staCruzSales as $sale) {
    $d = substr($sale->created_at->toDateTimeString(), 0, 10);
    if (!isset($staCruzDaily[$d])) {
        $staCruzDaily[$d] = ['orders' => 0, 'revenue' => 0.0, 'qty' => 0];
    }
    $staCruzDaily[$d]['orders']++;
    $staCruzDaily[$d]['revenue'] += (float)$sale->total;
    foreach ($sale->items as $item) {
        $staCruzDaily[$d]['qty'] += (float)$item->quantity;
        $staCruzTotalQty += (float)$item->quantity;
    }
}

echo "STA CRUZ BASELINE:\n";
echo "Total Revenue: ₱" . number_format($staCruzTotalRevenue, 2) . "\n";
echo "Total Orders: " . $staCruzTotalOrders . "\n";
echo "Total Quantity: " . $staCruzTotalQty . "\n";
echo "Target Victoria Revenue (90% - 95%): ₱" . number_format($staCruzTotalRevenue * 0.90, 2) . " - ₱" . number_format($staCruzTotalRevenue * 0.95, 2) . "\n\n";

// 2. Fetch available products with prices
$products = Product::whereNull('deleted_at')
    ->get();

// Categorize products and assign weights
$weightedProducts = [];
foreach ($products as $p) {
    $name = strtolower($p->name);
    $price = (float)$p->selling_price;
    if ($price <= 0) continue;

    // Fast-casual restaurant mix:
    // Fast moving student meals & 4pc maki & drinks: high weight
    // Solo bowls & bento meals & 8pc maki: medium weight
    // Platters & sushi boats: rare weight
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

// Helper to pick a random weighted product
function pickProduct(array $weightedProducts): array {
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

// Generate realistic time in 10:00 AM - 8:00 PM (10:00 to 20:00) with restaurant peaks
function generateRealisticTime(string $dateStr): Carbon {
    // Determine time slot:
    // Lunch peak: 11:30 - 13:30 (weight 35)
    // Afternoon: 13:30 - 17:00 (weight 20)
    // Dinner peak: 17:00 - 19:30 (weight 35)
    // Early/Late: 10:00 - 11:30 (weight 5), 19:30 - 20:00 (weight 5)
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

// Run simulation with fixed seed for determinism
mt_srand(987654);

$simulatedVictoriaSales = [];
$victoriaDaily = [];
$victoriaTotalRevenue = 0.0;
$victoriaTotalQty = 0;
$victoriaTotalOrders = 0;

foreach ($staCruzDaily as $dateStr => $scStat) {
    // Reference volume for this day from Sta Cruz
    $scQty = $scStat['qty'];
    
    // Victoria volume varies around 88% - 96% of Sta Cruz daily volume with natural variance
    // Weekend/weekday realistic variations
    $dateObj = Carbon::parse($dateStr);
    $isWeekend = $dateObj->isWeekend();
    
    // Scale factor between 0.88 and 0.96 with natural jitter
    $scale = mt_rand(88, 96) / 100.0;
    
    // Target day quantity
    $targetDayQty = max(8, (int)round($scQty * $scale));
    
    $dayQty = 0;
    $dayOrders = 0;
    $dayRevenue = 0.0;
    $daySales = [];

    while ($dayQty < $targetDayQty) {
        // Pick number of items in this transaction (1 to 3 items mostly)
        $numItems = mt_rand(1, 100) <= 65 ? 1 : (mt_rand(1, 100) <= 75 ? 2 : 3);
        $orderItems = [];
        $orderTotal = 0.0;
        $orderQty = 0;

        for ($i = 0; $i < $numItems; $i++) {
            $picked = pickProduct($weightedProducts);
            $p = $picked['product'];
            $price = $picked['price'];

            // Quantity per item (usually 1, sometimes 2-3, rarely more)
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
                'product_id' => $p->id,
                'product_name' => $p->name,
                'quantity' => $itemQty,
                'unit_price' => $price,
                'subtotal' => $lineTotal,
            ];
        }

        $transTime = generateRealisticTime($dateStr);
        $payMethod = mt_rand(1, 100) <= 82 ? 'cash' : (mt_rand(1, 100) <= 60 ? 'gcash' : 'maya');
        $orderType = mt_rand(1, 100) <= 75 ? 'dine-in' : 'take-out';

        $daySales[] = [
            'date' => $dateStr,
            'time' => $transTime,
            'total' => $orderTotal,
            'quantity' => $orderQty,
            'payment_method' => $payMethod,
            'type' => $orderType,
            'items' => $orderItems,
        ];

        $dayQty += $orderQty;
        $dayOrders++;
        $dayRevenue += $orderTotal;
    }

    // Sort day sales chronologically
    usort($daySales, fn($a, $b) => $a['time'] <=> $b['time']);

    $victoriaDaily[$dateStr] = [
        'orders' => $dayOrders,
        'revenue' => $dayRevenue,
        'qty' => $dayQty,
    ];

    $victoriaTotalRevenue += $dayRevenue;
    $victoriaTotalQty += $dayQty;
    $victoriaTotalOrders += $dayOrders;
    $simulatedVictoriaSales[$dateStr] = $daySales;
}

echo "=== SIMULATED VICTORIA RESULTS ===\n";
echo "Total Revenue: ₱" . number_format($victoriaTotalRevenue, 2) . "\n";
echo "Total Orders: " . $victoriaTotalOrders . "\n";
echo "Total Quantity: " . $victoriaTotalQty . "\n";
echo "Revenue Ratio (Victoria / Sta Cruz): " . number_format(($victoriaTotalRevenue / $staCruzTotalRevenue) * 100, 2) . "%\n";
echo "Quantity Ratio (Victoria / Sta Cruz): " . number_format(($victoriaTotalQty / $staCruzTotalQty) * 100, 2) . "%\n\n";

echo "Daily Comparison:\n";
printf("%-12s | %-24s | %-24s | %-8s\n", "Date", "Sta Cruz (Rev / Qty)", "Victoria (Rev / Qty)", "Rev Ratio");
echo str_repeat("-", 75) . "\n";
foreach ($staCruzDaily as $dateStr => $sc) {
    $vic = $victoriaDaily[$dateStr] ?? ['revenue' => 0, 'qty' => 0, 'orders' => 0];
    $ratio = $sc['revenue'] > 0 ? number_format(($vic['revenue'] / $sc['revenue']) * 100, 1) . "%" : "N/A";
    printf(
        "%-12s | ₱%-9s (%2d orders, %2d qty) | ₱%-9s (%2d orders, %2d qty) | %-8s\n",
        $dateStr,
        number_format($sc['revenue'], 2),
        $sc['orders'],
        $sc['qty'],
        number_format($vic['revenue'], 2),
        $vic['orders'],
        $vic['qty'],
        $ratio
    );
}
