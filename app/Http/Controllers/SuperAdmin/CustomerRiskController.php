<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CustomerRiskService;
use App\Services\CustomerTrustService;
use App\Services\SecurityAuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerRiskController extends Controller
{
    public function __construct(
        protected CustomerRiskService $riskService,
        protected CustomerTrustService $trustService
    ) {
    }

    /**
     * GET /super-admin/customer-risk
     * Overview and filtering of customer risk profiles.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = User::where('role', User::ROLE_CUSTOMER)
            ->with(['orders.delivery.attempts']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('mobile_number', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('restricted_only') || $request->input('risk_level') === 'RESTRICTED') {
            $query->where('cod_restricted', true);
        }

        if ($request->input('filter') === 'unverified_phone') {
            $query->whereNull('phone_verified_at');
        }

        $customers = $query->latest()->paginate(20)->withQueryString();

        // Compute evaluated metrics for each customer in page
        $customers->getCollection()->transform(function (User $customer) {
            $riskData = $this->riskService->evaluateCustomerRisk($customer);
            return [
                'id'                     => $customer->id,
                'name'                   => $customer->name,
                'email'                  => $customer->email,
                'mobile_number'          => $customer->mobile_number,
                'is_phone_verified'      => $customer->isPhoneVerified(),
                'phone_verified_at'      => $customer->phone_verified_at?->toIso8601String(),
                'cod_restricted'         => $customer->isCodRestricted(),
                'cod_restriction_reason' => $customer->cod_restriction_reason,
                'risk_level_override'    => $customer->risk_level_override,
                'risk_level'             => $riskData['risk_level'],
                'metrics'                => $riskData['metrics'],
                'created_at'             => $customer->created_at?->toIso8601String(),
            ];
        });

        // Filter by calculated risk level if requested (e.g. LOW_RISK, HIGH_RISK)
        if ($request->filled('risk_level') && in_array($request->input('risk_level'), ['LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK'])) {
            $targetRisk = $request->input('risk_level');
            $filtered = $customers->getCollection()->filter(fn ($c) => $c['risk_level'] === $targetRisk)->values();
            $customers->setCollection($filtered);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success'   => true,
                'customers' => $customers,
            ]);
        }

        return Inertia::render('SuperAdmin/CustomerRisk', [
            'customers' => $customers,
            'filters'   => $request->only(['search', 'risk_level', 'filter']),
        ]);
    }

    /**
     * GET /super-admin/customer-risk/{id}
     * Detailed customer risk breakdown.
     */
    public function show(Request $request, $id): JsonResponse
    {
        /** @var User|null $customer */
        $customer = User::with(['orders.delivery.attempts', 'orders.items.product'])->find($id);

        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        $riskData = $this->riskService->evaluateCustomerRisk($customer);

        return response()->json([
            'success'   => true,
            'customer'  => [
                'id'                     => $customer->id,
                'name'                   => $customer->name,
                'email'                  => $customer->email,
                'mobile_number'          => $customer->mobile_number,
                'is_phone_verified'      => $customer->isPhoneVerified(),
                'phone_verified_at'      => $customer->phone_verified_at,
                'cod_restricted'         => $customer->isCodRestricted(),
                'cod_restriction_reason' => $customer->cod_restriction_reason,
                'risk_level_override'    => $customer->risk_level_override,
                'risk_level'             => $riskData['risk_level'],
                'metrics'                => $riskData['metrics'],
                'orders'                 => $customer->orders,
            ]
        ]);
    }

    /**
     * POST /super-admin/customer-risk/{id}/override
     * Manually override customer COD restriction or risk level.
     */
    public function overrideCod(Request $request, $id): JsonResponse
    {
        $admin = $request->user();

        if (!$admin || !$admin->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $validated = $request->validate([
            'cod_restricted'      => 'required|boolean',
            'risk_level_override' => 'nullable|string|in:LOW_RISK,MEDIUM_RISK,HIGH_RISK,RESTRICTED,AUTO',
            'reason'              => 'required|string|min:5|max:255',
        ]);

        /** @var User|null $customer */
        $customer = User::find($id);

        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        $prevState = [
            'cod_restricted'         => (bool) $customer->cod_restricted,
            'cod_restriction_reason' => $customer->cod_restriction_reason,
            'risk_level_override'    => $customer->risk_level_override,
        ];

        $overrideRisk = $validated['risk_level_override'] === 'AUTO' ? null : ($validated['risk_level_override'] ?? null);

        $customer->update([
            'cod_restricted'         => $validated['cod_restricted'],
            'cod_restriction_reason' => $validated['cod_restricted'] ? $validated['reason'] : null,
            'risk_level_override'    => $overrideRisk,
        ]);

        $newState = [
            'cod_restricted'         => (bool) $customer->cod_restricted,
            'cod_restriction_reason' => $customer->cod_restriction_reason,
            'risk_level_override'    => $customer->risk_level_override,
        ];

        SecurityAuditLogger::logSecurityEvent(
            event: 'COD_OVERRIDE_PERFORMED',
            target: "user:{$customer->id}",
            details: [
                'admin_id'       => $admin->id,
                'admin_name'     => $admin->name,
                'customer_id'    => $customer->id,
                'customer_name'  => $customer->name,
                'customer_phone' => $customer->mobile_number,
                'previous_state' => $prevState,
                'new_state'      => $newState,
                'reason'         => $validated['reason'],
            ],
            level: 'warning'
        );

        return response()->json([
            'success'  => true,
            'message'  => 'Customer COD status updated successfully.',
            'customer' => $customer->fresh(),
        ]);
    }
}
