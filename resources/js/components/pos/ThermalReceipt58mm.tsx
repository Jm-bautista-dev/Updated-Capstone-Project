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
    const branchNameDisplay = branchHeading.toUpperCase().endsWith('BRANCH') 
        ? branchHeading.toUpperCase() 
        : `${branchHeading.toUpperCase()} BRANCH`;
    const branchAddress = receiptData?.branch_address;
    const orderNumber = receiptData?.order_number || 'POS-ORDER';
    const dateTime = receiptData?.date_time || new Date().toLocaleString('en-PH');
    const fulfillmentType = (receiptData?.fulfillment_type || 'DINE-IN').toUpperCase();
    const cashierName = receiptData?.cashier_name || 'Staff';
    const items = receiptData?.items || [];
    const subtotal = receiptData?.subtotal ?? 0;
    const discount = receiptData?.discount ?? 0;
    const discountType = receiptData?.discount_type;
    const deliveryFee = receiptData?.delivery_fee ?? 0;
    const total = receiptData?.total ?? 0;
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
                            min-height: 110mm !important;
                            margin: 0 !important;
                            padding: 4mm 3mm 12mm 3mm !important;
                            display: flex !important;
                            flex-direction: column !important;
                            justify-content: space-between !important;
                            background: #ffffff !important;
                            color: #000000 !important;
                            font-family: 'Courier New', Courier, monospace !important;
                            font-size: 11px !important;
                            line-height: 1.3 !important;
                            box-sizing: border-box !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                `
            }} />

            <div
                id="thermal-receipt-58mm"
                className={`w-[58mm] max-w-[58mm] min-h-95 p-3 bg-white text-black font-mono text-[11px] leading-tight select-none box-border flex flex-col justify-between ${
                    isPrintOnly ? 'hidden print:flex' : ''
                } ${className}`}
            >
                <div>
                    {/* Reprint Banner */}
                    {isReprint && (
                        <div className="text-center font-bold pb-1.5 border-b border-dashed border-black mb-1.5">
                            <div>*** OFFICIAL REPRINT ***</div>
                            {reprintReason && <div className="text-[9.5px]">Reason: {reprintReason}</div>}
                            {reprintedAt && <div className="text-[9.5px]">Time: {reprintedAt}</div>}
                        </div>
                    )}

                    {/* Header / Store Info */}
                    <div className="text-center space-y-0.5 pb-2">
                        <div className="font-extrabold text-[14px] tracking-wider uppercase text-black">
                            MAKI DESU
                        </div>
                        <div className="text-[10px] font-medium text-gray-700 uppercase tracking-wide">
                            Japanese Restaurant
                        </div>
                        <div className="font-bold text-[11.5px] tracking-wide uppercase text-black">
                            {branchNameDisplay}
                        </div>
                        {branchAddress && (
                            <div className="text-[9.5px] leading-tight text-gray-600 px-1 pt-0.5">
                                {branchAddress}
                            </div>
                        )}
                    </div>

                    <div className="border-t-2 border-double border-black my-1" />

                    {/* Transaction Metadata */}
                    <div className="space-y-0.5 text-[10.5px]">
                        <div className="flex justify-between items-center font-bold">
                            <span>Order #: {orderNumber}</span>
                            <span className="uppercase text-[9.5px] bg-black text-white px-1 rounded-xs">
                                {fulfillmentType}
                            </span>
                        </div>
                        <div>Date: {dateTime}</div>
                        <div>Cashier: {cashierName}</div>

                        {receiptData?.scheduled_pickup_at && (
                            <div>Pickup: {receiptData.scheduled_pickup_at}</div>
                        )}
                        {receiptData?.pickup_verification_code && (
                            <div>Code: {receiptData.pickup_verification_code}</div>
                        )}

                        {receiptData?.customer_name && (
                            <div>Customer: {receiptData.customer_name}</div>
                        )}
                        {receiptData?.customer_phone && (
                            <div>Phone: {receiptData.customer_phone}</div>
                        )}
                    </div>

                    <div className="border-t border-dashed border-black my-1.5" />

                    {/* If plain text fallback only */}
                    {!receiptData && formattedText ? (
                        <pre className="whitespace-pre-wrap font-mono text-[10px] leading-tight">
                            {formattedText}
                        </pre>
                    ) : (
                        <>
                            {/* Items Column Header */}
                            <div className="font-bold text-[10.5px]">ITEM</div>
                            <div className="flex justify-between font-bold text-[10px] pb-0.5 text-gray-700">
                                <span>QTY x PRICE</span>
                                <span className="text-right">TOTAL</span>
                            </div>
                            <div className="border-t border-black my-0.5" />

                            {/* Items List */}
                            <div className="space-y-1.5 my-1">
                                {items.map((item, idx) => {
                                    const qty = item.quantity || 1;
                                    const unitPrice = item.unit_price ?? (item.subtotal ? Number(item.subtotal) / Number(qty) : 0);
                                    return (
                                        <div key={idx} className="space-y-0.5">
                                            {/* Full Product Name (Wraps naturally, never truncated) */}
                                            <div className="font-bold text-[11px] leading-tight wrap-break-word text-black">
                                                {item.name}
                                            </div>

                                            {/* Quantity x Unit Price & Line Total */}
                                            <div className="flex justify-between items-center text-[10.5px]">
                                                <span className="text-gray-800">
                                                    {qty} x {formatCurrency(unitPrice)}
                                                </span>
                                                <span className="font-bold text-black text-right shrink-0">
                                                    {formatCurrency(item.subtotal)}
                                                </span>
                                            </div>

                                            {/* Addons / Modifiers */}
                                            {item.addons && item.addons.length > 0 && (
                                                <div className="pl-2 space-y-0.5 text-[9.5px] text-gray-700">
                                                    {item.addons.map((ad, adIdx) => {
                                                        const adQty = ad.quantity ?? 1;
                                                        const adUnitPrice = ad.unit_price ?? ad.price ?? 0;
                                                        const adPrice = ad.subtotal ?? (adUnitPrice * adQty);
                                                        const adQtyPrefix = adQty > 1 ? `${adQty}x ` : '';
                                                        return (
                                                            <div key={adIdx} className="space-y-0.5">
                                                                <div className="wrap-break-word font-medium">+ {adQtyPrefix}{ad.name}</div>
                                                                {adPrice > 0 && (
                                                                    <div className="flex justify-between text-[9px] text-gray-600 pl-2">
                                                                        <span>{adQty} x {formatCurrency(adUnitPrice)}</span>
                                                                        <span className="font-semibold text-black">+{formatCurrency(adPrice)}</span>
                                                                    </div>
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
                                {(discount > 0 || deliveryFee > 0) && (
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                )}

                                {discount > 0 && (
                                    <div className="flex justify-between font-bold text-black">
                                        <span>Discount {discountType ? `(${discountType.replace(/_/g, ' ').toUpperCase()})` : ''}</span>
                                        <span>-{formatCurrency(discount)}</span>
                                    </div>
                                )}

                                {deliveryFee > 0 && (
                                    <div className="flex justify-between">
                                        <span>Delivery Fee</span>
                                        <span>+{formatCurrency(deliveryFee)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between font-extrabold text-[12.5px] pt-1 pb-0.5 border-y border-black my-1">
                                    <span>TOTAL</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-black my-1" />

                            {/* Payment & Change */}
                            <div className="space-y-0.5 text-[10.5px]">
                                <div className="flex justify-between">
                                    <span>{paymentMethod} Paid</span>
                                    <span>{formatCurrency(paidAmount)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Change</span>
                                    <span>{formatCurrency(changeAmount)}</span>
                                </div>
                            </div>

                            <div className="border-t-2 border-double border-black my-2" />
                        </>
                    )}
                </div>

                {/* Footer Section */}
                <div className="pt-2">
                    <div className="text-center space-y-0.5 text-[10px]">
                        <div className="font-bold">Thank you for dining with us!</div>
                        <div>Please come again</div>
                        {isReprint && (
                            <div className="text-[9px] pt-1 font-bold">*** END OF REPRINT ***</div>
                        )}
                    </div>
                    {/* Extra feed spacing for physical tear-off bar */}
                    <div className="h-6 print:h-10" />
                </div>
            </div>
        </>
    );
};

export default ThermalReceipt58mm;
