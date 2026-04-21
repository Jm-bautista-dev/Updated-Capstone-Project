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
    public function adminIndex(): Response
    {
        return Inertia::render('Admin/Branches/Index', [
            'branches' => Branch::orderBy('name')->get([
                'id', 'name', 'address', 'latitude', 'longitude',
                'delivery_radius_km', 'has_internal_riders',
                'base_delivery_fee', 'per_km_fee',
            ]),
        ]);
    }

    /**
     * Update branch location + delivery settings.
     * PUT /branches/{id}
     */
    public function update(Request $request, int $id)
    {
        $branch = Branch::findOrFail($id);

        $validated = $request->validate([
            'address'             => 'nullable|string|max:500',
            'latitude'            => ['nullable', 'numeric', 'between:-90,90', 'unique:branches,latitude,' . $id],
            'longitude'           => ['nullable', 'numeric', 'between:-180,180', 'unique:branches,longitude,' . $id],
            'delivery_radius_km'  => 'nullable|numeric|min:0|max:200',
            'has_internal_riders' => 'nullable|boolean',
            'base_delivery_fee'   => 'nullable|numeric|min:0',
            'per_km_fee'          => 'nullable|numeric|min:0',
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
                'delivery_radius_km' => $b->delivery_radius_km ? (float) $b->delivery_radius_km : 0,
                'base_delivery_fee'  => $b->base_delivery_fee   ? (float) $b->base_delivery_fee   : 0,
            ]);

        return response()->json([
            'count'    => $branches->count(),
            'branches' => $branches,
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
