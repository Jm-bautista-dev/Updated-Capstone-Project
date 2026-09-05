<?php

namespace App\Exports;

use App\Models\Sale;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SalesExport implements FromCollection, WithHeadings, WithMapping
{
    protected $filters;

    public function __construct($filters)
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        $user = auth()->user();
        $branchId = isset($this->filters['branch_id']) && $this->filters['branch_id'] !== 'all' && $this->filters['branch_id'] !== ''
            ? (int) $this->filters['branch_id']
            : null;

        return Sale::with(['cashier', 'branch', 'order.user', 'delivery', 'items.product'])
            ->when(!$user->isAdmin(), function ($q) use ($user) {
                return $q->where('branch_id', $user->branch_id);
            })
            ->when($branchId && $user->isAdmin(), fn($q) => $q->where('branch_id', $branchId))
            ->when($this->filters['date_from'] ?? null, fn($q) => $q->whereDate('created_at', '>=', $this->filters['date_from']))
            ->when($this->filters['date_to'] ?? null, fn($q) => $q->whereDate('created_at', '<=', $this->filters['date_to']))
            ->when(($this->filters['cashier_id'] ?? null) && $this->filters['cashier_id'] !== 'all' && $user->isAdmin(), fn($q) => $q->where('user_id', $this->filters['cashier_id']))
            ->when(($this->filters['status'] ?? null) && $this->filters['status'] !== 'all', fn($q) => $q->where('status', $this->filters['status']))
            ->latest()
            ->get();
    }

    public function headings(): array
    {
        $user = auth()->user();
        if ($user && $user->isAdmin()) {
            return [
                'Date',
                'Order Number',
                'Branch',
                'Cashier',
                'Customer',
                'Payment Method',
                'Order Type',
                'Subtotal',
                'Discount',
                'Delivery Fee',
                'Total',
                'Cost Total',
                'Profit',
                'Status',
            ];
        }

        return [
            'Date',
            'Order Number',
            'Branch',
            'Cashier',
            'Customer',
            'Payment Method',
            'Order Type',
            'Subtotal',
            'Discount',
            'Delivery Fee',
            'Total',
            'Status',
        ];
    }

    public function map($sale): array
    {
        $user = auth()->user();
        $deliveryFee = (float) ($sale->delivery_fee ?? $sale->delivery?->delivery_fee ?? 0.0);
        if ($sale->subtotal !== null) {
            $subtotal = (float) $sale->subtotal;
        } elseif ($sale->items && $sale->items->isNotEmpty()) {
            $subtotal = (float) $sale->items->sum('subtotal');
        } else {
            $subtotal = max(0.0, (float) $sale->total - $deliveryFee);
        }

        $dateFormatted = $sale->created_at ? $sale->created_at->format('Y-m-d H:i:s') : 'N/A';
        $branchName = $sale->branch?->name ?? 'N/A';
        $orderType = ucwords(str_replace(['-', '_'], ' ', $sale->type ?? 'In-Store'));
        $paymentMethod = ucfirst($sale->payment_method ?? 'Cash');

        if ($user && $user->isAdmin()) {
            return [
                $dateFormatted,
                $sale->order_number,
                $branchName,
                $sale->cashier_name,
                $sale->customer_name,
                $paymentMethod,
                $orderType,
                number_format($subtotal, 2, '.', ''),
                number_format((float) ($sale->discount ?? 0), 2, '.', ''),
                number_format($deliveryFee, 2, '.', ''),
                number_format((float) $sale->total, 2, '.', ''),
                number_format((float) ($sale->cost_total ?? 0), 2, '.', ''),
                number_format((float) ($sale->profit ?? 0), 2, '.', ''),
                ucfirst($sale->status ?? ''),
            ];
        }

        return [
            $dateFormatted,
            $sale->order_number,
            $branchName,
            $sale->cashier_name,
            $sale->customer_name,
            $paymentMethod,
            $orderType,
            number_format($subtotal, 2, '.', ''),
            number_format((float) ($sale->discount ?? 0), 2, '.', ''),
            number_format($deliveryFee, 2, '.', ''),
            number_format((float) $sale->total, 2, '.', ''),
            ucfirst($sale->status ?? ''),
        ];
    }
}
