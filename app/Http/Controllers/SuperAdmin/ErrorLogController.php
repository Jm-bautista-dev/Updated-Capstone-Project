<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemErrorLog;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ErrorLogController extends Controller
{
    /**
     * GET /super-admin/errors
     */
    public function index(Request $request): Response
    {
        $query = SystemErrorLog::with('user:id,name,email,role');

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                  ->orWhere('exception_class', 'like', "%{$search}%")
                  ->orWhere('endpoint', 'like', "%{$search}%")
                  ->orWhere('file', 'like', "%{$search}%");
            });
        }

        // Severity filter
        if ($request->filled('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        // Status code filter
        if ($request->filled('status_code')) {
            $query->where('status_code', $request->input('status_code'));
        }

        // Resolution status filter
        if ($request->has('resolved')) {
            $resolved = filter_var($request->input('resolved'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_resolved', $resolved);
        } else {
            // Default to unresolved errors first
            $query->where('is_resolved', false);
        }

        $errors = $query->orderBy('last_seen_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total'       => SystemErrorLog::count(),
            'unresolved'  => SystemErrorLog::where('is_resolved', false)->count(),
            'critical'    => SystemErrorLog::where('severity', 'critical')->where('is_resolved', false)->count(),
            'resolved'    => SystemErrorLog::where('is_resolved', true)->count(),
        ];

        return Inertia::render('SuperAdmin/ErrorLogs', [
            'errors'  => $errors,
            'stats'   => $stats,
            'filters' => $request->only(['search', 'severity', 'status_code', 'resolved']),
        ]);
    }

    /**
     * POST /super-admin/errors/{id}/resolve
     */
    public function toggleResolve(Request $request, int $id): JsonResponse
    {
        $error = SystemErrorLog::findOrFail($id);
        $newStatus = !$error->is_resolved;

        $error->update([
            'is_resolved'     => $newStatus,
            'developer_notes' => $request->input('notes', $error->developer_notes),
        ]);

        AuditLogger::log(
            action: $newStatus ? 'error.marked_resolved' : 'error.marked_unresolved',
            target: "Error #{$error->id} ({$error->exception_class})",
            beforeState: ['is_resolved' => !$newStatus],
            afterState: ['is_resolved' => $newStatus]
        );

        return response()->json([
            'success'     => true,
            'message'     => $newStatus ? 'Error marked as resolved.' : 'Error marked as unresolved.',
            'is_resolved' => $newStatus,
        ]);
    }

    /**
     * POST /super-admin/errors/clear-resolved
     */
    public function clearResolved(): JsonResponse
    {
        $count = SystemErrorLog::where('is_resolved', true)->delete();

        AuditLogger::log(
            action: 'error.cleared_resolved',
            target: "Deleted {$count} resolved error logs"
        );

        return response()->json([
            'success' => true,
            'message' => "Cleared {$count} resolved error logs.",
        ]);
    }
}
