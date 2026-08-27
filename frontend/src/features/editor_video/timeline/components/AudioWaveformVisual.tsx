// ─── AudioWaveformVisual ───────────────────────────────────────────────────────
// Canonical location: timeline/components/AudioWaveformVisual.tsx
// Extracts and renders REAL PCM audio waveform peak data via Web Audio API AudioContext.

import React, { useState, useEffect, useMemo } from "react";

interface AudioWaveformVisualProps {
  audioUrl?: string;
  seed?: number | string;
  color?: string; // Light lavender/lilac default matching user design
  opacity?: number;
  className?: string;
}

// Module-level persistent cache for decoded audio waveform peaks
const audioPeaksCache = new Map<string, number[]>();

/** Extracts real acoustic PCM amplitude peaks from an audio file using Web Audio API */
async function extractRealPeaks(url: string, numBuckets = 220): Promise<number[]> {
  if (audioPeaksCache.has(url)) {
    return audioPeaksCache.get(url)!;
  }

  try {
    const response = await fetch(url);
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

    // Normalize peaks between 0.06 and 1.0
    const normalized = rawPeaks.map((p) =>
      Math.min(1.0, Math.max(0.06, p / maxPeak))
    );

    audioPeaksCache.set(url, normalized);
    audioCtx.close().catch(() => {});
    return normalized;
  } catch (err) {
    // If fetching or decoding fails, return fallback
    return [];
  }
}

export const AudioWaveformVisual: React.FC<AudioWaveformVisualProps> = ({
  audioUrl,
  seed = 1,
  color = "#d8b4fe",
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
    });

    return () => {
      isMounted = false;
    };
  }, [audioUrl]);

  // Construct continuous SVG path from either real decoded peaks or synthesized speech cadence
  const pathD = useMemo(() => {
    const width = 500;
    const height = 36;
    const midY = height / 2;
    const maxAmp = midY - 2;

    const topPoints: [number, number][] = [];
    const bottomPoints: [number, number][] = [];

    if (realPeaks && realPeaks.length > 0) {
      // ── Render REAL Decoded PCM Audio Peaks ───────────────────────────────
      const numPoints = realPeaks.length;
      for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * width;
        const normalizedAmp = realPeaks[i];
        const amp = Math.max(0.8, normalizedAmp * maxAmp);

        topPoints.push([x, midY - amp]);
        bottomPoints.push([x, midY + amp]);
      }
    } else {
      // ── Acoustic Cadence Approximation while decoding or offline ─────────
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

      const step = 2; // 250 sample points
      for (let x = 0; x <= width; x += step) {
        const progress = x / width;
        const envelope1 = Math.sin(progress * Math.PI * 7.5 + hash % 3) * 0.45 + 0.55;
        const envelope2 = Math.sin(progress * Math.PI * 3.2 + 0.8) * 0.35 + 0.65;
        const wordEnvelope = Math.max(0.12, envelope1 * envelope2);

        const noise = pseudoRandom(x) * 0.65 + 0.35;
        const amp = Math.min(maxAmp, wordEnvelope * noise * (maxAmp - 1));

        const edgeTaper = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI);
        const finalAmp = Math.max(0.8, amp * Math.pow(edgeTaper, 0.4));

        topPoints.push([x, midY - finalAmp]);
        bottomPoints.push([x, midY + finalAmp]);
      }
    }

    // Build SVG path
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
      viewBox="0 0 500 36"
      preserveAspectRatio="none"
      className={`w-full h-full pointer-events-none ${className}`}
      fill={color}
      opacity={opacity}
    >
      <path d={pathD} />
      {/* Zero crossing line for silence intervals */}
      <line
        x1="0"
        y1="18"
        x2="500"
        y2="18"
        stroke={color}
        strokeWidth="0.6"
        opacity={0.4}
      />
    </svg>
  );
};

export default React.memo(AudioWaveformVisual);
