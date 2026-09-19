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

    // ── 1. HEADER ──
    const branchHeading = formatReceiptBranchHeading(data.branch_name);
    builder.align('center');
    builder.size('double_height');
    builder.bold(true);
    builder.line(branchHeading);
    builder.size('normal');
    builder.bold(false);

    if (data.branch_address) {
        builder.line(data.branch_address);
    }

    builder.separator('=');

    // ── 2. ORDER META ──
    if (data.is_reprint) {
        builder.bold(true);
        builder.line('*** OFFICIAL REPRINT ***');
        if (data.reprint_reason) {
            builder.line(`Reason: ${data.reprint_reason}`);
        }
        builder.bold(false);
        builder.separator('-');
    }

    builder.align('left');
    builder.leftRight(`Order #: ${data.order_number || 'N/A'}`, (data.fulfillment_type || 'Dine-In').toUpperCase());
    builder.line(`Date: ${data.date_time || new Date().toLocaleString('en-PH')}`);

    if (data.cashier_name) {
        builder.line(`Cashier: ${data.cashier_name}`);
    }

    // Customer delivery details if present
    if (data.customer_name) {
        builder.separator('-');
        builder.line(`Customer: ${data.customer_name}`);
        if (data.customer_phone) builder.line(`Phone: ${data.customer_phone}`);
        if (data.customer_address) builder.line(`Address: ${data.customer_address}`);
    }

    builder.separator('=');

    // ── 3. ITEMS TABLE ──
    builder.bold(true);
    builder.leftRight('Item (Qty)', 'Price');
    builder.bold(false);
    builder.separator('-');

    if (Array.isArray(data.items) && data.items.length > 0) {
        data.items.forEach((item: ReceiptItemPayload) => {
            const itemSubtotal = item.subtotal ?? (item.quantity * item.unit_price);
            builder.itemRow(item.name, item.quantity, formatPhp(itemSubtotal));

            // Print item add-ons / modifiers if any
            if (Array.isArray(item.addons) && item.addons.length > 0) {
                item.addons.forEach(addon => {
                    const addonPrice = addon.price > 0 ? `+${formatPhp(addon.price)}` : '';
                    builder.leftRight(`  + ${addon.name}`, addonPrice);
                });
            }
        });
    } else {
        builder.line('No items listed');
    }

    builder.separator('-');

    // ── 4. TOTALS & PAYMENT ──
    const subtotal = data.subtotal ?? 0;
    const discount = data.discount ?? 0;
    const deliveryFee = data.delivery_fee ?? 0;
    const total = data.total ?? subtotal;
    const paid = data.paid_amount ?? total;
    const change = data.change_amount ?? 0;

    if (discount > 0 || deliveryFee > 0) {
        builder.leftRight('Subtotal', formatPhp(subtotal));
    }

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

    builder.leftRight(`${(data.payment_method || 'CASH').toUpperCase()} Paid`, formatPhp(paid));
    if (change > 0 || (data.payment_method || 'CASH').toUpperCase() === 'CASH') {
        builder.bold(true);
        builder.leftRight('Change', formatPhp(change));
        builder.bold(false);
    }

    builder.separator('=');

    // ── 5. FOOTER ──
    builder.align('center');
    builder.line('Thank you for dining with us!');
    builder.line('Please come again.');
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
    builder.size('double_height');
    builder.bold(true);
    builder.line(branchHeading);
    builder.size('normal');
    builder.bold(false);
    builder.separator('=');

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
    builder.leftRight('ITEM', 'PRICE');
    builder.bold(false);
    builder.separator('-');
    builder.leftRight('Sample Roll x1', 'PHP 150.00');
    builder.leftRight('Green Tea x1', 'PHP 45.00');
    builder.separator('-');
    builder.bold(true);
    builder.leftRight('SAMPLE TOTAL:', 'PHP 195.00');
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
