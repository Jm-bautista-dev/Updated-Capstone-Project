import React from 'react';
import type { ReceiptDataPayload } from '@/lib/pos-print-bridge';
import { formatCurrency, formatReceiptBranchHeading } from '@/lib/utils';

export interface ThermalReceipt58mmProps {
    receiptData?: ReceiptDataPayload | null;
    formattedText?: string | null;
    className?: string;
    isPrintOnly?: boolean;
}

export const ThermalReceipt58mm: React.FC<ThermalReceipt58mmProps> = ({
    receiptData,
    formattedText,
    className = '',
    isPrintOnly = false,
}) => {
    if (!receiptData && !formattedText) {
        if (isPrintOnly) {
            return null;
        }
        return (
            <div className={`w-[58mm] max-w-[58mm] p-4 bg-white text-gray-500 font-mono text-xs text-center border border-dashed border-gray-300 rounded-lg ${className}`}>
                Receipt details unavailable.
            </div>
        );
    }

    const rawBranch = receiptData?.branch_name || 'VICTORIA';
    const branchHeading = formatReceiptBranchHeading(rawBranch);
    const orderNumber = receiptData?.order_number || 'POS-ORDER';
    
    // Parse date and time cleanly
    let dateDisplay = receiptData?.date || '';
    let timeDisplay = receiptData?.time || '';
    if (!dateDisplay || !timeDisplay) {
        const rawDateTime = receiptData?.date_time;
        if (rawDateTime) {
            const parts = rawDateTime.split(' ');
            if (parts.length >= 4) {
                // e.g. "Oct 03, 2026 08:42 PM" -> date: "Oct 03, 2026", time: "08:42 PM"
                dateDisplay = `${parts[0]} ${parts[1]} ${parts[2]}`;
                timeDisplay = `${parts[3]} ${parts[4] || ''}`.trim();
            } else {
                dateDisplay = rawDateTime;
            }
        } else {
            const now = new Date();
            dateDisplay = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            timeDisplay = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
    }

    const fulfillmentType = (receiptData?.fulfillment_type || 'DINE-IN').toUpperCase();
    const cashierName = receiptData?.cashier_name;
    const customerName = receiptData?.customer_name;
    const customerPhone = receiptData?.customer_phone;
    const items = receiptData?.items || [];
    const subtotal = receiptData?.subtotal ?? 0;
    const discount = receiptData?.discount ?? 0;
    const discountType = receiptData?.discount_type;
    const deliveryFee = receiptData?.delivery_fee ?? 0;
    const total = receiptData?.total ?? subtotal;
    const paidAmount = receiptData?.paid_amount ?? total;
    const changeAmount = receiptData?.change_amount ?? Math.max(0, paidAmount - total);
    const paymentMethod = (receiptData?.payment_method || 'CASH').toUpperCase();
    const isReprint = receiptData?.is_reprint || false;
    const reprintReason = receiptData?.reprint_reason;
    const reprintedAt = receiptData?.reprinted_at;

    return (
        <>
            {/* Scoped CSS for 58mm Thermal Printing */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @media print {
                        @page {
                            size: 58mm auto;
                            margin: 0mm;
                        }
                        html, body {
                            width: 58mm !important;
                            max-width: 58mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #fff !important;
                        }
                        body * {
                            visibility: hidden !important;
                        }
                        #thermal-receipt-58mm, #thermal-receipt-58mm * {
                            visibility: visible !important;
                        }
                        #thermal-receipt-58mm {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 58mm !important;
                            max-width: 58mm !important;
                            margin: 0 !important;
                            padding: 2mm 2mm 8mm 2mm !important;
                            display: block !important;
                            background: #ffffff !important;
                            color: #000000 !important;
                            font-family: 'Courier New', Courier, monospace !important;
                            font-size: 11px !important;
                            line-height: 1.25 !important;
                            box-sizing: border-box !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                `
            }} />

            <div
                id="thermal-receipt-58mm"
                className={`w-[58mm] max-w-[58mm] p-2.5 bg-white text-black font-mono text-[11px] leading-tight select-none box-border flex flex-col justify-between ${
                    isPrintOnly ? 'hidden print:block' : ''
                } ${className}`}
            >
                <div>
                    {/* Reprint Banner */}
                    {isReprint && (
                        <div className="text-center font-bold pb-1 border-b border-dashed border-black mb-1.5 text-[10px]">
                            <div>*** REPRINT ***</div>
                            {reprintReason && <div>Reason: {reprintReason}</div>}
                            {reprintedAt && <div>Time: {reprintedAt}</div>}
                        </div>
                    )}

                    {/* Branch Header ONLY (Never "MAKI DESU") */}
                    <div className="border-t-2 border-b-2 border-black py-1.5 text-center my-1">
                        <div className="font-extrabold text-[15px] tracking-widest uppercase text-black">
                            {branchHeading}
                        </div>
                    </div>

                    {/* Order Metadata */}
                    <div className="space-y-0.5 text-[10.5px] pt-1.5 pb-1">
                        <div className="font-bold">Order #: {orderNumber}</div>
                        <div>Date: {dateDisplay}</div>
                        {timeDisplay && <div>Time: {timeDisplay}</div>}
                        <div>Type: {fulfillmentType}</div>

                        {receiptData?.scheduled_pickup_at && (
                            <div>Pickup: {receiptData.scheduled_pickup_at}</div>
                        )}
                        {receiptData?.pickup_verification_code && (
                            <div>Pickup Code: {receiptData.pickup_verification_code}</div>
                        )}

                        {cashierName && <div>Cashier: {cashierName}</div>}
                        {customerName && <div>Customer: {customerName}</div>}
                        {customerPhone && <div>Phone: {customerPhone}</div>}
                    </div>

                    {/* If plain text fallback only */}
                    {!receiptData && formattedText ? (
                        <pre className="whitespace-pre-wrap font-mono text-[10px] leading-tight mt-2">
                            {formattedText}
                        </pre>
                    ) : (
                        <>
                            {/* Items Section Header */}
                            <div className="border-t border-dashed border-black my-1" />
                            <div className="font-bold text-[11px] py-0.5 tracking-wider">ITEMS</div>
                            <div className="border-t border-dashed border-black my-1" />

                            {/* Items List */}
                            <div className="space-y-2 my-1.5">
                                {items.map((item, idx) => {
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

                                    return (
                                        <div key={idx} className="space-y-0.5">
                                            {/* Product Name (Always rendered, natural word wrap, never truncated) */}
                                            <div className="font-bold text-[11px] leading-snug wrap-break-word text-black">
                                                {productName}
                                            </div>

                                            {/* Quantity x Unit Price & Line Total */}
                                            <div className="flex justify-between items-center text-[10.5px] pl-2">
                                                <span className="text-gray-800">
                                                    {qty} x {formatCurrency(unitPrice)}
                                                </span>
                                                <span className="font-bold text-black text-right shrink-0 font-mono">
                                                    {formatCurrency(itemSubtotal)}
                                                </span>
                                            </div>

                                            {/* Add-ons / Modifiers */}
                                            {item.addons && item.addons.length > 0 && (
                                                <div className="pl-3 space-y-0.5 text-[9.5px] text-gray-700">
                                                    {item.addons.map((ad, adIdx) => {
                                                        const adQty = Number(ad.quantity) || 1;
                                                        const adUnitPrice = Number(ad.unit_price ?? ad.price ?? 0);
                                                        const adPrice = Number(ad.subtotal ?? (adUnitPrice * adQty));
                                                        const adQtyPrefix = adQty > 1 ? `${adQty}x ` : '';
                                                        return (
                                                             <div key={adIdx} className="flex justify-between items-center">
                                                                <span className="wrap-break-word">+ {adQtyPrefix}{ad.name}</span>
                                                                {adPrice > 0 && (
                                                                    <span className="font-semibold text-black text-right shrink-0 font-mono">
                                                                        +{formatCurrency(adPrice)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-dashed border-black my-1.5" />

                            {/* Totals Section */}
                            <div className="space-y-0.5 text-[10.5px]">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between font-bold text-black">
                                        <span>Discount {discountType ? `(${discountType.replace(/_/g, ' ').toUpperCase()})` : ''}</span>
                                        <span className="font-mono">-{formatCurrency(discount)}</span>
                                    </div>
                                )}

                                {deliveryFee > 0 && (
                                    <div className="flex justify-between">
                                        <span>Delivery Fee</span>
                                        <span className="font-mono">+{formatCurrency(deliveryFee)}</span>
                                    </div>
                                )}

                                <div className="border-t border-dashed border-black my-1" />

                                <div className="flex justify-between font-extrabold text-[12px] py-0.5">
                                    <span>TOTAL</span>
                                    <span className="font-mono">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-black my-1.5" />

                            {/* Payment & Change */}
                            <div className="space-y-0.5 text-[10.5px]">
                                <div>Payment: {paymentMethod}</div>
                                {paymentMethod === 'CASH' ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Cash Received</span>
                                            <span className="font-mono">{formatCurrency(paidAmount)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span>Change</span>
                                            <span className="font-mono">{formatCurrency(changeAmount)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between font-bold">
                                        <span>Paid Amount</span>
                                        <span className="font-mono">{formatCurrency(paidAmount)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer Section */}
                            <div className="border-t-2 border-b-2 border-black py-1.5 text-center my-2">
                                <div className="font-extrabold text-[12px] tracking-wider uppercase">
                                    THANK YOU!
                                </div>
                            </div>

                            {isReprint && (
                                <div className="text-center text-[9.5px] font-bold pb-1">
                                    *** END OF REPRINT ***
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Feed padding for physical thermal tear-off */}
                <div className="h-4 print:h-8" />
            </div>
        </>
    );
};

export default ThermalReceipt58mm;
