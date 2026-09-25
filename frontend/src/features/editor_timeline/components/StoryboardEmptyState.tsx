import React from "react";
import { Layers, Sparkles, Plus } from "lucide-react";

interface StoryboardEmptyStateProps {
  hasScrapedImages: boolean;
  onAddAllToStoryboard?: () => void;
  scrapedCount?: number;
}

export default function StoryboardEmptyState({
  hasScrapedImages,
  onAddAllToStoryboard,
  scrapedCount,
}: StoryboardEmptyStateProps) {
  return (
    <div
      id="panels_timeline_section_empty"
      className="relative w-full flex-1 min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-transparent border border-transparent text-center space-y-3 select-none overflow-hidden"
    >
      <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 flex items-center justify-center text-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          {hasScrapedImages ? (
            <Layers className="w-5 h-5" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
        </div>

        <div className="space-y-1 max-w-sm">
          <h3 className="text-xs sm:text-sm font-mono font-bold text-white uppercase tracking-wider">
            {hasScrapedImages
              ? "No Panels in Storyboard Yet"
              : "Storyboard Awaiting Panels"}
          </h3>
          <p className="text-[11px] sm:text-xs text-neutral-400 font-mono leading-relaxed">
            {hasScrapedImages
              ? "Your imported comic assets are ready below. Click below to add all frames to the timeline."
              : "Enter a Webtoon URL above or import images to generate storyboard panel cuts."}
          </p>
        </div>

        {hasScrapedImages && onAddAllToStoryboard && (
          <button
            type="button"
            onClick={onAddAllToStoryboard}
            className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              Add All Assets to Storyboard{" "}
              {scrapedCount ? `(${scrapedCount} Frames)` : ""}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
