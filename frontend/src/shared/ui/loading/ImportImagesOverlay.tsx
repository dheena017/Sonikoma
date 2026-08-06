import React, { useState, useEffect } from "react";
import { Zap, Loader2, Sparkles, CheckCircle2, ShieldCheck, Image as ImageIcon } from "lucide-react";

interface ImportImagesOverlayProps {
  /** Optional custom title or message */
  message?: string;
  count?: number;
}

const SCRAPE_TIPS = [
  "Smart Scanner automatically merges and splits continuous webtoon strips.",
  "Speech Bubble Cleaner erases original text for clean AI voice synthesis.",
  "Panel images are extracted at original lossless CDN resolution.",
  "Auto-crop panel detector uses AI edge detection to isolate comic frames.",
];

/**
 * State-of-the-art Hero Extraction Loading Overlay displayed during Webtoon URL scraping.
 * Features live multi-step pipeline indicators, scanning wave effects, and dynamic tips.
 */
export function ImportImagesOverlay({
  message = "Connecting to source & extracting frames...",
}: ImportImagesOverlayProps) {
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIdx((prev) => (prev + 1) % SCRAPE_TIPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center justify-center p-8 sm:p-12 my-3 rounded-2xl bg-neutral-950/80 border border-neutral-850 shadow-2xl backdrop-blur-xl text-center space-y-6 overflow-hidden animate-in fade-in duration-300">
      {/* Animated Background Scan Line */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent opacity-60" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent animate-pulse" />

      {/* Animated Hero Icon Badge */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="relative p-0.5 rounded-2xl bg-gradient-to-br from-purple-500 via-cyan-500 to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          <div className="w-16 h-16 rounded-[14px] bg-neutral-950 flex items-center justify-center">
            <Zap className="w-7 h-7 text-purple-400 animate-pulse" />
          </div>
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50" />
          <span className="relative inline-flex rounded-full h-5 w-5 bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-md">
            <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
          </span>
        </span>
      </div>

      {/* Main Header & Subtitle */}
      <div className="relative z-10 space-y-1.5 max-w-md">
        <h3 className="text-sm font-mono font-bold text-neutral-100 uppercase tracking-widest">
          {message}
        </h3>
        <p className="text-xs text-neutral-400 font-sans font-medium leading-relaxed">
          Resolving high-resolution Webtoon frames, bypassing CDN protection, and parsing panel structures...
        </p>
      </div>

      {/* Live Pipeline Step Badges */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 max-w-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/90 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Source Connected</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/90 border border-purple-500/30 text-[10px] font-mono text-purple-300 shadow-sm">
          <ShieldCheck className="w-3 h-3 text-purple-400" />
          <span>CDN Intercepted</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/90 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 shadow-sm animate-pulse">
          <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
          <span>Extracting Frames...</span>
        </div>
      </div>

      {/* Progress Shimmer Bar */}
      <div className="relative z-10 w-full max-w-sm h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
        <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 rounded-full animate-[lp-shimmer_1.5s_infinite_ease-in-out]" />
      </div>

      {/* Rotating Tip Footer */}
      <div className="relative z-10 flex items-center justify-center gap-2 text-[11px] font-sans text-neutral-400 bg-neutral-900/70 border border-neutral-850 px-4 py-2 rounded-xl max-w-md transition-all duration-300">
        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span className="truncate">{SCRAPE_TIPS[tipIdx]}</span>
      </div>
    </div>
  );
}
