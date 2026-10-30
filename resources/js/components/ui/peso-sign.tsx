import React from 'react';
import { cn } from '@/lib/utils';

export interface PesoSignProps extends React.HTMLAttributes<HTMLSpanElement> {
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * Philippine Peso Symbol (₱) Icon Component.
 * Standardized typography-based currency marker matching Lucide icon sizing, alignment, and bounding boxes.
 * Cross-platform compatible across desktop and mobile devices.
 */
export function PesoSign({
    className = 'size-5',
    'aria-hidden': ariaHidden = true,
    ...props
}: PesoSignProps) {
    return (
        <span
            role="img"
            aria-label="Philippine Peso"
            aria-hidden={ariaHidden}
            className={cn(
                "inline-flex items-center justify-center font-bold font-sans select-none leading-none tracking-normal text-current",
                className
            )}
            style={{ fontSize: '1.125em', lineHeight: 1 }}
            {...props}
        >
            ₱
        </span>
    );
}

export default PesoSign;
