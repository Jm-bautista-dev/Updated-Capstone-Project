<?php

namespace App\Http\Controllers;

use App\Models\IngredientLog;
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
        
        $query = IngredientLog::with(['ingredient.branch', 'user'])
            ->latest();

        if (!$user->isAdmin()) {
            $query->whereHas('ingredient', function ($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }

        $logs = $query->limit(10)->get()->map(function ($log) use ($user) {
            if (!$log->ingredient) return null;

            $isAlert = str_contains($log->reason, 'Stock Alert');

            return [
                'id' => $log->id,
                'employee_name' => $log->user ? $log->user->name : 'System',
                'action' => $isAlert ? 'Alert' : ($log->change_qty > 0 ? 'Added' : 'Deducted'),
                'ingredient_name' => $log->ingredient->name,
                'quantity_change' => abs((float)$log->change_qty) . ' ' . $log->ingredient->unit,
                'remaining' => $log->ingredient->stock . ' ' . $log->ingredient->unit,
                'source' => $log->reason,
                'branch_name' => $log->ingredient->branch ? $log->ingredient->branch->name : 'N/A',
                'created_at' => $log->created_at->toIso8601String(),
                'time_ago' => $log->created_at->diffForHumans(),
                'is_unread' => $user->last_notifications_read_at ? $log->created_at->gt($user->last_notifications_read_at) : true,
                'type' => $log->reason === 'Out of Stock Alert' ? 'out_of_stock' : ($log->reason === 'Low Stock Alert' ? 'low_stock' : 'activity'),
            ];
        })->filter()->values();

        $unreadCount = $logs->where('is_unread', true)->count();

        return \response()->json([
            'notifications' => $logs,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAsRead()
    {
        $user = Auth::user();
        $user->update([
            'last_notifications_read_at' => \now(),
        ]);

        return \response()->json(['success' => true]);
    }

    /**
     * Show full inventory activity page.
     */
    public function activity(Request $request)
    {
        $user = Auth::user();
        
        $query = IngredientLog::with(['ingredient.branch', 'user'])
            ->latest();

        // Branch visibility rules
        if (!$user->isAdmin()) {
            $query->whereHas('ingredient', function ($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        } elseif ($request->filled('branch_id')) {
            $query->whereHas('ingredient', function ($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
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
