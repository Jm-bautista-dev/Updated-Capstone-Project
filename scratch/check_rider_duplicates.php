<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Rider;
use Illuminate\Support\Facades\DB;

$riders = Rider::withTrashed()->get(['id', 'name', 'phone', 'email', 'branch_id', 'deleted_at']);
echo "Total riders in DB: " . $riders->count() . "\n";
foreach ($riders as $r) {
    echo sprintf(
        "ID: %d | Name: %s | Phone: %s | Email: %s | Branch: %s | Deleted: %s\n",
        $r->id,
        $r->name,
        $r->phone ?? 'NULL',
        $r->email,
        $r->branch_id,
        $r->deleted_at ? 'YES (' . $r->deleted_at . ')' : 'NO'
    );
}

$duplicates = DB::table('riders')
    ->select('phone', DB::raw('count(*) as count'))
    ->whereNotNull('phone')
    ->groupBy('phone')
    ->having('count', '>', 1)
    ->get();

echo "\n--- Duplicate Phone Groups ---\n";
echo "Duplicate groups count: " . $duplicates->count() . "\n";
foreach ($duplicates as $d) {
    echo "Duplicate Phone: " . $d->phone . " (" . $d->count . " occurrences)\n";
}
