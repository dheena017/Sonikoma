import React from "react";
import { Sparkles } from "lucide-react";

interface TimelineHeaderProps {
  panelsLength: number;
  selectedCount?: number;
  totalCount?: number;
  showBulkOps?: boolean;
  setShowBulkOps?:
    | React.Dispatch<React.SetStateAction<boolean>>
    | ((v: boolean) => void);
  isZipping?: boolean;
  handleDownloadZip?: () => void;
  isAnalyzingAll?: boolean;
  handleAnalyzeAllPanels?: () => void;
  handleAnalyzeSelected?: () => void;
  selectAllPanels?: () => void;
  clearSelection?: () => void;
  handleDeleteSelected?: () => void;
  handleAutoCropSelected?: () => void;
  handleCleanBubblesSelected?: () => void;
  handleBatchMergeSelected?: () => void;
  batchProgress?: { current: number; total: number } | null;
  cleanProgress?: { current: number; total: number } | null;
  handleSaveStoryboard?: () => void;
  isBatchCropping?: boolean;
  isCleaningBubbles?: boolean;
  handleCancelBatch?: () => void;
  handleCancelAnalysis?: () => void;
}

export default function TimelineHeader({
  panelsLength,
  selectedCount = 0,
  totalCount = 0,
  showBulkOps,
  setShowBulkOps,
  isZipping,
  handleDownloadZip,
  isAnalyzingAll,
  handleAnalyzeAllPanels,
  handleAnalyzeSelected,
  selectAllPanels,
  clearSelection,
  handleDeleteSelected,
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  handleBatchMergeSelected,
  batchProgress,
  cleanProgress,
  handleSaveStoryboard,
  isBatchCropping,
  isCleaningBubbles,
  handleCancelBatch,
  handleCancelAnalysis,
}: TimelineHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
      <div>
        <h3 className="font-bold text-base text-white flex flex-wrap items-center gap-2">
          Timeline &amp; Text
          <span className="text-xs bg-neutral-800 text-neutral-400 border border-neutral-750 px-2 py-0.5 rounded-full font-mono shrink-0">
            {panelsLength} {panelsLength === 1 ? "panel" : "panels"}
          </span>
        </h3>
        <p className="hidden sm:block text-xs text-neutral-400 mt-0.5">
          Review live isolated panel frames. Adjust speech transcripts locally
          below.
        </p>
      </div>

      {(selectedCount > 0 ||
        isAnalyzingAll ||
        isBatchCropping ||
        isCleaningBubbles) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {selectedCount > 0 && (
              <span className="text-xs bg-neutral-800 text-neutral-300 border border-neutral-750 px-2 py-1 rounded-full font-mono">
                {selectedCount} selected • {totalCount} total
              </span>
            )}
            {(isAnalyzingAll || isBatchCropping || isCleaningBubbles) && (
              <span className="text-xs text-purple-300 border border-purple-700/50 bg-purple-950/30 px-2 py-1 rounded-full font-mono">
                {isAnalyzingAll
                  ? "Analyzing sequence"
                  : isBatchCropping
                  ? "Batch cropping"
                  : "Cleaning bubbles"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCount > 0 && selectAllPanels && (
              <button
                type="button"
                onClick={selectAllPanels}
                className="text-[10px] font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                Select All
              </button>
            )}

            {selectedCount > 0 && handleAnalyzeSelected && (
              <button
                type="button"
                onClick={handleAnalyzeSelected}
                className="text-[10px] font-bold border border-indigo-500/50 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                <Sparkles className="w-3 h-3" />
                Analyze Selected
              </button>
            )}

            {selectedCount > 0 && handleAutoCropSelected && (
              <button
                type="button"
                onClick={handleAutoCropSelected}
                className="text-[10px] font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                Auto-Crop
              </button>
            )}

            {selectedCount > 0 && handleCleanBubblesSelected && (
              <button
                type="button"
                onClick={handleCleanBubblesSelected}
                className="text-[10px] font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                Clean Bubbles
              </button>
            )}

            {selectedCount > 1 && handleBatchMergeSelected && (
              <button
                type="button"
                onClick={handleBatchMergeSelected}
                className="text-[10px] font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                Stitch Selected
              </button>
            )}

            {selectedCount > 0 && clearSelection && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-[10px] font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                Clear Selection
              </button>
            )}

            {selectedCount > 0 && handleDeleteSelected && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="text-[10px] font-bold border border-rose-600 bg-rose-950 hover:bg-rose-900 text-rose-200 rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                Delete Selected
              </button>
            )}

            {selectedCount > 0 && handleAutoCropSelected && (
              <button
                type="button"
                onClick={handleAutoCropSelected}
                className="text-[10px] font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                Auto-Crop
              </button>
            )}

            {selectedCount > 0 && handleCleanBubblesSelected && (
              <button
                type="button"
                onClick={handleCleanBubblesSelected}
                className="text-[10px] font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                Clean Bubbles
              </button>
            )}

            {selectedCount > 1 && handleBatchMergeSelected && (
              <button
                type="button"
                onClick={handleBatchMergeSelected}
                className="text-[10px] font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95"
              >
                Stitch Selected
              </button>
            )}

            {(isAnalyzingAll || isBatchCropping || isCleaningBubbles) && (
              <button
                type="button"
                onClick={() => {
                  if (isAnalyzingAll && handleCancelAnalysis)
                    handleCancelAnalysis();
                  if (
                    (isBatchCropping || isCleaningBubbles) &&
                    handleCancelBatch
                  )
                    handleCancelBatch();
                }}
                className="text-[10px] font-bold border border-red-500/50 bg-red-600 hover:bg-red-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
              >
                Stop{" "}
                {isAnalyzingAll
                  ? "Analyzing"
                  : isBatchCropping
                  ? "Cropping"
                  : "Cleaning"}
              </button>
            )}

            {!isAnalyzingAll &&
              !isBatchCropping &&
              !isCleaningBubbles &&
              handleAnalyzeAllPanels &&
              panelsLength > 0 && (
                <button
                  type="button"
                  onClick={handleAnalyzeAllPanels}
                  className="text-[10px] font-bold border border-indigo-500/50 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
                >
                  <Sparkles className="w-3 h-3" />
                  Analyze Full Sequence
                </button>
              )}
            {handleSaveStoryboard && panelsLength > 0 && (
              <button
                type="button"
                onClick={handleSaveStoryboard}
                className="text-[10px] font-bold border border-purple-500/50 bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
              >
                Save Timeline
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
