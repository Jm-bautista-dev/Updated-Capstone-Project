<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * POSCancellationController
 *
 * Provides Master Prompt–specified POS route for resolving cancellation
 * requests directly from the POS terminal / cashier interface.
 * Delegates all business logic to the existing CancellationRequestController.
 */
class POSCancellationController extends Controller
{
    public function __construct(protected CancellationRequestController $cancellationController)
    {
    }

    /**
     * POST /v1/pos/cancellation-requests/{id}/resolve
     * Cashier resolves (approve or reject) a rider cancellation request from POS.
     */
    public function resolve(Request $request, int $id): JsonResponse
    {
        return $this->cancellationController->resolve($request, $id);
    }

    /**
     * POST /v1/pos/cancellation-requests/{id}/approve
     * POS approve alias — delegates to Branch controller approve action.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        return (new Branch\CancellationRequestController())->approve($request, $id);
    }

    /**
     * POST /v1/pos/cancellation-requests/{id}/reject
     * POS reject alias — delegates to Branch controller reject action.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        return (new Branch\CancellationRequestController())->reject($request, $id);
    }
}
