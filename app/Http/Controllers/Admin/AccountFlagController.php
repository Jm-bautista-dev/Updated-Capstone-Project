<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Models\User;
use App\Services\AccountGovernanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountFlagController extends Controller
{
    public function __construct(
        protected AccountGovernanceService $governanceService
    ) {
    }

    /**
     * POST /admin/accounts/flag
     * POST /api/v1/admin/accounts/flag
     * Report an account (creates a Moderation Case for Super Admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type'     => 'required|string|in:user,rider',
            'target_id'       => 'required|integer',
            'reason_category' => 'required|string|in:suspected_fraud,fake_delivery,cod_abuse,customer_complaint,unauthorized_behavior,gps_manipulation,other',
            'title'           => 'required|string|min:5|max:255',
            'description'     => 'required|string|min:10|max:2000',
            'evidence_notes'  => 'nullable|string|max:2000',
            'under_review'    => 'nullable|boolean',
        ]);

        $reporter = $request->user();

        /** @var \App\Models\Rider|\App\Models\User|null $target */
        $target = $validated['target_type'] === 'rider'
            ? Rider::find($validated['target_id'])
            : User::find($validated['target_id']);

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Target account not found.'], 404);
        }

        $case = $this->governanceService->flagAccount(
            target: $target,
            reasonCategory: $validated['reason_category'],
            title: $validated['title'],
            description: $validated['description'],
            evidenceNotes: $validated['evidence_notes'] ?? null,
            reporter: $reporter,
            markUnderReview: (bool) ($validated['under_review'] ?? false)
        );

        return response()->json([
            'success'     => true,
            'message'     => "Report submitted successfully. Moderation Case #{$case->case_number} created.",
            'case_number' => $case->case_number,
            'case'        => $case,
        ], 201);
    }
}
