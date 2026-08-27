<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DatabaseHealthController extends Controller
{
    /**
     * GET /super-admin/database
     * Read-only database health, latency, migration status, and table size metrics.
     */
    public function index(Request $request): Response
    {
        $connectionName = config('database.default');
        $driver         = config("database.connections.{$connectionName}.driver", 'mysql');
        
        $start = microtime(true);
        try {
            DB::select('SELECT 1');
            $latencyMs = round((microtime(true) - $start) * 1000, 2);
            $dbConnected = true;
        } catch (\Throwable $e) {
            $latencyMs = 0;
            $dbConnected = false;
        }

        // Table Sizes & Rows (Read-Only)
        $tablesInfo = [];
        try {
            if ($driver === 'mysql') {
                $dbName = config("database.connections.{$connectionName}.database");
                $results = DB::select("
                    SELECT 
                        table_name AS name,
                        table_rows AS rows,
                        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
                    FROM information_schema.TABLES
                    WHERE table_schema = ?
                    ORDER BY (data_length + index_length) DESC
                    LIMIT 25
                ", [$dbName]);

                foreach ($results as $row) {
                    $tablesInfo[] = [
                        'name'    => $row->name,
                        'rows'    => (int) ($row->rows ?? 0),
                        'size_mb' => (float) ($row->size_mb ?? 0),
                    ];
                }
            } else {
                // SQLite fallback for testing environments
                $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                foreach ($tables as $t) {
                    $count = DB::table($t->name)->count();
                    $tablesInfo[] = [
                        'name'    => $t->name,
                        'rows'    => $count,
                        'size_mb' => 0.05,
                    ];
                }
            }
        } catch (\Throwable $e) {
            $tablesInfo = [];
        }

        // Migration status count
        $appliedMigrationsCount = 0;
        try {
            $appliedMigrationsCount = DB::table('migrations')->count();
        } catch (\Throwable $e) {
            // Migrations table might not exist yet
        }

        return Inertia::render('SuperAdmin/DatabaseHealth', [
            'database' => [
                'connection'       => $connectionName,
                'driver'           => strtoupper($driver),
                'isConnected'      => $dbConnected,
                'latencyMs'        => $latencyMs,
                'appliedMigrations' => $appliedMigrationsCount,
            ],
            'tables' => $tablesInfo,
        ]);
    }
}
