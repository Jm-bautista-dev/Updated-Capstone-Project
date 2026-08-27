<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SystemHealthController extends Controller
{
    /**
     * GET /super-admin/system-health
     */
    public function index(Request $request): Response
    {
        return Inertia::render('SuperAdmin/SystemHealth', [
            'initialHealth' => $this->runFullDiagnostics(),
        ]);
    }

    /**
     * GET /super-admin/system-health/check (AJAX refresh)
     */
    public function check(Request $request): JsonResponse
    {
        return response()->json([
            'success'   => true,
            'timestamp' => now()->toIso8601String(),
            'health'    => $this->runFullDiagnostics(),
        ]);
    }

    private function runFullDiagnostics(): array
    {
        // 1. Database Diagnostic
        $dbStart = microtime(true);
        $dbStatus = 'healthy';
        $dbMessage = '';
        try {
            DB::select('SELECT 1');
            $dbLatency = round((microtime(true) - $dbStart) * 1000, 2);
            $dbMessage = "Latency: {$dbLatency}ms";
        } catch (\Throwable $e) {
            $dbStatus  = 'offline';
            $dbLatency = 0;
            $dbMessage = $e->getMessage();
        }

        // 2. Storage Diagnostic
        $appWritable    = is_writable(storage_path('app'));
        $publicWritable = is_writable(public_path('storage')) || is_writable(storage_path('app/public'));
        $logsWritable   = is_writable(storage_path('logs'));
        $storageStatus  = ($appWritable && $logsWritable) ? 'healthy' : 'warning';

        // 3. Cache Diagnostic
        $cacheStart = microtime(true);
        $cacheStatus = 'healthy';
        try {
            Cache::put('health_test', '1', 5);
            $cached = Cache::get('health_test');
            $cacheLatency = round((microtime(true) - $cacheStart) * 1000, 2);
            $cacheMessage = $cached === '1' ? "Latency: {$cacheLatency}ms" : 'Read mismatch';
        } catch (\Throwable $e) {
            $cacheStatus  = 'offline';
            $cacheLatency = 0;
            $cacheMessage = $e->getMessage();
        }

        // 4. External Services Check (OSRM / OpenStreetMap)
        $osrmStatus = 'healthy';
        $osrmLatency = 0;
        try {
            $s = microtime(true);
            $ctx = stream_context_create(['http' => ['timeout' => 2]]);
            @file_get_contents('http://router.project-osrm.org/nearest/v1/driving/121.32,14.23', false, $ctx);
            $osrmLatency = round((microtime(true) - $s) * 1000, 2);
        } catch (\Throwable $e) {
            $osrmStatus = 'warning';
        }

        return [
            'database' => [
                'name'       => 'MySQL Database',
                'status'     => $dbStatus,
                'latency'    => $dbLatency ?? 0,
                'message'    => $dbMessage,
                'connection' => config('database.default'),
            ],
            'application' => [
                'name'        => 'Laravel Framework',
                'status'      => 'healthy',
                'php_version' => PHP_VERSION,
                'version'     => app()->version(),
                'environment' => app()->environment(),
            ],
            'storage' => [
                'name'            => 'Filesystem Storage',
                'status'          => $storageStatus,
                'app_writable'    => $appWritable,
                'public_writable' => $publicWritable,
                'logs_writable'   => $logsWritable,
            ],
            'cache' => [
                'name'    => 'Cache Driver',
                'status'  => $cacheStatus,
                'driver'  => config('cache.default'),
                'message' => $cacheMessage ?? 'OK',
            ],
            'external' => [
                'osrm_routing' => [
                    'name'    => 'OSRM Road Distance API',
                    'status'  => $osrmStatus,
                    'latency' => $osrmLatency,
                ],
            ],
        ];
    }
}
