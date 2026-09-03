import type { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/**
 * Format receipt branch heading to display ONLY the authoritative branch name in uppercase.
 * Strips brand prefixes/suffixes (e.g. "Maki Desu Victoria" -> "VICTORIA", "Maki Desu Sta Cruz" -> "STA. CRUZ").
 * Ensures dynamic multi-branch safety without hardcoding.
 */
export function formatReceiptBranchHeading(branchName?: string | null): string {
    if (!branchName || !branchName.trim()) {
        return 'STORE';
    }

    const trimmed = branchName.trim();

    // Strip "MAKI DESU" prefixes, suffixes, and trailing "Branch"
    const cleaned = trimmed
        .replace(/^MAKI\s*DESU\s*[-–—:]*\s*/i, '')
        .replace(/\s*[-–—:]*\s*MAKI\s*DESU$/i, '')
        .replace(/\s+Branch$/i, '')
        .trim();

    // Standardize abbreviation formatting if matched
    if (/^sta\.?\s*cruz$/i.test(cleaned) || /^santa\s*cruz$/i.test(cleaned)) {
        return 'STA. CRUZ';
    }
    if (/^victoria$/i.test(cleaned)) {
        return 'VICTORIA';
    }

    if (!cleaned || /^maki\s*desu$/i.test(cleaned)) {
        return 'STORE';
    }

    return cleaned.toUpperCase();
}

/**
 * Universal Currency Formatter for Philippine Peso (₱).
 * Guaranteed cross-platform rendering on Desktop, Tablet, and Mobile WebViews.
 */
export function formatCurrency(amount: number | string | null | undefined): string {
    const num = typeof amount === 'string' ? parseFloat(amount) || 0 : (amount ?? 0);
    return `₱${Number(num).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

