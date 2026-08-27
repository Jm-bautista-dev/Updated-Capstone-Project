<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerDeviceToken;
use App\Models\CustomerNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerNotificationController extends Controller
{
    /**
     * POST /v1/customer/device-token
     * POST /v1/notifications/push-token
     * Register or refresh a push notification device token.
     */
    public function registerDeviceToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'push_token'  => 'required|string|max:255',
            'platform'    => 'nullable|string|in:android,ios,web',
            'device_name' => 'nullable|string|max:100',
        ]);

        CustomerDeviceToken::updateOrCreate(
            [
                'user_id'    => $request->user()->id,
                'push_token' => $validated['push_token'],
            ],
            [
                'platform'     => $validated['platform'] ?? 'android',
                'device_name'  => $validated['device_name'] ?? 'Mobile Device',
                'is_active'    => true,
                'last_seen_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Device token registered.',
        ]);
    }

    /**
     * POST /v1/notifications/push-token/remove
     * Deactivate / delete a push token (on logout).
     */
    public function removeDeviceToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'push_token' => 'required|string',
        ]);

        CustomerDeviceToken::where('user_id', $request->user()->id)
            ->where('push_token', $validated['push_token'])
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Device token removed.',
        ]);
    }

    /**
     * GET /v1/customer/notifications
     * Paginated notification ledger for the authenticated customer.
     */
    public function index(Request $request): JsonResponse
    {
        $user    = $request->user();
        $perPage = min((int) $request->get('per_page', 20), 50);

        $notifications = CustomerNotification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $unreadCount = CustomerNotification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success'      => true,
            'data'         => $notifications->items(),
            'unread_count' => $unreadCount,
            'current_page' => $notifications->currentPage(),
            'last_page'    => $notifications->lastPage(),
            'total'        => $notifications->total(),
        ]);
    }

    /**
     * GET /v1/customer/notifications/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = CustomerNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success'      => true,
            'unread_count' => $count,
        ]);
    }

    /**
     * POST /v1/customer/notifications/{id}/read
     * Mark a single notification as read (supports both id and uuid).
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = CustomerNotification::where('user_id', $request->user()->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('uuid', $id);
            })
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    /**
     * POST /v1/customer/notifications/read-all
     * Mark every unread notification as read for this user.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        CustomerNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }
}
