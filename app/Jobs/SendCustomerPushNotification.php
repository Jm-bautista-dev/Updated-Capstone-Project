<?php

namespace App\Jobs;

use App\Models\CustomerDeviceToken;
use App\Models\CustomerNotification;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SendCustomerPushNotification
 *
 * Persists a CustomerNotification record and dispatches Expo push
 * notification(s) to all active device tokens belonging to the customer.
 *
 * Usage:
 *   SendCustomerPushNotification::dispatch(
 *       userId: $order->user_id,
 *       type:   'order_status',
 *       title:  'Order Update',
 *       body:   'Your order is on the way!',
 *       data:   ['order_id' => $order->id, 'status' => 'in_transit'],
 *       orderId: $order->id,
 *   );
 */
class SendCustomerPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Maximum Expo chunk size */
    private const EXPO_CHUNK_SIZE = 100;

    /** Expo Push API endpoint */
    private const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    public function __construct(
        public readonly int    $userId,
        public readonly string $type,
        public readonly string $title,
        public readonly string $body,
        public readonly array  $data      = [],
        public readonly ?int   $orderId   = null,
        public readonly ?string $eventId  = null,
    ) {
    }

    public function handle(): void
    {
        // ── 1. Resolve order metadata ───────────────────────────────────────
        $orderNumber = null;
        if ($this->orderId) {
            $orderNumber = Order::find($this->orderId)?->order_number;
        }

        // ── 2. Persist notification record ──────────────────────────────────
        CustomerNotification::create([
            'user_id'      => $this->userId,
            'type'         => $this->type,
            'order_id'     => $this->orderId,
            'order_number' => $orderNumber,
            'event_id'     => $this->eventId,
            'title'        => $this->title,
            'body'         => $this->body,
            'data'         => $this->data,
        ]);

        // ── 3. Collect active Expo push tokens ──────────────────────────────
        $tokens = CustomerDeviceToken::where('user_id', $this->userId)
            ->where('is_active', true)
            ->pluck('push_token')
            ->filter(fn(string $t) => str_starts_with($t, 'ExponentPushToken[') || str_starts_with($t, 'ExpoPushToken['))
            ->values()
            ->all();

        if (empty($tokens)) {
            // No Expo tokens — notification persisted in DB, nothing more to do
            return;
        }

        // ── 4. Build Expo messages ───────────────────────────────────────────
        $messages = array_map(fn(string $token) => [
            'to'    => $token,
            'sound' => 'default',
            'title' => $this->title,
            'body'  => $this->body,
            'data'  => array_merge($this->data, [
                'type'         => $this->type,
                'order_id'     => $this->orderId,
                'order_number' => $orderNumber,
                'event_id'     => $this->eventId,
            ]),
            'channelId' => 'default',
            '_displayInForeground' => true,
        ], $tokens);

        // ── 5. Chunk and send to Expo API ────────────────────────────────────
        foreach (array_chunk($messages, self::EXPO_CHUNK_SIZE) as $chunk) {
            try {
                $response = Http::withHeaders([
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                    'Accept-Encoding' => 'gzip, deflate',
                ])->timeout(15)->post(self::EXPO_PUSH_URL, $chunk);

                $responseData = $response->json();

                if (!$response->successful()) {
                    Log::warning('Expo push send failed', [
                        'user_id' => $this->userId,
                        'status'  => $response->status(),
                        'body'    => $responseData,
                    ]);
                } else {
                    // Check for individual ticket errors
                    $tickets = $responseData['data'] ?? [];
                    foreach ($tickets as $index => $ticket) {
                        if (($ticket['status'] ?? '') === 'error') {
                            $details = $ticket['details'] ?? [];
                            // Deactivate invalid token to prevent future failures
                            if (($details['error'] ?? '') === 'DeviceNotRegistered') {
                                CustomerDeviceToken::where('user_id', $this->userId)
                                    ->where('push_token', $chunk[$index]['to'] ?? '')
                                    ->update(['is_active' => false]);

                                Log::info('Deactivated invalid push token', [
                                    'user_id' => $this->userId,
                                    'token'   => $chunk[$index]['to'] ?? 'unknown',
                                ]);
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Expo push exception', [
                    'user_id' => $this->userId,
                    'error'   => $e->getMessage(),
                ]);
                // Don't rethrow — DB record is already saved, push is best-effort
            }
        }
    }

    /**
     * Convenience static factory for common order status notifications.
     * Dispatches the job and returns the dispatched PendingDispatch.
     */
    public static function forOrderStatus(
        int    $userId,
        int    $orderId,
        string $status,
        string $orderNumber = '',
        array  $extra       = []
    ): void {
        $messages = [
            'pending'            => ['🕐 Order Received',          'Your order has been received and is being prepared.'],
            'confirmed'          => ['✅ Order Confirmed',          'Your order has been confirmed by the branch.'],
            'ready_for_pickup'   => ['🛵 Rider on the Way',        'A rider has been assigned and is heading to you.'],
            'picked_up'          => ['📦 Order Picked Up',         'Your order has been picked up by the rider.'],
            'in_transit'         => ['🚀 Out for Delivery',        'Your order is on the way!'],
            'delivered'          => ['🎉 Order Delivered',         'Your order has been delivered. Enjoy!'],
            'cancelled'          => ['❌ Order Cancelled',         'Your order has been cancelled.'],
            'cancellation_requested' => ['⚠️ Cancellation Requested', 'The rider has requested a cancellation for your order.'],
        ];

        [$title, $body] = $messages[$status] ?? ['📦 Order Update', 'Your order status has been updated.'];

        $body = $orderNumber ? "Order #{$orderNumber}: {$body}" : $body;

        static::dispatch(
            userId:   $userId,
            type:     'order_status',
            title:    $title,
            body:     $body,
            data:     array_merge(['order_id' => $orderId, 'status' => $status], $extra),
            orderId:  $orderId,
            eventId:  "order_{$orderId}_{$status}",
        );
    }
}
