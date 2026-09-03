<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Rider;
use App\Models\User;
use App\Services\AccountGovernanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountGovernanceController extends Controller
{
    public function __construct(
        protected AccountGovernanceService $governanceService
    ) {
    }

    /**
     * GET /super-admin/accounts
     * Unified account governance overview with role and status filters.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $roleFilter = $request->input('role');
        $statusFilter = $request->input('status');
        $branchFilter = $request->input('branch_id');
        $search = $request->input('search');

        $accountList = [];

        // 1. Query Users
        if (!$roleFilter || $roleFilter !== 'rider') {
            $userQuery = User::with('branch:id,name');

            if ($roleFilter) {
                $userQuery->where('role', $roleFilter);
            }
            if ($statusFilter) {
                $userQuery->where('account_status', $statusFilter);
            }
            if ($branchFilter) {
                $userQuery->where('branch_id', $branchFilter);
            }
            if ($search) {
                $userQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('mobile_number', 'like', "%{$search}%");
                });
            }

            foreach ($userQuery->latest()->get() as $u) {
                $accountList[] = $this->formatUserAccount($u);
            }
        }

        // 2. Query Riders
        if (!$roleFilter || $roleFilter === 'rider') {
            $riderQuery = Rider::with('branch:id,name');

            if ($statusFilter) {
                $riderQuery->where('account_status', $statusFilter);
            }
            if ($branchFilter) {
                $riderQuery->where('branch_id', $branchFilter);
            }
            if ($search) {
                $riderQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            foreach ($riderQuery->latest()->get() as $r) {
                $accountList[] = $this->formatRiderAccount($r);
            }
        }

        $allAccounts = collect($accountList)->sortByDesc('created_at')->values();

        // Paginate collection manually
        $perPage = 25;
        $page = (int) $request->input('page', 1);
        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $allAccounts->forPage($page, $perPage)->values(),
            $allAccounts->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $branches = Branch::all(['id', 'name']);

        if ($request->wantsJson()) {
            return response()->json([
                'success'  => true,
                'accounts' => $paginated,
            ]);
        }

        return Inertia::render('SuperAdmin/Accounts', [
            'accounts' => $paginated,
            'branches' => $branches,
            'filters'  => $request->only(['role', 'status', 'branch_id', 'search']),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatUserAccount(User $u): array
    {
        $isRestricted = ($u->account_status ?? 'active') === 'restricted'
            || (bool) $u->is_order_restricted
            || (bool) $u->cod_restricted;

        return [
            'id'                     => $u->id,
            'type'                   => 'user',
            'name'                   => $u->name,
            'email'                  => $u->email,
            'phone'                  => $u->mobile_number,
            'role'                   => $u->role,
            'account_status'         => $u->account_status ?? 'active',
            'status_reason'          => $u->status_reason ?? $u->restriction_reason,
            'is_restricted'          => $isRestricted,
            'restriction_source'     => $u->restriction_source ?? ($u->cod_restriction_source ?: 'MANUAL'),
            'restriction_reason'     => $u->restriction_reason ?? $u->status_reason ?? $u->cod_restriction_reason,
            'restricted_at'          => $u->restricted_at?->toIso8601String() ?? $u->cod_restricted_at?->toIso8601String(),
            'consecutive_streak'     => (int) ($u->consecutive_cancellations ?? 0),
            'streak_threshold'       => 10,
            'branch'                 => $u->branch?->name ?? 'All Branches',
            'branch_id'              => $u->branch_id,
            'is_order_restricted'    => (bool) $u->is_order_restricted,
            'is_delivery_restricted' => false,
            'created_at'             => $u->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatRiderAccount(Rider $r): array
    {
        $isRestricted = ($r->account_status ?? 'active') === 'restricted'
            || (bool) $r->is_delivery_restricted;

        return [
            'id'                     => $r->id,
            'type'                   => 'rider',
            'name'                   => $r->name,
            'email'                  => $r->email,
            'phone'                  => $r->phone,
            'role'                   => 'rider',
            'account_status'         => $r->account_status ?? 'active',
            'status_reason'          => $r->status_reason ?? $r->restriction_reason,
            'is_restricted'          => $isRestricted,
            'restriction_source'     => $r->restriction_source ?? 'MANUAL',
            'restriction_reason'     => $r->restriction_reason ?? $r->status_reason,
            'restricted_at'          => $r->restricted_at?->toIso8601String(),
            'consecutive_streak'     => (int) ($r->consecutive_delivery_failures ?? 0),
            'streak_threshold'       => 5,
            'branch'                 => $r->branch?->name ?? 'Unassigned',
            'branch_id'              => $r->branch_id,
            'is_order_restricted'    => false,
            'is_delivery_restricted' => (bool) $r->is_delivery_restricted,
            'active_deliveries'      => $r->activeDeliveriesCount(),
            'created_at'             => $r->created_at?->toIso8601String(),
        ];
    }

    /**
     * GET /super-admin/accounts/{type}/{id}
     * Comprehensive account detail profile with history and audit trail.
     */
    public function show(Request $request, string $type, $id): JsonResponse
    {
        /** @var User|Rider|null $target */
        $target = $type === 'rider'
            ? Rider::with(['branch', 'moderationCases.reportedBy', 'moderationCases.resolvedBy'])->find($id)
            : User::with(['branch', 'moderationCases.reportedBy', 'moderationCases.resolvedBy'])->find($id);

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
        }

        $orders = [];
        $deliveries = [];
        $activeDeliveries = 0;

        if ($target instanceof User) {
            $orders = Order::where('user_id', $target->id)->latest()->take(10)->get();
        } elseif ($target instanceof Rider) {
            $deliveries = Delivery::where('rider_id', $target->id)->latest()->take(10)->get();
            $activeDeliveries = $target->activeDeliveriesCount();
        }

        $auditLogs = AuditLog::where('target', "{$type}:{$target->id}")
            ->orWhere('actor_id', $target->id)
            ->latest()
            ->take(15)
            ->get();

        return response()->json([
            'success' => true,
            'account' => [
                'id'                     => $target->id,
                'type'                   => $type,
                'name'                   => $target->name,
                'email'                  => $target->email,
                'phone'                  => $target->mobile_number ?? $target->phone,
                'role'                   => $target->role ?? 'rider',
                'account_status'         => $target->account_status ?? 'active',
                'status_reason'          => $target->status_reason,
                'restricted_at'          => $target->restricted_at,
                'suspended_at'           => $target->suspended_at,
                'deactivated_at'         => $target->deactivated_at,
                'branch'                 => $target->branch,
                'is_order_restricted'    => (bool) ($target->is_order_restricted ?? false),
                'is_delivery_restricted' => (bool) ($target->is_delivery_restricted ?? false),
                'active_deliveries'      => $activeDeliveries,
                'has_historical_records' => $target->hasHistoricalBusinessRecords(),
                'orders'                 => $orders,
                'deliveries'             => $deliveries,
                'moderation_cases'       => $target->moderationCases,
                'audit_logs'             => $auditLogs,
                'created_at'             => $target->created_at?->toIso8601String(),
            ]
        ]);
    }

    /**
     * POST /super-admin/accounts/{type}/{id}/status
     * Modify account status with validation, reason, and self-lockout check.
     */
    public function updateStatus(Request $request, string $type, $id): JsonResponse
    {
        $validated = $request->validate([
            'status'                 => 'required|string|in:active,under_review,restricted,suspended,deactivated',
            'reason'                 => 'required|string|min:3|max:500',
            'force'                  => 'nullable|boolean',
            'restrict_new_only'      => 'nullable|boolean',
            'is_order_restricted'    => 'nullable|boolean',
            'is_delivery_restricted' => 'nullable|boolean',
        ]);

        $admin = $request->user();

        /** @var User|Rider|null $target */
        $target = $type === 'rider' ? Rider::find($id) : User::find($id);

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Target account not found.'], 404);
        }

        try {
            $result = $this->governanceService->changeStatus(
                target: $target,
                newStatus: $validated['status'],
                reason: $validated['reason'],
                actor: $admin,
                options: [
                    'force'                  => $validated['force'] ?? false,
                    'restrict_new_only'      => $validated['restrict_new_only'] ?? false,
                    'is_order_restricted'    => $validated['is_order_restricted'] ?? false,
                    'is_delivery_restricted' => $validated['is_delivery_restricted'] ?? false,
                ]
            );

            return response()->json($result, $result['success'] ? 200 : 422);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /super-admin/accounts/{type}/{id}/remove-restriction
     * Dedicated Super Admin endpoint to lift active restrictions and reset consecutive streaks.
     */
    public function removeRestriction(Request $request, string $type, $id): JsonResponse
    {
        $admin = $request->user();
        if (!$admin || !$admin->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: Only Super Admins can remove account restrictions.'], 403);
        }

        /** @var User|Rider|null $target */
        $target = $type === 'rider' ? Rider::find($id) : User::find($id);

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
        }

        $reason = $request->input('reason', 'Restriction removed by Super Admin');

        try {
            $result = $this->governanceService->liftRestriction(
                target: $target,
                reason: $reason,
                actor: $admin
            );

            return response()->json($result, 200);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /super-admin/accounts/{type}/{id}/restrict
     * Dedicated Super Admin endpoint to manually restrict an account.
     */
    public function restrict(Request $request, string $type, $id): JsonResponse
    {
        $admin = $request->user();
        if (!$admin || !$admin->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: Only Super Admins can manually restrict accounts.'], 403);
        }

        $validated = $request->validate([
            'reason'            => 'required|string|min:3|max:500',
            'restrict_new_only' => 'nullable|boolean',
        ]);

        /** @var User|Rider|null $target */
        $target = $type === 'rider' ? Rider::find($id) : User::find($id);

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
        }

        try {
            $result = $this->governanceService->restrictAccount(
                target: $target,
                reason: $validated['reason'],
                actor: $admin,
                options: ['restrict_new_only' => $validated['restrict_new_only'] ?? false]
            );

            return response()->json($result, 200);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /super-admin/accounts/{type}/{id}/restore
     * Restore a suspended or deactivated account to active status.
     */
    public function restore(Request $request, string $type, $id): JsonResponse
    {
        $admin = $request->user();

        /** @var User|Rider|null $target */
        $target = $type === 'rider' ? Rider::find($id) : User::find($id);

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
        }

        $reason = $request->input('reason', 'Restored to active by Super Admin');

        try {
            $result = $this->governanceService->changeStatus(
                target: $target,
                newStatus: User::STATUS_ACTIVE,
                reason: $reason,
                actor: $admin,
                options: ['force' => true]
            );

            return response()->json($result, 200);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * DELETE /super-admin/accounts/{type}/{id}
     * Safe delete account: auto-deactivates if business records exist.
     */
    public function destroy(Request $request, string $type, $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:255',
        ]);

        $admin = $request->user();

        /** @var User|Rider|null $target */
        $target = $type === 'rider' ? Rider::find($id) : User::find($id);

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
        }

        try {
            $result = $this->governanceService->safeDelete(
                target: $target,
                reason: $validated['reason'],
                actor: $admin
            );

            return response()->json($result, 200);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
