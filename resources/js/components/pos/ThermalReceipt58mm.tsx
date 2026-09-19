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
        return null;
    }

    const branchName = formatReceiptBranchHeading(receiptData?.branch_name);
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
                            margin: 0 !important;
                            padding: 3mm 2mm 8mm 2mm !important;
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
                className={`w-[58mm] max-w-[58mm] p-2 bg-white text-black font-mono text-[11px] leading-tight select-none box-border ${
                    isPrintOnly ? 'hidden print:block' : ''
                } ${className}`}
            >
                {/* Reprint Banner */}
                {isReprint && (
                    <div className="text-center font-bold pb-1 border-b border-dashed border-black mb-1">
                        <div>*** REPRINT ***</div>
                        {reprintReason && <div className="text-[9.5px]">Reason: {reprintReason}</div>}
                        {reprintedAt && <div className="text-[9.5px]">Time: {reprintedAt}</div>}
                    </div>
                )}

                {/* Header / Store Info */}
                <div className="text-center space-y-0.5 pb-1.5">
                    <div className="font-extrabold text-[13px] tracking-wider uppercase">
                        {branchName}
                    </div>
                    {branchAddress && (
                        <div className="text-[9.5px] leading-tight text-gray-700">
                            {branchAddress}
                        </div>
                    )}
                </div>

                <div className="border-t border-dashed border-black my-1" />

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

                    {receiptData?.customer_name && (
                        <div>Customer: {receiptData.customer_name}</div>
                    )}
                    {receiptData?.customer_phone && (
                        <div>Phone: {receiptData.customer_phone}</div>
                    )}
                    {receiptData?.customer_address && (
                        <div className="text-[9.5px] leading-tight">
                            Addr: {receiptData.customer_address}
                        </div>
                    )}
                </div>

                <div className="border-t border-dashed border-black my-1" />

                {/* If plain text fallback only */}
                {!receiptData && formattedText ? (
                    <pre className="whitespace-pre-wrap font-mono text-[10px] leading-tight">
                        {formattedText}
                    </pre>
                ) : (
                    <>
                        {/* Items Column Header */}
                        <div className="flex justify-between font-bold text-[10.5px] pb-0.5">
                            <span>Item (Qty)</span>
                            <span className="text-right">Price</span>
                        </div>
                        <div className="border-t border-black my-0.5" />

                        {/* Items List */}
                        <div className="space-y-1 my-1">
                            {items.map((item, idx) => (
                                <div key={idx} className="space-y-0.5">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold flex-1 pr-1 wrap-break-word">
                                            {item.name} <span className="font-normal text-[10px]">x{item.quantity}</span>
                                        </span>
                                        <span className="font-bold shrink-0 text-right">
                                            {formatCurrency(item.subtotal)}
                                        </span>
                                    </div>

                                    {/* Addons / Modifiers */}
                                    {item.addons && item.addons.length > 0 && (
                                        <div className="pl-2 space-y-0.5 text-[9.5px] text-gray-700">
                                            {item.addons.map((ad, adIdx) => (
                                                <div key={adIdx} className="flex justify-between">
                                                    <span>+ {ad.name}</span>
                                                    {ad.price > 0 && (
                                                        <span>+{formatCurrency(ad.price)}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-dashed border-black my-1" />

                        {/* Totals Section */}
                        <div className="space-y-0.5 text-[10.5px]">
                            {(discount > 0 || deliveryFee > 0) && (
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                            )}

                            {discount > 0 && (
                                <div className="flex justify-between font-bold">
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

                            <div className="flex justify-between font-extrabold text-[12px] pt-1 border-t border-black">
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

                        <div className="border-t border-dashed border-black my-1.5" />

                        {/* Footer */}
                        <div className="text-center space-y-0.5 pt-0.5 text-[10px]">
                            <div className="font-bold">Thank you for dining with us!</div>
                            <div>Please come again</div>
                            {isReprint && (
                                <div className="text-[9px] pt-1 font-bold">*** END OF REPRINT ***</div>
                            )}
                        </div>
                    </>
                )}

                {/* Extra feed spacing for physical tear-off bar */}
                <div className="h-6 print:h-8" />
            </div>
        </>
    );
};

export default ThermalReceipt58mm;
