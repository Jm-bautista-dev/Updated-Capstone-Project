import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Load env so we can check APP_ENV during the build
    const env = loadEnv(mode, process.cwd(), '');
    const isProduction = mode === 'production' || env.APP_ENV === 'production';

    return {
        plugins: [
            laravel({
                input: ['resources/js/app.tsx'],
                ssr: 'resources/js/ssr.tsx',
                refresh: true,
            }),
            react(),
            tailwindcss(),
            // Skip wayfinder in production builds: it calls `php artisan wayfinder:generate`
            // which requires a live DB connection that is unavailable on Hostinger at build time.
            // Run `php artisan wayfinder:generate --with-form` locally, commit the generated
            // files, and Vite will use them without re-generating.
            ...(!isProduction
                ? [wayfinder({ formVariants: true })]
                : []),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'resources/js'),
            },
        },
        esbuild: {
            jsx: 'automatic',
        },
    };
});
