/**
 * Professional Real-Time Order Sound System & Repeating Alert Controller
 * Features:
 * - Web Audio API synthesized dual-tone POS chime (0.5s duration)
 * - Autoplay policy safe: AudioContext created and resumed inside user gestures
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
 * Creates or resumes the AudioContext inside a user-gesture event handler (safe from autoplay block).
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
                audioCtx.resume().catch(() => {});
            }

            // Drain queued sound if needed
            if (pendingSoundCount > 0 && isSoundEnabled()) {
                pendingSoundCount = 0;
                if (audioCtx.state === 'running') {
                    playSynthChime(audioCtx);
                } else {
                    audioCtx.resume().then(() => playSynthChime(audioCtx!)).catch(() => {});
                }
            } else {
                pendingSoundCount = 0;
            }
            return true;
        }
    } catch {
        // Silently fail
    }
    return false;
};

// Register global gesture listeners to prime audio context transparently
if (typeof window !== 'undefined') {
    const gestureHandler = () => {
        unlockAudio();
    };
    window.addEventListener('click', gestureHandler, { capture: true });
    window.addEventListener('keydown', gestureHandler, { capture: true });
    window.addEventListener('touchstart', gestureHandler, { capture: true });
    window.addEventListener('pointerdown', gestureHandler, { capture: true });
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
 * - Before first gesture: queues the sound to play on next gesture.
 */
export function playOrderNotificationSound(): boolean {
    if (!isSoundEnabled()) return false;

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
