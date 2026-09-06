import { router } from '@inertiajs/react';
import axios from 'axios';

const AUTH_CHANNEL_NAME = 'maki_auth_sync_channel';
const AUTH_STORAGE_KEY = 'maki_auth_event';

let isInitialized = false;

/**
 * Sync CSRF token into Axios defaults and meta tag.
 */
export function updateCsrfToken(token: string | null | undefined) {
    if (!token || typeof document === 'undefined') return;
    
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    
    const tokenMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (tokenMeta) {
        tokenMeta.content = token;
    }
}

/**
 * Configure global Axios defaults and response interceptors.
 */
export function setupAxiosDefaults() {
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    axios.defaults.withCredentials = true;

    // Sync CSRF token from meta tag if present
    if (typeof document !== 'undefined') {
        const tokenMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        if (tokenMeta?.content) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = tokenMeta.content;
        }
    }

    // Install response interceptor to handle authenticated 401/419 expiration safely
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            // NEVER logout on network errors, timeouts, 500s, 503 maintenance, or 403 forbidden
            if (!error.response) {
                // Network error or timeout - do not log out
                return Promise.reject(error);
            }

            const status = error.response.status;
            const url = error.config?.url || '';

            // 401 Unauthorized or 419 Page Expired handling:
            if (status === 401 || status === 419) {
                const isAuthCheckEndpoint = url.includes('/login') || url.includes('/change-password') || url.includes('/forgot-password');
                const isGuestPage = typeof window !== 'undefined' && (
                    window.location.pathname === '/login' ||
                    window.location.pathname === '/' ||
                    window.location.pathname === '/menu'
                );

                if (!isAuthCheckEndpoint && !isGuestPage && typeof window !== 'undefined') {
                    broadcastLogoutEvent();
                    window.location.href = status === 419 ? '/login?expired=1' : '/login';
                }
            }

            return Promise.reject(error);
        }
    );
}

/**
 * Broadcast an explicit logout event across all open browser tabs.
 */
export function broadcastLogoutEvent() {
    try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
            channel.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
            channel.close();
        }
    } catch {
        // BroadcastChannel not available or restricted
    }

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(AUTH_STORAGE_KEY, `LOGOUT_${Date.now()}`);
        }
    } catch {
        // localStorage not available or storage quota exceeded
    }
}

/**
 * Initialize cross-tab authentication synchronization, dynamic CSRF token sync, and BFCache protection.
 */
export function initializeAuthSync() {
    if (isInitialized || typeof window === 'undefined') {
        return;
    }
    isInitialized = true;

    setupAxiosDefaults();

    // 1. Cross-tab BroadcastChannel listener
    try {
        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
            channel.onmessage = (event) => {
                if (event.data?.type === 'LOGOUT') {
                    const pathname = window.location.pathname;
                    if (pathname !== '/login' && pathname !== '/' && pathname !== '/menu') {
                        window.location.href = '/login';
                    }
                }
            };
        }
    } catch {
        // BroadcastChannel fallback
    }

    // 2. Storage event fallback for older browsers or cross-window contexts
    window.addEventListener('storage', (event) => {
        if (event.key === AUTH_STORAGE_KEY && event.newValue?.startsWith('LOGOUT_')) {
            const pathname = window.location.pathname;
            if (pathname !== '/login' && pathname !== '/' && pathname !== '/menu') {
                window.location.href = '/login';
            }
        }
    });

    // 3. Dynamic CSRF Token Refresh on Inertia navigation
    router.on('navigate', (event) => {
        const pageProps = event.detail.page?.props as Record<string, unknown> | undefined;
        if (pageProps?.csrf_token && typeof pageProps.csrf_token === 'string') {
            updateCsrfToken(pageProps.csrf_token);
        }
    });

    router.on('success', (event) => {
        const pageProps = event.detail.page?.props as Record<string, unknown> | undefined;
        if (pageProps?.csrf_token && typeof pageProps.csrf_token === 'string') {
            updateCsrfToken(pageProps.csrf_token);
        }
    });

    // 4. Intercept Inertia 419 invalid responses (prevent raw iframe modal & handle expired session gracefully)
    router.on('invalid', (event) => {
        const response = event.detail.response;
        if (response && response.status === 419) {
            event.preventDefault(); // Prevent raw 419 HTML modal
            const pathname = window.location.pathname;
            if (pathname !== '/login' && pathname !== '/' && pathname !== '/menu') {
                broadcastLogoutEvent();
                window.location.href = '/login?expired=1';
            }
        }
    });

    // 5. Enterprise BFCache (Back/Forward Cache) Protection
    window.addEventListener('pageshow', (event) => {
        // If persisted is true, the page was restored from browser memory/BFCache
        if (event.persisted) {
            window.location.reload();
        }
    });

    // 6. Inertia navigation / popstate guard
    window.addEventListener('popstate', () => {
        const pathname = window.location.pathname;
        if (pathname === '/login' || pathname === '/' || pathname === '/menu') {
            return;
        }
    });
}
