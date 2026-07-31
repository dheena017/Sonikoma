import React from "react";
import { ExtractionSkeletonCard } from "./ExtractionSkeletonCard";

interface ImportImagesLoadingOverlayProps {
  /** Optional custom title or message */
  message?: string;
  /** Number of skeleton placeholder cards to render */
  count?: number;
}

/**
 * Loading state displayed in the LiveScraperDeck while importing/extracting images
 * from a Webtoon source URL. Matches the purple glow skeleton track style.
 */
export function ImportImagesLoadingOverlay({
  message = "Connecting to source & extracting frames…",
  count = 7,
}: ImportImagesLoadingOverlayProps) {
  const skeletonArray = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      {/* Status indicator strip */}
      <div className="flex items-center gap-2 px-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
        </span>
        <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
          {message}
        </span>
      </div>

      {/* Horizontal track of purple glowing skeleton cards */}
      <div className="relative">
        <div className="w-full flex gap-4 overflow-x-auto pb-4 pt-1.5 scrollbar-thin scroll-smooth px-1 select-none">
          {skeletonArray.map((num) => (
            <ExtractionSkeletonCard
              key={`import-skeleton-${num}`}
              index={num}
              isScroll={true}
            />
          ))}
        </div>

        {/* Right gradient fade edge */}
        <div className="pointer-events-none absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-neutral-900/80 to-transparent rounded-r-2xl" />
      </div>

      {/* Tip footer */}
      <p className="text-[9px] font-mono text-neutral-600 px-1">
        Frames will appear here as they are extracted from the source URL.
      </p>
    </div>
  );
}
