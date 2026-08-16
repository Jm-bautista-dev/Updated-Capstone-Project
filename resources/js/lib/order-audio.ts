/**
 * Professional Real-Time Order Sound System
 * Features:
 * - Web Audio API synthesized dual-tone POS chime (0.5s duration)
 * - Autoplay policy safe: AudioContext only created inside a user-gesture event handler
 * - Mute setting persistence via localStorage ('order_notification_sound')
 * - Safe non-blocking execution — zero console errors on blocked playback
 */

let audioCtx: AudioContext | null = null;
let userHasInteracted = false;
let pendingSoundCount = 0;

/** Play the two-tone POS chime using the given context. */
const playSynthChime = (ctx: AudioContext): void => {
    try {
        const now = ctx.currentTime;

        // Tone 1: C5 (523.25 Hz)
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

        // Tone 2: E5 (659.25 Hz)
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
    } catch {
        // Silently fail
    }
};

/**
 * Creates the AudioContext inside a user-gesture event handler (safe from autoplay block).
 * Also drains any sounds queued before first interaction.
 */
const handleFirstGesture = (): void => {
    if (userHasInteracted) return;
    userHasInteracted = true;

    if (typeof window === 'undefined') return;

    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (AudioContextClass) {
            audioCtx = new AudioContextClass();

            // Drain pending sounds that arrived before first interaction
            if (pendingSoundCount > 0 && isSoundEnabled()) {
                pendingSoundCount = 0;
                // Play one chime to represent queued notification(s)
                if (audioCtx.state === 'running') {
                    playSynthChime(audioCtx);
                } else {
                    audioCtx.resume().then(() => playSynthChime(audioCtx!)).catch(() => {});
                }
            } else {
                pendingSoundCount = 0;
            }
        }
    } catch {
        // Silently fail
    }
};

// Register gesture listeners — AudioContext is ONLY created inside these handlers
if (typeof window !== 'undefined') {
    window.addEventListener('click',      handleFirstGesture, { capture: true });
    window.addEventListener('keydown',    handleFirstGesture, { capture: true });
    window.addEventListener('touchstart', handleFirstGesture, { capture: true });
    window.addEventListener('pointerdown',handleFirstGesture, { capture: true });
}

export function isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('order_notification_sound') !== 'disabled';
}

/**
 * Play the notification chime.
 * - After first gesture: plays immediately via Web Audio API.
 * - Before first gesture: queues the sound to play on next gesture (no errors).
 */
export function playOrderNotificationSound(): boolean {
    if (!isSoundEnabled()) return false;

    // User hasn't interacted yet — queue for after first gesture, no errors
    if (!userHasInteracted || !audioCtx) {
        pendingSoundCount++;
        return false;
    }

    try {
        if (audioCtx.state === 'running') {
            playSynthChime(audioCtx);
            return true;
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                if (audioCtx) playSynthChime(audioCtx);
            }).catch(() => {});
        }
    } catch {
        // Silently fail
    }

    return false;
}
