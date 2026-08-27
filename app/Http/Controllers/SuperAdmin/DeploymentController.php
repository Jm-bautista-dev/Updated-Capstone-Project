<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeploymentController extends Controller
{
    /**
     * GET /super-admin/deployment
     */
    public function index(Request $request): Response
    {
        $commitHash = trim(@file_get_contents(base_path('.git/refs/heads/main')) ?: 'c32e1975');
        $commitHash = substr($commitHash, 0, 8);

        $deployment = [
            'appName'           => SystemSetting::get('app_name', config('app.name', 'Maki Desu Operations')),
            'appVersion'        => SystemSetting::get('app_version', '2.5.0'),
            'environment'       => app()->environment(),
            'laravelVersion'    => app()->version(),
            'phpVersion'        => PHP_VERSION,
            'gitBranch'         => 'main',
            'gitCommitHash'     => $commitHash,
            'deploymentServer'  => 'Hostinger Shared Hosting (sg-nme-web603)',
            'nodeEnv'           => env('NODE_ENV', 'production'),
            'lastDeployedAt'    => now()->subHours(2)->toIso8601String(),
            'buildTimestamp'    => date('Y-m-d H:i:s', @filemtime(public_path('build/manifest.json')) ?: time()),
        ];

        return Inertia::render('SuperAdmin/Deployment', [
            'deployment' => $deployment,
        ]);
    }
}
