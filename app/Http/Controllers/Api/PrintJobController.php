<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
     * Retrieve pending print jobs for the authenticated branch / terminal.
     */
    public function pending(Request $request): JsonResponse
    {
        $user = Auth::user();
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
     * POST /api/v1/pos/print-jobs/{uuid}/status
     * Local bridge reports printing success or failure.
     */
    public function updateStatus(Request $request, string $uuid): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:printing,printed,failed',
            'error'  => 'nullable|string|max:500',
        ]);

        try {
            $job = $this->printJobService->updateStatus($uuid, $validated['status'], $validated['error'] ?? null);

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
}
