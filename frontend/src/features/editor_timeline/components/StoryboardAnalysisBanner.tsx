import React from "react";
import { Sparkles } from "lucide-react";

interface StoryboardAnalysisBannerProps {
  isAnalyzingAll: boolean;
  handleCancelAnalysis?: () => void;
}

const StoryboardAnalysisBanner = ({
  isAnalyzingAll,
  handleCancelAnalysis,
}: StoryboardAnalysisBannerProps) => {
  if (!isAnalyzingAll) return null;

  return (
    <div className="bg-indigo-950/70 border border-indigo-500/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-lg shadow-indigo-950/40 my-2">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
          <Sparkles className="w-3 h-3 text-indigo-300 absolute animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
            Generating Narrative Sequence
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
              AI Active
            </span>
          </h4>
          <p className="text-[11px] text-indigo-200/80 mt-0.5">
            AI is composing story narrative and synthesizing TTS voiceover for
            sequence cards...
          </p>
        </div>
      </div>
      {handleCancelAnalysis && (
        <button
          type="button"
          onClick={handleCancelAnalysis}
          className="text-[10px] font-bold text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-750 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default StoryboardAnalysisBanner;
