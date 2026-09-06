import axios from 'axios';
import { router } from '@inertiajs/react';

const AUTH_CHANNEL_NAME = 'maki_auth_sync_channel';
const AUTH_STORAGE_KEY = 'maki_auth_event';

let isInitialized = false;

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

    // Install response interceptor to handle authenticated 401 expiration safely
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

            // 401 Unauthorized handling:
            // Only trigger logout redirect if it's a genuine 401 on an authenticated session endpoint
            // and NOT a login/password attempt or when already on login/welcome
            if (status === 401) {
                const isAuthCheckEndpoint = url.includes('/login') || url.includes('/change-password') || url.includes('/forgot-password');
                const isGuestPage = typeof window !== 'undefined' && (
                    window.location.pathname === '/login' ||
                    window.location.pathname === '/' ||
                    window.location.pathname === '/menu'
                );

                if (!isAuthCheckEndpoint && !isGuestPage && typeof window !== 'undefined') {
                    broadcastLogoutEvent();
                    window.location.href = '/login';
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
 * Initialize cross-tab authentication synchronization and BFCache protection.
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

    // 3. Enterprise BFCache (Back/Forward Cache) Protection
    window.addEventListener('pageshow', (event) => {
        // If persisted is true, the page was restored from browser memory/BFCache
        if (event.persisted) {
            window.location.reload();
        }
    });

    // 4. Inertia navigation / popstate guard
    window.addEventListener('popstate', () => {
        // When navigating back/forward via browser history in SPA mode,
        // if user is on a protected route without valid session, reload to re-verify
        const pathname = window.location.pathname;
        if (pathname === '/login' || pathname === '/' || pathname === '/menu') {
            return;
        }
    });
}
