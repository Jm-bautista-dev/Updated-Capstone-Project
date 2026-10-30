<?php

namespace App\Exports;

use App\Models\Sale;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Protection;

class SalesExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    protected $filters;

    public function __construct($filters)
    {
        $this->filters = $filters;
    }

    public function title(): string
    {
        return 'Sales Report';
    }

    public function collection()
    {
        $user = auth()->user();
        $branchId = isset($this->filters['branch_id']) && $this->filters['branch_id'] !== 'all' && $this->filters['branch_id'] !== ''
            ? (int) $this->filters['branch_id']
            : null;

        return Sale::with(['cashier', 'branch', 'order.user', 'delivery', 'items.product'])
            ->when($user && !$user->isAdmin(), function ($q) use ($user) {
                return $q->where('branch_id', $user->branch_id);
            })
            ->when($branchId && (!$user || $user->isAdmin()), fn($q) => $q->where('branch_id', $branchId))
            ->when(isset($this->filters['from']) && isset($this->filters['to']), function ($q) {
                return $q->whereBetween('created_at', [$this->filters['from'], $this->filters['to']]);
            }, function ($q) {
                return $q->when($this->filters['date_from'] ?? null, fn($sub) => $sub->whereDate('created_at', '>=', $this->filters['date_from']))
                         ->when($this->filters['date_to'] ?? null, fn($sub) => $sub->whereDate('created_at', '<=', $this->filters['date_to']));
            })
            ->when(($this->filters['cashier_id'] ?? null) && $this->filters['cashier_id'] !== 'all' && (!$user || $user->isAdmin()), fn($q) => $q->where('user_id', $this->filters['cashier_id']))
            ->when(($this->filters['status'] ?? null) && $this->filters['status'] !== 'all', fn($q) => $q->where('status', $this->filters['status']))
            ->when($this->filters['search'] ?? null, fn($q, $search) => $q->where('order_number', 'like', "%{$search}%"))
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

    public function styles(Worksheet $sheet)
    {
        $highestColumn = $sheet->getHighestColumn();
        $highestRow = $sheet->getHighestRow();

        // Freeze panes under header row
        $sheet->freezePane('A2');

        // Style the header row
        $sheet->getStyle("A1:{$highestColumn}1")->getFont()->setBold(true);
        $sheet->getStyle("A1:{$highestColumn}1")->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFF1F5F9'); // Slate bg

        // Clean grid borders
        $sheet->getStyle("A1:{$highestColumn}{$highestRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FFE2E8F0'],
                ],
            ],
        ]);

        // Auto-filter on header range so users can filter
        if ($highestRow >= 1) {
            $sheet->setAutoFilter("A1:{$highestColumn}{$highestRow}");
        }

        // Apply shared Excel protection service
        \App\Services\ExcelProtectionService::protect($sheet);
    }
}
