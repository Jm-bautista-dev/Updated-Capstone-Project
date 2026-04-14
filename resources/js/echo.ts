import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}


const key = import.meta.env.VITE_REVERB_APP_KEY || import.meta.env.VITE_PUSHER_APP_KEY;
const host = import.meta.env.VITE_REVERB_HOST || import.meta.env.VITE_PUSHER_HOST || window.location.hostname;
const port = import.meta.env.VITE_REVERB_PORT || 8080;
const scheme = import.meta.env.VITE_REVERB_SCHEME || (host === '127.0.0.1' || host === 'localhost' ? 'http' : 'https');

if (!key) {
    console.warn('Real-time broadcasting is disabled: Missing VITE_REVERB_APP_KEY in .env');
}

const echo = new Echo({
    broadcaster: 'reverb',
    key: key || 'missing-key',
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
});



export default echo;
