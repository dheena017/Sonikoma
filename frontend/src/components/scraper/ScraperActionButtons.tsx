import React from "react";
import {
  Square,
  CheckSquare,
  Scissors,
  RefreshCw,
  Sparkles,
  Settings2,
  Link2,
  X,
} from "lucide-react";

interface ScraperActionButtonsProps {
  scrapedImages: string[];
  selectedScraped: string[];
  handleSelectAllToggle: () => void;
  setShowAutoCropModal: (val: boolean) => void;
  isBatchCropping: boolean;
  batchProgress: { current: number; total: number } | null;
  handleAutoCropSelected: () => void;
  setShowBubbleModal: (val: boolean) => void;
  isCleaningBubbles: boolean;
  cleanProgress: { current: number; total: number } | null;
  handleCleanBubblesSelected: () => void;
  handleBatchMergeSelected: () => void;
  isBatchMerging: boolean;
  handleCancelBatch?: () => void;
}

export function ScraperActionButtons({
  scrapedImages,
  selectedScraped,
  handleSelectAllToggle,
  setShowAutoCropModal,
  isBatchCropping,
  batchProgress,
  handleAutoCropSelected,
  setShowBubbleModal,
  isCleaningBubbles,
  cleanProgress,
  handleCleanBubblesSelected,
  handleBatchMergeSelected,
  isBatchMerging,
  handleCancelBatch,
}: ScraperActionButtonsProps) {
  const isAllSelected =
    selectedScraped.length === scrapedImages.length && scrapedImages.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-neutral-800/40 mt-1 w-full font-sans">
      {/* Select All Toggle */}
      <button
        onClick={handleSelectAllToggle}
        disabled={scrapedImages.length === 0}
        className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isAllSelected ? (
          <>
            <Square className="h-4 w-4 text-neutral-400" />
            Deselect All
          </>
        ) : (
          <>
            <CheckSquare className="h-4 w-4 text-purple-400" />
            Select All
          </>
        )}
      </button>

      {/* Auto-Crop Segmented Button Group */}
      <div className="flex items-center">
        {isBatchCropping ? (
          <button
            onClick={() => handleCancelBatch && handleCancelBatch()}
            className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-rose-900/40 border border-rose-500 hover:bg-rose-900 text-white rounded-l-xl border-r-0"
          >
            <X className="h-4 w-4" />
            Stop Auto-Crop
          </button>
        ) : (
          <button
            onClick={() => {
              console.log(
                "[ScraperActionButtons] Triggering auto-crop on",
                selectedScraped.length,
                "panels"
              );
              handleAutoCropSelected();
            }}
            disabled={selectedScraped.length === 0}
            title="Auto-crop selected panels"
            className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-l-xl border-r-0"
          >
            <Scissors className="h-4 w-4 text-purple-400" />
            Auto-Crop
          </button>
        )}
        <button
          onClick={() => setShowAutoCropModal(true)}
          title="Auto-crop settings"
          className="px-2.5 py-2 text-xs font-bold flex items-center justify-center cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-r-xl"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {/* Clean Bubbles Button Group */}
      <div className="flex items-center">
        {isCleaningBubbles ? (
          <button
            onClick={() => handleCancelBatch && handleCancelBatch()}
            className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-rose-900/40 border border-rose-500 hover:bg-rose-900 text-white rounded-l-xl border-r-0"
          >
            <X className="h-4 w-4" />
            Stop Clean
          </button>
        ) : (
          <button
            onClick={() => {
              console.log(
                "[ScraperActionButtons] Triggering clean bubbles on",
                selectedScraped.length,
                "panels"
              );
              handleCleanBubblesSelected();
            }}
            disabled={selectedScraped.length === 0}
            title="Clean speech bubbles on selected panels"
            className="px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-l-xl border-r-0"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            Clean Bubbles
          </button>
        )}
        <button
          onClick={() => setShowBubbleModal(true)}
          title="Bubble cleaner settings"
          className="px-2.5 py-2 text-xs font-bold flex items-center justify-center cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-r-xl"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {/* Stitch / Merge Selected */}
      <button
        onClick={() => {
          console.log(
            "[ScraperActionButtons] Triggering stitch on",
            selectedScraped.length,
            "panels"
          );
          handleBatchMergeSelected();
        }}
        disabled={selectedScraped.length < 2 || isBatchMerging}
        title="Vertical stitch selected frames into a single image asset"
        className="px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isBatchMerging ? (
          <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
        ) : (
          <Link2 className="h-4 w-4 text-purple-400" />
        )}
        {isBatchMerging ? "Stitching..." : "Stitch Selected"}
      </button>
    </div>
  );
}
