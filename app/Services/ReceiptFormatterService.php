<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Order;
use App\Models\Branch;
use Carbon\Carbon;

class ReceiptFormatterService
{
    public const TIMEZONE = 'Asia/Manila';

    /**
     * Clean and format branch name for receipt header.
     * E.g. "Maki Desu Victoria" -> "VICTORIA", "Maki Desu Sta. Cruz" -> "STA. CRUZ"
     */
    public static function formatBranchHeading(?string $branchName): string
    {
        if (empty($branchName)) {
            return 'STORE RECEIPT';
        }

        $cleaned = preg_replace('/^Maki\s*Desu\s*[-–—:]*\s*/i', '', trim($branchName));
        return strtoupper(trim($cleaned ?: $branchName));
    }

    /**
     * Build standard receipt payload array from a Sale or Order model.
     */
    public function buildReceiptData(Sale|Order $record, ?string $jobType = 'receipt', ?string $reprintReason = null): array
    {
        $isSale = $record instanceof Sale;
        $branch = $record->branch ?? ($record->branch_id ? Branch::find($record->branch_id) : null);
        $branchHeading = self::formatBranchHeading($branch?->name);

        $createdAt = $record->created_at 
            ? Carbon::parse($record->created_at)->setTimezone(self::TIMEZONE) 
            : now()->setTimezone(self::TIMEZONE);

        $orderNumber = $record->order_number ?: ($isSale ? "POS-{$record->id}" : "ORD-{$record->id}");
        $fulfillmentType = strtoupper($record->type ?? $record->fulfillment_type ?? 'DINE-IN');
        $paperWidth = (int) ($branch?->receipt_paper_width ?? 80);

        // Extract items
        $items = [];
        $itemsCollection = $record->relationLoaded('items') ? $record->items : $record->items()->with('product')->get();

        foreach ($itemsCollection as $item) {
            $productName = $item->product?->name ?? $item->name ?? 'Menu Item';
            $qty = (float) $item->quantity;
            $unitPrice = (float) ($item->unit_price ?? $item->price ?? 0);
            $subtotal = (float) ($item->subtotal ?? ($qty * $unitPrice));

            $items[] = [
                'name'       => $productName,
                'quantity'   => $qty,
                'unit_price' => $unitPrice,
                'subtotal'   => $subtotal,
            ];
        }

        $subtotal = (float) ($record->subtotal ?? array_sum(array_column($items, 'subtotal')));
        $discount = (float) ($record->discount ?? 0);
        $discountType = $record->discount_type ?? null;
        $deliveryFee = (float) ($record->delivery_fee ?? 0);
        $total = (float) ($record->total ?? $record->total_amount ?? ($subtotal - $discount + $deliveryFee));
        $paidAmount = (float) ($record->paid_amount ?? $total);
        $changeAmount = (float) ($record->change_amount ?? max(0, $paidAmount - $total));
        $paymentMethod = strtoupper((string) ($record->payment_method ?? 'CASH'));

        $customerName = $record->customer_name ?? $record->delivery?->customer_name ?? null;
        $customerPhone = $record->contact_number ?? $record->delivery?->customer_phone ?? null;
        $customerAddress = $record->address ?? $record->delivery?->customer_address ?? null;
        $cashierName = $record->user?->name ?? $record->cashier?->name ?? 'Staff';

        return [
            'job_type'          => $jobType,
            'is_reprint'        => ($jobType === 'reprint'),
            'reprint_reason'    => $reprintReason,
            'reprinted_at'      => ($jobType === 'reprint') ? now()->setTimezone(self::TIMEZONE)->format('M d, Y h:i A') : null,
            'branch_id'         => $branch?->id,
            'branch_name'       => $branchHeading,
            'branch_address'    => $branch?->address,
            'order_number'      => $orderNumber,
            'date_time'         => $createdAt->format('M d, Y h:i A'),
            'fulfillment_type'  => $fulfillmentType,
            'customer_name'     => $customerName,
            'customer_phone'    => $customerPhone,
            'customer_address'  => $customerAddress,
            'cashier_name'      => $cashierName,
            'items'             => $items,
            'subtotal'          => $subtotal,
            'discount'          => $discount,
            'discount_type'     => $discountType,
            'delivery_fee'      => $deliveryFee,
            'total'             => $total,
            'payment_method'    => $paymentMethod,
            'paid_amount'       => $paidAmount,
            'change_amount'     => $changeAmount,
            'paper_width'       => $paperWidth,
        ];
    }

    /**
     * Generate monospaced plain text ASCII receipt.
     */
    public function formatPlainText(array $data, int $width = 80): string
    {
        $cols = ($width === 58) ? 32 : 42;
        $divider = str_repeat('-', $cols);
        $lines = [];

        // Reprint Banner
        if (!empty($data['is_reprint'])) {
            $lines[] = $this->centerText('*** REPRINT ***', $cols);
            if (!empty($data['reprint_reason'])) {
                $lines[] = $this->centerText("Reason: {$data['reprint_reason']}", $cols);
            }
            if (!empty($data['reprinted_at'])) {
                $lines[] = $this->centerText("Time: {$data['reprinted_at']}", $cols);
            }
            $lines[] = $divider;
        }

        // Branch Header
        $lines[] = $this->centerText($data['branch_name'], $cols);
        if (!empty($data['branch_address'])) {
            $lines[] = $this->centerText($data['branch_address'], $cols);
        }
        $lines[] = $divider;

        // Order Metadata
        $lines[] = $this->twoColumn("Order #: {$data['order_number']}", $data['fulfillment_type'], $cols);
        $lines[] = "Date: {$data['date_time']}";
        if (!empty($data['cashier_name'])) {
            $lines[] = "Cashier: {$data['cashier_name']}";
        }

        if (!empty($data['customer_name'])) {
            $lines[] = "Customer: {$data['customer_name']}";
        }
        if (!empty($data['customer_address'])) {
            $lines[] = "Address: {$data['customer_address']}";
        }

        $lines[] = $divider;

        // Column Header
        if ($cols === 32) {
            $lines[] = $this->twoColumn("Item (Qty)", "Price", $cols);
        } else {
            $lines[] = sprintf("%-22s %4s %14s", "Item", "Qty", "Price");
        }
        $lines[] = $divider;

        // Items
        foreach ($data['items'] as $item) {
            $name = $item['name'];
            $qty = $item['quantity'];
            $priceStr = 'PHP ' . number_format($item['subtotal'], 2);

            if ($cols === 32) {
                $itemLeft = sprintf("%s x%s", mb_strimwidth($name, 0, 18, '..'), $qty);
                $lines[] = $this->twoColumn($itemLeft, $priceStr, $cols);
            } else {
                $truncatedName = mb_strimwidth($name, 0, 22, '..');
                $lines[] = sprintf("%-22s %4s %14s", $truncatedName, $qty, $priceStr);
            }
        }

        $lines[] = $divider;

        // Totals
        if (!empty($data['discount']) && $data['discount'] > 0) {
            $lines[] = $this->twoColumn("Subtotal", 'PHP ' . number_format($data['subtotal'], 2), $cols);
            $discLabel = "Discount" . (!empty($data['discount_type']) ? " ({$data['discount_type']})" : '');
            $lines[] = $this->twoColumn($discLabel, '-PHP ' . number_format($data['discount'], 2), $cols);
        }

        if (!empty($data['delivery_fee']) && $data['delivery_fee'] > 0) {
            $lines[] = $this->twoColumn("Delivery Fee", 'PHP ' . number_format($data['delivery_fee'], 2), $cols);
        }

        $lines[] = $this->twoColumn("TOTAL", 'PHP ' . number_format($data['total'], 2), $cols);
        $lines[] = $divider;

        // Payment Info
        $payLabel = "{$data['payment_method']} Paid";
        $lines[] = $this->twoColumn($payLabel, 'PHP ' . number_format($data['paid_amount'], 2), $cols);
        $lines[] = $this->twoColumn("Change", 'PHP ' . number_format($data['change_amount'], 2), $cols);

        $lines[] = $divider;
        $lines[] = $this->centerText("Thank you!", $cols);

        if (!empty($data['is_reprint'])) {
            $lines[] = $this->centerText('*** END OF REPRINT ***', $cols);
        }

        return implode("\n", $lines);
    }

    /**
     * Generate raw binary ESC/POS command stream (Base64 encoded).
     */
    public function formatEscPosBase64(array $data, int $width = 80): string
    {
        $cols = ($width === 58) ? 32 : 42;
        $ESC = "\x1B";
        $GS  = "\x1D";

        $out = "";

        // 1. Initialize Printer
        $out .= "{$ESC}@";

        // 2. Set Code Page to CP437
        $out .= "{$ESC}t\x00";

        // 3. Reprint Warning
        if (!empty($data['is_reprint'])) {
            $out .= "{$ESC}a\x01"; // Center align
            $out .= "{$ESC}E\x01"; // Bold on
            $out .= "*** REPRINT ***\n";
            if (!empty($data['reprint_reason'])) {
                $out .= "Reason: {$data['reprint_reason']}\n";
            }
            if (!empty($data['reprinted_at'])) {
                $out .= "Time: {$data['reprinted_at']}\n";
            }
            $out .= "{$ESC}E\x00"; // Bold off
            $out .= str_repeat('-', $cols) . "\n";
        }

        // 4. Branch Header (Double height & Double width)
        $out .= "{$ESC}a\x01"; // Center align
        $out .= "{$GS}!\x11";  // Double width & height
        $out .= "{$ESC}E\x01"; // Bold on
        $out .= "{$data['branch_name']}\n";
        $out .= "{$GS}!\x00";  // Normal size
        $out .= "{$ESC}E\x00"; // Bold off

        if (!empty($data['branch_address'])) {
            $out .= "{$data['branch_address']}\n";
        }
        $out .= str_repeat('-', $cols) . "\n";

        // 5. Order Meta (Left align)
        $out .= "{$ESC}a\x00"; // Left align
        $out .= $this->twoColumn("Order #: {$data['order_number']}", $data['fulfillment_type'], $cols) . "\n";
        $out .= "Date: {$data['date_time']}\n";
        if (!empty($data['cashier_name'])) {
            $out .= "Cashier: {$data['cashier_name']}\n";
        }
        if (!empty($data['customer_name'])) {
            $out .= "Customer: {$data['customer_name']}\n";
        }
        if (!empty($data['customer_address'])) {
            $out .= "Address: {$data['customer_address']}\n";
        }
        $out .= str_repeat('-', $cols) . "\n";

        // 6. Items Table
        $out .= "{$ESC}E\x01"; // Bold header
        if ($cols === 32) {
            $out .= $this->twoColumn("Item (Qty)", "Price", $cols) . "\n";
        } else {
            $out .= sprintf("%-22s %4s %14s\n", "Item", "Qty", "Price");
        }
        $out .= "{$ESC}E\x00"; // Bold off
        $out .= str_repeat('-', $cols) . "\n";

        foreach ($data['items'] as $item) {
            $name = $item['name'];
            $qty = $item['quantity'];
            $priceStr = 'PHP ' . number_format($item['subtotal'], 2);

            if ($cols === 32) {
                $itemLeft = sprintf("%s x%s", mb_strimwidth($name, 0, 18, '..'), $qty);
                $out .= $this->twoColumn($itemLeft, $priceStr, $cols) . "\n";
            } else {
                $truncatedName = mb_strimwidth($name, 0, 22, '..');
                $out .= sprintf("%-22s %4s %14s\n", $truncatedName, $qty, $priceStr);
            }
        }
        $out .= str_repeat('-', $cols) . "\n";

        // 7. Totals & Discounts
        if (!empty($data['discount']) && $data['discount'] > 0) {
            $out .= $this->twoColumn("Subtotal", 'PHP ' . number_format($data['subtotal'], 2), $cols) . "\n";
            $discLabel = "Discount" . (!empty($data['discount_type']) ? " ({$data['discount_type']})" : '');
            $out .= $this->twoColumn($discLabel, '-PHP ' . number_format($data['discount'], 2), $cols) . "\n";
        }

        if (!empty($data['delivery_fee']) && $data['delivery_fee'] > 0) {
            $out .= $this->twoColumn("Delivery Fee", 'PHP ' . number_format($data['delivery_fee'], 2), $cols) . "\n";
        }

        // GRAND TOTAL (Double Height + Bold)
        $out .= "{$ESC}E\x01"; // Bold on
        $out .= "{$GS}!\x01";  // Double height
        $out .= $this->twoColumn("TOTAL", 'PHP ' . number_format($data['total'], 2), ($cols === 32 ? 32 : 42)) . "\n";
        $out .= "{$GS}!\x00";  // Normal size
        $out .= "{$ESC}E\x00"; // Bold off
        $out .= str_repeat('-', $cols) . "\n";

        // 8. Payment & Change
        $payLabel = "{$data['payment_method']} Paid";
        $out .= $this->twoColumn($payLabel, 'PHP ' . number_format($data['paid_amount'], 2), $cols) . "\n";
        $out .= "{$ESC}E\x01";
        $out .= $this->twoColumn("Change", 'PHP ' . number_format($data['change_amount'], 2), $cols) . "\n";
        $out .= "{$ESC}E\x00";

        $out .= str_repeat('-', $cols) . "\n";

        // 9. Footer
        $out .= "{$ESC}a\x01"; // Center align
        $out .= "Thank you!\n";

        if (!empty($data['is_reprint'])) {
            $out .= "*** END OF REPRINT ***\n";
        }

        // 10. Feed 4 lines and Partial/Full Paper Cut (GS V 65 16)
        $out .= "\n\n\n\n";
        $out .= "{$GS}V\x41\x10";

        return base64_encode($out);
    }

    private function centerText(string $text, int $width): string
    {
        $textLen = mb_strwidth($text);
        if ($textLen >= $width) {
            return mb_strimwidth($text, 0, $width);
        }
        $leftPad = (int) floor(($width - $textLen) / 2);
        return str_repeat(' ', $leftPad) . $text;
    }

    private function twoColumn(string $left, string $right, int $width): string
    {
        $leftLen = mb_strwidth($left);
        $rightLen = mb_strwidth($right);

        if ($leftLen + $rightLen >= $width) {
            $availableLeft = max(1, $width - $rightLen - 1);
            $left = mb_strimwidth($left, 0, $availableLeft);
            $leftLen = mb_strwidth($left);
        }

        $spaces = max(1, $width - $leftLen - $rightLen);
        return $left . str_repeat(' ', $spaces) . $right;
    }
}
