import React, { useState, useEffect, useRef } from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface PosCartQuantityInputProps {
    item: {
        id: number;
        name: string;
        quantity: number;
        unit?: string;
        [key: string]: unknown;
    };
    cartIndex: number;
    maxStock: number;
    otherQtyInCart: number;
    disabled?: boolean;
    onUpdateQuantity: (cartIndex: number, newQty: number) => void;
    onDelta: (cartIndex: number, delta: number) => void;
}

export const PosCartQuantityInput: React.FC<PosCartQuantityInputProps> = ({
    item,
    cartIndex,
    maxStock,
    otherQtyInCart,
    disabled = false,
    onUpdateQuantity,
    onDelta,
}) => {
    // Effective maximum allowed for THIS line item in cart
    const maxAllowed = Math.max(0, maxStock - otherQtyInCart);
    const [localVal, setLocalVal] = useState<string>(String(item.quantity));
    const [inlineError, setInlineError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local input value when item.quantity changes from outside
    useEffect(() => {
        setLocalVal(String(item.quantity));
        setInlineError(null);
    }, [item.quantity]);

    const isMinusDisabled = disabled || item.quantity <= 1;
    const isPlusDisabled = disabled || item.quantity >= maxAllowed || maxAllowed <= 0;

    const commitValue = () => {
        const trimmed = localVal.trim();

        // 1. If blank or empty, revert back to previous valid quantity or 1
        if (trimmed === '') {
            toast.warning(`Quantity cannot be empty. Restoring to ${item.quantity || 1}.`);
            setLocalVal(String(item.quantity || 1));
            setInlineError(null);
            if (item.quantity < 1) {
                onUpdateQuantity(cartIndex, 1);
            }
            return;
        }

        const parsed = parseInt(trimmed, 10);

        // 2. Reject non-numeric, 0, or negative numbers
        if (isNaN(parsed) || parsed <= 0) {
            toast.warning(`Quantity must be at least 1 for ${item.name}.`);
            setInlineError('Min: 1');
            setLocalVal(String(item.quantity || 1));
            return;
        }

        // 3. Reject exceeding available stock
        if (parsed > maxAllowed) {
            toast.warning(`Insufficient stock. Only ${maxAllowed} units are available.`);
            setInlineError(`Max: ${maxAllowed}`);
            setLocalVal(String(item.quantity));
            return;
        }

        // 4. Valid positive integer within stock limit
        setInlineError(null);
        setLocalVal(String(parsed));
        if (parsed !== item.quantity) {
            onUpdateQuantity(cartIndex, parsed);
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
        setInlineError(null);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').trim();

        // Strict whole-number integer digits only
        if (!/^\d+$/.test(text)) {
            toast.warning('Invalid quantity. Only whole numbers are accepted.');
            setInlineError('Whole numbers only');
            return;
        }

        const parsed = parseInt(text, 10);
        if (parsed <= 0) {
            toast.warning('Quantity must be at least 1.');
            setInlineError('Min: 1');
            return;
        }

        if (parsed > maxAllowed) {
            toast.warning(`Insufficient stock. Only ${maxAllowed} units are available.`);
            setInlineError(`Max: ${maxAllowed}`);
            return;
        }

        setInlineError(null);
        setLocalVal(String(parsed));
        onUpdateQuantity(cartIndex, parsed);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // Allow empty string temporarily so the cashier can backspace and type fresh digits
        if (val === '') {
            setLocalVal('');
            setInlineError('Required');
            return;
        }

        // Strict whole-number digits only (reject '-', '+', 'e', '.', letters, symbols)
        if (!/^\d+$/.test(val)) {
            toast.warning('Only positive whole numbers are accepted.');
            return;
        }

        // Strip leading zeros if multi-digit (e.g., "05" -> "5")
        const sanitized = val.length > 1 && val.startsWith('0') ? String(parseInt(val, 10)) : val;
        const parsed = parseInt(sanitized, 10);

        if (parsed <= 0) {
            toast.warning('Quantity must be at least 1.');
            setInlineError('Min: 1');
            setLocalVal('1');
            onUpdateQuantity(cartIndex, 1);
            return;
        }

        // IMMEDIATE VALIDATION: Reject typing excessive quantity immediately
        if (parsed > maxAllowed) {
            toast.warning(`Insufficient stock. Only ${maxAllowed} units are available.`);
            setInlineError(`Max: ${maxAllowed}`);
            // Keep local input at existing valid value
            setLocalVal(String(item.quantity));
            return;
        }

        setInlineError(null);
        setLocalVal(sanitized);
        onUpdateQuantity(cartIndex, parsed);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitValue();
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setLocalVal(String(item.quantity));
            setInlineError(null);
            inputRef.current?.blur();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (item.quantity < maxAllowed) {
                onDelta(cartIndex, 1);
            } else {
                toast.warning(`Insufficient stock. Only ${maxAllowed} units are available.`);
                setInlineError(`Max: ${maxAllowed}`);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (item.quantity > 1) {
                onDelta(cartIndex, -1);
            }
        }
    };

    const handleMinusClick = () => {
        if (isMinusDisabled) return;
        setInlineError(null);
        onDelta(cartIndex, -1);
    };

    const handlePlusClick = () => {
        if (item.quantity >= maxAllowed) {
            toast.warning(`Insufficient stock. Only ${maxAllowed} units are available.`);
            setInlineError(`Max: ${maxAllowed}`);
            return;
        }
        setInlineError(null);
        onDelta(cartIndex, 1);
    };

    return (
        <div className="flex flex-col items-center">
            {/* Control container: [ − ] [ 150 ] [ + ] */}
            <div className={cn(
                "flex items-center bg-[#FFF5F7] dark:bg-[#1E1E21] rounded-xl border p-1 transition-all gap-1",
                inlineError
                    ? "border-rose-400 dark:border-rose-800 ring-2 ring-rose-500/20"
                    : "border-[#F8C8DC]/60 dark:border-[#26262A]"
            )}>
                {/* Minus Button */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isMinusDisabled}
                    className={cn(
                        "size-8 rounded-lg text-[#3D2C2E] dark:text-zinc-300 transition-all",
                        isMinusDisabled
                            ? "opacity-35 cursor-not-allowed hover:bg-transparent"
                            : "hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xs active:scale-95 cursor-pointer"
                    )}
                    onClick={handleMinusClick}
                    aria-label={`Decrease quantity for ${item.name}`}
                    title={item.quantity <= 1 ? "Minimum quantity is 1 (use trash button to remove)" : "Decrease quantity"}
                >
                    <FiMinus className="size-3.5" />
                </Button>

                {/* Manually Editable Numeric Input */}
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={localVal}
                    disabled={disabled}
                    onChange={handleChange}
                    onPaste={handlePaste}
                    onFocus={handleFocus}
                    onBlur={commitValue}
                    onKeyDown={handleKeyDown}
                    aria-label={`Quantity for ${item.name}`}
                    title={`Enter quantity (1 - ${maxAllowed})`}
                    className={cn(
                        "w-14 sm:w-16 h-8 text-center font-black text-sm rounded-lg transition-all select-all",
                        "bg-white dark:bg-zinc-900 border text-[#3D2C2E] dark:text-white shadow-2xs",
                        inlineError
                            ? "border-rose-500 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20"
                            : "border-[#F8C8DC]/80 dark:border-zinc-700 hover:border-[#E75480] focus:border-[#E75480] dark:focus:border-[#FF4F81] focus:ring-2 focus:ring-[#E75480]/20",
                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        "focus:outline-none",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />

                {/* Plus Button */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPlusDisabled}
                    className={cn(
                        "size-8 rounded-lg text-[#3D2C2E] dark:text-zinc-300 transition-all",
                        isPlusDisabled
                            ? "opacity-35 cursor-not-allowed hover:bg-transparent"
                            : "hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xs active:scale-95 cursor-pointer"
                    )}
                    onClick={handlePlusClick}
                    aria-label={`Increase quantity for ${item.name}`}
                    title={item.quantity >= maxAllowed ? `Maximum available stock (${maxStock}) reached` : "Increase quantity"}
                >
                    <FiPlus className="size-3.5" />
                </Button>
            </div>

            {/* Contextual stock indicator / validation message */}
            <div className="min-h-3.5 mt-0.5 flex items-center justify-center">
                {inlineError ? (
                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 animate-pulse tracking-tight">
                        {inlineError}
                    </span>
                ) : item.quantity >= maxAllowed && maxAllowed > 0 ? (
                    <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                        MAX STOCK ({maxStock})
                    </span>
                ) : maxStock > 0 ? (
                    <span className="text-[9px] text-[#7D6B6E]/70 dark:text-zinc-400 font-semibold">
                        Max: {maxAllowed}
                    </span>
                ) : (
                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">
                        Out of stock
                    </span>
                )}
            </div>
        </div>
    );
};

