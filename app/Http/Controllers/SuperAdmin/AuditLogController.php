<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * GET /super-admin/audit-logs
     */
    public function index(Request $request): Response
    {
        $query = AuditLog::with('actor:id,name,email,role');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('actor_name', 'like', "%{$search}%")
                  ->orWhere('target', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('role')) {
            $query->where('actor_role', $request->input('role'));
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        $actionTypes = AuditLog::select('action')->distinct()->pluck('action');

        return Inertia::render('SuperAdmin/AuditLogs', [
            'logs'        => $logs,
            'actionTypes' => $actionTypes,
            'filters'     => $request->only(['search', 'action', 'role']),
        ]);
    }
}
