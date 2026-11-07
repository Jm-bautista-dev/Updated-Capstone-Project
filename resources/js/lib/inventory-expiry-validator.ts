/**
 * Inventory Expiration Validation Helper
 * Ensures strict enforcement of expiration dates for ingredient restocking across MAKI DESU.
 * Evaluated strictly in Asia/Manila business timezone.
 */

export const EXPIRED_DATE_ERROR_MESSAGE =
    'The selected expiration date has already passed. You cannot restock an ingredient batch that is already expired. Please select a valid expiration date.';

/**
 * Returns today's date formatted as YYYY-MM-DD in the Asia/Manila timezone.
 */
export function getBusinessTodayManila(): string {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(new Date());
    } catch {
        // Fallback to local date string ISO format (YYYY-MM-DD)
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

/**
 * Checks if the provided date string (YYYY-MM-DD) is strictly prior to today's date in Asia/Manila.
 * Returns true if expired (past date), false if today or future date, or if date is unset.
 */
export function isExpirationDateExpired(dateStr?: string | null): boolean {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
        return false;
    }

    // Extract YYYY-MM-DD prefix if timestamp is provided
    const cleanDate = dateStr.trim().split('T')[0].split(' ')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        return false;
    }

    const todayStr = getBusinessTodayManila();
    return cleanDate < todayStr;
}

/**
 * Validates a restocking expiration date.
 * Returns { valid: boolean, error: string | null }
 */
export function validateRestockExpiration(
    dateStr?: string | null,
    isPerishable: boolean = true
): { valid: boolean; error: string | null } {
    if (!dateStr || dateStr.trim() === '') {
        if (isPerishable) {
            return {
                valid: false,
                error: 'An expiration date is required for perishable ingredients.',
            };
        }
        return { valid: true, error: null };
    }

    if (isExpirationDateExpired(dateStr)) {
        return {
            valid: false,
            error: EXPIRED_DATE_ERROR_MESSAGE,
        };
    }

    return { valid: true, error: null };
}

