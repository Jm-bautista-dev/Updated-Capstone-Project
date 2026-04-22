<?php

namespace App\Console\Commands;

use App\Models\Sale;
use App\Models\User;
use App\Models\Branch;
use App\Models\IngredientStock;
use App\Models\InventoryItem;
use App\Mail\DailyInventoryReportMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendDailyInventoryReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:daily-report';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate and email a daily summary of sales and inventory status.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Generating comprehensive daily business summary...');
        
        try {
            $today = now()->startOfDay();
            
            // 1. Recipient List (Admins + Configured Email)
            $admins = User::where('role', User::ROLE_ADMIN)->pluck('email')->toArray();
            $configuredRecipient = env('REPORT_RECIPIENT_EMAIL');
            $recipients = array_unique(array_filter(array_merge($admins, (array)$configuredRecipient)));

            if (empty($recipients)) {
                $this->warn('No recipients found for the daily report.');
                return;
            }

            // 2. Sales Summary (Per Branch)
            $branches = Branch::all();
            $branchSummaries = [];
            $overallTotalSales = 0;
            $bestBranch = ['name' => 'N/A', 'sales' => 0];

            foreach ($branches as $branch) {
                $salesData = Sale::where('branch_id', $branch->id)
                    ->where('created_at', '>=', $today)
                    ->selectRaw('SUM(total) as total_sales, COUNT(*) as orders_count')
                    ->first();

                $topProduct = DB::table('sale_items')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->join('products', 'sale_items.product_id', '=', 'products.id')
                    ->where('sales.branch_id', $branch->id)
                    ->where('sale_items.created_at', '>=', $today)
                    ->select('products.name', DB::raw('SUM(sale_items.quantity) as qty'))
                    ->groupBy('products.id', 'products.name')
                    ->orderByDesc('qty')
                    ->first();

                $totalSales = (float) ($salesData->total_sales ?? 0);
                $ordersCount = (int) ($salesData->orders_count ?? 0);

                if ($totalSales > $bestBranch['sales']) {
                    $bestBranch = ['name' => $branch->name, 'sales' => $totalSales];
                }

                $overallTotalSales += $totalSales;

                $branchSummaries[] = [
                    'name'         => $branch->name,
                    'total_sales'  => $totalSales,
                    'orders_count' => $ordersCount,
                    'top_product'  => $topProduct ? $topProduct->name : 'N/A'
                ];
            }

            // 3. Inventory Alerts
            $outOfStock = IngredientStock::with(['ingredient', 'branch'])
                ->where('stock', '<=', 0)
                ->get();

            $lowStock = IngredientStock::with(['ingredient', 'branch'])
                ->whereColumn('stock', '<=', 'low_stock_level')
                ->where('stock', '>', 0)
                ->get();

            // 4. Prepare data for the mail
            $reportData = [
                'date'               => now()->format('F d, Y'),
                'branch_summaries'   => $branchSummaries,
                'out_of_stock'       => $outOfStock,
                'low_stock'          => $lowStock,
                'overall_total'      => $overallTotalSales,
                'best_branch'        => $bestBranch['name'],
            ];

            // 5. Send Email
            Mail::to($recipients)->send(new DailyInventoryReportMail($reportData));

            $this->info('Daily summary sent successfully to ' . count($recipients) . ' recipients.');
            Log::info('Daily business summary sent to: ' . implode(', ', $recipients));

        } catch (\Exception $e) {
            $this->error('Failed to generate daily summary: ' . $e->getMessage());
            Log::error('Daily business summary failed: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
        }
    }
}
