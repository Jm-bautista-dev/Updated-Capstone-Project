/**
 * Professional Real-Time Order Sound System & Repeating Alert Controller
 * Features:
 * - Web Audio API synthesized dual-tone POS chime (0.5s duration)
 * - Autoplay policy safe: AudioContext created and resumed strictly after user interaction
 * - Repeating interval controller: plays short chime every 3.5s until unacknowledged queue is empty
 * - Explicit unlock helper to recover suspended/blocked audio gracefully
 * - Mute setting persistence via localStorage ('order_notification_sound')
 * - Safe non-blocking execution — zero console errors or uncaught promises
 */

let audioCtx: AudioContext | null = null;
let userHasInteracted = false;
let pendingSoundCount = 0;
let repeatingIntervalId: number | null = null;
const REPEAT_INTERVAL_MS = 3500;

/** Play the two-tone POS chime using the given context. */
const playSynthChime = (ctx: AudioContext): void => {
    try {
        if (ctx.state !== 'running') {
            return;
        }

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
        // Silently fail without throwing
    }
};

/**
 * Creates or resumes the AudioContext strictly inside a user-gesture event handler.
 * Also drains any sounds queued before first interaction.
 */
export const unlockAudio = (): boolean => {
    userHasInteracted = true;

    if (typeof window === 'undefined') return false;

    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (!audioCtx && AudioContextClass) {
            audioCtx = new AudioContextClass();
        }

        if (audioCtx) {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    if (pendingSoundCount > 0 && isSoundEnabled() && audioCtx) {
                        pendingSoundCount = 0;
                        playSynthChime(audioCtx);
                    }
                }).catch(() => {});
            } else if (audioCtx.state === 'running') {
                if (pendingSoundCount > 0 && isSoundEnabled()) {
                    pendingSoundCount = 0;
                    playSynthChime(audioCtx);
                }
            }
            return true;
        }
    } catch {
        // Silently fail
    }
    return false;
};

// Register global gesture listeners to prime audio context only on real user gestures
if (typeof window !== 'undefined') {
    const gestureHandler = () => {
        unlockAudio();
    };
    window.addEventListener('click', gestureHandler, { capture: true, once: false });
    window.addEventListener('keydown', gestureHandler, { capture: true, once: false });
    window.addEventListener('touchend', gestureHandler, { capture: true, once: false });
}

export function isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('order_notification_sound') !== 'disabled';
}

export function setSoundEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    if (enabled) {
        localStorage.removeItem('order_notification_sound');
        unlockAudio();
    } else {
        localStorage.setItem('order_notification_sound', 'disabled');
        stopRepeatingAlertSound();
    }
}

export function isAudioReady(): boolean {
    return userHasInteracted && audioCtx !== null && audioCtx.state === 'running';
}

/**
 * Play a single notification chime.
 * - After first gesture: plays immediately via Web Audio API.
 * - Before first gesture: queues the sound to play on next gesture without throwing autoplay warnings.
 */
export function playOrderNotificationSound(): boolean {
    if (!isSoundEnabled()) return false;

    if (!userHasInteracted || !audioCtx || audioCtx.state !== 'running') {
        pendingSoundCount++;
        return false;
    }

    try {
        playSynthChime(audioCtx);
        return true;
    } catch {
        // Silently fail
    }

    return false;
}

/**
 * Starts repeating alert sound at controlled intervals (3.5s).
 * Exactly one interval timer is active application-wide.
 */
export function startRepeatingAlertSound(intervalMs: number = REPEAT_INTERVAL_MS): void {
    if (!isSoundEnabled()) return;

    // Play immediately first
    playOrderNotificationSound();

    if (repeatingIntervalId !== null) {
        return; // Already actively repeating
    }

    if (typeof window !== 'undefined') {
        repeatingIntervalId = window.setInterval(() => {
            if (!isSoundEnabled()) {
                stopRepeatingAlertSound();
                return;
            }
            playOrderNotificationSound();
        }, intervalMs);
    }
}

/**
 * Stops repeating alert sound immediately.
 */
export function stopRepeatingAlertSound(): void {
    if (repeatingIntervalId !== null && typeof window !== 'undefined') {
        window.clearInterval(repeatingIntervalId);
        repeatingIntervalId = null;
    }
}
