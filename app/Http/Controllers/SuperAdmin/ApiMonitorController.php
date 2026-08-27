<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemErrorLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ApiMonitorController extends Controller
{
    /**
     * GET /super-admin/api-monitor
     */
    public function index(Request $request): Response
    {
        // Calculate recent endpoint metrics from SystemErrorLog & recent orders
        $recentEndpointErrors = SystemErrorLog::select('endpoint', 'method', DB::raw('COUNT(*) as total_errors'), DB::raw('MAX(last_seen_at) as last_error_at'))
            ->whereNotNull('endpoint')
            ->groupBy('endpoint', 'method')
            ->orderBy('total_errors', 'desc')
            ->take(15)
            ->get();

        $monitoredEndpoints = [
            ['path' => '/api/v1/login', 'method' => 'POST', 'name' => 'Mobile/Web Authentication', 'status' => 'active'],
            ['path' => '/api/v1/customer/orders', 'method' => 'POST', 'name' => 'Order Placement', 'status' => 'active'],
            ['path' => '/api/v1/customer/orders/{id}', 'method' => 'GET', 'name' => 'Order Details & Buy Again', 'status' => 'active'],
            ['path' => '/api/v1/customer/orders/{id}/tracking', 'method' => 'GET', 'name' => 'Customer Order Tracking', 'status' => 'active'],
            ['path' => '/api/v1/rider/location', 'method' => 'POST', 'name' => 'Rider GPS Tracking Ping', 'status' => 'active'],
            ['path' => '/api/v1/rider/orders/{id}/status', 'method' => 'POST', 'name' => 'Rider Workflow Transition', 'status' => 'active'],
            ['path' => '/api/pos/calculate-delivery-distance', 'method' => 'POST', 'name' => 'POS Road Routing Calculation', 'status' => 'active'],
            ['path' => '/api/v1/system/status', 'method' => 'GET', 'name' => 'Public System Status Check', 'status' => 'active'],
        ];

        return Inertia::render('SuperAdmin/ApiMonitor', [
            'endpoints' => $monitoredEndpoints,
            'recentEndpointErrors' => $recentEndpointErrors,
            'summary' => [
                'totalMonitored' => count($monitoredEndpoints),
                'activeEndpoints' => count($monitoredEndpoints),
                'errorCount24h'   => SystemErrorLog::where('created_at', '>=', now()->subDay())->count(),
            ]
        ]);
    }
}
