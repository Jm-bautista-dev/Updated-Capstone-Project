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
     * Displays ONLY the branch name (e.g. "VICTORIA", "STA. CRUZ") and NEVER "MAKI DESU".
     * E.g. "Maki Desu Victoria" -> "VICTORIA", "Maki Desu Sta. Cruz" -> "STA. CRUZ"
     */
    public static function formatBranchHeading(?string $branchName): string
    {
        if (empty($branchName) || !trim($branchName)) {
            return 'STORE';
        }

        $trimmed = trim($branchName);

        // Strip "MAKI DESU" prefixes, suffixes, and trailing "Branch"
        $cleaned = preg_replace('/^Maki\s*Desu\s*[-–—:]*\s*/i', '', $trimmed);
        $cleaned = preg_replace('/\s*[-–—:]*\s*Maki\s*Desu$/i', '', $cleaned);
        $cleaned = preg_replace('/\s+Branch$/i', '', $cleaned);
        $cleaned = trim($cleaned);

        // Standardize common branch names if matched
        if (preg_match('/^sta\.?\s*cruz$/i', $cleaned) || preg_match('/^santa\s*cruz$/i', $cleaned)) {
            return 'STA. CRUZ';
        }
        if (preg_match('/^victoria$/i', $cleaned)) {
            return 'VICTORIA';
        }

        // If the cleaned result is empty or still "MAKI DESU", fallback to STORE
        if (empty($cleaned) || strcasecmp($cleaned, 'Maki Desu') === 0) {
            return 'STORE';
        }

        return strtoupper($cleaned);
    }

    /**
     * Build standard receipt payload array from a Sale or Order model.
     */
    public function buildReceiptData(Sale|Order $record, ?string $jobType = 'receipt', ?string $reprintReason = null, ?int $paperWidthOverride = null): array
    {
        if ($record instanceof Sale) {
            $record->loadMissing(['delivery', 'order', 'branch', 'user']);
            if (!$record->delivery) {
                $record->load('delivery');
            }
        } elseif ($record instanceof Order) {
            $record->loadMissing(['delivery', 'branch', 'user']);
            if (!$record->delivery) {
                $record->load('delivery');
            }
        }

        $isSale = $record instanceof Sale;
        $branch = $record->branch ?? ($record->branch_id ? Branch::find($record->branch_id) : null);
        $branchHeading = self::formatBranchHeading($branch?->name);

        $createdAt = $record->created_at 
            ? Carbon::parse($record->created_at)->setTimezone(self::TIMEZONE) 
            : now()->setTimezone(self::TIMEZONE);

        $orderNumber = $record->order_number ?: ($isSale ? "POS-{$record->id}" : "ORD-{$record->id}");
        $fulfillmentType = strtoupper($record->type ?? $record->fulfillment_type ?? 'DINE-IN');
        $paperWidth = $paperWidthOverride ?: (int) ($branch?->receipt_paper_width ?? 80);

        // Extract items - reliably load from relation or database
        $items = [];
        if ($record->relationLoaded('items') && $record->items->isNotEmpty()) {
            if (method_exists($record->items, 'loadMissing')) {
                try {
                    $record->items->loadMissing('product');
                } catch (\Throwable) {
                    // Ignore for in-memory / dummy collections
                }
            }
            $itemsCollection = $record->items;
        } else {
            $itemsCollection = $record->items()->with('product')->get();
        }

        foreach ($itemsCollection as $item) {
            $productName = $item->product?->name 
                ?? $item->product_name 
                ?? $item->name 
                ?? ($item->product_id ? \App\Models\Product::withTrashed()->find($item->product_id)?->name : null)
                ?? 'Menu Item';
            $qty = (float) $item->quantity;
            $unitPrice = (float) ($item->unit_price ?? $item->price ?? 0);
            if ($unitPrice <= 0 && $qty > 0 && !empty($item->subtotal)) {
                $unitPrice = (float) $item->subtotal / $qty;
            }
            $subtotal = (float) ($item->subtotal ?? $item->line_total ?? ($qty * $unitPrice));

            $addons = [];
            if (!empty($item->selected_addons)) {
                $rawAddons = is_string($item->selected_addons) ? json_decode($item->selected_addons, true) : $item->selected_addons;
                if (is_array($rawAddons)) {
                    foreach ($rawAddons as $ad) {
                        $adQty = max(1, (float) ($ad['quantity'] ?? 1));
                        $adPrice = (float) ($ad['price'] ?? $ad['unit_price'] ?? 0);
                        $adSubtotal = (float) ($ad['subtotal'] ?? ($adPrice * $adQty));
                        $addons[] = [
                            'name'       => $ad['name'] ?? 'Add-on',
                            'quantity'   => $adQty,
                            'unit_price' => $adPrice,
                            'price'      => $adPrice,
                            'subtotal'   => $adSubtotal,
                        ];
                    }
                }
            }

            $items[] = [
                'name'       => $productName,
                'quantity'   => $qty,
                'unit_price' => $unitPrice,
                'subtotal'   => $subtotal,
                'addons'     => $addons,
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

        $customerName = $record->delivery?->customer_name
            ?? $record->order?->customer_name
            ?? ($record->customer_name && $record->customer_name !== 'Walk-in Customer' ? $record->customer_name : null)
            ?? ($record instanceof Sale ? null : $record->customer_name);
        $customerPhone = $record->contact_number ?? $record->delivery?->customer_phone ?? $record->order?->contact_number ?? null;
        $cashierName = $record->user?->name ?? $record->cashier?->name ?? 'Staff';

        $scheduledPickupAt = $record->scheduled_pickup_at 
            ? Carbon::parse($record->scheduled_pickup_at)->setTimezone(self::TIMEZONE)->format('M d, Y h:i A') 
            : null;
        $pickupVerificationCode = $record->pickup_verification_code ?? null;

        return [
            'job_type'                 => $jobType,
            'is_reprint'               => ($jobType === 'reprint'),
            'reprint_reason'           => $reprintReason,
            'reprinted_at'             => ($jobType === 'reprint') ? now()->setTimezone(self::TIMEZONE)->format('M d, Y h:i A') : null,
            'branch_id'                => $branch?->id,
            'branch_name'              => $branchHeading,
            'branch_address'           => $branch?->address,
            'order_number'             => $orderNumber,
            'date_time'                => $createdAt->format('M d, Y h:i A'),
            'fulfillment_type'         => $fulfillmentType,
            'scheduled_pickup_at'      => $scheduledPickupAt,
            'pickup_verification_code' => $pickupVerificationCode,
            'customer_name'            => $customerName,
            'customer_phone'           => $customerPhone,
            'cashier_name'             => $cashierName,
            'items'                    => $items,
            'subtotal'                 => $subtotal,
            'discount'                 => $discount,
            'discount_type'            => $discountType,
            'delivery_fee'             => $deliveryFee,
            'total'                    => $total,
            'payment_method'           => $paymentMethod,
            'paid_amount'              => $paidAmount,
            'change_amount'            => $changeAmount,
            'paper_width'              => $paperWidth,
        ];
    }

    /**
     * Helper to wrap text into multiple lines with maximum column width constraint.
     */
    public function wordWrapLines(string $text, int $width): array
    {
        $text = trim($text);
        if ($width <= 0 || mb_strwidth($text) <= $width) {
            return [$text];
        }

        $words = preg_split('/\s+/', $text);
        $lines = [];
        $currentLine = '';

        foreach ($words as $word) {
            if ($currentLine === '') {
                if (mb_strwidth($word) <= $width) {
                    $currentLine = $word;
                } else {
                    $chunks = [];
                    $len = mb_strlen($word);
                    $chunk = '';
                    for ($i = 0; $i < $len; $i++) {
                        $char = mb_substr($word, $i, 1);
                        if (mb_strwidth($chunk . $char) > $width) {
                            $chunks[] = $chunk;
                            $chunk = $char;
                        } else {
                            $chunk .= $char;
                        }
                    }
                    if ($chunk !== '') {
                        $chunks[] = $chunk;
                    }
                    for ($i = 0; $i < count($chunks) - 1; $i++) {
                        $lines[] = $chunks[$i];
                    }
                    $currentLine = end($chunks);
                }
            } else {
                $testLine = $currentLine . ' ' . $word;
                if (mb_strwidth($testLine) <= $width) {
                    $currentLine = $testLine;
                } else {
                    $lines[] = $currentLine;
                    if (mb_strwidth($word) <= $width) {
                        $currentLine = $word;
                    } else {
                        $chunks = [];
                        $len = mb_strlen($word);
                        $chunk = '';
                        for ($i = 0; $i < $len; $i++) {
                            $char = mb_substr($word, $i, 1);
                            if (mb_strwidth($chunk . $char) > $width) {
                                $chunks[] = $chunk;
                                $chunk = $char;
                            } else {
                                $chunk .= $char;
                            }
                        }
                        if ($chunk !== '') {
                            $chunks[] = $chunk;
                        }
                        for ($i = 0; $i < count($chunks) - 1; $i++) {
                            $lines[] = $chunks[$i];
                        }
                        $currentLine = end($chunks);
                    }
                }
            }
        }

        if ($currentLine !== '') {
            $lines[] = $currentLine;
        }

        return $lines;
    }

    /**
     * Generate monospaced plain text ASCII receipt.
     */
    public function formatPlainText(array $data, int $width = 80): string
    {
        $cols = ($width === 58) ? 32 : 42;
        $divider = str_repeat('-', $cols);
        $lines = [];

        // Reprint or Test Banner
        if (!empty($data['is_reprint'])) {
            $lines[] = $this->centerText('*** REPRINT ***', $cols);
            if (!empty($data['reprint_reason'])) {
                $lines[] = $this->centerText("Reason: {$data['reprint_reason']}", $cols);
            }
            if (!empty($data['reprinted_at'])) {
                $lines[] = $this->centerText("Time: {$data['reprinted_at']}", $cols);
            }
            $lines[] = $divider;
        } elseif (($data['job_type'] ?? '') === 'test') {
            $lines[] = $this->centerText('*** TEST PRINT ***', $cols);
            if (!empty($data['reprint_reason'])) {
                $lines[] = $this->centerText($data['reprint_reason'], $cols);
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
        if (!empty($data['scheduled_pickup_at'])) {
            $lines[] = "Pickup: {$data['scheduled_pickup_at']}";
        }
        if (!empty($data['pickup_verification_code'])) {
            $lines[] = "Pickup Code: {$data['pickup_verification_code']}";
        }
        if (!empty($data['cashier_name'])) {
            $lines[] = mb_strimwidth("Cashier: {$data['cashier_name']}", 0, $cols, '..');
        }

        if (!empty($data['customer_name'])) {
            $lines[] = mb_strimwidth("Customer: {$data['customer_name']}", 0, $cols, '..');
        }

        $lines[] = $divider;

        // Column Header
        if ($cols === 32) {
            $lines[] = "ITEM";
            $lines[] = $this->twoColumn("QTY x PRICE", "TOTAL", $cols);
        } else {
            $lines[] = sprintf("%-22s %4s %14s", "Item", "Qty", "Price");
        }
        $lines[] = $divider;

        // Items
        foreach ($data['items'] as $item) {
            $name = $item['name'];
            $qty = $item['quantity'];
            $unitPrice = (float) ($item['unit_price'] ?? 0);
            $subtotal = (float) ($item['subtotal'] ?? ($qty * $unitPrice));
            $priceStr = 'PHP ' . number_format($subtotal, 2);
            $unitPriceStr = 'PHP ' . number_format($unitPrice, 2);

            if ($cols === 32) {
                // Wrap long product names without truncation
                $nameLines = $this->wordWrapLines($name, $cols);
                foreach ($nameLines as $nl) {
                    $lines[] = $nl;
                }
                $qtyPriceStr = sprintf("%s x %s", $qty, $unitPriceStr);
                $lines[] = $this->twoColumn($qtyPriceStr, $priceStr, $cols);
            } else {
                $truncatedName = mb_strimwidth($name, 0, 22, '..');
                $lines[] = sprintf("%-22s %4s %14s", $truncatedName, $qty, $priceStr);
            }

            // Print Add-ons under item if present
            if (!empty($item['addons'])) {
                foreach ($item['addons'] as $ad) {
                    $adQty = max(1, (float) ($ad['quantity'] ?? 1));
                    $adUnitPrice = (float) ($ad['unit_price'] ?? ($ad['price'] ?? 0));
                    $adSubtotal = (float) ($ad['subtotal'] ?? ($adUnitPrice * $adQty));
                    $adPriceStr = $adSubtotal > 0 ? ('PHP ' . number_format($adSubtotal, 2)) : '';
                    $adUnitPriceStr = $adUnitPrice > 0 ? ('PHP ' . number_format($adUnitPrice, 2)) : '';
                    $adQtyPrefix = $adQty > 1 ? ((int)$adQty . 'x ') : '';

                    if ($cols === 32) {
                        $adNameLines = $this->wordWrapLines("+ " . $adQtyPrefix . $ad['name'], $cols - 2);
                        foreach ($adNameLines as $adLine) {
                            $lines[] = "  " . $adLine;
                        }
                        if ($adSubtotal > 0) {
                            $adQtyPriceStr = sprintf("  %s x %s", $adQty, $adUnitPriceStr);
                            $lines[] = $this->twoColumn($adQtyPriceStr, "+" . $adPriceStr, $cols);
                        }
                    } else {
                        $lines[] = $this->twoColumn("  + " . mb_strimwidth($adQtyPrefix . $ad['name'], 0, $cols - 14, '..'), $adPriceStr ? ('+' . $adPriceStr) : '', $cols);
                    }
                }
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

        // 3. Reprint or Test Warning
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
        } elseif (($data['job_type'] ?? '') === 'test') {
            $out .= "{$ESC}a\x01"; // Center align
            $out .= "{$ESC}E\x01"; // Bold on
            $out .= "*** TEST PRINT ***\n";
            if (!empty($data['reprint_reason'])) {
                $out .= "{$data['reprint_reason']}\n";
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
            $out .= mb_strimwidth("Cashier: {$data['cashier_name']}", 0, $cols, '..') . "\n";
        }
        if (!empty($data['customer_name'])) {
            $out .= mb_strimwidth("Customer: {$data['customer_name']}", 0, $cols, '..') . "\n";
        }
        $out .= str_repeat('-', $cols) . "\n";

        // 6. Items Table
        $out .= "{$ESC}E\x01"; // Bold header
        if ($cols === 32) {
            $out .= "ITEM\n";
            $out .= $this->twoColumn("QTY x PRICE", "TOTAL", $cols) . "\n";
        } else {
            $out .= sprintf("%-22s %4s %14s\n", "Item", "Qty", "Price");
        }
        $out .= "{$ESC}E\x00"; // Bold off
        $out .= str_repeat('-', $cols) . "\n";

        foreach ($data['items'] as $item) {
            $name = $item['name'];
            $qty = $item['quantity'];
            $unitPrice = (float) ($item['unit_price'] ?? 0);
            $subtotal = (float) ($item['subtotal'] ?? ($qty * $unitPrice));
            $priceStr = 'PHP ' . number_format($subtotal, 2);
            $unitPriceStr = 'PHP ' . number_format($unitPrice, 2);

            if ($cols === 32) {
                $out .= "{$ESC}E\x01"; // Bold product name
                $nameLines = $this->wordWrapLines($name, $cols);
                foreach ($nameLines as $nl) {
                    $out .= $nl . "\n";
                }
                $out .= "{$ESC}E\x00"; // Bold off
                $qtyPriceStr = sprintf("%s x %s", $qty, $unitPriceStr);
                $out .= $this->twoColumn($qtyPriceStr, $priceStr, $cols) . "\n";
            } else {
                $truncatedName = mb_strimwidth($name, 0, 22, '..');
                $out .= sprintf("%-22s %4s %14s\n", $truncatedName, $qty, $priceStr);
            }

            // Print Add-ons under item in ESC/POS
            if (!empty($item['addons'])) {
                foreach ($item['addons'] as $ad) {
                    $adQty = max(1, (float) ($ad['quantity'] ?? 1));
                    $adUnitPrice = (float) ($ad['unit_price'] ?? ($ad['price'] ?? 0));
                    $adSubtotal = (float) ($ad['subtotal'] ?? ($adUnitPrice * $adQty));
                    $adPriceStr = $adSubtotal > 0 ? ('PHP ' . number_format($adSubtotal, 2)) : '';
                    $adUnitPriceStr = $adUnitPrice > 0 ? ('PHP ' . number_format($adUnitPrice, 2)) : '';
                    $adQtyPrefix = $adQty > 1 ? ((int)$adQty . 'x ') : '';

                    if ($cols === 32) {
                        $adNameLines = $this->wordWrapLines("+ " . $adQtyPrefix . $ad['name'], $cols - 2);
                        foreach ($adNameLines as $adLine) {
                            $out .= "  " . $adLine . "\n";
                        }
                        if ($adSubtotal > 0) {
                            $adQtyPriceStr = sprintf("  %s x %s", $adQty, $adUnitPriceStr);
                            $out .= $this->twoColumn($adQtyPriceStr, "+" . $adPriceStr, $cols) . "\n";
                        }
                    } else {
                        $out .= $this->twoColumn("  + " . mb_strimwidth($adQtyPrefix . $ad['name'], 0, $cols - 14, '..'), $adPriceStr ? ('+' . $adPriceStr) : '', $cols) . "\n";
                    }
                }
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
