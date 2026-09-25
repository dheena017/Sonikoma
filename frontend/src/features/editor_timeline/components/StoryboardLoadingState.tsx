import React from "react";
import { Loader2 } from "lucide-react";

export default function StoryboardLoadingState() {
  return (
    <div
      id="panels_timeline_section_loading"
      className="relative w-full flex-1 min-h-[240px] flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-transparent select-none space-y-4"
    >
      {/* Centered Status Indicator */}
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <div className="h-10 w-10 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 flex items-center justify-center text-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>

        <div className="space-y-0.5">
          <h3 className="text-xs sm:text-sm font-mono font-bold text-white uppercase tracking-wider">
            Loading Storyboard Panels...
          </h3>
          <p className="text-[11px] sm:text-xs text-neutral-400 font-mono">
            Synchronizing panels and workspace state
          </p>
        </div>
      </div>

      {/* Realistic Storyboard Card Skeletons */}
      <div className="w-full flex items-center justify-center gap-3 overflow-hidden px-2 pt-1 max-w-4xl">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="w-48 sm:w-56 shrink-0 rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-3 space-y-2.5 shadow-sm animate-pulse"
          >
            {/* Card Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-neutral-800" />
              <div className="h-3 w-10 rounded bg-neutral-800" />
            </div>

            {/* Thumbnail Placeholder */}
            <div className="h-36 sm:h-40 w-full rounded-xl bg-neutral-900 border border-neutral-800/60 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-neutral-600 animate-spin" />
              </div>
            </div>

            {/* Card Bottom / Dialogue Skeleton */}
            <div className="space-y-1.5 pt-0.5">
              <div className="h-2.5 w-full rounded bg-neutral-900" />
              <div className="h-2 w-2/3 rounded bg-neutral-900/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
