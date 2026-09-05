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

        return Sale::with(['cashier', 'branch'])
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
                'Order Number',
                'Cashier',
                'Type',
                'Subtotal',
                'Discount',
                'Total',
                'Cost Total',
                'Profit',
                'Payment Method',
                'Status',
                'Date',
            ];
        }

        return [
            'Order Number',
            'Cashier',
            'Type',
            'Subtotal',
            'Discount',
            'Total',
            'Payment Method',
            'Status',
            'Date',
        ];
    }

    public function map($sale): array
    {
        $user = auth()->user();
        if ($user && $user->isAdmin()) {
            return [
                $sale->order_number,
                $sale->cashier->name ?? 'N/A',
                $sale->type,
                $sale->subtotal,
                $sale->discount ?? 0,
                $sale->total,
                $sale->cost_total,
                $sale->profit,
                $sale->payment_method,
                $sale->status,
                $sale->created_at->format('Y-m-d H:i:s'),
            ];
        }

        return [
            $sale->order_number,
            $sale->cashier->name ?? 'N/A',
            $sale->type,
            $sale->subtotal,
            $sale->discount ?? 0,
            $sale->total,
            $sale->payment_method,
            $sale->status,
            $sale->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
