<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ModerationCase;
use App\Services\AccountGovernanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModerationCaseController extends Controller
{
    public function __construct(
        protected AccountGovernanceService $governanceService
    ) {
    }

    /**
     * GET /super-admin/moderation-cases
     * List all moderation cases with status and category filtering.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = ModerationCase::with(['reportedBy:id,name,role,email', 'resolvedBy:id,name,role']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('reason_category')) {
            $query->where('reason_category', $request->input('reason_category'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('case_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $cases = $query->latest()->paginate(20)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'cases'   => $cases,
            ]);
        }

        return Inertia::render('SuperAdmin/ModerationCases', [
            'cases'   => $cases,
            'filters' => $request->only(['status', 'reason_category', 'search']),
        ]);
    }

    /**
     * GET /super-admin/moderation-cases/{id}
     * Detail view of a moderation case.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $case = ModerationCase::with(['reportedBy', 'resolvedBy'])->find($id);

        if (!$case) {
            return response()->json(['success' => false, 'message' => 'Moderation case not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'case'    => $case,
        ]);
    }

    /**
     * POST /super-admin/moderation-cases/{id}/resolve
     * Resolve or dismiss a moderation case with a decision.
     */
    public function resolve(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => 'required|string|in:clear,warning,restrict,suspend,deactivate,dismiss',
            'notes'    => 'required|string|min:3|max:1000',
        ]);

        $admin = $request->user();
        $case = ModerationCase::find($id);

        if (!$case) {
            return response()->json(['success' => false, 'message' => 'Moderation case not found.'], 404);
        }

        try {
            $resolvedCase = $this->governanceService->resolveCase(
                case: $case,
                decision: $validated['decision'],
                notes: $validated['notes'],
                actor: $admin
            );

            return response()->json([
                'success' => true,
                'message' => "Case #{$case->case_number} resolved with decision: {$validated['decision']}.",
                'case'    => $resolvedCase,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
