import React, { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { SonikomaLogo } from "@/shared/ui/branding";

interface RouteLoadingFallbackProps {
  status?: string;
  subtitle?: string;
}

const HUMAN_FRIENDLY_TIPS = [
  "Preparing your AI tools, comic panels, and studio workspace...",
  "Loading smart auto-crop, audio generators, and video rendering engines...",
  "Synchronizing your saved projects and creative storyboard settings...",
  "Fine-tuning panel layout algorithms for high-speed comic processing...",
];

export default function RouteLoadingFallback({
  status = "Setting up your workspace...",
  subtitle,
}: RouteLoadingFallbackProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % HUMAN_FRIENDLY_TIPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const activeSubtitle = subtitle || HUMAN_FRIENDLY_TIPS[tipIndex];

  return (
    <div className="w-full flex-1 min-h-[480px] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 select-none">
      {/* Prominent, Centered Studio Loading Card */}
      <div className="flex flex-col items-center gap-5 px-8 sm:px-12 py-9 rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] shadow-2xl max-w-md w-full text-center relative overflow-hidden group">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Sonikoma Logo Brand Header */}
        <div className="relative z-10 pt-1 flex justify-center">
          <SonikomaLogo
            size="lg"
            showSubtitle={true}
            subtitleText="Comic to Video Studio"
          />
        </div>

        {/* Spinner & Active Icon Badge */}
        <div className="relative z-10 flex items-center justify-center gap-2.5 px-4 py-2 rounded-full bg-[#121212] border border-[#2F2F2F] shadow-inner mt-1">
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
          <span className="text-xs font-semibold text-blue-400 tracking-wide uppercase">
            Studio Loading
          </span>
        </div>

        {/* Human-Friendly Text & Explanations */}
        <div className="space-y-2 relative z-10 px-2 min-h-[64px] flex flex-col justify-center">
          <h4 className="text-base sm:text-lg font-bold text-[#E5E5E5] font-sans tracking-tight leading-snug">
            {status}
          </h4>
          <p className="text-xs text-neutral-400 font-medium leading-relaxed transition-all duration-300">
            {activeSubtitle}
          </p>
        </div>

        {/* Active Moving Progress Slider */}
        <div className="w-full h-1.5 rounded-full bg-[#121212] border border-[#2F2F2F] overflow-hidden relative z-10 mt-1">
          <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full animate-progress-slider w-full" />
        </div>

        {/* Friendly Tip Tag */}
        <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium pt-1">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Hang tight! Everything will be ready in just a moment.</span>
        </div>
      </div>
    </div>
  );
}
