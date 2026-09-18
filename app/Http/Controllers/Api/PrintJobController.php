<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintBridge;
use App\Models\PrintJob;
use App\Services\PrintJobService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrintJobController extends Controller
{
    public function __construct(
        protected PrintJobService $printJobService
    ) {}

    /**
     * GET /api/v1/pos/print-jobs/pending
     * Retrieve pending print jobs for the authenticated branch / terminal / bridge.
     */
    public function pending(Request $request): JsonResponse
    {
        $user = Auth::user();
        $bridgeUuid = $request->header('X-Bridge-UUID', $request->input('bridge_uuid'));

        // If requested by a registered PrintBridge
        if ($bridgeUuid) {
            $bridge = PrintBridge::where('bridge_uuid', $bridgeUuid)->first();
            if ($bridge) {
                $bridge->recordHeartbeat();
                $jobs = $this->printJobService->getPendingJobsForBridge($bridge, 15);
                return response()->json([
                    'success' => true,
                    'count'   => $jobs->count(),
                    'jobs'    => $jobs,
                ]);
            }
        }

        // Fallback to user session/token branch scoping
        $branchId = $request->input('branch_id', $user?->branch_id);

        if (!$branchId && $user?->role !== 'super_admin' && $user?->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Branch ID required.'], 400);
        }

        $query = PrintJob::where('status', PrintJob::STATUS_PENDING);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $jobs = $query->orderBy('id', 'asc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'count'   => $jobs->count(),
            'jobs'    => $jobs,
        ]);
    }

    /**
     * GET /api/v1/pos/print-jobs/{uuid}
     * Retrieve single print job by UUID.
     */
    public function show(string $uuid): JsonResponse
    {
        $job = PrintJob::where('job_uuid', $uuid)->first();

        if (!$job) {
            return response()->json(['success' => false, 'message' => 'Print job not found.'], 404);
        }

        return response()->json([
            'success'   => true,
            'print_job' => $job,
        ]);
    }

    /**
     * POST /api/v1/pos/print-jobs/{uuid}/claim
     * PrintBridge atomically claims a pending job to prevent duplicate spooling.
     */
    public function claim(Request $request, string $uuid): JsonResponse
    {
        $bridgeUuid = $request->header('X-Bridge-UUID', $request->input('bridge_uuid'));

        if (!$bridgeUuid) {
            return response()->json(['success' => false, 'message' => 'Bridge UUID required to claim job.'], 400);
        }

        $bridge = PrintBridge::where('bridge_uuid', $bridgeUuid)->first();
        if (!$bridge) {
            return response()->json(['success' => false, 'message' => 'Bridge device not recognized.'], 404);
        }

        try {
            $job = $this->printJobService->claimJob($bridge, $uuid);

            return response()->json([
                'success'   => true,
                'message'   => "Job claimed by {$bridge->bridge_uuid}",
                'print_job' => $job,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 409);
        }
    }

    /**
     * POST /api/v1/pos/print-jobs/{uuid}/status
     * Local/Android bridge reports printing success or failure.
     */
    public function updateStatus(Request $request, string $uuid): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:printing,printed,failed',
            'error'  => 'nullable|string|max:500',
        ]);

        $bridgeUuid = $request->header('X-Bridge-UUID', $request->input('bridge_uuid'));
        $bridge = $bridgeUuid ? PrintBridge::where('bridge_uuid', $bridgeUuid)->first() : null;

        try {
            $job = $this->printJobService->updateStatus($uuid, $validated['status'], $validated['error'] ?? null, $bridge);

            return response()->json([
                'success'   => true,
                'message'   => "Print job status updated to {$job->status}",
                'print_job' => $job,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * POST /api/v1/pos/print-jobs/reprint
     * Trigger an authorized manual reprint for a sale or order.
     */
    public function reprint(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id'  => 'nullable|exists:sales,id',
            'order_id' => 'nullable|exists:orders,id',
            'reason'   => 'nullable|string|max:255',
        ]);

        $user = Auth::user();

        if (empty($validated['sale_id']) && empty($validated['order_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Either sale_id or order_id is required for reprinting.',
            ], 422);
        }

        try {
            $recordId = $validated['sale_id'] ?? $validated['order_id'];
            $type = !empty($validated['sale_id']) ? 'sale' : 'order';
            $reason = $validated['reason'] ?? 'Customer requested copy';

            $reprintJob = $this->printJobService->reprintReceipt(
                recordId: (int) $recordId,
                recordType: $type,
                actor: $user,
                reason: $reason
            );

            return response()->json([
                'success'   => true,
                'message'   => 'Reprint job created successfully.',
                'print_job' => $reprintJob,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate reprint: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/pos/print-jobs/test
     * Generate a 58mm hardware diagnostic test print job.
     */
    public function testJob(Request $request): JsonResponse
    {
        $user = Auth::user();
        $branchId = (int) $request->input('branch_id', $user?->branch_id ?: 1);
        $terminalId = $request->input('terminal_id');

        try {
            $testJob = $this->printJobService->generateTestJob($branchId, $terminalId, $user);

            return response()->json([
                'success'   => true,
                'message'   => 'Diagnostic test print job generated successfully.',
                'print_job' => $testJob,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create test job: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/pos/print-bridges/register
     * Register or update an Android / Windows / Network print bridge device.
     */
    public function registerBridge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bridge_uuid'            => 'nullable|string|max:64',
            'name'                   => 'required|string|max:100',
            'branch_id'              => 'required|exists:branches,id',
            'terminal_id'            => 'nullable|string|max:50',
            'device_type'            => 'nullable|string|in:android,windows,network',
            'paired_printer_name'    => 'nullable|string|max:100',
            'paired_printer_address' => 'nullable|string|max:100',
            'connection_type'        => 'nullable|string|in:bluetooth_spp,bluetooth_ble,usb,tcp',
            'battery_level'          => 'nullable|integer|min:0|max:100',
        ]);

        try {
            $bridge = $this->printJobService->registerBridge($validated);

            return response()->json([
                'success' => true,
                'message' => 'Print bridge registered successfully.',
                'bridge'  => $bridge,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to register bridge: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/pos/print-bridges/heartbeat
     * Record live heartbeat and printer connectivity status.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bridge_uuid'   => 'required|string|max:64',
            'battery_level' => 'nullable|integer|min:0|max:100',
            'status'        => 'nullable|string|in:online,offline,printing',
        ]);

        try {
            $bridge = $this->printJobService->recordHeartbeat(
                $validated['bridge_uuid'],
                $validated['battery_level'] ?? null,
                $validated['status'] ?? null
            );

            return response()->json([
                'success'   => true,
                'is_online' => $bridge->isOnline(),
                'bridge'    => $bridge,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bridge not found or heartbeat failed: ' . $e->getMessage(),
            ], 404);
        }
    }

    /**
     * GET /api/v1/pos/print-bridges
     * List registered print bridges for the current branch / admin.
     */
    public function listBridges(Request $request): JsonResponse
    {
        $user = Auth::user();
        $branchId = $request->input('branch_id', $user?->branch_id);

        $query = PrintBridge::query();

        if ($branchId && $user?->role !== 'super_admin' && $user?->role !== 'admin') {
            $query->where('branch_id', $branchId);
        } elseif ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $bridges = $query->orderBy('last_heartbeat_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'count'   => $bridges->count(),
            'bridges' => $bridges->map(function ($b) {
                return [
                    'id'                     => $b->id,
                    'bridge_uuid'            => $b->bridge_uuid,
                    'name'                   => $b->name,
                    'branch_id'              => $b->branch_id,
                    'terminal_id'            => $b->terminal_id,
                    'device_type'            => $b->device_type,
                    'paired_printer_name'    => $b->paired_printer_name,
                    'paired_printer_address' => $b->paired_printer_address,
                    'connection_type'        => $b->connection_type,
                    'status'                 => $b->status,
                    'is_online'              => $b->isOnline(),
                    'battery_level'          => $b->battery_level,
                    'last_heartbeat_at'      => $b->last_heartbeat_at?->toIso8601String(),
                ];
            }),
        ]);
    }
}
