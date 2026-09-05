<?php

namespace App\Http\Controllers;

use App\Models\IngredientLog;
use App\Models\IngredientStock;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Branch;
use App\Models\User;

class NotificationController extends Controller
{
    /**
     * Get recent notifications for the bell dropdown.
     */
    public function index()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'notifications' => [],
                'unread_count'  => 0,
            ]);
        }

        $isAdmin = method_exists($user, 'isAdmin') ? $user->isAdmin() : (($user->role ?? '') === 'admin');

        // 1. Fetch individual notification streams
        $orderNotifications        = $this->fetchOrderNotifications($user, $isAdmin);
        $cancellationNotifications = $this->fetchCancellationNotifications($user, $isAdmin);
        $ingredientNotifications   = $this->fetchIngredientNotifications($user, $isAdmin);

        // 2. Combine and sort notifications by created_at descending
        $allNotifications = $orderNotifications->concat($cancellationNotifications)->concat($ingredientNotifications)
            ->sortByDesc('created_at')
            ->values()
            ->take(15);

        $unreadCount = $allNotifications->where('is_unread', true)->count();

        return response()->json([
            'notifications' => $allNotifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    /**
     * Fetch order notification stream.
     */
    private function fetchOrderNotifications($user, bool $isAdmin)
    {
        try {
            $orderQuery = Order::with('branch')->latest();
            if (!$isAdmin && isset($user->branch_id)) {
                $orderQuery->where('branch_id', $user->branch_id);
            }

            return $orderQuery->limit(10)->get()->map(function ($order) use ($user) {
                $orderNum = $order->order_number ?? ("ORD-" . $order->id);
                return [
                    'id'              => 'order_' . $order->id,
                    'order_id'        => $order->id,
                    'order_number'    => $orderNum,
                    'employee_name'   => $order->customer_name,
                    'action'          => 'Order',
                    'ingredient_name' => $orderNum,
                    'quantity_change' => '₱' . number_format((float)$order->total_amount, 2),
                    'remaining'       => ucwords(str_replace('_', ' ', $order->status ?? '')),
                    'source'          => 'Customer Mobile Order',
                    'branch_name'     => $order->branch ? $order->branch->name : 'N/A',
                    'created_at'      => $order->created_at ? $order->created_at->toIso8601String() : now()->toIso8601String(),
                    'time_ago'        => $order->created_at ? $order->created_at->diffForHumans() : 'Just now',
                    'is_unread'       => $user->last_notifications_read_at && $order->created_at ? $order->created_at->gt($user->last_notifications_read_at) : true,
                    'type'            => 'new_order',
                    'url'             => '/deliveries',
                ];
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed fetching order notifications: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * Fetch pending cancellation request notification stream.
     */
    private function fetchCancellationNotifications($user, bool $isAdmin)
    {
        try {
            if (!class_exists(\App\Models\OrderCancellationRequest::class)) {
                return collect();
            }

            $cancellationReqQuery = \App\Models\OrderCancellationRequest::with(['order.branch', 'requestedByRider', 'branch'])
                ->where('status', 'pending')
                ->latest('requested_at');

            if (!$isAdmin && isset($user->branch_id)) {
                $cancellationReqQuery->where('branch_id', $user->branch_id);
            }

            return $cancellationReqQuery->limit(10)->get()->map(function ($req) use ($user) {
                $orderNum = $req->order?->order_number ?? ("ORD-" . $req->order_id);
                return [
                    'id'                      => 'cancel_req_' . $req->id,
                    'cancellation_request_id' => $req->id,
                    'order_id'                => $req->order_id,
                    'order_number'            => $orderNum,
                    'employee_name'           => $req->requestedByRider?->name ?? 'Rider',
                    'action'                  => 'Alert',
                    'ingredient_name'         => "Cancellation Request #{$orderNum}",
                    'quantity_change'         => $req->reason,
                    'remaining'               => 'Pending Approval',
                    'source'                  => 'Rider Cancellation Request',
                    'branch_name'             => $req->branch?->name ?? $req->order?->branch?->name ?? 'N/A',
                    'created_at'              => $req->requested_at ? $req->requested_at->toIso8601String() : now()->toIso8601String(),
                    'time_ago'                => $req->requested_at ? $req->requested_at->diffForHumans() : 'Just now',
                    'is_unread'               => $user->last_notifications_read_at && $req->requested_at ? $req->requested_at->gt($user->last_notifications_read_at) : true,
                    'type'                    => 'cancellation_request',
                    'url'                     => "/deliveries?order_id={$req->order_id}",
                ];
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed fetching cancellation request notifications: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * Fetch ingredient log and low stock notification stream.
     */
    private function fetchIngredientNotifications($user, bool $isAdmin)
    {
        try {
            $logQuery = IngredientLog::with(['ingredient', 'branch', 'user'])->latest();

            if (!$isAdmin && isset($user->branch_id)) {
                $logQuery->where('branch_id', $user->branch_id);
            }

            return $logQuery->limit(10)->get()->map(function ($log) use ($user) {
                if (!$log->ingredient) return null;

                $isAlert = str_contains($log->reason ?? '', 'Stock Alert');

                $currentStock = 0;
                if ($log->branch_id) {
                    $stockRow = IngredientStock::where('ingredient_id', $log->ingredient_id)
                        ->where('branch_id', $log->branch_id)
                        ->first();
                    $currentStock = $stockRow ? $stockRow->stock : 0;
                }

                return [
                    'id'              => 'log_' . $log->id,
                    'employee_name'   => $log->user ? $log->user->name : 'System',
                    'action'          => $isAlert ? 'Alert' : ($log->change_qty > 0 ? 'Added' : 'Deducted'),
                    'ingredient_name' => $log->ingredient->name,
                    'quantity_change' => abs((float)$log->change_qty) . ' ' . $log->ingredient->unit,
                    'remaining'       => $currentStock . ' ' . $log->ingredient->unit,
                    'source'          => $log->reason,
                    'branch_name'     => $log->branch ? $log->branch->name : 'N/A',
                    'created_at'      => $log->created_at ? $log->created_at->toIso8601String() : now()->toIso8601String(),
                    'time_ago'        => $log->created_at ? $log->created_at->diffForHumans() : 'Just now',
                    'is_unread'       => $user->last_notifications_read_at && $log->created_at ? $log->created_at->gt($user->last_notifications_read_at) : true,
                    'type'            => str_contains($log->reason ?? '', 'Out of Stock') ? 'out_of_stock' : (str_contains($log->reason ?? '', 'Low Stock') ? 'low_stock' : 'activity'),
                    'url'             => '/inventory/activity',
                ];
            })->filter()->values();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed fetching ingredient log notifications: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * JSON API: Get activity logs for inventory page (avoids Inertia 409 version conflict).
     * Used by axios calls from Inventory/Index.tsx drawer and recent-activity panel.
     */
    public function activityLogs(Request $request)
    {
        $user = Auth::user();

        $query = IngredientLog::with(['ingredient', 'branch', 'user'])
            ->latest();

        // Branch visibility rules
        if (!$user->isAdmin()) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('ingredient_id')) {
            $query->where('ingredient_id', $request->ingredient_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $logs = $query->limit($request->input('limit', 50))->get()->map(function ($log) use ($user) {
            if (!$log->ingredient) return null;

            $currentStock = 0;
            if ($log->branch_id) {
                $stockRow = IngredientStock::where('ingredient_id', $log->ingredient_id)
                    ->where('branch_id', $log->branch_id)
                    ->first();
                $currentStock = $stockRow ? $stockRow->stock : 0;
            }

            $isAlert = str_contains($log->reason, 'Stock Alert');

            return [
                'id'               => $log->id,
                'ingredient_id'    => $log->ingredient_id,
                'branch_id'        => $log->branch_id,
                'employee_name'    => $log->user ? $log->user->name : 'System',
                'action'           => $isAlert ? 'Alert' : ($log->change_qty > 0 ? 'Added' : 'Deducted'),
                'ingredient_name'  => $log->ingredient->name,
                'quantity_change'  => abs((float)$log->change_qty) . ' ' . $log->ingredient->unit,
                'remaining'        => $currentStock . ' ' . $log->ingredient->unit,
                'source'           => $log->reason,
                'branch_name'      => $log->branch ? $log->branch->name : 'N/A',
                'created_at'       => $log->created_at->toIso8601String(),
                'time_ago'         => $log->created_at->diffForHumans(),
                'is_unread'        => $user->last_notifications_read_at
                    ? $log->created_at->gt($user->last_notifications_read_at)
                    : true,
                'type'             => str_contains($log->reason, 'Out of Stock')
                    ? 'out_of_stock'
                    : (str_contains($log->reason, 'Low Stock') ? 'low_stock' : 'activity'),
            ];
        })->filter()->values();

        return response()->json(['logs' => $logs]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAsRead()
    {
        $user = Auth::user();
        if ($user) {
            $user->update([
                'last_notifications_read_at' => now(),
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Show full inventory activity page.
     */
    public function activity(Request $request)
    {
        $user = Auth::user();
        
        $query = IngredientLog::with(['ingredient', 'branch', 'user'])
            ->latest();

        // Branch visibility rules
        if (!$user->isAdmin()) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        // Filters
        if ($request->filled('employee_id')) {
            $query->where('user_id', $request->employee_id);
        }

        if ($request->filled('ingredient_id')) {
            $query->where('ingredient_id', $request->ingredient_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $logs = $query->paginate(20)->withQueryString();

        return Inertia::render('Inventory/Activity', [
            'logs' => $logs,
            'branches' => $user->isAdmin() ? Branch::all() : [],
            'employees' => $user->isAdmin() ? User::all() : User::where('branch_id', $user->branch_id)->get(),
            'filters' => $request->only(['branch_id', 'employee_id', 'ingredient_id', 'date']),
        ]);
    }
}
