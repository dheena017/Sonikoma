import React from "react";
import { RefreshCw } from "lucide-react";

interface PanelCardControlsProps {
  imgUrl: string;
  idx: number;
  scrapedImages: string[];
  mergingIndices: number[];
  handleMergeWithNext: (index: number) => Promise<void>;
  addPanelsWithAutoAnalysis: (urls: string[], currentScrapedList?: string[], shouldScroll?: boolean) => void;
}

export function PanelCardControls({
  imgUrl,
  idx,
  scrapedImages,
  mergingIndices,
  handleMergeWithNext,
  addPanelsWithAutoAnalysis,
}: PanelCardControlsProps) {
  return (
    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => addPanelsWithAutoAnalysis([imgUrl])}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white text-[9px] py-1 rounded font-mono transition-colors font-medium border border-purple-500/30 cursor-pointer text-center flex items-center justify-center gap-1"
      >
        <span>+ Insert to Storyboard</span>
      </button>

      {idx < scrapedImages.length - 1 && (
        <button
          onClick={() => handleMergeWithNext(idx)}
          disabled={mergingIndices.includes(idx)}
          className="w-full bg-indigo-950/50 hover:bg-indigo-900 border border-indigo-900/60 text-indigo-100 hover:text-white text-[9px] sm:text-[10px] py-2 rounded-xl font-medium font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {mergingIndices.includes(idx) ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <span className="text-[10px] font-bold">🔗</span>
          )}
          <span>Merge</span>
        </button>
      )}
    </div>
  );
}
