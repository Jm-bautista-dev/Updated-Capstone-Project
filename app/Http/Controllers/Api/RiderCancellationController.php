<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RiderCancellationController
 *
 * Provides the Master Prompt–specified route alias for rider-initiated
 * cancellation requests. Delegates to RiderController::cancelOrder()
 * to keep all cancellation logic in one place.
 */
class RiderCancellationController extends Controller
{
    public function __construct(protected RiderController $riderController)
    {
    }

    /**
     * POST /v1/rider/orders/{id}/cancel-request
     * Alias entry point — delegates to RiderController::cancelOrder().
     */
    public function requestCancellation(Request $request, int $id): JsonResponse
    {
        return $this->riderController->cancelOrder($request, $id);
    }

    /**
     * GET /v1/rider/cancellation-requests
     * Returns the authenticated rider's full cancellation ledger.
     * Delegates to the existing RiderDelivery sub-controller.
     */
    public function index(Request $request): JsonResponse
    {
        return (new Rider\RiderDeliveryController())->cancellationRequests($request);
    }
}
