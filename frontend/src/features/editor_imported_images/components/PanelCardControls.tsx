import React from "react";
import { Loader2, PlusCircle, Link2 } from "lucide-react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

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
      <Tooltip text="Add this panel to your video timeline" placement="top">
        <button
          type="button"
          aria-label="Add this panel to your video timeline"
          onClick={() => {
            console.log(
              `[PanelCardControls] Adding image #${idx + 1} to timeline`
            );
            addPanelsToStoryboard([imgUrl]);
          }}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-violet-600 hover:from-purple-600 hover:to-violet-500 active:from-purple-800 active:to-violet-700 text-white text-[10px] h-10 rounded-2xl font-mono font-semibold tracking-[0.12em] transition-all duration-150 shadow-[0_10px_30px_-18px_rgba(168,85,247,0.45)] cursor-pointer border border-purple-500/20"
        >
          <PlusCircle className="h-4 w-4 shrink-0" />
          <span>Add to Timeline</span>
        </button>
      </Tooltip>

      {/* Merge with next */}
      <Tooltip
        text={
          isLast
            ? "This is the final panel in the chapter (no next frame to merge)"
            : "Stitch and merge this frame vertically with the next frame"
        }
        placement="top"
      >
        <button
          type="button"
          aria-label={
            isLast
              ? "Final panel in chapter"
              : "Stitch and merge with next frame"
          }
          onClick={() => {
            if (isLast) return;
            console.log(
              `[PanelCardControls] Merging image #${idx + 1} with next`
            );
            handleMergeWithNext(idx);
          }}
          disabled={isMerging || isLast}
          className={[
            "w-full flex items-center justify-center gap-2 text-[10px] h-10 rounded-2xl font-mono font-medium tracking-[0.12em] transition-all duration-150 border",
            isLast
              ? "bg-white/[0.02] border-white/[0.05] text-neutral-600 cursor-not-allowed select-none opacity-40"
              : isMerging
              ? "bg-indigo-950/30 border-indigo-900/30 text-indigo-400 opacity-70 cursor-wait cursor-pointer"
              : "bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-800/40 hover:border-indigo-600/50 text-indigo-400 hover:text-indigo-300 hover:shadow-[0_10px_20px_-14px_rgba(99,102,241,0.35)] cursor-pointer",
          ].join(" ")}
        >
          {isMerging ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
          ) : (
            <Link2 className="h-4 w-4 shrink-0" />
          )}
          <span>
            {isMerging
              ? "Merging…"
              : isLast
              ? "End of Chapter"
              : "Merge with Next"}
          </span>
        </button>
      </Tooltip>
    </div>
  );
}
