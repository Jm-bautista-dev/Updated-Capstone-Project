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
        $rawBranchId = $request->input('branch_id');
        $branchId = ($rawBranchId === '' || $rawBranchId === 'all' || $rawBranchId === null) ? null : $rawBranchId;

        $query = Sale::with(['items.product', 'cashier', 'branch', 'delivery.rider', 'order'])
            ->when($status && $status !== 'all', function ($q) use ($status) {
                return $q->where('status', $status);
            })
            ->when($search, function ($q) use ($search) {
                return $q->where(function ($sub) use ($search) {
                    $sub->where('order_number', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%")
                        ->orWhereHas('delivery', function ($dq) use ($search) {
                            $dq->where('customer_name', 'like', "%{$search}%")
                               ->orWhere('customer_phone', 'like', "%{$search}%")
                               ->orWhere('tracking_no', 'like', "%{$search}%");
                        })
                        ->orWhereHas('order', function ($oq) use ($search) {
                            $oq->where('customer_name', 'like', "%{$search}%")
                               ->orWhere('contact_number', 'like', "%{$search}%");
                        });
                });
            });

        // Scope the main query and stats
        if (!$user->isAdmin()) {
            // Cashier: all sales from their specific authorized branch (POS + delivered mobile orders)
            $query->where('branch_id', $user->branch_id);
            $statsScope = Sale::where('branch_id', $user->branch_id);
        } else {
            // Admin: sees ALL, optional branch filter
            if ($branchId) {
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
                'branch_id' => $branchId ? (string) $branchId : 'all',
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
        
        // Authorization check: Admin can update any, Cashier only their authorized branch
        if (!$user->isAdmin() && (int)$sale->branch_id !== (int)$user->branch_id) {
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

            // Sync linked Order status if present
            if ($validated['status'] === 'cancelled' && $sale->order_id) {
                $order = \App\Models\Order::find($sale->order_id);
                if ($order && $order->status !== 'cancelled') {
                    $order->update([
                        'status'       => 'cancelled',
                        'cancelled_at' => now(),
                    ]);
                }
            }

            // Sync linked Delivery status if present & broadcast real-time event
            /** @var \App\Models\Delivery|null $delivery */
            $delivery = \App\Models\Delivery::where('sale_id', $sale->id)->orWhere('order_id', $sale->order_id)->first();
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

    public function exportSummary(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        try {
            $dateRange = $this->resolveExportDateRange($request);
            $query     = $this->buildScopedSalesExportQuery($request, $dateRange);

            $sales = (clone $query)->get();
            $count = $sales->count();
            $totalAmount = (float) $sales->sum('total');
            $subtotalAmount = 0.0;
            $deliveryFeeAmount = 0.0;

            foreach ($sales as $s) {
                $fee = (float) ($s->delivery_fee ?? $s->delivery?->delivery_fee ?? 0.0);
                $deliveryFeeAmount += $fee;
                if ($s->subtotal !== null) {
                    $subtotalAmount += (float) $s->subtotal;
                } elseif ($s->items && $s->items->isNotEmpty()) {
                    $subtotalAmount += (float) $s->items->sum('subtotal');
                } else {
                    $subtotalAmount += max(0.0, (float) $s->total - $fee);
                }
            }

            $branchName = 'All Branches';
            $branchId   = $request->input('branch_id');
            if (!$user->isAdmin()) {
                $branchName = $user->branch?->name ?? 'My Branch';
            } elseif ($branchId && $branchId !== 'all') {
                $b = Branch::find((int) $branchId);
                if ($b) $branchName = $b->name;
            }

            return response()->json([
                'success'             => true,
                'preset'              => $dateRange['preset'],
                'label'               => $dateRange['label'],
                'from'                => $dateRange['from']->format('Y-m-d H:i:s'),
                'to'                  => $dateRange['to']->format('Y-m-d H:i:s'),
                'count'               => $count,
                'subtotal_amount'     => round($subtotalAmount, 2),
                'delivery_fee_amount' => round($deliveryFeeAmount, 2),
                'total_amount'        => round($totalAmount, 2),
                'branch_name'         => $branchName,
                'status'              => $request->input('status', 'all'),
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json(['error' => collect($ve->errors())->flatten()->first()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to calculate export summary: ' . $e->getMessage()], 500);
        }
    }

    public function exportCsv(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $dateRange = $this->resolveExportDateRange($request);
        $query     = $this->buildScopedSalesExportQuery($request, $dateRange);

        $branchSlug = 'all';
        $branchId   = $request->input('branch_id');
        if (!$user->isAdmin()) {
            $branchSlug = \Illuminate\Support\Str::slug($user->branch?->name ?? 'my_branch');
        } elseif ($branchId && $branchId !== 'all') {
            $b = Branch::find((int) $branchId);
            if ($b) $branchSlug = \Illuminate\Support\Str::slug($b->name);
        }

        $filename = "sales_{$branchSlug}_{$dateRange['slug']}.csv";

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($query) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'Order Number',
                'Transaction ID',
                'Date & Time',
                'Branch',
                'Cashier',
                'Order Type',
                'Payment Method',
                'Product Subtotal (PHP)',
                'Delivery Fee (PHP)',
                'Total Amount Paid (PHP)',
                'Status',
                'Line Items Count',
                'Items Detail',
            ]);

            $query->orderBy('created_at', 'desc')->chunk(500, function ($sales) use ($handle) {
                foreach ($sales as $sale) {
                    $itemDetails = [];
                    if ($sale->items) {
                        foreach ($sale->items as $item) {
                            $pName = $item->product?->name ?? 'Item';
                            $qty   = $item->quantity ?? 1;
                            $price = number_format((float) ($item->subtotal ?? ($item->price * $qty)), 2, '.', '');
                            $itemDetails[] = "{$qty}x {$pName} (PHP {$price})";
                        }
                    }
                    $itemsString = implode('; ', $itemDetails);

                    $deliveryFee = (float) ($sale->delivery_fee ?? $sale->delivery?->delivery_fee ?? 0.0);
                    if ($sale->subtotal !== null) {
                        $productSubtotal = (float) $sale->subtotal;
                    } elseif ($sale->items && $sale->items->isNotEmpty()) {
                        $productSubtotal = (float) $sale->items->sum('subtotal');
                    } else {
                        $productSubtotal = max(0.0, (float) $sale->total - $deliveryFee);
                    }

                    fputcsv($handle, [
                        $sale->order_number,
                        $sale->id,
                        $sale->created_at ? $sale->created_at->format('Y-m-d H:i:s') : '',
                        $sale->branch?->name ?? 'Main Branch',
                        $sale->cashier?->name ?? 'Staff',
                        $sale->type ?? 'In-Store',
                        $sale->payment_method ?? 'Cash',
                        number_format($productSubtotal, 2, '.', ''),
                        number_format($deliveryFee, 2, '.', ''),
                        number_format((float) $sale->total, 2, '.', ''),
                        ucfirst($sale->status ?? ''),
                        $sale->items ? $sale->items->count() : 0,
                        $itemsString,
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->streamDownload($callback, $filename, $headers);
    }

    private function resolveExportDateRange(Request $request): array
    {
        $tz = config('app.timezone', 'Asia/Manila');
        $now = \Carbon\Carbon::now($tz);
        $preset = $request->input('date_preset', 'today');

        switch ($preset) {
            case '7_days':
                $from = $now->copy()->subDays(6)->startOfDay();
                $to   = $now->copy()->endOfDay();
                $label = 'Last 7 Days (' . $from->format('M d, Y') . ' – ' . $to->format('M d, Y') . ')';
                $slug = 'last_7_days';
                break;
            case '30_days':
                $from = $now->copy()->subDays(29)->startOfDay();
                $to   = $now->copy()->endOfDay();
                $label = 'Last 30 Days (' . $from->format('M d, Y') . ' – ' . $to->format('M d, Y') . ')';
                $slug = 'last_30_days';
                break;
            case '1_year':
                $from = $now->copy()->subYear()->startOfDay();
                $to   = $now->copy()->endOfDay();
                $label = 'Last 1 Year (' . $from->format('M d, Y') . ' – ' . $to->format('M d, Y') . ')';
                $slug = 'last_1_year';
                break;
            case 'custom':
                $dateFromInput = $request->input('date_from');
                $dateToInput   = $request->input('date_to');

                if (!$dateFromInput || !$dateToInput) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'date_from' => 'Both start and end dates are required for custom range.',
                    ]);
                }

                $from = \Carbon\Carbon::parse($dateFromInput, $tz)->startOfDay();
                $to   = \Carbon\Carbon::parse($dateToInput, $tz)->endOfDay();

                if ($from->gt($to)) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'date_from' => 'Start date must be earlier than or equal to the end date.',
                    ]);
                }

                $label = 'Custom Range (' . $from->format('M d, Y') . ' – ' . $to->format('M d, Y') . ')';
                $slug = $from->format('Y-m-d') . '_to_' . $to->format('Y-m-d');
                break;
            case 'today':
            default:
                $preset = 'today';
                $from = $now->copy()->startOfDay();
                $to   = $now->copy()->endOfDay();
                $label = 'Today (' . $from->format('M d, Y') . ')';
                $slug = 'today';
                break;
        }

        return [
            'preset' => $preset,
            'from'   => $from,
            'to'     => $to,
            'label'  => $label,
            'slug'   => $slug,
        ];
    }

    private function buildScopedSalesExportQuery(Request $request, array $dateRange)
    {
        $user     = Auth::user();
        $status   = $request->input('status', 'all');
        $search   = $request->input('search', '');
        $branchId = $request->input('branch_id');

        $query = Sale::with(['items.product', 'cashier', 'branch'])
            ->whereBetween('created_at', [$dateRange['from'], $dateRange['to']])
            ->when($status && $status !== 'all', function ($q) use ($status) {
                return $q->where('status', $status);
            })
            ->when($search, function ($q) use ($search) {
                return $q->where('order_number', 'like', "%{$search}%");
            });

        if (!$user->isAdmin()) {
            $query->where('branch_id', $user->branch_id);
        } else {
            if ($branchId && $branchId !== 'all') {
                $query->where('branch_id', (int) $branchId);
            }
        }

        return $query;
    }
}
