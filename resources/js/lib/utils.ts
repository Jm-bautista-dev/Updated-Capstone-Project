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

/**
 * Robust Relative Time Formatter.
 * Compares absolute UTC timestamps, defensively clamping any future/negative elapsed time to 'just now'.
 */
export function formatRelativeTime(dateStrOrMinutes?: string | number | null): string {
    if (dateStrOrMinutes === null || dateStrOrMinutes === undefined) {
        return 'just now';
    }

    if (typeof dateStrOrMinutes === 'number') {
        if (dateStrOrMinutes <= 0) return 'just now';
        if (dateStrOrMinutes < 60) return `${Math.floor(dateStrOrMinutes)}m ago`;
        const hours = Math.floor(dateStrOrMinutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    const eventTime = new Date(dateStrOrMinutes).getTime();
    if (isNaN(eventTime)) return 'just now';

    const elapsedMs = Date.now() - eventTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    if (elapsedMinutes <= 0) {
        return 'just now';
    }
    if (elapsedMinutes < 60) {
        return `${elapsedMinutes}m ago`;
    }
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
        return `${elapsedHours}h ago`;
    }
    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${elapsedDays}d ago`;
}


