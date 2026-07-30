import React from "react";
import { Loader2 } from "lucide-react";

interface ExtractionSkeletonCardProps {
  index: number;
  isScroll?: boolean;
}

/**
 * Skeleton card shown while panels are being extracted/scraped from a Webtoon source.
 * Displayed in the Imported Images grid during live scraping.
 */
export function ExtractionSkeletonCard({
  index,
  isScroll = false,
}: ExtractionSkeletonCardProps) {
  return (
    <div
      className={`relative group overflow-hidden rounded-2xl border-2 border-purple-500/80 bg-purple-950/20 p-3 sm:p-4 space-y-3 shadow-[0_0_24px_rgba(168,85,247,0.4)] ring-1 ring-purple-500/30 backdrop-blur-md cursor-wait select-none transition-all duration-300 scale-[1.01] ${
        isScroll ? "w-[240px] sm:w-[270px] shrink-0" : "w-full"
      }`}
    >
      {/* Header with frame label + spinner badge */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
          FRAME #{String(index).padStart(2, "0")}
        </span>
        <div className="w-4 h-4 rounded-full bg-purple-600/90 border border-purple-400/60 shadow-[0_0_8px_rgba(168,85,247,0.8)] flex items-center justify-center">
          <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
        </div>
      </div>

      {/* Main aspect ratio placeholder */}
      <div className="relative aspect-[3/4] w-full rounded-xl bg-neutral-950/90 border border-purple-500/40 flex flex-col items-center justify-center p-4 gap-1.5 shadow-inner">
        <Loader2 className="h-6 w-6 text-purple-400 animate-spin drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
        <span className="text-[10px] font-black font-mono tracking-[0.2em] text-purple-200 uppercase mt-1">
          Extracting...
        </span>
        <span className="text-[8px] font-mono tracking-wider text-purple-400/80 font-extrabold uppercase">
          Please wait...
        </span>
      </div>
    </div>
  );
}
