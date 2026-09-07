<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Rider;
use App\Models\Order;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\OrderAuditLog;
use App\Models\DeliveryAssignmentLog;
use App\Models\DeliveryAttempt;
use App\Models\OrderCancellationRequest;
use App\Models\CancellationRequest;
use App\Services\InventoryService;
use App\Services\OrderFulfillmentService;
use App\Events\OrderAssigned;
use App\Events\OrderStatusUpdated;
use App\Events\RiderStatusUpdated;
use App\Events\CancellationRequested;
use App\Events\CancellationResolved;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeliveryService
{
    protected InventoryService $inventoryService;
    protected OrderFulfillmentService $fulfillmentService;

    public function __construct(InventoryService $inventoryService, OrderFulfillmentService $fulfillmentService)
    {
        $this->inventoryService  = $inventoryService;
        $this->fulfillmentService = $fulfillmentService;
    }
    /**
     * Recommend a delivery type based on branch capabilities and distance.
     */
    public function recommend(Branch $branch, ?float $distanceKm): array
    {
        $fee = $distanceKm ? $branch->calculateDeliveryFee($distanceKm) : (float) $branch->base_delivery_fee;
        $availableCount = $branch->riders()->availableForAssignment()->count();

        if (!$branch->has_internal_riders) {
            return [
                'type'                => 'external',
                'reason'              => 'No internal riders are enabled for this branch.',
                'fee'                 => $fee,
                'available_riders'    => $availableCount,
                'recommended_rider'   => null,
            ];
        }

        if ($distanceKm === null) {
            return [
                'type'                => 'external',
                'reason'              => 'Enter delivery distance to receive a smart recommendation.',
                'fee'                 => $fee,
                'available_riders'    => $availableCount,
                'recommended_rider'   => null,
            ];
        }

        if (!$branch->isWithinRadius($distanceKm)) {
            return [
                'type'                => 'external',
                'reason'              => "Distance ({$distanceKm}km) exceeds branch radius ({$branch->delivery_radius_km}km).",
                'fee'                 => $fee,
                'available_riders'    => $availableCount,
                'recommended_rider'   => null,
            ];
        }

        if ($availableCount === 0) {
            return [
                'type'                => 'external',
                'reason'              => 'All internal riders are currently busy.',
                'fee'                 => $fee,
                'available_riders'    => 0,
                'recommended_rider'   => null,
            ];
        }

        $best = $this->findBestAvailableRider($branch);

        return [
            'type'                => 'internal',
            'reason'              => "Within branch radius ({$branch->delivery_radius_km}km) — {$availableCount} rider(s) available.",
            'fee'                 => $fee,
            'available_riders'    => $availableCount,
            'recommended_rider'   => $best ? ['id' => $best->id, 'name' => $best->name, 'phone' => $best->phone] : null,
        ];
    }

    /**
     * Find the best available rider in a branch.
     */
    public function findBestAvailableRider(Branch $branch): ?Rider
    {
        return $branch->riders()
            ->availableForAssignment()
            ->orderByRaw('COALESCE(last_active_at, created_at) ASC')
            ->orderBy('updated_at', 'ASC')
            ->first();
    }

    /**
     * Create a delivery record linked to a sale.
     */
    public function createDelivery(array $data): Delivery
    {
        $records = DB::transaction(function () use ($data) {
            $sale = Sale::with('branch')->findOrFail($data['sale_id']);
            $branchId = $sale->branch_id;
            /** @var Rider|null $rider */
            $rider = null;

            if (($data['delivery_type'] ?? 'internal') === 'internal') {
                $riderId = $data['rider_id'] ?? null;

                if ($riderId) {
                    /** @var Rider|null $rider */
                    $rider = Rider::where('id', $riderId)
                        ->where('branch_id', $branchId)
                        ->lockForUpdate()
                        ->first();

                    if (! $rider) {
                        throw new \Exception('Selected rider does not exist in this branch.');
                    }

                    if (! $rider->is_active || $rider->status === 'offline') {
                        throw new \Exception("Rider '{$rider->name}' is currently inactive/offline and cannot be assigned.");
                    }

                    if ($rider->hasInTransitDelivery()) {
                        throw new \Exception("Rider '{$rider->name}' is currently out for delivery and cannot take additional orders.");
                    }

                    $rider->update([
                        'status'         => 'busy',
                        'last_active_at' => now(),
                    ]);
                }
            }

            $proofPath = null;
            if (isset($data['proof_of_delivery']) && $data['proof_of_delivery'] instanceof UploadedFile) {
                $proofPath = $data['proof_of_delivery']->store('delivery-proofs', 'public');
                $this->syncToPublicStorage($proofPath);
            }

            $deliveryStatus = $rider ? 'assigned_to_rider' : Delivery::STATUS_PENDING;

            $delivery = Delivery::create([
                'sale_id'           => $data['sale_id'],
                'delivery_type'     => $data['delivery_type'] ?? 'internal',
                'external_service'  => $data['external_service'] ?? null,
                'tracking_number'   => $data['tracking_number'] ?? null,
                'rider_id'          => $rider?->id ?? ($data['rider_id'] ?? null),
                'customer_name'     => $data['customer_name'],
                'customer_phone'    => $data['customer_phone'] ?? null,
                'customer_address'  => $data['customer_address'],
                'distance_km'       => $data['distance_km'] ?? null,
                'delivery_fee'      => $data['delivery_fee'] ?? 0,
                'delivery_notes'    => $data['delivery_notes'] ?? null,
                'external_notes'    => $data['external_notes'] ?? null,
                'proof_of_delivery' => $proofPath,
                'status'            => $deliveryStatus,
                'created_by'        => Auth::id(),
                'updated_by'        => Auth::id(),
            ]);

            return [
                'delivery' => $delivery,
                'rider'    => $rider,
                'sale'     => $sale,
            ];
        });

        $delivery = $records['delivery'];
        $rider = $records['rider'];

        // Real-time broadcasts strictly after DB transaction commits
        if ($rider) {
            try {
                event(new RiderStatusUpdated($rider->fresh(['branch'])));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast failed: ' . $e->getMessage());
            }

            try {
                event(new OrderAssigned($delivery->fresh(['sale.branch', 'order.branch', 'rider'])));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OrderAssigned broadcast failed: ' . $e->getMessage());
            }
        }

        try {
            event(new OrderStatusUpdated($delivery->fresh(['sale.branch', 'order.branch', 'rider']), 'pos', null));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('OrderStatusUpdated broadcast failed: ' . $e->getMessage());
        }

        return $delivery;
    }

    /**
     * Advance delivery status to the next step.
     */
    public function advanceStatus(Delivery $delivery): Delivery
    {
        $nextStatuses = $delivery->getNextStatuses();

        if (empty($nextStatuses)) {
            // Also guard against admin trying to advance rider-only statuses
            if (in_array($delivery->status, Delivery::RIDER_ONLY_STATUSES)) {
                throw new \Exception(
                    "Status '{$delivery->status}' is controlled by the rider app only. " .
                    "Web admin cannot advance this delivery further."
                );
            }
            throw new \Exception('Delivery is already at its final status.');
        }

        return DB::transaction(function () use ($delivery, $nextStatuses) {
            $previousStatus = $delivery->status;
            $newStatus = $nextStatuses[0];
            $updatePayload = [
                'status'     => $newStatus,
                'updated_by' => Auth::id(),
            ];
            if ($newStatus === Delivery::STATUS_DELIVERED && !$delivery->delivered_at) {
                $updatePayload['delivered_at'] = now();
            }
            $delivery->update($updatePayload);

            // Map Delivery vocabulary → Order state machine vocabulary
            // Must match the Order::TRANSITIONS constants exactly
            $deliveryToOrderStatus = [
                Delivery::STATUS_PENDING          => 'pending',
                Delivery::STATUS_PREPARING        => 'preparing',
                Delivery::STATUS_READY            => 'ready_for_pickup',
                Delivery::STATUS_OUT_FOR_DELIVERY => 'in_transit',
                Delivery::STATUS_DELIVERED        => 'delivered',
            ];

            // Sync status with linked Order if exists
            if ($delivery->order_id) {
                $order = $delivery->order()->with('items.product')->first();
                if ($order instanceof Order) {
                    // CRITICAL FIX: The Order state machine requires pending → confirmed → preparing.
                    // When admin starts preparing a mobile order (still 'pending'),
                    // we auto-confirm first, then move to preparing.
                    if ($newStatus === Delivery::STATUS_PREPARING && $order->status === 'pending') {
                        if ($order->canTransitionTo('confirmed')) {
                            $order->transitionTo('confirmed', 'Auto-confirmed on kitchen start', Auth::id());
                        }
                    }

                    $mappedOrderStatus = $deliveryToOrderStatus[$newStatus] ?? null;

                    if ($mappedOrderStatus && $order->canTransitionTo($mappedOrderStatus)) {
                        $order->transitionTo($mappedOrderStatus, 'Admin advanced delivery status', Auth::id());
                    }

                    // Deduct inventory ONLY when starting preparation
                    if ($newStatus === Delivery::STATUS_PREPARING) {
                        $this->inventoryService->deductForOrder($order);
                    }

                    // Food is ready for pickup: stays unassigned for rider self-acceptance pool
                    if ($newStatus === Delivery::STATUS_READY) {
                        // Order is available for rider self-acceptance in the job pool
                    }

                    // Record as Sale if DELIVERED
                    if ($newStatus === Delivery::STATUS_DELIVERED) {
                        // Use the fulfillment service (idempotent, won't duplicate)
                        $this->fulfillmentService->onOrderDelivered(
                            $order->fresh(['items.product.ingredients.stocks', 'branch']),
                            $delivery
                        );
                    }
                }
            }

            if ($newStatus === Delivery::STATUS_DELIVERED && $delivery->rider_id) {
                /** @var Rider|null $rider */
                $rider = Rider::find($delivery->rider_id);
                if ($rider && $rider->activeDeliveriesCount() === 0) {
                    $rider->markAvailable();
                    try {
                        event(new RiderStatusUpdated($rider->fresh(['branch'])));
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast failed: ' . $e->getMessage());
                    }
                }
            }

            event(new OrderStatusUpdated($delivery->fresh(), 'admin', $previousStatus ?? null));

            return $delivery->fresh();
        });
    }

    /**
     * Convert an Order to a Sale record for analytics (delegates to OrderFulfillmentService).
     */
    private function recordOrderAsSale($order, $delivery)
    {
        $this->fulfillmentService->onOrderDelivered($order, $delivery);
    }
    /**
     * Manually assign a rider to a delivery.
     * Guard: delivery must be in ready_for_pickup or failed_delivery (reassign).
     */
    public function assignRider(Delivery $delivery, int $riderId): Delivery
    {
        // Allow assigning a rider when pending, preparing, ready, or reassigning
        $assignableStatuses = [
            Delivery::STATUS_WAITING_KITCHEN,
            Delivery::STATUS_PENDING,
            Delivery::STATUS_PREPARING,
            Delivery::STATUS_READY,
            Delivery::STATUS_ASSIGNED,  // reassign
            Delivery::STATUS_FAILED,    // reassign after failed delivery
            'assigned_to_rider',
        ];

        if (!in_array($delivery->status, $assignableStatuses)) {
            throw new \Exception(
                "Cannot assign a rider to a delivery in '{$delivery->status}' status."
            );
        }

        return DB::transaction(function () use ($delivery, $riderId) {
            $previousStatus = $delivery->status;
            /** @var Rider|null $rider */
            $rider = Rider::where('id', $riderId)
                ->lockForUpdate()
                ->first();

            if (!$rider) {
                throw new \Exception("Rider not found.");
            }

            if (!$rider->is_active) {
                throw new \Exception("Rider '{$rider->name}' is currently inactive and cannot be assigned a new delivery.");
            }

            if ($rider->status === 'offline') {
                throw new \Exception("Rider '{$rider->name}' is currently offline and cannot be assigned a new delivery.");
            }

            $orderBranchId = $delivery->order?->branch_id ?? $delivery->sale?->branch_id;
            if ($orderBranchId && (int) $rider->branch_id !== (int) $orderBranchId) {
                throw new \Exception("Rider '{$rider->name}' belongs to a different branch and cannot take this delivery.");
            }

            // CRITICAL BUSINESS RULE: Rider cannot be assigned if they are OUT FOR DELIVERY (in_transit)
            if ($rider->hasInTransitDelivery()) {
                throw new \Exception(
                    "Rider '{$rider->name}' is currently out for delivery and cannot be assigned additional orders."
                );
            }

            // If there's an existing rider being replaced, check if old rider has remaining active orders
            if ($delivery->rider_id && $delivery->rider_id !== $rider->id) {
                /** @var Rider|null $oldRider */
                $oldRider = Rider::find($delivery->rider_id);
                if ($oldRider) {
                    // Count active deliveries minus this one
                    $remainingActive = $oldRider->deliveries()
                        ->where('id', '!=', $delivery->id)
                        ->whereNotIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED])
                        ->count();
                    if ($remainingActive === 0) {
                        $oldRider->markAvailable();
                        try {
                            event(new RiderStatusUpdated($oldRider->fresh(['branch'])));
                        } catch (\Throwable $e) {
                            \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast failed: ' . $e->getMessage());
                        }
                    }
                }
            }

            // Update the Delivery record
            $delivery->update([
                'rider_id'    => $rider->id,
                'status'      => 'assigned_to_rider',
                'accepted_at' => now(),
                'updated_by'  => Auth::id(),
            ]);

            // Also update the parent Order
            if ($delivery->order_id) {
                $order = $delivery->order;
                if ($order) {
                    $order->update([
                        'rider_id' => $rider->id,
                        'status'   => 'assigned_to_rider',
                    ]);

                    // Write audit log via state machine
                    OrderAuditLog::create([
                        'order_id'   => $order->id,
                        'user_id'    => Auth::id(),
                        'rider_id'   => $rider->id,
                        'old_status' => $order->getOriginal('status') ?? $order->status,
                        'new_status' => 'assigned_to_rider',
                        'device_ip'  => request()->ip(),
                        'user_agent' => request()->userAgent(),
                        'reason'     => 'Admin manually assigned rider: ' . $rider->name,
                    ]);
                }
            }

            // Write audit record to DeliveryAssignmentLog
            DeliveryAssignmentLog::create([
                'delivery_id'         => $delivery->id,
                'order_id'            => $delivery->order_id,
                'sale_id'             => $delivery->sale_id,
                'rider_id'            => $rider->id,
                'assigned_by_type'    => 'admin_manual',
                'assigned_by_user_id' => Auth::id(),
                'previous_status'     => $previousStatus,
                'new_status'          => 'assigned_to_rider',
                'notes'               => 'Admin manually assigned rider: ' . $rider->name,
            ]);

            $rider->update([
                'status'         => 'busy',
                'last_active_at' => now(),
            ]);

            try {
                event(new RiderStatusUpdated($rider->fresh(['branch'])));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast failed: ' . $e->getMessage());
            }

            \Illuminate\Support\Facades\Log::info('Rider assigned successfully', [
                'delivery_id' => $delivery->id,
                'order_id'    => $delivery->order_id,
                'rider_id'    => $rider->id,
                'rider_name'  => $rider->name,
            ]);

            try {
                event(new OrderAssigned($delivery->fresh(['sale.branch', 'order.branch', 'rider'])));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OrderAssigned broadcast failed: ' . $e->getMessage());
            }

            event(new OrderStatusUpdated($delivery->fresh(), 'admin', $previousStatus ?? null));

            return $delivery->fresh(['rider']);
        });
    }

    /**
     * Atomically claim/self-accept a delivery by an authenticated rider.
     * Concurrency safe: only one rider can win race conditions.
     * Idempotent: rapid double taps by the same rider succeed cleanly.
     */
    public function acceptDelivery(Delivery $delivery, Rider $rider): array
    {
        // 1. Rider Eligibility Checks
        if (method_exists($rider, 'canAcceptDeliveries') && !$rider->canAcceptDeliveries()) {
            throw new \RuntimeException("Your rider account is currently restricted from accepting new deliveries. Please contact management.", 403);
        }

        if (!$rider->is_active) {
            throw new \RuntimeException("Rider account is inactive and cannot accept deliveries.", 422);
        }

        if ($rider->status === 'offline') {
            throw new \RuntimeException("You are currently offline. Set your status to active to accept deliveries.", 422);
        }

        // Strict Business Rule: Rider cannot accept orders if they are currently OUT FOR DELIVERY (in_transit)
        if ($rider->hasInTransitDelivery()) {
            throw new \RuntimeException(
                "You are currently out for delivery on an active route and cannot accept additional orders until your delivery route is completed.",
                422
            );
        }

        // Branch Isolation: Match delivery branch with rider branch
        $branchId = $delivery->order?->branch_id ?? $delivery->sale?->branch_id;
        if ($branchId && $rider->branch_id && (int) $rider->branch_id !== (int) $branchId) {
            throw new \RuntimeException("This delivery belongs to another branch and cannot be accepted.", 422);
        }

        $deliveryToBroadcast = null;
        $riderToBroadcast = null;
        $previousStatus = null;

        $result = DB::transaction(function () use ($delivery, $rider, &$deliveryToBroadcast, &$riderToBroadcast, &$previousStatus) {
            /** @var Delivery|null $lockedDelivery */
            $lockedDelivery = Delivery::with(['order', 'sale'])
                ->where('id', $delivery->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedDelivery) {
                throw new \RuntimeException("Delivery not found.", 404);
            }

            // IDEMPOTENCY: If already assigned to THIS EXACT RIDER
            if ($lockedDelivery->rider_id === $rider->id) {
                $deliveryToBroadcast = $lockedDelivery->fresh(['order.branch', 'sale.branch', 'rider']);
                $riderToBroadcast = $rider->fresh(['branch']);
                return [
                    'success'  => true,
                    'message'  => 'Delivery is already assigned to you.',
                    'delivery' => $deliveryToBroadcast,
                    'already_assigned_to_me' => true,
                ];
            }

            // CONFLICT: Another rider already won the race condition
            if ($lockedDelivery->rider_id !== null && $lockedDelivery->rider_id !== $rider->id) {
                throw new \RuntimeException("Delivery already accepted by another rider.", 409);
            }

            // VALID STATUS: Must be ready_for_pickup (or failed_delivery for reassignment)
            $acceptableStatuses = [
                Delivery::STATUS_READY,
                'ready_for_pickup',
                Delivery::STATUS_FAILED,
            ];

            if (!in_array($lockedDelivery->status, $acceptableStatuses)) {
                throw new \RuntimeException("Delivery is no longer available for acceptance (current status: {$lockedDelivery->status}).", 422);
            }

            $previousStatus = $lockedDelivery->status;

            // Update parent Order if linked
            if ($lockedDelivery->order_id) {
                $order = Order::where('id', $lockedDelivery->order_id)->lockForUpdate()->first();
                if ($order) {
                    if ($order->canTransitionTo('assigned_to_rider')) {
                        $order->transitionTo('assigned_to_rider', 'Rider self-accepted delivery', null, $rider->id);
                    }
                    $order->update([
                        'rider_id' => $rider->id,
                        'status'   => 'assigned_to_rider',
                    ]);
                }
            }

            // Update Delivery
            $lockedDelivery->update([
                'rider_id'    => $rider->id,
                'status'      => 'assigned_to_rider',
                'accepted_at' => now(),
                'updated_by'  => null,
            ]);

            // Mark Rider Busy
            $rider->update([
                'status'         => 'busy',
                'last_active_at' => now(),
            ]);

            // Audit Trail
            DeliveryAssignmentLog::create([
                'delivery_id'         => $lockedDelivery->id,
                'order_id'            => $lockedDelivery->order_id,
                'sale_id'             => $lockedDelivery->sale_id,
                'rider_id'            => $rider->id,
                'assigned_by_type'    => 'rider_self_accept',
                'assigned_by_user_id' => null,
                'previous_status'     => $previousStatus,
                'new_status'          => 'assigned_to_rider',
                'notes'               => "Self-accepted by rider {$rider->name} (#{$rider->id})",
            ]);

            $deliveryToBroadcast = $lockedDelivery->fresh(['order.branch', 'order.items.product', 'sale.branch', 'sale.items.product', 'rider']);
            $riderToBroadcast = $rider->fresh(['branch']);

            return [
                'success'  => true,
                'message'  => 'Order accepted! Please head to the branch for pickup.',
                'delivery' => $deliveryToBroadcast,
                'already_assigned_to_me' => false,
            ];
        });

        // ── Real-Time Broadcasts strictly after database transaction commits ──
        if ($deliveryToBroadcast) {
            try {
                event(new OrderAssigned($deliveryToBroadcast));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OrderAssigned broadcast failed: ' . $e->getMessage());
            }

            try {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'rider', $previousStatus));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OrderStatusUpdated broadcast failed: ' . $e->getMessage());
            }
        }

        if ($riderToBroadcast) {
            try {
                event(new RiderStatusUpdated($riderToBroadcast));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast failed: ' . $e->getMessage());
            }
        }

        return $result;
    }

    /**
     * Automatically assign the best available rider for the delivery's branch.
     */
    public function autoAssign(Delivery $delivery): ?Rider
    {
        $branchId = $delivery->order?->branch_id ?? $delivery->sale?->branch_id;
        if (!$branchId) return null;

        /** @var Branch|null $branch */
        $branch = Branch::find($branchId);
        if (!$branch) return null;

        $rider = $this->findBestAvailableRider($branch);
        
        if ($rider) {
            $this->assignRider($delivery, $rider->id);
            return $rider;
        }

        return null;
    }

    /**
     * Mark a delivery as failed (rider could not deliver).
     * Frees the rider and transitions delivery to failed_delivery,
     * allowing admin to reassign.
     */
    public function handleFailedDelivery(Delivery $delivery, string $reason = 'Delivery failed'): Delivery
    {
        if (!$delivery->canMarkFailed()) {
            throw new \Exception(
                "Cannot mark delivery as failed from status '{$delivery->status}'. " .
                "Only in_transit or picked_up deliveries can be marked as failed."
            );
        }

        return DB::transaction(function () use ($delivery, $reason) {
            $previousStatus = $delivery->status;
            // Free the current rider
            if ($delivery->rider_id) {
                /** @var Rider|null $rider */
                $rider = Rider::find($delivery->rider_id);
                if ($rider) {
                    $rider->markAvailable();
                }
            }

            $delivery->update([
                'status'              => Delivery::STATUS_FAILED,
                'cancellation_reason' => $reason,
                'updated_by'          => Auth::id(),
            ]);

            // Write audit log on the linked order
            if ($delivery->order_id) {
                $order = $delivery->order;
                if ($order) {
                    OrderAuditLog::create([
                        'order_id'   => $order->id,
                        'user_id'    => Auth::id(),
                        'rider_id'   => $delivery->rider_id,
                        'old_status' => $order->status,
                        'new_status' => 'failed_delivery',
                        'device_ip'  => request()->ip(),
                        'user_agent' => request()->userAgent(),
                        'reason'     => $reason,
                    ]);
                }
            }

            \Illuminate\Support\Facades\Log::warning('Delivery marked as failed', [
                'delivery_id' => $delivery->id,
                'order_id'    => $delivery->order_id,
                'rider_id'    => $delivery->rider_id,
                'reason'      => $reason,
            ]);

            // Track rider failure streak if rider was assigned and failure is rider-attributable
            if ($delivery->rider_id && !str_contains(strtolower($reason), 'customer') && !str_contains(strtolower($reason), 'store') && !str_contains(strtolower($reason), 'system')) {
                app(\App\Services\AccountGovernanceService::class)->recordRiderDeliveryFailure($delivery->rider_id, $reason, $delivery);
            }

            event(new OrderStatusUpdated($delivery->fresh(), 'admin', $previousStatus ?? null));

            return $delivery->fresh();
        });
    }

    /**
     * Record an immutable delivery attempt (successful or failed) with GPS proximity and controlled attribution.
     */
    public function recordDeliveryAttempt(
        Delivery $delivery,
        string $status = 'failed',
        ?string $failureReason = null,
        ?float $latitude = null,
        ?float $longitude = null,
        ?string $notes = null,
        ?string $proofImagePath = null,
        ?int $riderId = null
    ): DeliveryAttempt {
        $reasonsConfig = config('cod_security.failure_reasons', []);
        $category = 'other';
        if ($failureReason && isset($reasonsConfig[$failureReason])) {
            $category = $reasonsConfig[$failureReason]['category'] ?? 'other';
        }

        $activeRiderId = $riderId ?? $delivery->rider_id;

        // Calculate distance from customer coordinates if coordinates provided
        $distanceFromCustomer = null;
        $customerLat = (float) ($delivery->latitude ?? $delivery->order?->latitude);
        $customerLng = (float) ($delivery->longitude ?? $delivery->order?->longitude);

        if ($latitude !== null && $longitude !== null && $customerLat && $customerLng) {
            $earthRadius = 6371; // km
            $latFrom = deg2rad($latitude);
            $lonFrom = deg2rad($longitude);
            $latTo = deg2rad($customerLat);
            $lonTo = deg2rad($customerLng);

            $latDelta = $latTo - $latFrom;
            $lonDelta = $lonTo - $lonFrom;

            $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
                cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

            $distanceFromCustomer = round($angle * $earthRadius, 2);
        }

        $attemptNumber = DeliveryAttempt::where('delivery_id', $delivery->id)->count() + 1;

        $attempt = DeliveryAttempt::create([
            'delivery_id'            => $delivery->id,
            'order_id'               => $delivery->order_id,
            'sale_id'                => $delivery->sale_id,
            'rider_id'               => $activeRiderId,
            'attempt_number'         => $attemptNumber,
            'status'                 => $status,
            'failure_reason'         => $failureReason,
            'failure_category'       => $category,
            'latitude'               => $latitude,
            'longitude'              => $longitude,
            'distance_from_customer' => $distanceFromCustomer,
            'notes'                  => $notes,
            'proof_image_path'       => $proofImagePath,
        ]);

        if ($status === 'failed') {
            $this->handleFailedDelivery($delivery, $failureReason ?? 'Delivery attempt failed');

            SecurityAuditLogger::logSecurityEvent(
                event: 'DELIVERY_ATTEMPT_FAILED',
                target: "delivery:{$delivery->id}",
                details: [
                    'order_id'               => $delivery->order_id,
                    'rider_id'               => $activeRiderId,
                    'failure_reason'         => $failureReason,
                    'failure_category'       => $category,
                    'distance_from_customer' => $distanceFromCustomer,
                    'notes'                  => $notes,
                ],
                level: 'warning'
            );

            if ($failureReason === 'CUSTOMER_REFUSED_ORDER') {
                SecurityAuditLogger::logSecurityEvent(
                    event: 'CUSTOMER_REFUSED_ORDER',
                    target: "order:{$delivery->order_id}",
                    details: [
                        'customer_name'  => $delivery->customer_name,
                        'customer_phone' => $delivery->customer_phone,
                    ],
                    level: 'warning'
                );
            }
        }

        return $attempt;
    }

    /**
     * SCENARIO A: Rider cancels / unassigns BEFORE food pickup.
     * Food is still at the store; customer order remains active; delivery returns to ready_for_pickup pool.
     */
    public function releaseRiderBeforePickup(Delivery $delivery, Rider $rider, string $reason, ?string $notes = null): array
    {
        if ($delivery->picked_up_at !== null || in_array($delivery->status, ['picked_up', 'in_transit', 'delivered'])) {
            throw new \RuntimeException("Cannot perform pre-pickup release: order has already been picked up. Please follow the return workflow.", 422);
        }

        $deliveryToBroadcast = null;
        $riderToBroadcast = null;

        $result = DB::transaction(function () use ($delivery, $rider, $reason, $notes, &$deliveryToBroadcast, &$riderToBroadcast) {
            /** @var Delivery|null $lockedDelivery */
            $lockedDelivery = Delivery::with(['order', 'sale'])
                ->where('id', $delivery->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedDelivery) {
                throw new \RuntimeException("Delivery not found.", 404);
            }

            if ((int) $lockedDelivery->rider_id !== (int) $rider->id) {
                throw new \RuntimeException("You are not the assigned rider for this delivery.", 403);
            }

            $prevDeliveryStatus = $lockedDelivery->status;

            // 1. Reset Delivery to ready_for_pickup with no assigned rider
            $lockedDelivery->update([
                'rider_id'            => null,
                'status'              => Delivery::STATUS_READY,
                'accepted_at'         => null,
                'cancellation_reason' => $reason,
                'updated_by'          => null,
            ]);

            // 2. Keep parent Order active and in ready_for_pickup
            if ($lockedDelivery->order_id) {
                $order = Order::where('id', $lockedDelivery->order_id)->lockForUpdate()->first();
                if ($order) {
                    $oldStatus = $order->status;
                    $order->update([
                        'rider_id'                => null,
                        'status'                  => 'ready_for_pickup',
                        'is_cancellation_pending' => false,
                        'cancellation_status'     => null,
                    ]);

                    OrderAuditLog::create([
                        'order_id'   => $order->id,
                        'user_id'    => null,
                        'rider_id'   => $rider->id,
                        'old_status' => $oldStatus,
                        'new_status' => 'ready_for_pickup',
                        'device_ip'  => request()->ip(),
                        'user_agent' => request()->userAgent(),
                        'reason'     => "Rider {$rider->name} released order before pickup: {$reason}" . ($notes ? " ({$notes})" : ""),
                    ]);
                }
            }

            // 3. Write Assignment Log
            DeliveryAssignmentLog::create([
                'delivery_id'         => $lockedDelivery->id,
                'order_id'            => $lockedDelivery->order_id,
                'sale_id'             => $lockedDelivery->sale_id,
                'rider_id'            => $rider->id,
                'assigned_by_type'    => 'rider_cancel_before_pickup',
                'assigned_by_user_id' => null,
                'previous_status'     => $prevDeliveryStatus,
                'new_status'          => Delivery::STATUS_READY,
                'notes'               => "Pre-pickup release by rider {$rider->name}. Reason: {$reason}",
            ]);

            // 4. Release Rider if no other active deliveries
            $hasOtherActive = Delivery::where('rider_id', $rider->id)
                ->where('id', '!=', $lockedDelivery->id)
                ->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
                ->exists();

            if (!$hasOtherActive) {
                $rider->markAvailable();
            }

            $deliveryToBroadcast = $lockedDelivery->fresh(['order.branch', 'order.items.product', 'sale.branch', 'sale.items.product']);
            $riderToBroadcast = $rider->fresh(['branch']);

            return [
                'success'               => true,
                'message'               => 'Delivery released successfully. The order has been returned to the available pool for other riders.',
                'status'                => Delivery::STATUS_READY,
                'is_reassigned_to_pool' => true,
                'delivery'              => $deliveryToBroadcast,
            ];
        });

        if ($deliveryToBroadcast) {
            try {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'rider', 'assigned_to_rider'));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OrderStatusUpdated broadcast failed: ' . $e->getMessage());
            }
        }

        if ($riderToBroadcast) {
            try {
                event(new RiderStatusUpdated($riderToBroadcast));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast failed: ' . $e->getMessage());
            }
        }

        return $result;
    }

    /**
     * SCENARIO B: Rider cancels AFTER food pickup.
     * Food is in rider's possession; triggers mandatory return workflow. Order is NOT yet cancelled or in the pool.
     */
    public function initiateReturnAfterPickup(Delivery $delivery, Rider $rider, string $reason, ?string $notes = null): array
    {
        $deliveryToBroadcast = null;
        $cancellationToBroadcast = null;

        $result = DB::transaction(function () use ($delivery, $rider, $reason, $notes, &$deliveryToBroadcast, &$cancellationToBroadcast) {
            /** @var Delivery|null $lockedDelivery */
            $lockedDelivery = Delivery::with(['order.branch', 'sale.branch'])
                ->where('id', $delivery->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedDelivery) {
                throw new \RuntimeException("Delivery not found.", 404);
            }

            if ((int) $lockedDelivery->rider_id !== (int) $rider->id) {
                throw new \RuntimeException("You are not the assigned rider for this delivery.", 403);
            }

            if ($lockedDelivery->isDelivered()) {
                throw new \RuntimeException("Cannot request return for an already delivered order.", 422);
            }

            if ($lockedDelivery->isCancelled()) {
                throw new \RuntimeException("Order is already cancelled.", 422);
            }

            $order = $lockedDelivery->order ?: Order::find($lockedDelivery->order_id);
            $prevOrderStatus = $order?->status ?? 'in_transit';
            $prevDeliveryStatus = $lockedDelivery->status;

            $now = now();

            // 1. Update Delivery to return_required state
            $lockedDelivery->update([
                'status'              => Delivery::STATUS_RETURN_REQUIRED,
                'return_status'       => Delivery::RETURN_STATUS_REQUIRED,
                'return_reason'       => $reason,
                'return_notes'        => $notes,
                'return_requested_at' => $now,
                'cancellation_reason' => $reason,
                'updated_by'          => null,
            ]);

            // 2. Update Order to cancellation_requested state
            if ($order) {
                $order->update([
                    'status'                  => 'cancellation_requested',
                    'is_cancellation_pending' => true,
                    'cancellation_status'     => 'pending',
                    'cancellation_reason'     => $reason,
                ]);

                OrderAuditLog::create([
                    'order_id'   => $order->id,
                    'user_id'    => null,
                    'rider_id'   => $rider->id,
                    'old_status' => $prevOrderStatus,
                    'new_status' => 'cancellation_requested',
                    'device_ip'  => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'reason'     => "Rider {$rider->name} requested return after pickup. Reason: {$reason}" . ($notes ? " ({$notes})" : ""),
                ]);
            }

            // 3. Create OrderCancellationRequest ledger if mobile order
            $cancellationRequest = null;
            if ($order) {
                $cancellationRequest = OrderCancellationRequest::create([
                    'order_id'                 => $order->id,
                    'delivery_id'              => $lockedDelivery->id,
                    'requested_by_rider_id'    => $rider->id,
                    'branch_id'                => $order->branch_id ?? $rider->branch_id,
                    'reason'                   => $reason,
                    'notes'                    => $notes,
                    'previous_order_status'    => $prevOrderStatus,
                    'previous_delivery_status' => $prevDeliveryStatus,
                    'status'                   => 'pending',
                    'return_status'            => Delivery::RETURN_STATUS_REQUIRED,
                    'action_type'              => 'after_pickup_return',
                    'requested_at'             => $now,
                ]);

                // Create legacy record for backward compatibility
                CancellationRequest::create([
                    'order_id'      => $order->id,
                    'delivery_id'   => $lockedDelivery->id,
                    'rider_id'      => $rider->id,
                    'reason'        => $reason,
                    'notes'         => $notes,
                    'status'        => 'pending',
                    'return_status' => Delivery::RETURN_STATUS_REQUIRED,
                    'action_type'   => 'after_pickup_return',
                    'requested_at'  => $now,
                ]);
            }

            // 4. Rider status remains busy/returning
            $rider->update(['status' => 'busy']);

            $deliveryToBroadcast = $lockedDelivery->fresh(['order.branch', 'order.items.product', 'sale.branch', 'sale.items.product', 'rider']);
            $cancellationToBroadcast = $cancellationRequest?->fresh(['order', 'delivery', 'requestedByRider', 'branch']);

            return [
                'success'               => true,
                'message'               => 'Return initiated. You are responsible for returning the physical items to the store.',
                'status'                => Delivery::STATUS_RETURN_REQUIRED,
                'return_status'         => Delivery::RETURN_STATUS_REQUIRED,
                'delivery'              => $deliveryToBroadcast,
                'cancellation_request'  => $cancellationToBroadcast,
            ];
        });

        // Broadcast after commit
        if ($deliveryToBroadcast) {
            try {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'rider'));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OrderStatusUpdated broadcast failed in initiateReturnAfterPickup: ' . $e->getMessage());
            }
        }

        if ($cancellationToBroadcast) {
            try {
                event(new CancellationRequested($cancellationToBroadcast));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('CancellationRequested broadcast failed in initiateReturnAfterPickup: ' . $e->getMessage());
            }
        }

        return $result;
    }

    /**
     * SCENARIO B STEP 2: Rider arrives at store and reports items returned.
     * Transitions delivery return_status to 'return_pending_verification'.
     */
    public function reportReturnByRider(Delivery $delivery, Rider $rider, ?string $notes = null): array
    {
        $deliveryToBroadcast = null;

        $result = DB::transaction(function () use ($delivery, $rider, $notes, &$deliveryToBroadcast) {
            /** @var Delivery|null $lockedDelivery */
            $lockedDelivery = Delivery::with(['order.branch', 'sale.branch'])
                ->where('id', $delivery->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedDelivery) {
                throw new \RuntimeException("Delivery not found.", 404);
            }

            if ((int) $lockedDelivery->rider_id !== (int) $rider->id) {
                throw new \RuntimeException("Unauthorized: You are not the assigned rider.", 403);
            }

            $now = now();

            $lockedDelivery->update([
                'status'             => Delivery::STATUS_RETURN_PENDING_VERIFICATION,
                'return_status'      => Delivery::RETURN_STATUS_PENDING,
                'return_reported_at' => $now,
                'return_notes'       => $notes ? ($lockedDelivery->return_notes . "\nRider return note: " . $notes) : $lockedDelivery->return_notes,
            ]);

            OrderCancellationRequest::where('delivery_id', $lockedDelivery->id)
                ->where('status', 'pending')
                ->update([
                    'return_status'      => Delivery::RETURN_STATUS_PENDING,
                    'return_reported_at' => $now,
                ]);

            CancellationRequest::where('delivery_id', $lockedDelivery->id)
                ->where('status', 'pending')
                ->update([
                    'return_status'      => Delivery::RETURN_STATUS_PENDING,
                    'return_reported_at' => $now,
                ]);

            if ($lockedDelivery->order_id) {
                OrderAuditLog::create([
                    'order_id'   => $lockedDelivery->order_id,
                    'user_id'    => null,
                    'rider_id'   => $rider->id,
                    'old_status' => $lockedDelivery->status,
                    'new_status' => $lockedDelivery->status,
                    'device_ip'  => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'reason'     => "Rider {$rider->name} reported items physically returned to store counter. Awaiting cashier verification.",
                ]);
            }

            $deliveryToBroadcast = $lockedDelivery->fresh(['order.branch', 'order.items.product', 'sale.branch', 'sale.items.product', 'rider']);

            return [
                'success'       => true,
                'message'       => 'Return reported. Please hand over the physical items to the store cashier for verification.',
                'status'        => $lockedDelivery->status,
                'return_status' => Delivery::RETURN_STATUS_PENDING,
                'delivery'      => $deliveryToBroadcast,
            ];
        });

        if ($deliveryToBroadcast) {
            try {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'rider'));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OrderStatusUpdated broadcast failed: ' . $e->getMessage());
            }
        }

        return $result;
    }

    /**
     * SCENARIO B STEP 3: Cashier/Admin verifies physical return and executes authoritative decision.
     *
     * @param Delivery $delivery
     * @param User     $user     Cashier or Admin
     * @param string   $decision 'reassign' | 'cancel' | 'verify_only'
     * @param string|null $notes
     */
    public function verifyReturn(Delivery $delivery, User $user, string $decision, ?string $notes = null): array
    {
        $deliveryToBroadcast = null;
        $riderToBroadcast = null;
        $cancellationToBroadcast = null;

        $result = DB::transaction(function () use ($delivery, $user, $decision, $notes, &$deliveryToBroadcast, &$riderToBroadcast, &$cancellationToBroadcast) {
            /** @var Delivery|null $lockedDelivery */
            $lockedDelivery = Delivery::with(['order.branch', 'order.items.product', 'sale.branch', 'sale.items.product', 'rider'])
                ->where('id', $delivery->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedDelivery) {
                throw new \RuntimeException("Delivery not found.", 404);
            }

            // Branch authorization check
            $branchId = $lockedDelivery->order?->branch_id ?? $lockedDelivery->sale?->branch_id;
            if (!$user->isAdmin() && $user->branch_id && $branchId && (int) $user->branch_id !== (int) $branchId) {
                throw new \RuntimeException("Unauthorized: You can only verify returns for your assigned branch.", 403);
            }

            $now = now();
            $returningRider = $lockedDelivery->rider;
            $order = $lockedDelivery->order ?: ($lockedDelivery->order_id ? Order::find($lockedDelivery->order_id) : null);

            // 1. Mark Physical Return Verified
            $lockedDelivery->update([
                'return_status'      => Delivery::RETURN_STATUS_VERIFIED,
                'return_verified_at' => $now,
                'return_verified_by' => $user->id,
            ]);

            // 2. Release returning rider from responsibility
            if ($returningRider) {
                $hasOtherActive = Delivery::where('rider_id', $returningRider->id)
                    ->where('id', '!=', $lockedDelivery->id)
                    ->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
                    ->exists();

                if (!$hasOtherActive) {
                    $returningRider->markAvailable();
                }
                $riderToBroadcast = $returningRider->fresh(['branch']);
            }

            // 3. Process Decision
            if ($decision === 'reassign') {
                // OPTION A: REASSIGN DELIVERY
                // Reset delivery to ready_for_pickup, unassign rider, preserve original customer order
                $lockedDelivery->update([
                    'rider_id'          => null,
                    'status'            => Delivery::STATUS_READY,
                    'accepted_at'       => null,
                    'picked_up_at'      => null,
                    'transit_at'        => null,
                    'return_resolution' => 'reassign',
                    'reassigned_at'     => $now,
                    'updated_by'        => $user->id,
                ]);

                if ($order) {
                    $order->update([
                        'rider_id'                => null,
                        'status'                  => 'ready_for_pickup',
                        'is_cancellation_pending' => false,
                        'cancellation_status'     => 'reassigned',
                    ]);

                    OrderAuditLog::create([
                        'order_id'   => $order->id,
                        'user_id'    => $user->id,
                        'rider_id'   => $returningRider?->id,
                        'old_status' => 'cancellation_requested',
                        'new_status' => 'ready_for_pickup',
                        'device_ip'  => request()->ip(),
                        'user_agent' => request()->userAgent(),
                        'reason'     => "Return physically verified by {$user->name}. Delivery reassigned to rider pool." . ($notes ? " ({$notes})" : ""),
                    ]);
                }

                $returningRiderId = $returningRider?->id ?? $lockedDelivery->rider_id;
                if ($returningRiderId) {
                    DeliveryAssignmentLog::create([
                        'delivery_id'         => $lockedDelivery->id,
                        'order_id'            => $lockedDelivery->order_id,
                        'sale_id'             => $lockedDelivery->sale_id,
                        'rider_id'            => $returningRiderId,
                        'assigned_by_type'    => 'admin_reassign_after_return',
                        'assigned_by_user_id' => $user->id,
                        'previous_status'     => 'cancellation_requested',
                        'new_status'          => Delivery::STATUS_READY,
                        'notes'               => "Return verified by {$user->name}. Reassigned to available delivery pool.",
                    ]);
                }

                // Update cancellation request record
                $cancellationReq = OrderCancellationRequest::where('delivery_id', $lockedDelivery->id)
                    ->where('status', 'pending')
                    ->first();

                if ($cancellationReq) {
                    $cancellationReq->update([
                        'status'             => 'approved',
                        'return_status'      => Delivery::RETURN_STATUS_VERIFIED,
                        'return_verified_at' => $now,
                        'return_verified_by' => $user->id,
                        'resolution_action'  => 'reassigned',
                        'reviewed_by'        => $user->id,
                        'reviewed_at'        => $now,
                    ]);
                    $cancellationToBroadcast = $cancellationReq->fresh();
                }

                $msg = 'Order return verified. The delivery has been placed back in the rider job pool for reassignment.';
            } elseif ($decision === 'cancel') {
                // OPTION B: PERMANENTLY CANCEL CUSTOMER ORDER
                $lockedDelivery->update([
                    'status'              => Delivery::STATUS_CANCELLED,
                    'return_resolution'   => 'cancel',
                    'cancelled_by'        => $user->id,
                    'cancelled_at'        => $now,
                    'cancellation_reason' => $notes ?? $lockedDelivery->return_reason ?? 'Cancelled after verified return',
                    'updated_by'          => $user->id,
                ]);

                if ($order) {
                    $order->update([
                        'status'                  => 'cancelled',
                        'is_cancellation_pending' => false,
                        'cancellation_status'     => 'approved',
                        'cancelled_at'            => $now,
                        'cancelled_by'            => $user->id,
                        'cancellation_reason'     => $notes ?? $lockedDelivery->return_reason ?? 'Cancelled after verified return',
                    ]);

                    // Restore inventory if deducted
                    if ($order->inventory_deducted) {
                        try {
                            $this->inventoryService->restoreForOrder($order);
                        } catch (\Throwable $e) {
                            \Illuminate\Support\Facades\Log::warning('Inventory restoration failed on return cancel: ' . $e->getMessage());
                        }
                    }

                    OrderAuditLog::create([
                        'order_id'   => $order->id,
                        'user_id'    => $user->id,
                        'rider_id'   => $returningRider?->id,
                        'old_status' => 'cancellation_requested',
                        'new_status' => 'cancelled',
                        'device_ip'  => request()->ip(),
                        'user_agent' => request()->userAgent(),
                        'reason'     => "Return physically verified by {$user->name}. Customer order permanently cancelled." . ($notes ? " ({$notes})" : ""),
                    ]);
                }

                $cancellationReq = OrderCancellationRequest::where('delivery_id', $lockedDelivery->id)
                    ->where('status', 'pending')
                    ->first();

                if ($cancellationReq) {
                    $cancellationReq->update([
                        'status'             => 'approved',
                        'return_status'      => Delivery::RETURN_STATUS_VERIFIED,
                        'return_verified_at' => $now,
                        'return_verified_by' => $user->id,
                        'resolution_action'  => 'cancelled',
                        'reviewed_by'        => $user->id,
                        'reviewed_at'        => $now,
                    ]);
                    $cancellationToBroadcast = $cancellationReq->fresh();
                }

                $msg = 'Order return verified. Customer order has been permanently cancelled and inventory restored.';
            } else {
                // VERIFY ONLY (Awaiting store decision)
                $msg = 'Physical return verified. Please select whether to reassign or cancel the order.';
            }

            $deliveryToBroadcast = $lockedDelivery->fresh(['order.branch', 'order.items.product', 'sale.branch', 'sale.items.product']);

            return [
                'success'           => true,
                'message'           => $msg,
                'status'            => $lockedDelivery->status,
                'return_status'     => Delivery::RETURN_STATUS_VERIFIED,
                'return_resolution' => $lockedDelivery->return_resolution,
                'delivery'          => $deliveryToBroadcast,
            ];
        });

        if ($cancellationToBroadcast) {
            try {
                event(new CancellationResolved($cancellationToBroadcast));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('CancellationResolved broadcast failed: ' . $e->getMessage());
            }
        }

        if ($deliveryToBroadcast) {
            try {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'cashier'));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OrderStatusUpdated broadcast failed: ' . $e->getMessage());
            }
        }

        if ($riderToBroadcast) {
            try {
                event(new RiderStatusUpdated($riderToBroadcast));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast failed: ' . $e->getMessage());
            }
        }

        return $result;
    }

    /**
     * Store cashier/admin rejects rider return claim.
     */
    public function rejectReturn(Delivery $delivery, User $user, string $rejectionReason): array
    {
        $deliveryToBroadcast = null;
        $cancellationToBroadcast = null;

        $result = DB::transaction(function () use ($delivery, $user, $rejectionReason, &$deliveryToBroadcast, &$cancellationToBroadcast) {
            /** @var Delivery|null $lockedDelivery */
            $lockedDelivery = Delivery::with(['order.branch', 'sale.branch', 'rider'])
                ->where('id', $delivery->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedDelivery) {
                throw new \RuntimeException("Delivery not found.", 404);
            }

            $now = now();

            $lockedDelivery->update([
                'return_status' => Delivery::RETURN_STATUS_REJECTED,
                'updated_by'    => $user->id,
            ]);

            $cancellationReq = OrderCancellationRequest::where('delivery_id', $lockedDelivery->id)
                ->where('status', 'pending')
                ->first();

            if ($cancellationReq) {
                $cancellationReq->update([
                    'status'            => 'rejected',
                    'return_status'     => Delivery::RETURN_STATUS_REJECTED,
                    'rejection_reason'  => $rejectionReason,
                    'reviewed_by'       => $user->id,
                    'reviewed_at'       => $now,
                    'resolution_action' => 'rejected',
                ]);
                $cancellationToBroadcast = $cancellationReq->fresh();
            }

            if ($lockedDelivery->order_id) {
                OrderAuditLog::create([
                    'order_id'   => $lockedDelivery->order_id,
                    'user_id'    => $user->id,
                    'rider_id'   => $lockedDelivery->rider_id,
                    'old_status' => $lockedDelivery->status,
                    'new_status' => $lockedDelivery->status,
                    'device_ip'  => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'reason'     => "Return claim rejected by {$user->name}. Reason: {$rejectionReason}",
                ]);
            }

            $deliveryToBroadcast = $lockedDelivery->fresh(['order.branch', 'order.items.product', 'sale.branch', 'sale.items.product', 'rider']);

            return [
                'success'       => true,
                'message'       => 'Return claim rejected. Order remains under store investigation.',
                'status'        => $lockedDelivery->status,
                'return_status' => Delivery::RETURN_STATUS_REJECTED,
                'delivery'      => $deliveryToBroadcast,
            ];
        });

        if ($cancellationToBroadcast) {
            try {
                event(new CancellationResolved($cancellationToBroadcast));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('CancellationResolved broadcast failed: ' . $e->getMessage());
            }
        }

        if ($deliveryToBroadcast) {
            try {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'cashier'));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OrderStatusUpdated broadcast failed: ' . $e->getMessage());
            }
        }

        return $result;
    }

    /**
     * Copy uploaded image to public/storage if storage link is a physical folder.
     */
    private function syncToPublicStorage(?string $imagePath): void
    {
        \App\Utils\ImageHelper::syncToPublicStorage($imagePath);
    }
}

