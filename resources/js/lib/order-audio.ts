/**
 * Professional Real-Time Order Sound System
 * Features:
 * - Web Audio API synthesized dual-tone POS chime (0.5s duration)
 * - HTML5 Audio fallback
 * - Autoplay policy unlocker on first user interaction
 * - Mute setting persistence via localStorage ('order_notification_sound')
 * - Safe non-blocking execution with try-catch
 */

let audioCtx: AudioContext | null = null;

// Initialize & auto-resume AudioContext on first user interaction
const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;

    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {
            // Suspended until user gesture
        });
    }

    return audioCtx;
};

// Setup user gesture listener to unlock Web Audio API on page click/tap/keypress
if (typeof window !== 'undefined') {
    const unlockAudio = () => {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        } else if (!audioCtx) {
            getAudioContext();
        }
    };

    window.addEventListener('click', unlockAudio, { capture: true, once: false });
    window.addEventListener('keydown', unlockAudio, { capture: true, once: false });
    window.addEventListener('touchstart', unlockAudio, { capture: true, once: false });
}

export function isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('order_notification_sound') !== 'disabled';
}

export function playOrderNotificationSound(): boolean {
    if (!isSoundEnabled()) return false;

    try {
        const ctx = getAudioContext();

        if (ctx) {
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const now = ctx.currentTime;

            // Tone 1: 523.25 Hz (C5)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, now);
            gain1.gain.setValueAtTime(0.4, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.25);

            // Tone 2: 659.25 Hz (E5)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(659.25, now + 0.15);
            gain2.gain.setValueAtTime(0.5, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.5);
        }

        // Always also trigger fallback audio element for maximum browser compatibility
        const fallbackAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        fallbackAudio.volume = 0.8;
        const playPromise = fallbackAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.warn('[Audio Autoplay] Sound playback prevented by browser interaction policy:', err);
            });
        }
        return true;
    } catch (err) {
        console.warn('[Audio System] Unable to play order notification sound:', err);
        return false;
    }
}
