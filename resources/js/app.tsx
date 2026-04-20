import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import './echo';

const appName = import.meta.env.VITE_APP_NAME || 'Maki Desu';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

/**
 * Enterprise-Grade BFCache (Back/Forward Cache) Protection
 * Ensures that if a user clicks "Back" after logout, the browser
 * is forced to re-verify the session instead of showing a cached view.
 */
if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', (event) => {
        // If persisted is true, the page was restored from the bfcache
        if (event.persisted) {
            window.location.reload();
        }
    });

    // Immediate session verification on focus
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Check if user is still allowed to be on this page
            // (Optional: perform a mini axios call here to verify session)
        }
    });
}
