/**
 * MAKI DESU POS — ESC/POS Thermal Receipt Binary Builder
 * 
 * Generates standard ESC/POS binary buffers (Uint8Array) for direct hardware printing
 * via WebUSB, Web Serial, TCP sockets, or Local Spooler Bridges.
 * 
 * Fully supports 58mm (32 cols standard) and 80mm (42/48 cols) thermal printers.
 */

import type { ReceiptDataPayload, ReceiptItemPayload } from './pos-print-bridge';
import { formatReceiptBranchHeading } from './utils';

// ESC/POS Command Byte Constants
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

export class EscPosBuilder {
    private buffer: number[] = [];
    private cols: number;

    constructor(paperWidth: 58 | 80 = 58) {
        this.cols = paperWidth === 80 ? 42 : 32;
        this.init();
    }

    /**
     * Initialize printer (clears print buffer and resets modes)
     */
    public init(): this {
        this.buffer.push(ESC, 0x40); // ESC @
        this.buffer.push(ESC, 0x74, 0x00); // Code page CP437 (USA, Standard Europe)
        return this;
    }

    /**
     * Set Text Alignment: 'left' | 'center' | 'right'
     */
    public align(align: 'left' | 'center' | 'right'): this {
        const val = align === 'center' ? 1 : align === 'right' ? 2 : 0;
        this.buffer.push(ESC, 0x61, val); // ESC a n
        return this;
    }

    /**
     * Toggle Bold Text
     */
    public bold(enable = true): this {
        this.buffer.push(ESC, 0x45, enable ? 1 : 0); // ESC E n
        return this;
    }

    /**
     * Toggle Underline
     */
    public underline(enable = true): this {
        this.buffer.push(ESC, 0x2D, enable ? 1 : 0); // ESC - n
        return this;
    }

    /**
     * Set Text Size: Normal, Double Width, Double Height, or Quad Size
     */
    public size(mode: 'normal' | 'double_width' | 'double_height' | 'quad' = 'normal'): this {
        let val = 0x00;
        if (mode === 'double_width') val = 0x20;
        else if (mode === 'double_height') val = 0x10;
        else if (mode === 'quad') val = 0x30;
        this.buffer.push(GS, 0x21, val); // GS ! n
        return this;
    }

    /**
     * Append Raw String encoded in CP437 / ASCII bytes
     */
    public text(str: string): this {
        // Sanitize string to standard printable ASCII / CP437 compatible chars
        const sanitized = str
            .replace(/₱/g, 'PHP ')
            .replace(/[^\x20-\x7E\n\r]/g, '');

        for (let i = 0; i < sanitized.length; i++) {
            this.buffer.push(sanitized.charCodeAt(i));
        }
        return this;
    }

    /**
     * Append Text followed by Line Feed
     */
    public line(str = ''): this {
        this.text(str);
        this.buffer.push(LF);
        return this;
    }

    /**
     * Append Empty Line(s)
     */
    public feed(lines = 1): this {
        for (let i = 0; i < lines; i++) {
            this.buffer.push(LF);
        }
        return this;
    }

    /**
     * Append a Horizontal Dashed Separator Line across the full column width
     */
    public separator(char = '-'): this {
        this.align('left');
        this.line(char.repeat(this.cols));
        return this;
    }

    /**
     * Print Left & Right Aligned Text on the Same Line
     * (e.g. "Total                       PHP 350.00")
     */
    public leftRight(left: string, right: string): this {
        this.align('left');
        const cleanLeft = left.replace(/₱/g, 'PHP ');
        const cleanRight = right.replace(/₱/g, 'PHP ');

        const available = this.cols - cleanRight.length;
        if (available <= 0) {
            this.line(cleanLeft);
            this.line(' '.repeat(Math.max(0, this.cols - cleanRight.length)) + cleanRight);
            return this;
        }

        if (cleanLeft.length > available - 1) {
            const truncated = cleanLeft.substring(0, available - 1);
            const spaces = ' '.repeat(this.cols - truncated.length - cleanRight.length);
            this.line(truncated + spaces + cleanRight);
        } else {
            const spaces = ' '.repeat(this.cols - cleanLeft.length - cleanRight.length);
            this.line(cleanLeft + spaces + cleanRight);
        }
        return this;
    }

    /**
     * Print 3-column row: Item name, quantity, price
     */
    public itemRow(name: string, qty: number, priceStr: string): this {
        this.align('left');
        const qtyPart = ` x${qty}`;
        const rightPart = priceStr.replace(/₱/g, 'PHP ');
        const maxNameLen = this.cols - qtyPart.length - rightPart.length - 1;

        let nameDisplay = name.replace(/₱/g, 'PHP ');
        if (nameDisplay.length > maxNameLen && maxNameLen > 4) {
            nameDisplay = nameDisplay.substring(0, maxNameLen - 1) + '.';
        }

        const leftSide = `${nameDisplay}${qtyPart}`;
        const spaces = ' '.repeat(Math.max(1, this.cols - leftSide.length - rightPart.length));
        this.line(leftSide + spaces + rightPart);
        return this;
    }

    /**
     * Feed and Cut Paper (Full or Partial)
     */
    public cut(partial = false): this {
        this.feed(3);
        this.buffer.push(GS, 0x56, partial ? 0x01 : 0x00); // GS V 0 or 1
        return this;
    }

    /**
     * Pulse Cash Drawer Kick (Pin 2 or Pin 5)
     */
    public openCashDrawer(): this {
        this.buffer.push(ESC, 0x70, 0x00, 0x19, 0xFA); // ESC p 0 25 250
        return this;
    }

    /**
     * Compile and return Uint8Array binary buffer
     */
    public build(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}

/**
 * Helper to wrap text into multiple lines for ESC/POS with maximum column width.
 */
export function wrapText(text: string, maxLen: number): string[] {
    const clean = (text || '').trim().replace(/₱/g, 'PHP ');
    if (clean.length <= maxLen) return [clean];

    const words = clean.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if (!currentLine) {
            if (word.length <= maxLen) {
                currentLine = word;
            } else {
                for (let i = 0; i < word.length; i += maxLen) {
                    lines.push(word.substring(i, i + maxLen));
                }
            }
        } else {
            const testLine = `${currentLine} ${word}`;
            if (testLine.length <= maxLen) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                if (word.length <= maxLen) {
                    currentLine = word;
                } else {
                    for (let i = 0; i < word.length; i += maxLen) {
                        lines.push(word.substring(i, i + maxLen));
                    }
                }
            }
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines;
}

/**
 * Format currency value as PHP string
 */
function formatPhp(amount: number | string | undefined | null): string {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
    return `PHP ${isNaN(num) ? '0.00' : num.toFixed(2)}`;
}

/**
 * Generate standard ESC/POS binary receipt for MAKI DESU POS orders
 */
export function buildReceiptEscPos(data: ReceiptDataPayload, paperWidth: 58 | 80 = 58): Uint8Array {
    const builder = new EscPosBuilder(paperWidth);
    const cols = paperWidth === 80 ? 42 : 32;

    // ── 1. REPRINT BANNER IF APPLICABLE ──
    if (data.is_reprint) {
        builder.align('center');
        builder.bold(true);
        builder.line('*** REPRINT ***');
        if (data.reprint_reason) {
            builder.line(`Reason: ${data.reprint_reason}`);
        }
        if (data.reprinted_at) {
            builder.line(`Time: ${data.reprinted_at}`);
        }
        builder.bold(false);
        builder.separator('-');
    }

    // ── 2. BRANCH HEADER ONLY (Never "MAKI DESU") ──
    const branchHeading = formatReceiptBranchHeading(data.branch_name);
    builder.align('center');
    builder.separator('=');
    builder.size('double_height');
    builder.bold(true);
    builder.line(branchHeading);
    builder.size('normal');
    builder.bold(false);
    builder.separator('=');
    builder.feed(1);

    // ── 3. ORDER METADATA ──
    builder.align('left');
    builder.line(`Order #: ${data.order_number || 'N/A'}`);
    
    // Parse date and time cleanly
    let dateStr = data.date || '';
    let timeStr = data.time || '';
    if (!dateStr || !timeStr) {
        const rawDateTime = data.date_time;
        if (rawDateTime) {
            const parts = rawDateTime.split(' ');
            if (parts.length >= 4) {
                dateStr = `${parts[0]} ${parts[1]} ${parts[2]}`;
                timeStr = `${parts[3]} ${parts[4] || ''}`.trim();
            } else {
                dateStr = rawDateTime;
            }
        } else {
            const now = new Date();
            dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
    }

    builder.line(`Date: ${dateStr}`);
    if (timeStr) {
        builder.line(`Time: ${timeStr}`);
    }
    builder.line(`Type: ${(data.fulfillment_type || 'DINE-IN').toUpperCase()}`);

    if (data.scheduled_pickup_at) {
        builder.line(`Pickup: ${data.scheduled_pickup_at}`);
    }
    if (data.pickup_verification_code) {
        builder.line(`Pickup Code: ${data.pickup_verification_code}`);
    }
    if (data.cashier_name) {
        builder.line(`Cashier: ${data.cashier_name}`);
    }
    if (data.customer_name) {
        builder.line(`Customer: ${data.customer_name}`);
    }
    if (data.customer_phone) {
        builder.line(`Phone: ${data.customer_phone}`);
    }

    // ── 4. ITEMS SECTION ──
    builder.feed(1);
    builder.separator('-');
    builder.bold(true);
    builder.line('ITEMS');
    builder.bold(false);
    builder.separator('-');
    builder.feed(1);

    if (Array.isArray(data.items) && data.items.length > 0) {
        data.items.forEach((item: ReceiptItemPayload) => {
            const rawName = item.name 
                || (item as unknown as { product_name?: string }).product_name 
                || (item as unknown as { product?: { name?: string } }).product?.name 
                || 'Menu Item';
            const productName = String(rawName).trim() || 'Menu Item';
            const qty = Number(item.quantity) || 1;
            const unitPrice = item.unit_price !== undefined && item.unit_price !== null
                ? Number(item.unit_price)
                : (item.subtotal ? Number(item.subtotal) / qty : 0);
            const itemSubtotal = item.subtotal !== undefined && item.subtotal !== null
                ? Number(item.subtotal)
                : (qty * unitPrice);

            if (cols === 32) {
                // 1. Full product name wrapped naturally without truncation
                builder.bold(true);
                const nameLines = wrapText(productName, cols);
                nameLines.forEach(l => builder.line(l));
                builder.bold(false);

                // 2. QTY x Unit Price on left, Line Total on right
                const qtyPriceStr = `  ${qty} x ${formatPhp(unitPrice)}`;
                const lineTotalStr = formatPhp(itemSubtotal);
                builder.leftRight(qtyPriceStr, lineTotalStr);

                // 3. Print item add-ons / modifiers if any
                if (Array.isArray(item.addons) && item.addons.length > 0) {
                    item.addons.forEach(addon => {
                        const adQty = Number(addon.quantity) || 1;
                        const adQtyPrefix = adQty > 1 ? `${adQty}x ` : '';
                        const adUnitPrice = Number(addon.unit_price ?? addon.price ?? 0);
                        const adPriceVal = Number(addon.subtotal ?? (adUnitPrice * adQty));
                        
                        const addonNameLines = wrapText(`+ ${adQtyPrefix}${addon.name}`, cols - 2);
                        addonNameLines.forEach((l, lIdx) => {
                            if (adPriceVal > 0 && lIdx === addonNameLines.length - 1) {
                                builder.leftRight(`  ${l}`, `+${formatPhp(adPriceVal)}`);
                            } else {
                                builder.line(`  ${l}`);
                            }
                        });
                    });
                }
            } else {
                builder.bold(true);
                const nameLines = wrapText(productName, cols);
                nameLines.forEach(l => builder.line(l));
                builder.bold(false);
                const qtyPriceStr = `  ${qty} x ${formatPhp(unitPrice)}`;
                builder.leftRight(qtyPriceStr, formatPhp(itemSubtotal));

                if (Array.isArray(item.addons) && item.addons.length > 0) {
                    item.addons.forEach(addon => {
                        const adQty = (addon.quantity && addon.quantity > 1) ? `${addon.quantity}x ` : '';
                        const adPriceVal = addon.subtotal ?? (addon.price ? addon.price * (addon.quantity || 1) : 0);
                        const addonPrice = adPriceVal > 0 ? `+${formatPhp(adPriceVal)}` : '';
                        builder.leftRight(`  + ${adQty}${addon.name}`, addonPrice);
                    });
                }
            }
            builder.feed(1);
        });
    } else {
        builder.line('No items listed');
        builder.feed(1);
    }

    // ── 5. TOTALS & PAYMENT ──
    const subtotal = data.subtotal ?? 0;
    const discount = data.discount ?? 0;
    const deliveryFee = data.delivery_fee ?? 0;
    const total = data.total ?? subtotal;
    const paid = data.paid_amount ?? total;
    const change = data.change_amount ?? Math.max(0, paid - total);

    builder.separator('-');
    builder.leftRight('Subtotal', formatPhp(subtotal));

    if (discount > 0) {
        const discountLabel = data.discount_type ? `Discount (${data.discount_type.replace(/_/g, ' ').toUpperCase()})` : 'Discount';
        builder.leftRight(discountLabel, `-${formatPhp(discount)}`);
    }

    if (deliveryFee > 0) {
        builder.leftRight('Delivery Fee', `+${formatPhp(deliveryFee)}`);
    }

    builder.separator('-');
    builder.bold(true);
    builder.size('double_height');
    builder.leftRight('TOTAL', formatPhp(total));
    builder.size('normal');
    builder.bold(false);
    builder.separator('-');
    builder.feed(1);

    const payMethod = (data.payment_method || 'CASH').toUpperCase();
    builder.line(`Payment: ${payMethod}`);
    if (payMethod === 'CASH') {
        builder.leftRight('Cash Received', formatPhp(paid));
        builder.bold(true);
        builder.leftRight('Change', formatPhp(change));
        builder.bold(false);
    } else {
        builder.bold(true);
        builder.leftRight('Paid Amount', formatPhp(paid));
        builder.bold(false);
    }

    builder.feed(1);
    builder.separator('=');

    // ── 6. FOOTER ──
    builder.align('center');
    builder.bold(true);
    builder.line('THANK YOU!');
    builder.bold(false);
    builder.separator('=');

    if (data.is_reprint) {
        builder.line('*** END OF REPRINT ***');
    }
    builder.feed(1);

    // Cut paper
    builder.cut(false);

    return builder.build();
}

/**
 * Generate standard 58mm/80mm ESC/POS test receipt for diagnostic hardware verification
 */
export function buildTestReceiptEscPos(
    branchName = 'VICTORIA',
    paperWidth: 58 | 80 = 58,
    connectionType = 'Direct USB'
): Uint8Array {
    const builder = new EscPosBuilder(paperWidth);
    const branchHeading = formatReceiptBranchHeading(branchName);

    builder.align('center');
    builder.separator('=');
    builder.size('double_height');
    builder.bold(true);
    builder.line(branchHeading);
    builder.size('normal');
    builder.bold(false);
    builder.separator('=');
    builder.feed(1);

    builder.bold(true);
    builder.line('THERMAL PRINTER TEST');
    builder.bold(false);
    builder.separator('-');

    builder.align('left');
    builder.leftRight('Date/Time:', new Date().toLocaleTimeString('en-PH'));
    builder.leftRight('Interface:', connectionType);
    builder.leftRight('Paper Width:', `${paperWidth}mm (${builder['cols']} cols)`);
    builder.leftRight('Hardware Status:', 'CONNECTED');
    builder.separator('-');

    builder.bold(true);
    builder.line('ITEMS');
    builder.bold(false);
    builder.separator('-');

    builder.bold(true);
    builder.line('Sample Roll');
    builder.bold(false);
    builder.leftRight('  1 x PHP 150.00', 'PHP 150.00');

    builder.bold(true);
    builder.line('Green Tea');
    builder.bold(false);
    builder.leftRight('  1 x PHP 45.00', 'PHP 45.00');
    builder.separator('-');

    builder.bold(true);
    builder.size('double_height');
    builder.leftRight('SAMPLE TOTAL:', 'PHP 195.00');
    builder.size('normal');
    builder.bold(false);

    builder.separator('=');
    builder.align('center');
    builder.bold(true);
    builder.line('TEST PRINT SUCCESSFUL!');
    builder.bold(false);
    builder.line('Direct thermal stream is ready.');

    builder.cut(false);

    return builder.build();
}
