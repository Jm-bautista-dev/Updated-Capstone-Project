<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientBatch;
use App\Services\InventoryBatchService;
use App\Services\ExpirationAlertService;
use App\Utils\UnitConverter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InventoryBatchController extends Controller
{
    protected InventoryBatchService $batchService;
    protected ExpirationAlertService $alertService;

    public function __construct(InventoryBatchService $batchService, ExpirationAlertService $alertService)
    {
        $this->batchService = $batchService;
        $this->alertService = $alertService;
    }

    /**
     * List batches with branch isolation and flexible filtering.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->isAdmin()
            ? ($request->filled('branch_id') && $request->input('branch_id') !== 'all' ? (int) $request->input('branch_id') : null)
            : $user->branch_id;

        $query = IngredientBatch::with(['ingredient', 'branch', 'supplier', 'receivedBy']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($request->filled('ingredient_id')) {
            $query->where('ingredient_id', (int) $request->input('ingredient_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('batch_code', 'like', $search)
                  ->orWhere('lot_number', 'like', $search)
                  ->orWhere('reference', 'like', $search)
                  ->orWhereHas('ingredient', fn($iq) => $iq->where('name', 'like', $search));
            });
        }

        $now = Carbon::now(config('app.timezone', 'Asia/Manila'));

        // Expiration status filter
        if ($request->filled('expiration_filter')) {
            $expFilter = $request->input('expiration_filter');
            if ($expFilter === 'expired') {
                $query->whereNotNull('expiration_date')->where('expiration_date', '<=', $now);
            } elseif ($expFilter === 'expiring_today') {
                $query->whereNotNull('expiration_date')
                      ->whereDate('expiration_date', $now->toDateString())
                      ->where('expiration_date', '>', $now);
            } elseif ($expFilter === 'expiring_soon') {
                $warningDays = (int) $request->input('warning_days', 7);
                $query->whereNotNull('expiration_date')
                      ->where('expiration_date', '>', $now)
                      ->where('expiration_date', '<=', $now->copy()->addDays($warningDays));
            } elseif ($expFilter === 'quarantined') {
                $query->where('status', 'quarantined');
            } elseif ($expFilter === 'missing_expiry') {
                $query->whereNull('expiration_date')->where('is_legacy', false);
            }
        }

        $batches = $query->orderByFefoFifo()->paginate(25);

        return response()->json($batches);
    }

    /**
     * Get the consumption queue for an ingredient in a branch.
     */
    public function queue(Request $request, int $ingredientId)
    {
        $user = Auth::user();
        $branchId = $user->isAdmin()
            ? (int) ($request->input('branch_id') ?: $user->branch_id ?: 1)
            : (int) $user->branch_id;

        $queue = $this->batchService->getQueueForIngredient($ingredientId, $branchId, true);

        return response()->json($queue);
    }

    /**
     * Get detailed information for a specific batch (movements, allocations, adjustments).
     */
    public function show($id)
    {
        $user = Auth::user();
        $batch = IngredientBatch::with([
            'ingredient', 
            'branch', 
            'supplier', 
            'receivedBy',
            'movements.user',
            'allocations' => fn($q) => $q->latest()->limit(50),
        ])->findOrFail($id);

        if (!$user->isAdmin() && (int) $batch->branch_id !== (int) $user->branch_id) {
            return response()->json(['error' => 'Unauthorized branch access.'], 403);
        }

        return response()->json([
            'batch'       => $batch,
            'movements'   => $batch->movements,
            'allocations' => $batch->allocations,
        ]);
    }

    /**
     * Adjust physical count discrepancy or wastage on a specific batch.
     */
    public function adjust(Request $request, $id)
    {
        $user = Auth::user();
        $batch = IngredientBatch::findOrFail($id);

        if (!$user->isAdmin() && (int) $batch->branch_id !== (int) $user->branch_id) {
            return response()->json(['error' => 'Unauthorized branch access.'], 403);
        }

        $validated = $request->validate([
            'new_quantity' => 'required|numeric|min:0|max:1000000',
            'unit'         => 'required|string',
            'reason'       => 'required|string|in:physical_count,spoilage,damage,expired_removal,correction,other',
            'notes'        => 'nullable|string|max:500',
        ]);

        $newQuantityBase = UnitConverter::convertToBaseQuantity((float) $validated['new_quantity'], $validated['unit']);

        $updatedBatch = $this->batchService->adjustBatch(
            (int) $id,
            $newQuantityBase,
            $validated['reason'],
            $validated['notes'] ?? '',
            $user->id
        );

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => "Batch {$updatedBatch->batch_code} adjusted successfully.",
                'batch'   => $updatedBatch,
            ]);
        }

        return back()->with('success', "Batch {$updatedBatch->batch_code} adjusted successfully.");
    }

    /**
     * Update a batch's status (quarantine, recall, damage, or release).
     */
    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();
        $batch = IngredientBatch::findOrFail($id);

        if (!$user->isAdmin() && (int) $batch->branch_id !== (int) $user->branch_id) {
            return response()->json(['error' => 'Unauthorized branch access.'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['available', 'quarantined', 'recalled', 'damaged', 'expired'])],
            'reason' => 'nullable|string|max:500',
        ]);

        $updatedBatch = $this->batchService->updateBatchStatus(
            (int) $id,
            $validated['status'],
            $validated['reason'] ?? '',
            $user->id
        );

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => "Batch status updated to {$validated['status']}.",
                'batch'   => $updatedBatch,
            ]);
        }

        return back()->with('success', "Batch status updated to {$validated['status']}.");
    }

    /**
     * Get KPI overview metrics and active alerts for inventory.
     */
    public function overview(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->isAdmin()
            ? ($request->filled('branch_id') && $request->input('branch_id') !== 'all' ? (int) $request->input('branch_id') : null)
            : $user->branch_id;

        $stats = $this->batchService->getOverviewKpiStats($branchId);
        $alerts = $this->alertService->getActiveAlerts($branchId);

        return response()->json([
            'stats'  => $stats,
            'alerts' => $alerts,
        ]);
    }
}
