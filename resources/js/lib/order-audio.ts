/**
 * Professional Real-Time Order Sound System
 * Features:
 * - Web Audio API synthesized dual-tone POS chime (0.5s duration)
 * - Autoplay policy safe: AudioContext is only created after first user gesture
 * - Mute setting persistence via localStorage ('order_notification_sound')
 * - Safe non-blocking execution with try-catch
 * - No eager AudioContext creation, no HTML5 Audio fallback (avoids autoplay errors)
 */

let audioCtx: AudioContext | null = null;
let userHasInteracted = false;

// Queue sounds requested before first interaction so they play right after unlock
let pendingSoundCount = 0;

/**
 * Returns the AudioContext only if the user has already interacted with the page.
 * Returns null otherwise to silently skip playback.
 */
const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!userHasInteracted) return null;

    if (!audioCtx) {
        try {
            const AudioContextClass =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        } catch {
            return null;
        }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }

    return audioCtx;
};

/** Play the two-tone POS chime using the given context. */
const playSynthChime = (ctx: AudioContext): void => {
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
};

// One-time user gesture listener — unlocks Web Audio API and drains pending sounds
if (typeof window !== 'undefined') {
    const unlockAudio = () => {
        if (userHasInteracted) return;
        userHasInteracted = true;

        // Create context now that we have a user gesture
        const ctx = getAudioContext();

        // Play any sounds that were requested before interaction
        if (ctx && pendingSoundCount > 0 && isSoundEnabled()) {
            // Play one chime to represent the queued notification(s)
            playSynthChime(ctx);
        }
        pendingSoundCount = 0;
    };

    window.addEventListener('click', unlockAudio, { capture: true });
    window.addEventListener('keydown', unlockAudio, { capture: true });
    window.addEventListener('touchstart', unlockAudio, { capture: true });
    window.addEventListener('pointerdown', unlockAudio, { capture: true });
}

export function isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('order_notification_sound') !== 'disabled';
}

/**
 * Play the notification chime.
 * - If the user has already interacted with the page, plays immediately.
 * - If not yet interacted, queues the sound to play on the next gesture.
 * - Never throws or logs autoplay errors.
 */
export function playOrderNotificationSound(): boolean {
    if (!isSoundEnabled()) return false;

    try {
        const ctx = getAudioContext();

        if (ctx && ctx.state !== 'suspended') {
            playSynthChime(ctx);
            return true;
        }

        // AudioContext locked or not yet created — queue for after first gesture
        if (!userHasInteracted) {
            pendingSoundCount++;
            return false;
        }

        // Context suspended, try to resume and play
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().then(() => {
                playSynthChime(ctx);
            }).catch(() => {});
        }

        return false;
    } catch {
        // Silently fail — never spam the console with autoplay errors
        return false;
    }
}
