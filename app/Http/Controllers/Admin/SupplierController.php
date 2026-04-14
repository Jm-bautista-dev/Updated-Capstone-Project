<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Models\Ingredient;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * SupplierController
 *
 * Handles all CRUD operations for the Supplier Management module.
 * Uses Form Request validation, database transactions, eager loading,
 * and soft deletes for enterprise-grade data integrity.
 */
class SupplierController extends Controller
{
    /**
     * Display a paginated, searchable, filterable listing of suppliers.
     *
     * Supports:
     * - Server-side search (name, contact_person, email)
     * - Status filter (Active/Inactive)
     * - Branch filter
     * - Low-stock supplier filter (has ingredients below reorder level)
     * - Sorting by name, updated_at, or ingredients_count
     */
    public function index(Request $request)
    {
        $query = Supplier::with('branch')
            ->withCount('ingredients');

        // ── Search ──────────────────────────────────────────────
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // ── Status filter ───────────────────────────────────────
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // ── Branch filter ───────────────────────────────────────
        if ($request->filled('branch_id') && $request->input('branch_id') !== 'all') {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // ── Low-stock supplier filter ───────────────────────────
        // Only show suppliers who have at least one ingredient at or below reorder level (in their branch)
        if ($request->filled('low_stock') && $request->input('low_stock') === 'true') {
            $query->whereHas('ingredients', function ($q) {
                $q->whereHas('stocks', function ($sq) {
                    $sq->whereColumn('ingredient_stocks.branch_id', 'suppliers.branch_id')
                       ->whereColumn('ingredient_stocks.stock', '<=', 'ingredient_stocks.low_stock_level');
                });
            });
        }

        // ── Sorting ─────────────────────────────────────────────
        $sortField = $request->input('sort', 'updated_at');
        $sortDir   = $request->input('direction', 'desc');

        $allowedSorts = ['name', 'updated_at', 'ingredients_count', 'created_at'];
        if (!in_array($sortField, $allowedSorts)) {
            $sortField = 'updated_at';
        }
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortField, $sortDir);

        // ── Eager-load critical stock count per supplier ─────────
        // We use a subquery to count critical ingredients without N+1
        $query->withCount([
            'ingredients as critical_count' => function ($q) {
                $q->whereHas('stocks', function ($sq) {
                    $sq->whereColumn('ingredient_stocks.branch_id', 'suppliers.branch_id')
                       ->whereColumn('ingredient_stocks.stock', '<=', 'ingredient_stocks.low_stock_level');
                });
            },
        ]);

        $suppliers = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/Suppliers/Index', [
            'suppliers'   => $suppliers,
            'filters'     => $request->only(['search', 'status', 'branch_id', 'low_stock', 'sort', 'direction']),
            'branches'    => Branch::orderBy('name')->get(['id', 'name']),
            'ingredients' => Ingredient::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created supplier.
     * Uses StoreSupplierRequest for validation and DB::transaction for atomicity.
     */
    public function store(StoreSupplierRequest $request)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            $supplier = Supplier::create([
                'name'           => $validated['name'],
                'contact_person' => $validated['contact_person'],
                'email'          => $validated['email'],
                'phone'          => $validated['phone'] ?? null,
                'address'        => $validated['address'] ?? null,
                'status'         => $validated['status'],
                'branch_id'      => $validated['branch_id'],
                'created_by'     => Auth::id(),
                'updated_by'     => Auth::id(),
            ]);

            if (!empty($validated['ingredient_ids'])) {
                $supplier->ingredients()->sync($validated['ingredient_ids']);
            }
        });

        return back()->with('success', 'Supplier registered successfully.');
    }

    /**
     * Display the specified supplier with full relationship data.
     * Eager loads ingredients to prevent N+1 on the detail view.
     */
    public function show(Supplier $supplier)
    {
        $supplier->load(['branch', 'ingredients', 'creator', 'updater']);

        return Inertia::render('Admin/Suppliers/Show', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update the specified supplier.
     * Uses UpdateSupplierRequest and DB::transaction for atomicity + audit trail.
     */
    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $supplier) {
            $supplier->update([
                'name'           => $validated['name'],
                'contact_person' => $validated['contact_person'],
                'email'          => $validated['email'],
                'phone'          => $validated['phone'] ?? null,
                'address'        => $validated['address'] ?? null,
                'status'         => $validated['status'],
                'branch_id'      => $validated['branch_id'],
                'updated_by'     => Auth::id(),
            ]);

            $supplier->ingredients()->sync($validated['ingredient_ids'] ?? []);
        });

        return back()->with('success', 'Supplier updated successfully.');
    }

    /**
     * Soft-delete the specified supplier.
     * The record remains in the database for audit purposes.
     */
    public function destroy(Supplier $supplier)
    {
        $supplier->update(['updated_by' => Auth::id()]);
        $supplier->delete(); // SoftDeletes — sets deleted_at

        return back()->with('success', 'Supplier deactivated successfully.');
    }

    /**
     * Restore a soft-deleted supplier.
     */
    public function restore(int $id)
    {
        $supplier = Supplier::onlyTrashed()->findOrFail($id);
        $supplier->restore();
        $supplier->update([
            'status'     => 'Active',
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'Supplier restored successfully.');
    }
}
