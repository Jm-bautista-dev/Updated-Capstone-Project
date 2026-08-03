<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TopPickService;
use App\Http\Resources\TopPickResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TopPickController extends Controller
{
    protected TopPickService $topPickService;

    public function __construct(TopPickService $topPickService)
    {
        $this->topPickService = $topPickService;
    }

    /**
     * Get Top Picks / Best Sellers list.
     * 
     * GET /api/v1/top-picks
     * GET /api/top-picks
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'nullable|string|in:today,1,7,7_days,week,30,30_days,month,90,90_days,quarter,all,all_time',
            'limit'  => 'nullable|integer|min:1|max:100',
            'branch' => 'nullable|string',
            'type'   => 'nullable|string|in:sales,forecast',
        ]);

        $period = $validated['period'] ?? '30';
        $limit  = (int) ($validated['limit'] ?? 10);
        $branch = $validated['branch'] ?? 'all';
        $type   = $validated['type'] ?? 'sales';

        $topPicks = $this->topPickService->getTopPicks($period, $branch, $limit, $type);
        $normalizedPeriod = $this->topPickService->normalizePeriod($period);

        return response()->json([
            'success'      => true,
            'generated_at' => now()->toIso8601String(),
            'period'       => $normalizedPeriod,
            'branch'       => $branch,
            'total_items'  => count($topPicks),
            'products'     => TopPickResource::collection($topPicks),
        ]);
    }
}
