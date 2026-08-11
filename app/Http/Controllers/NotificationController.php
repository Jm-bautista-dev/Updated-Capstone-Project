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

        // 1. Fetch Order Notifications (Scoped by Branch)
        $orderQuery = Order::with('branch')->latest();
        if (!$user->isAdmin()) {
            $orderQuery->where('branch_id', $user->branch_id);
        }

        $orderNotifications = $orderQuery->limit(10)->get()->map(function ($order) use ($user) {
            return [
                'id'              => 'order_' . $order->id,
                'order_id'        => $order->id,
                'employee_name'   => $order->customer_name,
                'action'          => 'Order',
                'ingredient_name' => "New Mobile Order #{$order->id}",
                'quantity_change' => '₱' . number_format((float)$order->total_amount, 2),
                'remaining'       => ucwords(str_replace('_', ' ', $order->status)),
                'source'          => 'Customer Mobile Order',
                'branch_name'     => $order->branch ? $order->branch->name : 'N/A',
                'created_at'      => $order->created_at->toIso8601String(),
                'time_ago'        => $order->created_at->diffForHumans(),
                'is_unread'       => $user->last_notifications_read_at ? $order->created_at->gt($user->last_notifications_read_at) : true,
                'type'            => 'new_order',
                'url'             => '/deliveries',
            ];
        });

        // 2. Fetch Ingredient Log Notifications
        $logQuery = IngredientLog::with(['ingredient', 'branch', 'user'])->latest();

        // Strict branch isolation: cashiers only see logs for their branch
        if (!$user->isAdmin()) {
            $logQuery->where('branch_id', $user->branch_id);
        }

        $logs = $logQuery->limit(10)->get()->map(function ($log) use ($user) {
            if (!$log->ingredient) return null;

            $isAlert = str_contains($log->reason, 'Stock Alert');

            // Find current stock for THIS branch
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
                'created_at'      => $log->created_at->toIso8601String(),
                'time_ago'        => $log->created_at->diffForHumans(),
                'is_unread'       => $user->last_notifications_read_at ? $log->created_at->gt($user->last_notifications_read_at) : true,
                'type'            => str_contains($log->reason, 'Out of Stock') ? 'out_of_stock' : (str_contains($log->reason, 'Low Stock') ? 'low_stock' : 'activity'),
                'url'             => '/inventory/activity',
            ];
        })->filter();

        // Combine and sort notifications by created_at descending
        $allNotifications = $orderNotifications->concat($logs)
            ->sortByDesc('created_at')
            ->values()
            ->take(15);

        $unreadCount = $allNotifications->where('is_unread', true)->count();

        return response()->json([
            'notifications' => $allNotifications,
            'unread_count' => $unreadCount,
        ]);
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
        $user->update([
            'last_notifications_read_at' => now(),
        ]);

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
