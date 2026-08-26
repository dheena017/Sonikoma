import React from "react";
import { Loader2 } from "lucide-react";

interface RouteLoadingFallbackProps {
  status?: string;
}

export default function RouteLoadingFallback({
  status = "Loading Studio...",
}: RouteLoadingFallbackProps) {
  return (
    <div className="w-full flex-1 min-h-[460px] flex flex-col items-center justify-center p-6 animate-fade-in select-none">
      {/* Top moving animated progress bar */}
      <div className="route-progress-bar" />

      {/* Prominent, Centered Glassmorphic Loading Card */}
      <div className="relative flex flex-col items-center gap-5 px-10 py-8 rounded-3xl bg-[#0b0c14]/90 border border-purple-500/30 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 max-w-sm w-full text-center">
        {/* Glow ambient background */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 blur-xl opacity-60 pointer-events-none" />

        {/* Spinner Icon */}
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-950/50 border border-purple-500/40 shadow-inner">
          <div className="absolute inset-0 rounded-2xl bg-purple-500/20 blur-md animate-ping" />
          <Loader2 className="h-7 w-7 text-purple-400 animate-spin relative z-10" />
        </div>

        {/* Text */}
        <div className="space-y-1 relative z-10">
          <h4 className="text-sm font-bold text-white font-sans tracking-wide">
            {status}
          </h4>
          <p className="text-[11px] font-mono text-purple-300/70">
            Please wait a moment...
          </p>
        </div>

        {/* Active Moving Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden relative z-10 mt-1">
          <div className="h-full bg-gradient-to-r from-purple-500 via-pink-400 to-amber-300 rounded-full animate-progress-slider w-full" />
        </div>
      </div>
    </div>
  );
}
