import React from "react";
import {
  Square,
  CheckSquare,
  Scissors,
  RefreshCw,
  Brain,
  Settings2,
  Merge,
} from "lucide-react";

interface ScraperActionButtonsProps {
  scrapedImages: string[];
  selectedScraped: string[];
  handleSelectAllToggle: () => void;
  setShowAutoCropModal: (val: boolean) => void;
  isBatchCropping: boolean;
  batchProgress: { current: number; total: number } | null;
  setShowBubbleModal: (val: boolean) => void;
  isCleaningBubbles: boolean;
  cleanProgress: { current: number; total: number } | null;
  handleBatchMergeSelected: () => void;
  isBatchMerging: boolean;
}

export function ScraperActionButtons({
  scrapedImages,
  selectedScraped,
  handleSelectAllToggle,
  setShowAutoCropModal,
  isBatchCropping,
  batchProgress,
  setShowBubbleModal,
  isCleaningBubbles,
  cleanProgress,
  handleBatchMergeSelected,
  isBatchMerging,
}: ScraperActionButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-800/40 mt-1 w-full font-sans overflow-x-auto">
      <div className="flex items-center gap-2 flex-nowrap">
        {/* Select All Toggle */}
        <button
          onClick={handleSelectAllToggle}
          disabled={scrapedImages.length === 0}
          className="h-9 px-3.5 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-[11px] uppercase tracking-wider font-bold border border-neutral-800/60 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {selectedScraped.length === scrapedImages.length &&
          scrapedImages.length > 0 ? (
            <>
              <Square className="h-3.5 w-3.5 text-neutral-500" />
              <span>Deselect All</span>
            </>
          ) : (
            <>
              <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
              <span>Select All</span>
            </>
          )}
        </button>

        {/* Auto-Crop Segmented Button Group */}
        <div className="flex items-center h-9 animate-[fadeIn_0.2s_ease-out]">
          <button
            onClick={() => setShowAutoCropModal(true)}
            disabled={isBatchCropping || selectedScraped.length === 0}
            className="h-full px-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 rounded-l-xl border-r-0 flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95"
            title="Open Auto-Crop Settings"
          >
            {isBatchCropping ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Scissors className="h-3.5 w-3.5" />
            )}
            <span>
              {isBatchCropping && batchProgress
                ? `Cropping (${batchProgress.current}/${batchProgress.total})`
                : "Auto-Crop"}
            </span>
          </button>
          <button
            onClick={() => setShowAutoCropModal(true)}
            title="Auto-crop settings"
            className="h-full px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 rounded-r-xl transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Clean Bubbles Button Group */}
        <div className="flex items-center h-9">
          <button
            onClick={() => setShowBubbleModal(true)}
            disabled={isCleaningBubbles || selectedScraped.length === 0}
            className="h-full px-3.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 rounded-l-xl border-r-0 flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer active:scale-95 text-[11px] uppercase tracking-wider font-bold"
            title="Open Bubble Cleaner Settings"
          >
            {isCleaningBubbles ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Brain className="h-3.5 w-3.5" />
            )}
            <span>
              {isCleaningBubbles && cleanProgress
                ? `Cleaning (${cleanProgress.current}/${cleanProgress.total})`
                : "Clean Bubbles"}
            </span>
          </button>
          <button
            onClick={() => setShowBubbleModal(true)}
            title="Bubble cleaner settings"
            className="h-full px-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 rounded-r-xl transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stitch / Merge Selected */}
        <button
          onClick={handleBatchMergeSelected}
          disabled={selectedScraped.length < 2 || isBatchMerging}
          className="h-9 px-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 hover:text-emerald-200 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm"
          title="Vertical stitch selected frames into a single image asset"
        >
          {isBatchMerging ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Merge className="h-3.5 w-3.5" />
          )}
          <span>{isBatchMerging ? "Stitching..." : "Stitch Selected"}</span>
        </button>
      </div>
    </div>
  );
}
