<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Rider;
use App\Models\Order;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\InventoryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeliveryService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }
    /**
     * Recommend a delivery type based on branch capabilities and distance.
     */
    public function recommend(Branch $branch, ?float $distanceKm): array
    {
        $fee = $distanceKm ? $branch->calculateDeliveryFee($distanceKm) : (float) $branch->base_delivery_fee;
        $availableCount = $branch->riders()->available()->count();

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
            ->available()
            ->orderByRaw('COALESCE(last_active_at, created_at) ASC')
            ->orderBy('updated_at', 'ASC')
            ->first();
    }

    /**
     * Create a delivery record linked to a sale.
     */
    public function createDelivery(array $data): Delivery
    {
        return DB::transaction(function () use ($data) {
            $sale = Sale::with('branch')->findOrFail($data['sale_id']);
            $branchId = $sale->branch_id;

            if ($data['delivery_type'] === 'internal') {
                $riderId = $data['rider_id'] ?? null;

                if ($riderId) {
                    $rider = Rider::where('id', $riderId)
                        ->where('branch_id', $branchId)
                        ->available()
                        ->lockForUpdate()
                        ->first();

                    if (! $rider) {
                        throw new \Exception('Selected rider is no longer available. Please choose another rider.');
                    }
                } else {
                    $rider = Rider::where('branch_id', $branchId)
                        ->available()
                        ->orderByRaw('COALESCE(last_active_at, created_at) ASC')
                        ->orderBy('updated_at', 'ASC')
                        ->lockForUpdate()
                        ->first();

                    if (! $rider) {
                        throw new \Exception('No available internal rider found for this branch.');
                    }

                    $data['rider_id'] = $rider->id;
                }

                $rider->update([
                    'status'         => 'busy',
                    'last_active_at' => now(),
                ]);
            }

            $proofPath = null;
            if (isset($data['proof_of_delivery']) && $data['proof_of_delivery'] instanceof UploadedFile) {
                $proofPath = $data['proof_of_delivery']->store('delivery-proofs', 'public');
            }

            $delivery = Delivery::create([
                'sale_id'           => $data['sale_id'],
                'delivery_type'     => $data['delivery_type'],
                'external_service'  => $data['external_service'] ?? null,
                'tracking_number'   => $data['tracking_number'] ?? null,
                'rider_id'          => $data['rider_id'] ?? null,
                'customer_name'     => $data['customer_name'],
                'customer_phone'    => $data['customer_phone'] ?? null,
                'customer_address'  => $data['customer_address'],
                'distance_km'       => $data['distance_km'] ?? null,
                'delivery_fee'      => $data['delivery_fee'] ?? 0,
                'delivery_notes'    => $data['delivery_notes'] ?? null,
                'external_notes'    => $data['external_notes'] ?? null,
                'proof_of_delivery' => $proofPath,
                'status'            => Delivery::STATUS_PENDING,
                'created_by'        => Auth::id(),
                'updated_by'        => Auth::id(),
            ]);

            return $delivery;
        });
    }

    /**
     * Advance delivery status to the next step.
     */
    public function advanceStatus(Delivery $delivery): Delivery
    {
        $nextStatuses = $delivery->getNextStatuses();

        if (empty($nextStatuses)) {
            throw new \Exception('Delivery is already at its final status.');
        }

        return DB::transaction(function () use ($delivery, $nextStatuses) {
            $newStatus = $nextStatuses[0];
            $delivery->update([
                'status'     => $newStatus,
                'updated_by' => Auth::id(),
            ]);

            // Sync status with linked Order if exists
            if ($delivery->order_id) {
                $order = $delivery->order()->with('items.product')->first();
                if ($order instanceof Order) {
                    $order->update(['status' => $newStatus]);

                    // --- NEW INVENTORY LIFECYCLE LOGIC ---
                    // Deduct inventory ONLY when starting preparation
                    if ($newStatus === Delivery::STATUS_PREPARING) {
                        $this->inventoryService->deductForOrder($order);
                    }

                    // Record as Sale if DELIVERED
                    if ($newStatus === Delivery::STATUS_DELIVERED) {
                        $this->recordOrderAsSale($order, $delivery);
                    }
                }
            }

            if ($newStatus === Delivery::STATUS_DELIVERED && $delivery->rider_id) {
                /** @var \App\Models\Rider|null $rider */
                $rider = Rider::find($delivery->rider_id);
                if ($rider) {
                    $rider->markAvailable();
                }
            }

            return $delivery->fresh();
        });
    }

    /**
     * Convert an Order to a Sale record for analytics.
     */
    private function recordOrderAsSale($order, $delivery)
    {
        $orderNum = 'MOB-' . str_pad($order->id, 6, '0', STR_PAD_LEFT);

        // Prevent duplicate sales for the same order
        if (Sale::where('order_number', $orderNum)->exists()) {
            return;
        }

        // Calculate cost and profit
        $costTotal = 0;
        foreach ($order->items as $item) {
            $itemCost = $item->product->computeProductCost($order->branch_id) ?? 0;
            $costTotal += $itemCost * $item->quantity;
        }

        $profit = (float) $order->total_amount - (float) $costTotal;

        // Create Sale
        $sale = Sale::create([
            'order_number'   => $orderNum,
            'user_id'        => Auth::id() ?? $order->user_id ?? 1,
            'branch_id'      => $order->branch_id,
            'type'           => 'delivery',
            'total'          => $order->total_amount,
            'cost_total'     => $costTotal,
            'profit'         => $profit,
            'paid_amount'    => $order->total_amount,
            'change_amount'  => 0,
            'payment_method' => 'online',
            'status'         => 'completed',
            'created_at'     => $order->created_at,
        ]);

        // Create Sale Items
        foreach ($order->items as $item) {
            $itemCost = $item->product->computeProductCost($order->branch_id) ?? 0;
            SaleItem::create([
                'sale_id'    => $sale->id,
                'product_id' => $item->product_id,
                'quantity'   => $item->quantity,
                'unit_price' => $item->price,
                'cost_price' => $itemCost,
                'subtotal'   => $item->price * $item->quantity,
                'profit'     => ($item->price - $itemCost) * $item->quantity,
                'created_at' => $order->created_at,
            ]);
        }

        // Link delivery to this sale
        $delivery->update(['sale_id' => $sale->id]);
    }
}
