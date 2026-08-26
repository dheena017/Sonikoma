import React from "react";
import { Loader2 } from "lucide-react";

export default function RouteLoadingFallback() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[420px] p-6 animate-fade-in select-none page-transition">
      {/* Top glowing progress line with sweep effect */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-pink-400 to-amber-300 animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.8)] z-[100]" />

      <div className="flex flex-col items-center gap-4 px-8 py-7 rounded-2xl bg-[#0e0f17]/70 border border-purple-500/20 backdrop-blur-xl shadow-2xl shadow-purple-950/20">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-md animate-ping" />
          <Loader2 className="h-6 w-6 text-purple-300 animate-spin relative z-10" />
        </div>
        <span className="text-xs font-semibold text-neutral-300 font-sans tracking-wider uppercase">
          Loading Page...
        </span>
      </div>
    </div>
  );
}
