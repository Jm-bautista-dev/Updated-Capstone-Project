import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

// Never block app startup if broadcasting is misconfigured
Pusher.logToConsole = false;

const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;

// Guard: reject literal un-expanded shell variables (e.g. "${PUSHER_APP_KEY}")
const isValidKey = (k: string | undefined): k is string =>
    !!k && !k.startsWith('${');

let echo: Echo<'pusher' | 'reverb'> | null = null;

try {
    if (isValidKey(pusherKey)) {
        echo = new Echo({
            broadcaster: 'pusher',
            key: pusherKey,
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
            forceTLS: true,
            disableStats: true,         // stop Pusher's background stat pings
            activityTimeout: 30000,
            pongTimeout: 10000,
        });

        // Prevent connection errors from surfacing as unhandled promise rejections
        echo.connector.pusher.connection.bind('error', (err: unknown) => {
            console.warn('[Pusher] Connection error (non-fatal):', err);
        });
    } else if (isValidKey(reverbKey)) {
        const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
        const port = Number(import.meta.env.VITE_REVERB_PORT) || 8080;
        const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

        echo = new Echo({
            broadcaster: 'reverb',
            key: reverbKey,
            wsHost: host,
            wsPort: port,
            wssPort: port,
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
            disableStats: true,
        });
    } else {
        console.warn('[Echo] Real-time broadcasting disabled: no valid app key found in VITE_PUSHER_APP_KEY or VITE_REVERB_APP_KEY.');
    }
} catch (e) {
    console.warn('[Echo] Failed to initialize broadcasting (non-fatal):', e);
}

export default echo;
