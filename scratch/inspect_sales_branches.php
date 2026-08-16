<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Branch;
use App\Models\Sale;

echo "=== BRANCHES ===\n";
$branches = Branch::all();
foreach ($branches as $b) {
    echo "ID: {$b->id} | Name: {$b->name}\n";
}

echo "\n=== SALES BRANCH_ID DISTRIBUTION ===\n";
$salesByBranch = Sale::selectRaw('branch_id, count(*) as count')->groupBy('branch_id')->get();
foreach ($salesByBranch as $sb) {
    $branchName = Branch::find($sb->branch_id)?->name ?? 'NULL/UNKNOWN';
    echo "Branch ID: '{$sb->branch_id}' ({$branchName}) => {$sb->count} sales\n";
}

echo "\n=== FIRST 5 SALES WITH BRANCH RELATIONSHIP ===\n";
$sampleSales = Sale::with('branch')->latest()->limit(5)->get();
foreach ($sampleSales as $s) {
    echo "ID: {$s->id} | Order: {$s->order_number} | Branch ID: '{$s->branch_id}' | Branch Rel Name: '" . ($s->branch?->name ?? 'NULL') . "'\n";
}
