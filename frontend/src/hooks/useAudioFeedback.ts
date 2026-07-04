import { useCallback, useRef, useMemo } from "react";

export function useAudioFeedback(globalVolume: number, globalMuted: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getOrCreateContext = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      // Resume context if it was suspended (browser auto-play policy)
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {
          // Ignore resume errors, likely still blocked by policy
        });
      }
      return audioCtxRef.current;
    } catch (e) {
      return null;
    }
  }, []);

  const playTone = useCallback(
    (
      freq: number,
      duration: number,
      type: OscillatorType = "sine",
      volumeMultiplier: number = 1
    ) => {
      if (globalMuted) return;

      try {
        const ctx = getOrCreateContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const finalVolume = (globalVolume / 100) * 0.1 * volumeMultiplier;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(finalVolume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch (err) {
        // Gracefully catch DOMException if AudioContext is not allowed to start
        console.debug("Audio feedback blocked or failed:", err);
      }
    },
    [globalVolume, globalMuted, getOrCreateContext]
  );

  const playSuccess = useCallback(() => {
    if (globalMuted) return;
    const ctx = getOrCreateContext();
    if (!ctx) return;

    // A warm, subtle chime (D5 then A5)
    const playToneInternal = (
      freq: number,
      startOffset: number,
      duration: number
    ) => {
      try {
        const now = ctx.currentTime + startOffset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const finalVolume = (globalVolume / 100) * 0.08;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(finalVolume, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
        // Gracefully ignore
      }
    };

    playToneInternal(587.33, 0, 0.4); // D5
    playToneInternal(880.0, 0.1, 0.5); // A5
  }, [globalVolume, globalMuted, getOrCreateContext]);

  const playError = useCallback(() => {
    // A muted, low-frequency indicator
    playTone(150, 0.3, "triangle", 1.5);
  }, [playTone]);

  const playInfo = useCallback(() => {
    // Middle-range, crisp tone
    playTone(440, 0.2, "sine", 0.8);
  }, [playTone]);

  const playTick = useCallback(() => {
    // Short, very crisp tick
    playTone(1000, 0.05, "sine", 0.5);
  }, [playTone]);

  return useMemo(
    () => ({
      playSuccess,
      playError,
      playInfo,
      playTick,
    }),
    [playSuccess, playError, playInfo, playTick]
  );
}
