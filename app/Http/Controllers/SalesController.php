<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SalesController extends Controller
{
    public function index(Request $request)
    {
        $user     = Auth::user();
        $branches = Branch::orderBy('name')->get();
        $status   = $request->input('status', 'all');
        $search   = $request->input('search', '');
        $branchId = $request->input('branch_id');

        $query = Sale::with(['items.product', 'cashier', 'branch'])
            ->when($status !== 'all', function ($q) use ($status) {
                return $q->where('status', $status);
            })
            ->when($search, function ($q) use ($search) {
                return $q->where('order_number', 'like', "%{$search}%");
            });

        // Scope the main query and stats
        if (!$user->isAdmin()) {
            // Cashier: ONLY their own sales from their specific branch
            $query->where('user_id', $user->id)
                  ->where('branch_id', $user->branch_id);
            
            $statsScope = Sale::where('user_id', $user->id)
                              ->where('branch_id', $user->branch_id);
        } else {
            // Admin: sees ALL, optional branch filter
            if ($branchId && $branchId !== 'all') {
                $query->where('branch_id', (int) $branchId);
                $statsScope = Sale::where('branch_id', (int) $branchId);
            } else {
                $statsScope = Sale::query();
            }
        }

        return Inertia::render('Sales/Index', [
            'sales'    => $query->latest()->paginate(15)->withQueryString(),
            'branches' => $branches,
            'filters'  => [
                'status'    => $status,
                'search'    => $search,
                'branch_id' => $branchId,
            ],
            'isAdmin'  => $user->isAdmin(),
            'stats'    => [
                'pending'         => (clone $statsScope)->where('status', 'pending')->count(),
                'preparing'       => (clone $statsScope)->where('status', 'preparing')->count(),
                'completed_today' => (clone $statsScope)->where('status', 'completed')->whereDate('created_at', today())->count(),
            ],
        ]);
    }

    public function updateStatus(Request $request, Sale $sale)
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }
        
        // Authorization check: Admin can update any, Cashier only their branch or own sales
        if (!$user->isAdmin() && $sale->user_id !== $user->id && $sale->branch_id !== $user->branch_id) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'You are not authorized to modify this sale record.'], 403);
            }
            return back()->with('error', 'You are not authorized to modify this sale record.');
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,completed,cancelled',
        ]);

        $saleService = app(\App\Services\SaleService::class);
        $oldStatus = $sale->status;

        try {
            if ($validated['status'] === 'cancelled' && $sale->status !== 'cancelled') {
                $saleService->voidSale($sale);
            } else {
                $sale->update($validated);
            }

            // Sync linked Delivery status if present & broadcast real-time event
            /** @var \App\Models\Delivery|null $delivery */
            $delivery = \App\Models\Delivery::where('sale_id', $sale->id)->first();
            if ($delivery) {
                $mappedDeliveryStatus = match ($validated['status']) {
                    'pending'   => 'pending',
                    'preparing' => 'preparing',
                    'completed' => 'delivered',
                    'cancelled' => 'cancelled',
                    default     => $validated['status'],
                };
                $delivery->update(['status' => $mappedDeliveryStatus]);
                event(new \App\Events\OrderStatusUpdated($delivery->fresh(), 'cashier', $oldStatus));
            }

            $actionMessage = $validated['status'] === 'cancelled' 
                ? "Order #{$sale->order_number} has been voided and inventory restored."
                : "Order #{$sale->order_number} status updated to {$validated['status']}.";

            if ($request->wantsJson()) {
                return response()->json(['success' => true, 'message' => $actionMessage, 'sale' => $sale->fresh()]);
            }

            return back()->with('success', $actionMessage);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SalesController updateStatus error', [
                'sale_id' => $sale->id,
                'status'  => $validated['status'],
                'message' => $e->getMessage(),
            ]);

            if ($request->wantsJson()) {
                return response()->json(['error' => 'Failed to update order status: ' . $e->getMessage()], 422);
            }

            return back()->with('error', 'Failed to update order status: ' . $e->getMessage());
        }
    }
}
