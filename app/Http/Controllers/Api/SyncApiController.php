<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RestockRequest;
use App\Models\InventoryLog;
use App\Models\User;
use App\Services\SaleService;
use App\Services\InventoryService;
use App\Services\SyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Utils\UnitConverter;
use Illuminate\Validation\Rule;

class SyncApiController extends Controller
{
    protected SaleService $saleService;
    protected InventoryService $inventoryService;
    protected SyncService $syncService;

    public function __construct(
        SaleService $saleService,
        InventoryService $inventoryService,
        SyncService $syncService
    ) {
        $this->saleService = $saleService;
        $this->inventoryService = $inventoryService;
        $this->syncService = $syncService;
    }

    /**
     * Resolve product by barcode.
     */
    public function resolveBarcode(string $barcode)
    {
        /** @var User|null $user */
        $user = Auth::user();
        $branchId = $user?->branch_id;

        $query = Product::with(['category', 'ingredients']);

        if ($branchId && $user && !$user->isAdmin()) {
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id')
                  ->orWhereHas('branches', function ($bq) use ($branchId) {
                      $bq->where('branches.id', $branchId);
                  });
            });
        }

        $product = $query->where('barcode', $barcode)->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found with the scanned barcode.'
            ], 404);
        }

        // Add calculated availability
        $availability = $product->dynamicAvailability($branchId ?: $product->branch_id);
        $product->stock = $availability['available'];
        $product->is_available = $availability['is_available'];
        $product->is_direct = !$product->hasRecipe();

        return response()->json([
            'success' => true,
            'product' => $product
        ]);
    }

    /**
     * Process direct transaction sale.
     */
    public function storeSale(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type'             => 'required|string',
            'items'            => 'required|array|min:1',
            'items.*.id'       => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'total'            => 'nullable|numeric',
            'payment_method'   => 'required|string',
            'paid_amount'      => 'required|numeric|min:0',
            'change_amount'    => 'nullable|numeric',
            'discount'         => 'nullable|numeric|min:0',
            'discount_type'    => 'nullable|string|max:100',
            'discount_details' => 'nullable|array',
            'delivery_info'    => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->all();
            $data['order_number'] = 'POS-' . strtoupper(uniqid());
            $data['status'] = 'completed';

            $sale = $this->saleService->processSale($data);

            // Log Product Inventory
            $user = Auth::user();
            foreach ($data['items'] as $item) {
                InventoryLog::create([
                    'product_id' => $item['id'],
                    'user_id' => $user->id,
                    'action_type' => 'SALE',
                    'quantity' => $item['quantity'],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order processed successfully.',
                'sale' => $sale->load('items.product')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Process direct inventory update (stock-in or wastage).
     */
    public function updateInventory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type'           => 'required|in:ingredient,product',
            'id'             => 'required|integer',
            'branch_id'      => 'required|exists:branches,id',
            'action'         => 'required|in:IN,OUT',
            'quantity'       => 'required|numeric|gt:0|max:1000000',
            'unit'           => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'reason'         => 'required_if:action,OUT|nullable|string',
            'notes'          => 'nullable|string|max:500',
            'purchase_price' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $isAdmin = $user->role === 'admin';

        if (!$isAdmin && (int) $request->branch_id !== (int) $user->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update inventory for your own branch.'
            ], 403);
        }

        try {
            $action = $request->action;
            if ($action === 'IN') {
                $result = $this->inventoryService->stockIn(
                    $request->type,
                    (int) $request->id,
                    (float) $request->quantity,
                    $request->unit,
                    (int) $request->branch_id,
                    (float) ($request->purchase_price ?? 0)
                );

                if ($request->type === 'product') {
                    InventoryLog::create([
                        'product_id' => $request->id,
                        'user_id' => $user->id,
                        'action_type' => 'RESTOCK',
                        'quantity' => $request->quantity,
                    ]);
                }
            } else {
                $result = $this->inventoryService->logWastage(
                    $request->type,
                    (int) $request->id,
                    (float) $request->quantity,
                    $request->unit,
                    $request->reason ?? 'other',
                    $request->notes ?? '',
                    (int) $request->branch_id
                );

                if ($request->type === 'product') {
                    InventoryLog::create([
                        'product_id' => $request->id,
                        'user_id' => $user->id,
                        'action_type' => 'ADJUSTMENT',
                        'quantity' => -$request->quantity,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Inventory adjusted successfully.',
                'result' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Create restock request.
     */
    public function requestRestock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|exists:branches,id',
            'item_type' => 'required|in:ingredient,product',
            'item_id'   => 'required|integer',
            'quantity'  => 'required|numeric|gt:0',
            'unit'      => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        /** @var User|null $user */
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }
        if (!$user->isAdmin() && (int) $request->branch_id !== (int) $user->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only request restocks for your own branch.'
            ], 403);
        }

        try {
            $restock = RestockRequest::create([
                'branch_id' => $request->branch_id,
                'user_id'   => $user->id,
                'item_type' => $request->item_type,
                'item_id'   => $request->item_id,
                'quantity'  => $request->quantity,
                'unit'      => $request->unit,
                'status'    => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Restock request submitted successfully.',
                'restock' => $restock
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Sync background operations batch.
     */
    public function sync(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'operations' => 'required|array',
            'operations.*.id' => 'required|string',
            'operations.*.type' => 'required|in:SALE,INVENTORY_UPDATE,RESTOCK',
            'operations.*.payload' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $results = $this->syncService->syncBatch($request->operations);

            return response()->json([
                'success' => true,
                'synced' => $results['synced'],
                'conflicts' => $results['conflicts']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
