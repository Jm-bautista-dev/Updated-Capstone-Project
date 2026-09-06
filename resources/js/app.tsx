import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';

import { initializeTheme } from './hooks/use-appearance';
import { initializeAuthSync } from './lib/auth-sync';
import './echo';

const appName = import.meta.env.VITE_APP_NAME || 'Maki Desu';

// Initialize cross-tab auth sync, Axios defaults, and BFCache protection
initializeAuthSync();

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');
        const key = `./pages/${name}.tsx`;
        if (pages[key]) {
            return resolvePageComponent(key, pages);
        }
        const matchedKey = Object.keys(pages).find(
            (k) => k.toLowerCase() === key.toLowerCase()
        );
        return resolvePageComponent(matchedKey || key, pages);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#E75480',
    },
});

// This will set light / dark mode on load...
initializeTheme();

