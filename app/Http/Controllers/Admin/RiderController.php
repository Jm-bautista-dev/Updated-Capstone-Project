<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RiderController extends Controller
{
    public function index(Request $request)
    {
        $query = Rider::with('branch')->withCount('deliveries');

        if ($request->filled('branch_id') && $request->input('branch_id') !== 'all') {
            $query->where('branch_id', $request->input('branch_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $riders = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Riders/Index', [
            'riders'   => $riders,
            'filters'  => $request->only(['branch_id', 'status', 'search']),
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'phone'     => ['nullable', 'string', 'max:20', 'regex:/^[\+]?[0-9\s\-\(\)]{7,20}$/'],
            'branch_id' => 'required|exists:branches,id',
            'status'    => 'required|in:available,busy,offline',
        ]);

        Rider::create($validated);

        return back()->with('success', 'Rider added successfully.');
    }

    public function update(Request $request, Rider $rider)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'phone'     => ['nullable', 'string', 'max:20', 'regex:/^[\+]?[0-9\s\-\(\)]{7,20}$/'],
            'branch_id' => 'required|exists:branches,id',
            'status'    => 'required|in:available,busy,offline',
        ]);

        $rider->update($validated);

        return back()->with('success', 'Rider updated successfully.');
    }

    public function destroy(Rider $rider)
    {
        $rider->delete();
        return back()->with('success', 'Rider removed successfully.');
    }

    /**
     * Returns available riders for a branch (used by POS AJAX).
     */
    public function available(Request $request)
    {
        $request->validate(['branch_id' => 'required|exists:branches,id']);

        $riders = Rider::where('branch_id', $request->input('branch_id'))
            ->available()
            ->get(['id', 'name', 'phone']);

        return response()->json($riders);
    }
}
