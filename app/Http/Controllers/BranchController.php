<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchSchedule;
use App\Models\BranchSpecialSchedule;
use App\Services\BranchScheduleService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function __construct(
        protected BranchScheduleService $scheduleService
    ) {
    }

    /**
     * Admin/Cashier web page — manage branches, locations, and operating hours.
     * GET /branches
     */
    public function adminIndex(Request $request)
    {
        $user = $request->user();

        $branchesQuery = Branch::with(['schedules', 'specialSchedules' => function ($q) {
            $q->whereDate('date', '>=', now(BranchScheduleService::TIMEZONE)->subDays(1)->toDateString())
              ->orderBy('date');
        }])->orderBy('name');

        $branches = $branchesQuery->get()->map(function (Branch $b) {
            $status = $this->scheduleService->getBranchOperatingStatus($b);

            return [
                'id'                  => $b->id,
                'name'                => $b->name,
                'address'             => $b->address,
                'latitude'            => $b->latitude  ? (float) $b->latitude  : null,
                'longitude'           => $b->longitude ? (float) $b->longitude : null,
                'delivery_radius_km'  => $b->delivery_radius_km !== null ? (float) $b->delivery_radius_km : null,
                'has_internal_riders' => (bool) $b->has_internal_riders,
                'base_delivery_fee'   => $b->base_delivery_fee !== null ? (float) $b->base_delivery_fee : null,
                'per_km_fee'          => $b->per_km_fee !== null ? (float) $b->per_km_fee : null,
                'operating_mode'      => $b->operating_mode ?? 'automatic',
                'mode_override_reason'=> $b->mode_override_reason,
                'mode_override_until' => $b->mode_override_until?->toIso8601String(),
                'operating_status'    => $status,
                'schedules'           => $b->schedules,
                'special_schedules'   => $b->specialSchedules,
            ];
        });

        $rawAvgRadius = Branch::whereNotNull('delivery_radius_km')
            ->where('delivery_radius_km', '>', 0)
            ->avg('delivery_radius_km');

        $rawAvgBaseFee = Branch::whereNotNull('base_delivery_fee')
            ->where('base_delivery_fee', '>=', 0)
            ->avg('base_delivery_fee');

        $stats = [
            'total_branches'       => Branch::count(),
            'internal_fleet_count' => Branch::where('has_internal_riders', true)->count(),
            'average_radius_km'    => $rawAvgRadius !== null ? round((float) $rawAvgRadius, 1) : null,
            'average_base_fee'     => $rawAvgBaseFee !== null ? round((float) $rawAvgBaseFee, 2) : null,
        ];

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'branches' => $branches,
                'stats'    => $stats,
            ]);
        }

        return Inertia::render('Admin/Branches/Index', [
            'branches' => $branches,
            'stats'    => $stats,
        ]);
    }

    /**
     * Create a new branch (Admin only).
     * POST /branches
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name'                => 'required|string|max:255|unique:branches,name',
            'address'             => 'nullable|string|max:500',
            'latitude'            => ['nullable', 'numeric', 'between:-90,90', 'unique:branches,latitude'],
            'longitude'           => ['nullable', 'numeric', 'between:-180,180', 'unique:branches,longitude'],
            'delivery_radius_km'  => 'required|numeric|min:0.1|max:200',
            'has_internal_riders' => 'nullable|boolean',
            'base_delivery_fee'   => 'required|numeric|min:0',
            'per_km_fee'          => 'nullable|numeric|min:0',
        ], [
            'name.required'               => 'Branch name is required.',
            'name.unique'                 => 'A branch with this name already exists.',
            'delivery_radius_km.required' => 'Delivery radius is required.',
            'delivery_radius_km.numeric'  => 'Delivery radius must be a valid number.',
            'delivery_radius_km.min'      => 'Delivery radius must be greater than zero.',
            'base_delivery_fee.required'  => 'Base delivery fee is required.',
            'base_delivery_fee.numeric'   => 'Base delivery fee must be a valid number.',
            'base_delivery_fee.min'       => 'Base delivery fee cannot be negative.',
        ]);

        $branch = Branch::create($validated);

        return back()->with('success', "Branch \"{$branch->name}\" created successfully.");
    }

    /**
     * Update branch location + delivery settings.
     * PUT /branches/{id}
     */
    public function update(Request $request, int $id)
    {
        $branch = Branch::findOrFail($id);
        $this->authorizeBranchManagement($request, $branch);

        $validated = $request->validate([
            'name'                => 'sometimes|required|string|max:255|unique:branches,name,' . $id,
            'address'             => 'nullable|string|max:500',
            'latitude'            => ['nullable', 'numeric', 'between:-90,90', 'unique:branches,latitude,' . $id],
            'longitude'           => ['nullable', 'numeric', 'between:-180,180', 'unique:branches,longitude,' . $id],
            'delivery_radius_km'  => 'required|numeric|min:0.1|max:200',
            'has_internal_riders' => 'nullable|boolean',
            'base_delivery_fee'   => 'required|numeric|min:0',
            'per_km_fee'          => 'nullable|numeric|min:0',
        ], [
            'delivery_radius_km.required' => 'Delivery radius is required.',
            'delivery_radius_km.numeric'  => 'Delivery radius must be a valid number.',
            'delivery_radius_km.min'      => 'Delivery radius must be greater than zero.',
            'base_delivery_fee.required'  => 'Base delivery fee is required.',
            'base_delivery_fee.numeric'   => 'Base delivery fee must be a valid number.',
            'base_delivery_fee.min'       => 'Base delivery fee cannot be negative.',
        ]);

        $branch->update($validated);

        return back()->with('success', "Branch \"{$branch->name}\" updated.");
    }

    /**
     * Update branch operating mode (AUTOMATIC, FORCE_OPEN, FORCE_CLOSED).
     * POST /branches/{id}/operating-mode
     * POST /api/v1/branches/{id}/operating-mode
     */
    public function updateOperatingMode(Request $request, int $id)
    {
        $branch = Branch::findOrFail($id);
        $this->authorizeBranchManagement($request, $branch);

        $validated = $request->validate([
            'operating_mode' => 'required|string|in:automatic,force_open,force_closed',
            'reason'         => 'nullable|string|max:255',
            'expires_at'     => 'nullable|date',
            'duration_hours' => 'nullable|numeric|min:0.5|max:72',
        ]);

        $expiresAt = null;
        if (!empty($validated['expires_at'])) {
            $expiresAt = Carbon::parse($validated['expires_at'], BranchScheduleService::TIMEZONE);
        } elseif (!empty($validated['duration_hours'])) {
            $expiresAt = Carbon::now(BranchScheduleService::TIMEZONE)->addMinutes((int) ($validated['duration_hours'] * 60));
        }

        $updatedBranch = $this->scheduleService->setOperatingMode(
            branch: $branch,
            mode: $validated['operating_mode'],
            reason: $validated['reason'] ?? null,
            expiresAt: $expiresAt,
            actor: $request->user()
        );

        $status = $this->scheduleService->getBranchOperatingStatus($updatedBranch);

        $modeLabel = match ($validated['operating_mode']) {
            BranchScheduleService::MODE_FORCE_OPEN   => 'FORCE OPEN',
            BranchScheduleService::MODE_FORCE_CLOSED => 'FORCE CLOSED',
            default                                  => 'AUTOMATIC SCHEDULE',
        };

        $message = "Branch \"{$branch->name}\" set to {$modeLabel}.";

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'data'    => [
                    'operating_mode'       => $updatedBranch->operating_mode,
                    'mode_override_reason' => $updatedBranch->mode_override_reason,
                    'mode_override_until'  => $updatedBranch->mode_override_until,
                    'status'               => $status,
                ],
                'branch'  => $updatedBranch,
                'status'  => $status,
            ]);
        }

        return back()->with('success', $message);
    }

    /**
     * Update regular 7-day operating hours.
     * PUT /branches/{id}/regular-hours
     * PUT /api/v1/branches/{id}/regular-hours
     */
    public function updateRegularHours(Request $request, int $id)
    {
        $branch = Branch::findOrFail($id);
        $this->authorizeBranchManagement($request, $branch);

        $validated = $request->validate([
            'schedules'               => 'required|array|min:1|max:7',
            'schedules.*.day_of_week' => 'required|integer|between:0,6',
            'schedules.*.open_time'   => 'nullable|date_format:H:i,H:i:s',
            'schedules.*.close_time'  => 'nullable|date_format:H:i,H:i:s',
            'schedules.*.is_closed'   => 'nullable|boolean',
        ]);

        $this->scheduleService->updateRegularSchedule($branch, $validated['schedules'], $request->user());

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'success'   => true,
                'message'   => "Regular operating hours for \"{$branch->name}\" updated.",
                'schedules' => $branch->schedules()->get(),
                'status'    => $this->scheduleService->getBranchOperatingStatus($branch),
            ]);
        }

        return back()->with('success', "Regular operating hours for \"{$branch->name}\" updated.");
    }

    /**
     * Create or update a date-specific special schedule override.
     * POST /branches/{id}/special-hours
     * POST /api/v1/branches/{id}/special-hours
     */
    public function storeSpecialSchedule(Request $request, int $id)
    {
        $branch = Branch::findOrFail($id);
        $this->authorizeBranchManagement($request, $branch);

        $validated = $request->validate([
            'date'              => 'required|date_format:Y-m-d',
            'is_closed_all_day' => 'nullable|boolean',
            'is_open_24_hours'  => 'nullable|boolean',
            'open_time'         => 'nullable|required_if:is_closed_all_day,false,0|date_format:H:i,H:i:s',
            'close_time'        => 'nullable|required_if:is_closed_all_day,false,0|date_format:H:i,H:i:s',
            'reason'            => 'nullable|string|max:255',
        ]);

        $special = $this->scheduleService->createOrUpdateSpecialSchedule($branch, $validated, $request->user());

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'success'          => true,
                'message'          => "Special schedule for {$validated['date']} saved.",
                'special_schedule' => $special,
                'status'           => $this->scheduleService->getBranchOperatingStatus($branch),
            ], 201);
        }

        return back()->with('success', "Special schedule for {$validated['date']} saved.");
    }

    /**
     * Delete a date-specific special schedule override.
     * DELETE /branches/{id}/special-hours/{specialId}
     * DELETE /api/v1/branches/{id}/special-hours/{specialId}
     */
    public function destroySpecialSchedule(Request $request, int $id, int $specialId)
    {
        $branch = Branch::findOrFail($id);
        $this->authorizeBranchManagement($request, $branch);

        $deleted = $this->scheduleService->deleteSpecialSchedule($specialId, $branch, $request->user());

        if (!$deleted) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['success' => false, 'message' => 'Special schedule not found.'], 404);
            }
            return back()->withErrors(['error' => 'Special schedule not found.']);
        }

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => 'Special schedule removed.',
                'status'  => $this->scheduleService->getBranchOperatingStatus($branch),
            ]);
        }

        return back()->with('success', 'Special schedule removed.');
    }

    /**
     * Get branch operating status (public or authenticated).
     * GET /api/v1/branches/{id}/operating-status
     */
    public function getOperatingStatus(Request $request, int $id): JsonResponse
    {
        $branch = Branch::findOrFail($id);
        $status = $this->scheduleService->getBranchOperatingStatus($branch);

        return response()->json([
            'success'          => true,
            'branch'           => [
                'id'      => $branch->id,
                'name'    => $branch->name,
                'address' => $branch->address,
            ],
            'data'             => $status,
            'operating_status' => $status,
        ]);
    }

    /**
     * Internal web response — all branches as JSON (used by Inertia pages).
     */
    public function index(): JsonResponse
    {
        return response()->json(Branch::orderBy('name')->get());
    }

    /**
     * Return calculated branch statistics.
     * GET /branches/stats
     */
    public function stats(): JsonResponse
    {
        $rawAvgRadius = Branch::whereNotNull('delivery_radius_km')
            ->where('delivery_radius_km', '>', 0)
            ->avg('delivery_radius_km');

        $rawAvgBaseFee = Branch::whereNotNull('base_delivery_fee')
            ->where('base_delivery_fee', '>=', 0)
            ->avg('base_delivery_fee');

        return response()->json([
            'success' => true,
            'stats'   => [
                'total_branches'       => Branch::count(),
                'internal_fleet_count' => Branch::where('has_internal_riders', true)->count(),
                'average_radius_km'    => $rawAvgRadius !== null ? round((float) $rawAvgRadius, 1) : null,
                'average_base_fee'     => $rawAvgBaseFee !== null ? round((float) $rawAvgBaseFee, 2) : null,
            ],
        ]);
    }

    /**
     * Mobile API — branches with location and real-time operating availability.
     * GET /api/v1/branches
     */
    public function apiIndex(): JsonResponse
    {
        $branches = Branch::orderBy('name')->get()->map(function (Branch $b) {
            $status = $this->scheduleService->getBranchOperatingStatus($b);

            return [
                'id'                      => $b->id,
                'name'                    => $b->name,
                'address'                 => $b->address,
                'latitude'                => $b->latitude  ? (float) $b->latitude  : null,
                'longitude'               => $b->longitude ? (float) $b->longitude : null,
                'delivery_radius_km'      => $b->delivery_radius_km !== null ? (float) $b->delivery_radius_km : null,
                'base_delivery_fee'       => $b->base_delivery_fee !== null ? (float) $b->base_delivery_fee : null,
                'is_open'                 => (bool) $status['is_open'],
                'status'                  => $status['status'], // 'OPEN' | 'CLOSED'
                'is_accepting_orders'     => (bool) $status['is_accepting_orders'],
                'operating_mode'          => $status['operating_mode'], // 'automatic' | 'force_open' | 'force_closed'
                'today_hours'             => $status['today_hours_display'],
                'today_opening_time'      => $status['today_opening_time'],
                'today_closing_time'      => $status['today_closing_time'],
                'status_message'          => $status['status_message'],
                'is_special_schedule'     => (bool) $status['is_special_schedule'],
                'special_schedule_reason' => $status['special_schedule_reason'],
                'next_opening_at'         => $status['next_opening_at'],
                'next_closing_at'         => $status['next_closing_at'],
            ];
        });

        $rawAvgRadius = Branch::whereNotNull('delivery_radius_km')
            ->where('delivery_radius_km', '>', 0)
            ->avg('delivery_radius_km');

        $rawAvgBaseFee = Branch::whereNotNull('base_delivery_fee')
            ->where('base_delivery_fee', '>=', 0)
            ->avg('base_delivery_fee');

        return response()->json([
            'count'             => $branches->count(),
            'average_radius_km' => $rawAvgRadius !== null ? round((float) $rawAvgRadius, 1) : null,
            'average_base_fee'  => $rawAvgBaseFee !== null ? round((float) $rawAvgBaseFee, 2) : null,
            'branches'          => $branches,
        ]);
    }

    /**
     * Update branch location (admin only).
     * PATCH /api/v1/branches/{id}/location
     */
    public function updateLocation(Request $request, int $id): JsonResponse
    {
        $branch = Branch::findOrFail($id);
        $this->authorizeBranchManagement($request, $branch);

        $validated = $request->validate([
            'address'   => 'nullable|string|max:500',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $branch->update($validated);

        return response()->json([
            'success' => true,
            'branch'  => [
                'id'        => $branch->id,
                'name'      => $branch->name,
                'address'   => $branch->address,
                'latitude'  => (float) $branch->latitude,
                'longitude' => (float) $branch->longitude,
            ],
        ]);
    }

    /**
     * Verify caller has administrative privileges.
     */
    protected function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            abort(403, 'Administrator access required.');
        }
    }

    /**
     * Verify caller is authorized to manage the given branch.
     */
    protected function authorizeBranchManagement(Request $request, Branch $branch): void
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        // Super Admin and Admin have global access
        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return;
        }

        // Cashier can only manage their assigned branch
        if ($user->isCashier() && (int) $user->branch_id === (int) $branch->id) {
            return;
        }

        abort(403, 'You are not authorized to manage this branch.');
    }
}
