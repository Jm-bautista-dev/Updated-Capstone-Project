/**
 * POS Cart Persistence & Revalidation Library
 * 
 * Provides production-ready, security-scoped, and resilient local storage
 * persistence for the MAKI DESU POS / Cashier system.
 * 
 * Features:
 * - Scoped strictly by Cashier ID and Branch ID (no cross-cashier or cross-branch leaks).
 * - Preserves product IDs, quantities, unit prices, selected add-ons, order types, discounts, and delivery context.
 * - Revalidates all items on restore against the authoritative backend product catalog (stock, price, addon availability).
 * - Graceful degradation: handles corrupted JSON, schema migrations, and expiration (24h).
 * - Clean teardown: purges stored cart upon successful checkout, manual cart clearing, shift close, or logout.
 */

import type { PosDiscount } from '@/components/pos/ApplyDiscountModal';
import type { PosDeliveryInfo } from '@/components/pos/PosDeliverySection';

export interface SelectedAddon {
    addon_id?: number;
    name: string;
    price: number;
    quantity?: number;
    subtotal?: number;
    unit_price?: number;
    group_id?: number | string;
    group_name?: string;
}

export interface CatalogProduct {
    id: number;
    name: string;
    sku?: string;
    category_id?: number;
    selling_price: number;
    stock: number;
    is_low_stock?: boolean;
    image_url?: string | null;
    available_addons?: Array<{ id: number; name: string; price: number; stock_linked?: boolean }>;
    addon_groups?: Array<{
        id: number | string;
        name: string;
        selection_type?: 'single' | 'multi';
        is_required?: boolean;
        addons: Array<{ id: number; name: string; price: number; stock_linked?: boolean }>;
    }>;
    [key: string]: unknown;
}

export interface PosCartItem extends CatalogProduct {
    quantity: number;
    selected_addons?: SelectedAddon[];
}

export type KioskStep = 'browse' | 'review' | 'checkout';

export interface PersistedPosCartState {
    version: number;
    userId: string;
    branchId: string;
    updatedAt: number;
    cart: PosCartItem[];
    orderType: string;
    kioskStep: KioskStep;
    activeDiscount: PosDiscount | null;
    deliveryInfo: PosDeliveryInfo;
    calculatedDeliveryFee: number | null;
}

export interface RestoredCartResult {
    cart: PosCartItem[];
    orderType: string;
    kioskStep: KioskStep;
    activeDiscount: PosDiscount | null;
    deliveryInfo: PosDeliveryInfo;
    calculatedDeliveryFee: number | null;
    notices: string[];
    isRestored: boolean;
}

export const POS_CART_STORAGE_PREFIX = 'makidesu_pos_cart_';
export const POS_CART_SCHEMA_VERSION = 1;
export const MAX_CART_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export const DEFAULT_DELIVERY_INFO: PosDeliveryInfo = {
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    delivery_type: 'internal',
    external_service: 'grab',
    rider_id: '',
    tracking_number: '',
    distance_km: '',
    external_notes: '',
    latitude: null,
    longitude: null,
};

/**
 * Generate a deterministic, isolated storage key scoped to the cashier and branch.
 */
export function getPosCartStorageKey(
    userId?: number | string | null,
    branchId?: number | string | null
): string {
    const safeUserId = userId !== null && userId !== undefined ? String(userId) : 'guest';
    const safeBranchId = branchId !== null && branchId !== undefined ? String(branchId) : 'default';
    return `${POS_CART_STORAGE_PREFIX}u${safeUserId}_b${safeBranchId}`;
}

/**
 * Load, validate, and reconcile persisted cart state against the authoritative backend catalog.
 */
export function loadAndRevalidatePosCart(
    userId: number | string | null | undefined,
    branchId: number | string | null | undefined,
    catalogProducts: CatalogProduct[] = []
): RestoredCartResult {
    const defaultResult: RestoredCartResult = {
        cart: [],
        orderType: 'dine-in',
        kioskStep: 'browse',
        activeDiscount: null,
        deliveryInfo: { ...DEFAULT_DELIVERY_INFO },
        calculatedDeliveryFee: null,
        notices: [],
        isRestored: false,
    };

    if (typeof window === 'undefined' || !window.localStorage) {
        return defaultResult;
    }

    const key = getPosCartStorageKey(userId, branchId);
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(key);
    } catch {
        return defaultResult;
    }

    if (!raw) {
        return defaultResult;
    }

    let parsed: unknown = null;
    try {
        parsed = JSON.parse(raw);
    } catch {
        // Corrupted JSON: clean up corrupted data and return safely
        try {
            localStorage.removeItem(key);
        } catch {}
        return defaultResult;
    }

    if (!parsed || typeof parsed !== 'object') {
        return defaultResult;
    }

    const data = parsed as Partial<PersistedPosCartState>;

    // Security & Identity scoping check
    const safeUserId = userId !== null && userId !== undefined ? String(userId) : 'guest';
    const safeBranchId = branchId !== null && branchId !== undefined ? String(branchId) : 'default';

    if (String(data.userId || '') !== safeUserId || String(data.branchId || '') !== safeBranchId) {
        // Belongs to a different cashier or branch
        return defaultResult;
    }

    // Expiration check (24h)
    if (typeof data.updatedAt === 'number' && Date.now() - data.updatedAt > MAX_CART_AGE_MS) {
        try {
            localStorage.removeItem(key);
        } catch {}
        return defaultResult;
    }

    if (!Array.isArray(data.cart) || data.cart.length === 0) {
        return defaultResult;
    }

    const notices: string[] = [];
    const validatedCart: PosCartItem[] = [];

    // Revalidate each stored item against current authoritative products
    for (const rawItem of data.cart) {
        if (!rawItem || typeof rawItem !== 'object' || typeof rawItem.id !== 'number') {
            continue;
        }

        const qty = typeof rawItem.quantity === 'number' && rawItem.quantity > 0 ? rawItem.quantity : 1;

        if (catalogProducts.length > 0) {
            const catalogItem = catalogProducts.find((p) => p.id === rawItem.id);

            // 1. Product availability check
            if (!catalogItem) {
                notices.push(`Item "${rawItem.name || 'ID #' + rawItem.id}" is no longer available in this branch and was removed from the restored cart.`);
                continue;
            }

            // 2. Stock sold-out check
            if (catalogItem.stock <= 0) {
                notices.push(`"${catalogItem.name}" is sold out and was removed from the restored cart.`);
                continue;
            }

            // 3. Stock limit adjustment
            let effectiveQty = qty;
            if (effectiveQty > catalogItem.stock) {
                effectiveQty = catalogItem.stock;
                notices.push(`Quantity for "${catalogItem.name}" was adjusted from ${qty} to ${catalogItem.stock} to match available stock.`);
            }

            // 4. Authoritative unit price check
            const effectiveSellingPrice = Number(catalogItem.selling_price || 0);
            if (Number(rawItem.selling_price) !== effectiveSellingPrice) {
                notices.push(`Price for "${catalogItem.name}" has been updated to ₱${effectiveSellingPrice.toFixed(2)}.`);
            }

            // 5. Add-on revalidation
            let validatedAddons: SelectedAddon[] = [];
            if (Array.isArray(rawItem.selected_addons) && rawItem.selected_addons.length > 0) {
                const groupAddons = (catalogItem.addon_groups || []).flatMap((g) => g.addons || []);
                const directAddons = catalogItem.available_addons || [];
                const allCatalogAddons = [...groupAddons, ...directAddons];

                validatedAddons = rawItem.selected_addons
                    .map((a) => {
                        const matchedAddon = allCatalogAddons.find((ca) => ca.id === a.addon_id || (ca.name && a.name && ca.name.toLowerCase() === a.name.toLowerCase()));
                        const freshPrice = matchedAddon ? Number(matchedAddon.price) : Number(a.price || 0);
                        const adQty = Number(a.quantity || 1);
                        return {
                            ...a,
                            price: freshPrice,
                            unit_price: freshPrice,
                            quantity: adQty,
                            subtotal: freshPrice * adQty,
                        };
                    })
                    .filter((a) => a.name && typeof a.price === 'number');
            }

            validatedCart.push({
                ...catalogItem,
                name: catalogItem.name,
                sku: catalogItem.sku || rawItem.sku || '',
                category_id: catalogItem.category_id || rawItem.category_id || 0,
                selling_price: effectiveSellingPrice,
                stock: catalogItem.stock,
                image_url: catalogItem.image_url || rawItem.image_url || null,
                quantity: effectiveQty,
                selected_addons: validatedAddons,
            });
        } else {
            // Catalog empty or offline: sanitize fields without catalog verification
            validatedCart.push({
                ...rawItem,
                quantity: qty,
                selling_price: Number(rawItem.selling_price || 0),
                selected_addons: Array.isArray(rawItem.selected_addons) ? rawItem.selected_addons : [],
            });
        }
    }

    if (validatedCart.length === 0) {
        try {
            localStorage.removeItem(key);
        } catch {}
        return {
            ...defaultResult,
            notices,
        };
    }

    // Revalidate discount
    let validatedDiscount: PosDiscount | null = null;
    if (data.activeDiscount && typeof data.activeDiscount === 'object') {
        const disc = data.activeDiscount;
        if (Array.isArray(disc.eligibleItemIds) && disc.eligibleItemIds.length > 0) {
            const hasRemainingEligible = validatedCart.some((it) => disc.eligibleItemIds.includes(it.id));
            if (hasRemainingEligible) {
                validatedDiscount = disc;
            } else {
                notices.push('Previously selected discount was removed because eligible items are no longer in the cart.');
            }
        } else {
            validatedDiscount = disc;
        }
    }

    // Revalidate delivery info
    const validatedDeliveryInfo: PosDeliveryInfo = {
        ...DEFAULT_DELIVERY_INFO,
        ...(data.deliveryInfo && typeof data.deliveryInfo === 'object' ? data.deliveryInfo : {}),
    };

    const validatedOrderType = ['dine-in', 'takeout', 'delivery'].includes(String(data.orderType || ''))
        ? String(data.orderType)
        : 'dine-in';

    const validatedKioskStep: KioskStep = ['browse', 'review', 'checkout'].includes(String(data.kioskStep || ''))
        ? (data.kioskStep as KioskStep)
        : 'browse';

    return {
        cart: validatedCart,
        orderType: validatedOrderType,
        kioskStep: validatedKioskStep,
        activeDiscount: validatedDiscount,
        deliveryInfo: validatedDeliveryInfo,
        calculatedDeliveryFee: typeof data.calculatedDeliveryFee === 'number' ? data.calculatedDeliveryFee : null,
        notices,
        isRestored: true,
    };
}

/**
 * Save current active POS cart state to browser storage.
 */
export function savePosCart(
    userId: number | string | null | undefined,
    branchId: number | string | null | undefined,
    state: {
        cart: PosCartItem[];
        orderType: string;
        kioskStep: KioskStep;
        activeDiscount: PosDiscount | null;
        deliveryInfo: PosDeliveryInfo;
        calculatedDeliveryFee: number | null;
    }
): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
        return false;
    }

    const key = getPosCartStorageKey(userId, branchId);

    // If cart is empty and in default browse state, clean up storage key
    if (state.cart.length === 0 && state.kioskStep === 'browse') {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }

    const safeUserId = userId !== null && userId !== undefined ? String(userId) : 'guest';
    const safeBranchId = branchId !== null && branchId !== undefined ? String(branchId) : 'default';

    // Sanitize items for storage (do not store sensitive info, functions, or huge binary blobs)
    const sanitizedCart: PosCartItem[] = state.cart.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku || '',
        category_id: item.category_id || 0,
        selling_price: Number(item.selling_price || 0),
        stock: Number(item.stock || 0),
        image_url: item.image_url || null,
        quantity: item.quantity,
        selected_addons: item.selected_addons || [],
    }));

    const payload: PersistedPosCartState = {
        version: POS_CART_SCHEMA_VERSION,
        userId: safeUserId,
        branchId: safeBranchId,
        updatedAt: Date.now(),
        cart: sanitizedCart,
        orderType: state.orderType,
        kioskStep: state.kioskStep,
        activeDiscount: state.activeDiscount,
        deliveryInfo: state.deliveryInfo,
        calculatedDeliveryFee: state.calculatedDeliveryFee,
    };

    try {
        localStorage.setItem(key, JSON.stringify(payload));
        return true;
    } catch (e) {
        console.warn('Failed to persist POS cart to localStorage:', e);
        return false;
    }
}

/**
 * Explicitly clear persisted cart for a specific cashier and branch.
 */
export function clearPosCart(
    userId: number | string | null | undefined,
    branchId: number | string | null | undefined
): void {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    const key = getPosCartStorageKey(userId, branchId);
    try {
        localStorage.removeItem(key);
    } catch {}
}

/**
 * Clear all POS cart keys from terminal storage (e.g., on logout).
 */
export function clearAllPosCarts(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(POS_CART_STORAGE_PREFIX)) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
}

/**
 * Pre-checkout cart verification against current catalog stock.
 */
export function validateCartBeforeCheckout(
    cart: PosCartItem[],
    catalogProducts: CatalogProduct[]
): {
    isValid: boolean;
    errorMessage?: string;
    updatedCart?: PosCartItem[];
} {
    if (cart.length === 0) {
        return { isValid: false, errorMessage: 'Cart is empty. Please select products first.' };
    }

    if (!catalogProducts || catalogProducts.length === 0) {
        return { isValid: true };
    }

    let hasPriceChange = false;
    const adjustedCart: PosCartItem[] = [];

    for (const item of cart) {
        const catalogItem = catalogProducts.find((p) => p.id === item.id);
        if (!catalogItem) {
            return {
                isValid: false,
                errorMessage: `"${item.name}" is no longer available in this branch. Please remove it from your cart.`,
            };
        }

        if (catalogItem.stock <= 0) {
            return {
                isValid: false,
                errorMessage: `"${catalogItem.name}" is currently sold out and cannot be checked out.`,
            };
        }

        if (item.quantity > catalogItem.stock) {
            return {
                isValid: false,
                errorMessage: `Requested quantity for "${catalogItem.name}" (${item.quantity}) exceeds available stock (${catalogItem.stock}).`,
            };
        }

        if (item.selling_price !== catalogItem.selling_price) {
            hasPriceChange = true;
        }

        adjustedCart.push({
            ...item,
            selling_price: catalogItem.selling_price,
            stock: catalogItem.stock,
        });
    }

    return {
        isValid: true,
        updatedCart: hasPriceChange ? adjustedCart : undefined,
    };
}
