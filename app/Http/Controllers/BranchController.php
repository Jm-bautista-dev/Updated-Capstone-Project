<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    /**
     * Admin web page — manage branches and their locations.
     * GET /branches
     */
    public function adminIndex(Request $request)
    {
        $branches = Branch::orderBy('name')->get([
            'id', 'name', 'address', 'latitude', 'longitude',
            'delivery_radius_km', 'has_internal_riders',
            'base_delivery_fee', 'per_km_fee',
        ]);

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
     * Create a new branch.
     * POST /branches
     */
    public function store(Request $request)
    {
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
     * Mobile API — branches with location data.
     * GET /api/v1/branches
     *
     * Used by the mobile app to:
     *  - Detect the nearest branch via Haversine distance
     *  - Avoid showing duplicate menu items across branches
     */
    public function apiIndex(): JsonResponse
    {
        $branches = Branch::orderBy('name')
            ->get(['id', 'name', 'address', 'latitude', 'longitude', 'delivery_radius_km', 'base_delivery_fee'])
            ->map(fn(Branch $b) => [
                'id'        => $b->id,
                'name'      => $b->name,
                'address'   => $b->address,
                'latitude'  => $b->latitude  ? (float) $b->latitude  : null,
                'longitude' => $b->longitude ? (float) $b->longitude : null,
                'delivery_radius_km' => $b->delivery_radius_km !== null ? (float) $b->delivery_radius_km : null,
                'base_delivery_fee'  => $b->base_delivery_fee !== null ? (float) $b->base_delivery_fee : null,
            ]);

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
}
