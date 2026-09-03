// ─── AudioWaveformVisual ───────────────────────────────────────────────────────
// Canonical location: timeline/components/AudioWaveformVisual.tsx
// Extracts and renders REAL PCM audio waveform peak data via Web Audio API AudioContext.

import React, { useState, useEffect, useMemo } from "react";
import { getProxiedImageUrl } from "@/shared/utils/imageProxy";

interface AudioWaveformVisualProps {
  audioUrl?: string;
  seed?: number | string;
  color?: string;
  opacity?: number;
  className?: string;
}

// Module-level persistent cache for decoded audio waveform peaks
const audioPeaksCache = new Map<string, number[]>();

/** Extracts real acoustic PCM amplitude peaks from an audio file using Web Audio API */
async function extractRealPeaks(url: string, numBuckets = 300): Promise<number[]> {
  if (audioPeaksCache.has(url)) {
    return audioPeaksCache.get(url)!;
  }

  const tryDecode = async (targetUrl: string): Promise<number[]> => {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`Failed to load audio: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio API not supported");

    const audioCtx = new AudioContextClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0); // Primary mono channel

    const bucketSize = Math.max(1, Math.floor(channelData.length / numBuckets));
    const rawPeaks: number[] = [];

    let maxPeak = 0.001;
    for (let i = 0; i < numBuckets; i++) {
      const start = i * bucketSize;
      const end = Math.min(start + bucketSize, channelData.length);
      let peak = 0;
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > peak) peak = val;
      }
      rawPeaks.push(peak);
      if (peak > maxPeak) maxPeak = peak;
    }

    // Normalize peaks between 0.04 and 1.0
    const normalized = rawPeaks.map((p) =>
      Math.min(1.0, Math.max(0.04, p / maxPeak))
    );

    audioCtx.close().catch(() => {});
    return normalized;
  };

  try {
    const peaks = await tryDecode(url);
    audioPeaksCache.set(url, peaks);
    return peaks;
  } catch (err) {
    // If direct fetch fails (e.g. CORS on remote CDN), try via backend proxy
    try {
      const proxied = getProxiedImageUrl(url);
      if (proxied && proxied !== url) {
        const peaks = await tryDecode(proxied);
        audioPeaksCache.set(url, peaks);
        return peaks;
      }
    } catch {
      // Ignored
    }
    return [];
  }
}

export const AudioWaveformVisual: React.FC<AudioWaveformVisualProps> = ({
  audioUrl,
  seed = 1,
  color = "#93C5FD",
  opacity = 0.95,
  className = "",
}) => {
  const [realPeaks, setRealPeaks] = useState<number[] | null>(() =>
    audioUrl && audioPeaksCache.has(audioUrl)
      ? audioPeaksCache.get(audioUrl)!
      : null
  );

  useEffect(() => {
    if (!audioUrl) {
      setRealPeaks(null);
      return;
    }

    if (audioPeaksCache.has(audioUrl)) {
      setRealPeaks(audioPeaksCache.get(audioUrl)!);
      return;
    }

    let isMounted = true;
    extractRealPeaks(audioUrl).then((peaks) => {
      if (isMounted && peaks.length > 0) {
        setRealPeaks(peaks);
      }
    }).catch(() => {
      if (isMounted) setRealPeaks(null);
    });

    return () => {
      isMounted = false;
    };
  }, [audioUrl]);

  // Construct continuous SVG path from either REAL decoded peaks or organic audio model
  const pathD = useMemo(() => {
    const width = 1000;
    const height = 36;
    const midY = height / 2;
    const maxAmp = midY - 2.5;

    const topPoints: [number, number][] = [];
    const bottomPoints: [number, number][] = [];

    if (realPeaks && realPeaks.length > 0) {
      // ── Render REAL Decoded PCM Audio Peaks ───────────────────────────────
      const numPoints = realPeaks.length;
      for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * width;
        const normalizedAmp = realPeaks[i];
        const amp = Math.max(0.6, normalizedAmp * maxAmp);

        topPoints.push([x, midY - amp]);
        bottomPoints.push([x, midY + amp]);
      }
    } else {
      // ── Authentic Organic Audio Simulation (Voice / SFX / BGM) ─────────
      const str = String(seed);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      const pseudoRandom = (n: number) => {
        const x = Math.sin(hash + n * 137.5) * 10000;
        return x - Math.floor(x);
      };

      const isBgm = str.startsWith("bgm-");
      const isSfx = str.startsWith("sfx-");
      const step = 2; // 500 high-res sample points

      for (let x = 0; x <= width; x += step) {
        const progress = x / width;
        let amp = 0.5;

        if (isBgm) {
          // Continuous rhythmic musical waveform with beat bars and harmonic density
          const beat = (progress * 28) % 1;
          const kick = Math.exp(-beat * 4) * 0.45;
          const bass = Math.sin(progress * Math.PI * 14 + (hash % 4)) * 0.25 + 0.45;
          const hihat = (pseudoRandom(x) > 0.7 ? 0.25 : 0);
          const noise = pseudoRandom(x) * 0.2;
          const val = Math.min(1.0, (bass + kick + hihat + noise) * 0.9);
          amp = Math.max(1.2, val * maxAmp);
        } else if (isSfx) {
          // Sharp transient attack with natural decay tail
          const decay = Math.exp(-progress * 3.2);
          const transient = Math.sin(progress * Math.PI * 18) * 0.45 + 0.55;
          const noise = pseudoRandom(x) * 0.35 + 0.65;
          amp = Math.max(0.8, (transient * decay * noise) * maxAmp);
        } else {
          // Natural speech packets (syllables, words, short conversational pauses)
          const wordEnvelope =
            Math.sin(progress * Math.PI * 10 + hash % 3) * 0.45 +
            Math.sin(progress * Math.PI * 22) * 0.25 +
            0.4;
          const naturalPause = Math.sin(progress * Math.PI * 4 + 1.2) > 0.4 ? 1 : 0.2;
          const vocalNoise = pseudoRandom(x) * 0.5 + 0.5;
          const edgeTaper = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI);
          const speechAmp = Math.max(
            0.08,
            wordEnvelope * naturalPause * vocalNoise * Math.pow(edgeTaper, 0.4)
          );
          amp = Math.max(0.8, speechAmp * maxAmp);
        }

        topPoints.push([x, midY - amp]);
        bottomPoints.push([x, midY + amp]);
      }
    }

    // Build closed polygon for waveform fill
    let d = `M 0,${midY}`;
    topPoints.forEach(([x, y]) => {
      d += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
    });
    d += ` L ${width},${midY}`;
    for (let i = bottomPoints.length - 1; i >= 0; i--) {
      const [x, y] = bottomPoints[i];
      d += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
    }
    d += " Z";

    return d;
  }, [realPeaks, seed]);

  return (
    <svg
      viewBox="0 0 1000 36"
      preserveAspectRatio="none"
      className={`w-full h-full pointer-events-none ${className}`}
      fill={color}
      opacity={opacity}
    >
      <path d={pathD} />
      {/* Subtle zero-crossing guide */}
      <line
        x1="0"
        y1="18"
        x2="1000"
        y2="18"
        stroke={color}
        strokeWidth="0.5"
        opacity={0.3}
      />
    </svg>
  );
};

export default React.memo(AudioWaveformVisual);
