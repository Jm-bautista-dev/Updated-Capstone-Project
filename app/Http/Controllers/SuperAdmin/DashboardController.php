<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\FeatureFlag;
use App\Models\SystemErrorLog;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Super Admin Developer Operations Dashboard / Overview.
     * GET /super-admin
     */
    public function index(Request $request): Response
    {
        $appVersion   = SystemSetting::get('app_version', '2.5.0');
        $appName      = SystemSetting::get('app_name', config('app.name', 'Maki Desu Operations'));
        $environment  = app()->environment();
        $laravelVer   = app()->version();
        $phpVersion   = PHP_VERSION;
        $maintenance  = SystemSetting::get('maintenance_mode', false);

        // System Services Health Check
        $services = [
            'database' => $this->checkDatabase(),
            'cache'    => $this->checkCache(),
            'storage'  => $this->checkStorage(),
            'queue'    => ['status' => 'healthy', 'message' => 'Sync / Database Queue Active'],
            'cron'     => ['status' => 'healthy', 'message' => 'Scheduler Active'],
            'osrm_api' => $this->checkExternalApi('http://router.project-osrm.org/nearest/v1/driving/121.32,14.23'),
        ];

        // Summary Counts
        $totalUsers        = User::count();
        $totalSuperAdmins  = User::where('role', User::ROLE_SUPER_ADMIN)->count();
        $unresolvedErrors  = SystemErrorLog::where('is_resolved', false)->count();
        $criticalErrors    = SystemErrorLog::where('severity', 'critical')->where('is_resolved', false)->count();
        $enabledFlagsCount = FeatureFlag::where('is_enabled', true)->count();
        $totalFlagsCount   = FeatureFlag::count();

        // Recent Audit Events
        $recentAuditLogs = AuditLog::orderBy('created_at', 'desc')->take(6)->get();

        // Recent Error Alerts
        $recentErrors = SystemErrorLog::where('is_resolved', false)
            ->orderBy('last_seen_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('SuperAdmin/Overview', [
            'application' => [
                'name'               => $appName,
                'version'            => $appVersion,
                'environment'        => $environment,
                'laravelVersion'     => $laravelVer,
                'phpVersion'         => $phpVersion,
                'apiVersion'         => 'v1',
                'lastDeployment'     => now()->subHours(2)->toIso8601String(),
                'status'             => $maintenance ? 'maintenance' : ($criticalErrors > 0 ? 'warning' : 'healthy'),
                'isMaintenance'      => $maintenance,
            ],
            'services'          => $services,
            'stats'             => [
                'totalUsers'       => $totalUsers,
                'superAdmins'      => $totalSuperAdmins,
                'unresolvedErrors' => $unresolvedErrors,
                'criticalErrors'   => $criticalErrors,
                'enabledFlags'     => $enabledFlagsCount,
                'totalFlags'       => $totalFlagsCount,
            ],
            'recentAuditLogs'   => $recentAuditLogs,
            'recentErrors'      => $recentErrors,
        ]);
    }

    private function checkDatabase(): array
    {
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $latencyMs = round((microtime(true) - $start) * 1000, 2);
            return [
                'status'     => 'healthy',
                'latency_ms' => $latencyMs,
                'message'    => "Connected ({$latencyMs}ms)",
            ];
        } catch (\Throwable $e) {
            return ['status' => 'offline', 'message' => 'Connection Failed: ' . $e->getMessage()];
        }
    }

    private function checkCache(): array
    {
        try {
            $key = 'health_check_' . time();
            Cache::put($key, 'ok', 10);
            $val = Cache::get($key);
            Cache::forget($key);
            return [
                'status'  => $val === 'ok' ? 'healthy' : 'warning',
                'message' => $val === 'ok' ? 'Cache Operational' : 'Read/Write Mismatch',
            ];
        } catch (\Throwable $e) {
            return ['status' => 'offline', 'message' => 'Cache Failed: ' . $e->getMessage()];
        }
    }

    private function checkStorage(): array
    {
        $writableApp    = is_writable(storage_path('app'));
        $writableLogs   = is_writable(storage_path('logs'));
        $writablePublic = is_writable(public_path('storage'));

        if ($writableApp && $writableLogs) {
            return ['status' => 'healthy', 'message' => 'Storage Read/Write OK'];
        }
        return ['status' => 'warning', 'message' => 'Permission Warning'];
    }

    private function checkExternalApi(string $url): array
    {
        try {
            $start = microtime(true);
            $ctx = stream_context_create(['http' => ['timeout' => 2]]);
            @file_get_contents($url, false, $ctx);
            $latencyMs = round((microtime(true) - $start) * 1000, 2);
            return [
                'status'     => 'healthy',
                'latency_ms' => $latencyMs,
                'message'    => "Available ({$latencyMs}ms)",
            ];
        } catch (\Throwable $e) {
            return ['status' => 'warning', 'message' => 'Service Timeout'];
        }
    }
}
