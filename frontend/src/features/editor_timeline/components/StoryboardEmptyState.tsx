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
      className="relative w-full h-[160px] sm:h-[180px] flex-none flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2 select-none"
    >
      <div className="h-9 w-9 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
        {hasScrapedImages ? (
          <Layers className="w-4.5 h-4.5" />
        ) : (
          <Sparkles className="w-4.5 h-4.5" />
        )}
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          {hasScrapedImages
            ? "No Scenes in Storyboard Yet"
            : "Storyboard Awaiting Panels"}
        </h3>
        <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">
          {hasScrapedImages
            ? "Select panels below and click '+ Add to Storyboard' or 'Insert Selected' to build your timeline."
            : "Enter a Webtoon URL above or import images to generate storyboard panel cuts."}
        </p>
      </div>
    </div>
  );
}
