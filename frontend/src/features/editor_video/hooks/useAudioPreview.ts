// ─── useAudioPreview ─────────────────────────────────────────────────────────
// Canonical location: hooks/useAudioPreview.ts
// Real audio preview player with HTML5 Audio and Web Audio API synthesizer for instant zero-latency SFX

import { useState, useRef, useEffect, useCallback } from "react";

// Web Audio synthesizer for instant SFX preview without network dependency
function playSynthesizedSfx(type: string = "impact") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type.includes("punch") || type.includes("impact") || type.includes("boom")) {
      // Cinematic low boom / punch impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type.includes("slash") || type.includes("swoosh") || type.includes("whoosh")) {
      // White noise blade whoosh
      const bufferSize = ctx.sampleRate * 0.25;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } else {
      // High chime / alert
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Ignore audio synthesis errors
  }
}

export const useAudioPreview = () => {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const updateProgress = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused && audioRef.current.duration) {
      const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setPlaybackProgress(pct);
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const togglePlayTrack = useCallback(
    (trackId: string, audioUrl?: string, category: string = "music") => {
      if (playingTrackId === trackId) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setPlayingTrackId(null);
        setPlaybackProgress(0);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setPlayingTrackId(trackId);
        setPlaybackProgress(0);

        if (audioUrl && (audioUrl.startsWith("http") || audioUrl.startsWith("blob:") || audioUrl.startsWith("/"))) {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.volume = 0.85;

          audio.play().then(() => {
            animFrameRef.current = requestAnimationFrame(updateProgress);
          }).catch(() => {
            // If network fails, use Web Audio synthesis fallback
            playSynthesizedSfx(trackId);
            setTimeout(() => setPlayingTrackId(null), 800);
          });

          audio.onended = () => {
            setPlayingTrackId(null);
            setPlaybackProgress(0);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          };
        } else {
          // Play Web Audio synthesized SFX
          playSynthesizedSfx(trackId);
          setTimeout(() => {
            setPlayingTrackId(null);
            setPlaybackProgress(0);
          }, 600);
        }
      }
    },
    [playingTrackId, updateProgress]
  );

  return {
    playingTrackId,
    playbackProgress,
    togglePlayTrack,
  };
};
