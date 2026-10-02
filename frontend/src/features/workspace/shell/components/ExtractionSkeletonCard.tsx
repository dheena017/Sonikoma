import React from "react";
import { Loader2 } from "lucide-react";

interface ExtractionSkeletonCardProps {
  index: number;
  isScroll?: boolean;
}

/**
 * Clean, modern skeleton card shown while panels are being extracted/scraped from a Webtoon source.
 * Free of harsh neon glows, styled with sleek dark borders and subtle loading indicators.
 */
export function ExtractionSkeletonCard({
  index,
  isScroll = false,
}: ExtractionSkeletonCardProps) {
  return (
    <div
      className={`relative group overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3 space-y-2.5 backdrop-blur-sm cursor-wait select-none transition-all duration-200 pointer-events-none ${
        isScroll ? "w-[220px] sm:w-[250px] shrink-0" : "w-full"
      }`}
    >
      {/* Header with frame label + spinner badge */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
          <span className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider">
            FRAME #{String(index).padStart(2, "0")}
          </span>
        </div>
        <div className="w-4 h-4 rounded-full bg-neutral-800 border border-neutral-700/60 flex items-center justify-center">
          <Loader2 className="w-2.5 h-2.5 animate-spin text-neutral-400" />
        </div>
      </div>

      {/* Main aspect ratio placeholder */}
      <div className="relative aspect-[3/4] w-full rounded-lg bg-neutral-950/90 border border-neutral-850 flex flex-col items-center justify-center p-4 gap-2 overflow-hidden">
        {/* Subtle shimmer background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-800/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

        <div className="relative z-10 w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-sm">
          <Loader2 className="h-4 w-4 text-[#3B82F6] animate-spin" />
        </div>
        <span className="relative z-10 text-[10px] font-mono font-semibold tracking-wider text-neutral-300 uppercase">
          EXTRACTING...
        </span>
        <span className="relative z-10 text-[9px] font-mono tracking-normal text-neutral-500 font-medium">
          Processing frame
        </span>
      </div>
    </div>
  );
}
