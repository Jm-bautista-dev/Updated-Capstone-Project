<?php

namespace App\Console\Commands;

use App\Models\Sale;
use App\Models\SaleItem;
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
        $this->info('Generating daily inventory report...');
        $recipient = env('REPORT_RECIPIENT_EMAIL', 'jmbautistaa0428@gmail.com');

        try {
            $today = now()->startOfDay();

            // 1. Sales Totals
            $totalRevenue = Sale::where('created_at', '>=', $today)->sum('total');
            $totalTransactions = Sale::where('created_at', '>=', $today)->count();

            // 2. Top Products
            $topProducts = DB::table('sale_items')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->where('sale_items.created_at', '>=', $today)
                ->select('products.name', 
                    DB::raw('SUM(sale_items.quantity) as total_qty'),
                    DB::raw('SUM(sale_items.subtotal) as total_revenue'))
                ->groupBy('products.id', 'products.name')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get();

            // 3. Current Inventory
            $inventory = InventoryItem::orderBy('name')->get();

            $reportData = [
                'total_revenue' => $totalRevenue,
                'total_transactions' => $totalTransactions,
                'top_products' => $topProducts,
                'inventory' => $inventory,
            ];

            Mail::to($recipient)->send(new DailyInventoryReportMail($reportData));

            $this->info('Report sent successfully to ' . $recipient);
            Log::info('Daily inventory report sent to ' . $recipient);

        } catch (\Exception $e) {
            $this->error('Failed to generate report: ' . $e->getMessage());
            Log::error('Daily inventory report failed: ' . $e->getMessage());
        }
    }
}
