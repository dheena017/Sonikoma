import React from "react";
import { Layers, Plus, Sparkles } from "lucide-react";

interface StoryboardEmptyStateProps {
  hasScrapedImages: boolean;
}

/**
 * State-of-the-art Empty State for the Storyboard workspace displayed when no panels are added to the scene flow.
 * Styled with sleek dark glass layout, gradient icon badge, and clear actionable cues.
 */
export default function StoryboardEmptyState({
  hasScrapedImages,
}: StoryboardEmptyStateProps) {
  if (hasScrapedImages) {
    return (
      <div
        id="panels_timeline_section_empty"
        className="relative w-full flex flex-col items-center justify-center p-8 sm:p-12 my-2 rounded-2xl bg-white/[0.02] border border-white/8 text-center space-y-4 animate-in fade-in duration-300"
      >
        <div className="relative p-0.5 rounded-2xl bg-gradient-to-br from-purple-500/80 via-cyan-500/80 to-purple-600/80 shadow-md">
          <div className="w-12 h-12 rounded-[14px] bg-[#0c0d16]/90 flex items-center justify-center">
            <Layers className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="text-sm font-mono font-bold text-neutral-100 uppercase tracking-wider">
            No Scenes in Storyboard Yet
          </h3>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed font-medium">
            Panels are loaded in the deck below! Select frame cards and click{" "}
            <span className="text-purple-300 font-semibold font-mono">
              Insert Selected
            </span>
            , or click{" "}
            <span className="text-cyan-300 font-semibold font-mono">
              + Add to Storyboard
            </span>{" "}
            on any panel to start building your video sequence.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/8 text-[11px] font-mono text-purple-300">
          <Plus className="w-3.5 h-3.5 text-purple-400" />
          <span>Click '+ Add to Storyboard' on any deck panel below</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="panels_timeline_section_empty"
      className="relative w-full flex flex-col items-center justify-center p-8 sm:p-12 my-2 rounded-2xl bg-white/[0.02] border border-white/8 text-center space-y-4 animate-in fade-in duration-300"
    >
      <div className="relative p-0.5 rounded-2xl bg-gradient-to-br from-purple-500/80 via-cyan-500/80 to-purple-600/80 shadow-md">
        <div className="w-12 h-12 rounded-[14px] bg-[#0c0d16]/90 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-sm font-mono font-bold text-neutral-100 uppercase tracking-wider">
          Storyboard Deck Awaiting URL
        </h3>
        <p className="text-xs text-neutral-400 font-sans leading-relaxed font-medium">
          Enter a valid Webtoon viewer URL in the input above. Sonikoma will
          automatically extract and parse high-resolution panel images for your
          project.
        </p>
      </div>
    </div>
  );
}
