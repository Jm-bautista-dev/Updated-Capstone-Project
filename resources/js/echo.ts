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

const isPusher = !!import.meta.env.VITE_PUSHER_APP_KEY;

const echo = isPusher ? new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
}) : null;



export default echo;
