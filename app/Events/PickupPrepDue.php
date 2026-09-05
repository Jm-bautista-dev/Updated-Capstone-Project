<?php

namespace App\Events;

use App\Models\Order;
use App\Services\PickupOrderService;
use Carbon\Carbon;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PickupPrepDue implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $orderId;
    public string $orderNumber;
    public string $customerName;
    public ?int $branchId;
    public ?string $branchName;
    public ?string $scheduledPickupDisplay;
    public ?string $scheduledPickupIso;
    public ?string $prepStartIso;
    public bool $isOverdue;
    public int $overdueMinutes;
    public float $totalAmount;
    public int $itemsCount;
    public string $type;
    public string $fulfillmentType;
    public bool $isPickup;
    public string $url;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order)
    {
        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $order->loadMissing(['branch', 'items']);

        $this->orderId = (int) $order->id;
        $this->orderNumber = (string) ($order->order_number ?? "ORD-{$order->id}");
        $this->customerName = (string) ($order->customer_name ?? 'Customer');
        $this->branchId = $order->branch_id ? (int) $order->branch_id : null;
        $this->branchName = $order->branch?->name;

        $pickupAt = $order->scheduled_pickup_at ? Carbon::parse($order->scheduled_pickup_at) : null;
        $prepAt = $order->prep_start_at ? Carbon::parse($order->prep_start_at) : null;
        $now = Carbon::now($tz);

        $this->scheduledPickupDisplay = $pickupAt ? $pickupAt->copy()->setTimezone($tz)->format('M d, Y • g:i A') : 'ASAP';
        $this->scheduledPickupIso = $pickupAt?->toIso8601String();
        $this->prepStartIso = $prepAt?->toIso8601String();

        $prepTimeLocal = $prepAt ? $prepAt->copy()->setTimezone($tz) : null;
        $diffMin = $prepTimeLocal ? (int) $prepTimeLocal->diffInMinutes($now, false) : 0;
        $this->isOverdue = $diffMin > 5;
        $this->overdueMinutes = max(0, $diffMin);

        $this->totalAmount = (float) $order->total_amount;
        $this->itemsCount = $order->items ? $order->items->count() : 0;
        $this->type = 'pickup_prep_due';
        $this->fulfillmentType = 'pickup';
        $this->isPickup = true;
        $this->url = "/pickups?order_id={$order->id}&order_number=" . urlencode($this->orderNumber);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('admin.orders'),
            new PrivateChannel('orders'),
        ];

        if ($this->branchId) {
            $channels[] = new PrivateChannel("branch.{$this->branchId}.orders");
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'PickupPrepDue';
    }

    /**
     * Data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id'                       => 'prep_' . $this->orderId,
            'order_id'                 => $this->orderId,
            'order_number'             => $this->orderNumber,
            'customer_name'            => $this->customerName,
            'branch_id'                => $this->branchId,
            'branch_name'              => $this->branchName,
            'scheduled_pickup_display' => $this->scheduledPickupDisplay,
            'scheduled_pickup_at'      => $this->scheduledPickupIso,
            'prep_start_at'            => $this->prepStartIso,
            'is_overdue'               => $this->isOverdue,
            'overdue_minutes'          => $this->overdueMinutes,
            'total_amount'             => $this->totalAmount,
            'items_count'              => $this->itemsCount,
            'type'                     => $this->type,
            'fulfillment_type'         => $this->fulfillmentType,
            'is_pickup'                => $this->isPickup,
            'url'                      => $this->url,
            'title'                    => $this->isOverdue 
                                            ? "⚠️ Prep Overdue: #{$this->orderNumber}" 
                                            : "🍳 Time to Prepare: #{$this->orderNumber}",
            'message'                  => "Pickup scheduled for {$this->scheduledPickupDisplay}. Start preparing now!",
        ];
    }
}
