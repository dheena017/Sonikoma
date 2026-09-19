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
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-[11px] h-9 rounded-xl font-mono font-bold tracking-wider transition-all duration-150 cursor-pointer border border-blue-400/40 shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_22px_rgba(37,99,235,0.5)] active:scale-[0.98]"
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
            "w-full flex items-center justify-center gap-2 text-[11px] h-9 rounded-xl font-mono font-medium tracking-wide transition-all duration-150 border",
            isLast
              ? "bg-neutral-900/30 border-neutral-800/40 text-neutral-600 cursor-not-allowed select-none opacity-40"
              : isMerging
              ? "bg-neutral-900 border-neutral-700 text-neutral-300 opacity-70 cursor-wait"
              : "bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white cursor-pointer active:scale-[0.98]",
          ].join(" ")}
        >
          {isMerging ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
          ) : (
            <Link2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
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
