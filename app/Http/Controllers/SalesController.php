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
                $query->where('branch_id', $branchId);
            }
            $statsScope = new Sale();
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
        
        // Authorization check: Admin can update anything, Cashier only their own
        if (!$user->isAdmin() && $sale->user_id !== $user->id) {
            abort(403, 'Unauthorized access to this sale record.');
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,completed,cancelled',
        ]);

        $sale->update($validated);

        return back()->with('success', "Order #{$sale->order_number} status updated to {$validated['status']}");
    }
}
