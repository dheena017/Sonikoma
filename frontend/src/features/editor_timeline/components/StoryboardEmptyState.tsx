import React from "react";
import { Layers, Sparkles } from "lucide-react";

interface StoryboardEmptyStateProps {
  hasScrapedImages: boolean;
}

export default function StoryboardEmptyState({
  hasScrapedImages,
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
              ? "Select panels below and click '+ Add to Storyboard' or 'Insert Selected' to build your timeline."
              : "Enter a Webtoon URL above or import images to generate storyboard panel cuts."}
          </p>
        </div>
      </div>
    </div>
  );
}
