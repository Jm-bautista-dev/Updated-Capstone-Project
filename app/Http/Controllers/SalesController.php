<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SalesController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->input('status', 'all');
        $search = $request->input('search', '');

        $query = Sale::with(['items.product', 'cashier'])
            ->when($status !== 'all', function ($q) use ($status) {
                return $q->where('status', $status);
            })
            ->when($search, function ($q) use ($search) {
                return $q->where('order_number', 'like', "%{$search}%");
            })
            ->latest();

        // If cashier, only show their own sales
        if (Auth::user()->role === 'cashier') {
            $query->where('user_id', Auth::id());
        }

        return Inertia::render('Sales/Index', [
            'sales' => $query->paginate(15)->withQueryString(),
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'stats' => [
                'pending' => Sale::where('status', 'pending')->count(),
                'preparing' => Sale::where('status', 'preparing')->count(),
                'completed_today' => Sale::where('status', 'completed')->whereDate('created_at', today())->count(),
            ]
        ]);
    }

    public function updateStatus(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,completed,cancelled',
        ]);

        $sale->update($validated);

        return back()->with('success', "Order #{$sale->order_number} status updated to {$validated['status']}");
    }
}
