<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Rider;
use App\Models\Order;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\InventoryService;
use App\Services\OrderFulfillmentService;
use App\Events\OrderStatusUpdated;
use App\Events\RiderStatusUpdated;
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

                    // Auto-assign rider ONLY when food is ready
                    if ($newStatus === Delivery::STATUS_READY) {
                        if ($delivery->isInternal() && !$delivery->rider_id) {
                            $this->autoAssign($delivery);
                        }
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
                'rider_id'   => $rider->id,
                'status'     => 'assigned_to_rider',
                'updated_by' => Auth::id(),
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
                    \App\Models\OrderAuditLog::create([
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

            event(new OrderStatusUpdated($delivery->fresh(), 'admin', $previousStatus ?? null));

            return $delivery->fresh(['rider']);
        });
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
                    \App\Models\OrderAuditLog::create([
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

            event(new OrderStatusUpdated($delivery->fresh(), 'admin', $previousStatus ?? null));

            return $delivery->fresh();
        });
    }

    /**
     * Copy uploaded image to public/storage if storage link is a physical folder.
     */
    private function syncToPublicStorage(?string $imagePath): void
    {
        if (!$imagePath) return;
        $source = storage_path('app/public/' . $imagePath);
        $dest = public_path('storage/' . $imagePath);
        if (file_exists($source)) {
            if (!is_dir(dirname($dest))) {
                @mkdir(dirname($dest), 0755, true);
            }
            if ($source !== $dest && !file_exists($dest)) {
                @copy($source, $dest);
            }
        }
    }
}
