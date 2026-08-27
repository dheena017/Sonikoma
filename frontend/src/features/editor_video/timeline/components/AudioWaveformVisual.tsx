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
  color = "#d8b4fe",
  opacity = 0.95,
  className = "",
}) => {
  const [realPeaks, setRealPeaks] = useState<number[] | null>(() =>
    audioUrl && audioPeaksCache.has(audioUrl)
      ? audioPeaksCache.get(audioUrl)!
      : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(audioUrl && !audioPeaksCache.has(audioUrl)));

  useEffect(() => {
    if (!audioUrl) {
      setRealPeaks(null);
      setIsLoading(false);
      return;
    }

    if (audioPeaksCache.has(audioUrl)) {
      setRealPeaks(audioPeaksCache.get(audioUrl)!);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    extractRealPeaks(audioUrl).then((peaks) => {
      if (isMounted) {
        setRealPeaks(peaks.length > 0 ? peaks : null);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setRealPeaks(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [audioUrl]);

  // Construct continuous SVG path from REAL decoded audio peaks
  const pathD = useMemo(() => {
    const width = 1000;
    const height = 36;
    const midY = height / 2;
    const maxAmp = midY - 2.5;

    if (!realPeaks || realPeaks.length === 0) {
      return null;
    }

    const numPoints = realPeaks.length;
    const topPoints: [number, number][] = [];
    const bottomPoints: [number, number][] = [];

    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      const normalizedAmp = realPeaks[i];
      const amp = Math.max(0.6, normalizedAmp * maxAmp);

      topPoints.push([x, midY - amp]);
      bottomPoints.push([x, midY + amp]);
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
  }, [realPeaks]);

  return (
    <svg
      viewBox="0 0 1000 36"
      preserveAspectRatio="none"
      className={`w-full h-full pointer-events-none ${className}`}
      fill={color}
      opacity={opacity}
    >
      {pathD ? (
        <path d={pathD} />
      ) : isLoading ? (
        // Subtle loading audio pulse
        <line
          x1="0"
          y1="18"
          x2="1000"
          y2="18"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="8 6"
          opacity={0.6}
          className="animate-pulse"
        />
      ) : (
        // Clean authentic silence center-line (no fake hardcoded waves)
        <line
          x1="0"
          y1="18"
          x2="1000"
          y2="18"
          stroke={color}
          strokeWidth="1"
          opacity={0.35}
        />
      )}

      {/* Subtle zero-crossing guide */}
      <line
        x1="0"
        y1="18"
        x2="1000"
        y2="18"
        stroke={color}
        strokeWidth="0.5"
        opacity={0.25}
      />
    </svg>
  );
};

export default React.memo(AudioWaveformVisual);
