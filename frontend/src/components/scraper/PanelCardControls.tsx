import React from "react";
import { Loader2, PlusCircle, Link2 } from "lucide-react";

interface PanelCardControlsProps {
  imgUrl: string;
  idx: number;
  scrapedImages: string[];
  mergingIndices: number[];
  handleMergeWithNext: (index: number) => Promise<void>;
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
}

export function PanelCardControls({
  imgUrl,
  idx,
  scrapedImages,
  mergingIndices,
  handleMergeWithNext,
  addPanelsToStoryboard,
}: PanelCardControlsProps) {
  const isMerging = mergingIndices.includes(idx);
  const isLast = idx >= scrapedImages.length - 1;

  return (
    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Insert to Storyboard */}
      <button
        onClick={() => {
          console.log(
            `[PanelCardControls] Adding image #${idx + 1} to storyboard`
          );
          addPanelsToStoryboard([imgUrl]);
        }}
        className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-700 to-violet-600 hover:from-purple-600 hover:to-violet-500 active:from-purple-800 active:to-violet-700 text-white text-[9px] py-1.5 rounded-lg font-mono font-semibold tracking-wide transition-all duration-150 shadow-sm hover:shadow-[0_0_10px_rgba(168,85,247,0.35)] cursor-pointer border border-purple-500/20"
      >
        <PlusCircle className="h-3 w-3 shrink-0" />
        <span>Insert to Storyboard</span>
      </button>

      {/* Merge with next */}
      {!isLast && (
        <button
          onClick={() => {
            console.log(
              `[PanelCardControls] Merging image #${idx + 1} with next`
            );
            handleMergeWithNext(idx);
          }}
          disabled={isMerging}
          className={[
            "w-full flex items-center justify-center gap-1.5 text-[9px] py-1.5 rounded-lg font-mono font-medium tracking-wide transition-all duration-150 cursor-pointer border",
            isMerging
              ? "bg-indigo-950/30 border-indigo-900/30 text-indigo-400 opacity-70 cursor-wait"
              : "bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-800/40 hover:border-indigo-600/50 text-indigo-200 hover:text-white hover:shadow-[0_0_8px_rgba(99,102,241,0.25)]",
          ].join(" ")}
        >
          {isMerging ? (
            <Loader2 className="h-3 w-3 animate-spin text-indigo-400 shrink-0" />
          ) : (
            <Link2 className="h-3 w-3 shrink-0" />
          )}
          <span>{isMerging ? "Merging…" : "Merge with Next"}</span>
        </button>
      )}
    </div>
  );
}
