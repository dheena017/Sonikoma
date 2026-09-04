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
          className="w-full flex items-center justify-center gap-2 bg-[#2A2A2A] hover:bg-[#2A2A2A] active:bg-[#2A2A2A] text-white text-[10px] h-10 rounded-2xl font-mono font-semibold tracking-[0.12em] transition-all duration-150 cursor-pointer border border-white/10 hover:border-[#3B82F6]"
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
              ? "bg-[#2A2A2A] border-white/10 text-neutral-300 opacity-70 cursor-wait"
              : "bg-[#2A2A2A] hover:bg-[#2A2A2A] border-white/10 hover:border-[#3B82F6] text-neutral-300 hover:text-neutral-300 cursor-pointer",
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
