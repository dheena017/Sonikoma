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

      {panelsLength > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {handleAnalyzeAllPanels && (
            <button
              type="button"
              onClick={handleAnalyzeAllPanels}
              disabled={isAnalyzingAll}
              className="text-[10px] font-bold border border-indigo-500/50 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:border-neutral-750 disabled:text-neutral-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-3 h-3 ${isAnalyzingAll ? "animate-spin" : ""}`} />
              {isAnalyzingAll ? "Generating Narrative..." : "Analyze Full Sequence"}
            </button>
          )}



          {handleDownloadZip && (
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="text-[10px] font-bold border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95 cursor-pointer"
            >
              {isZipping ? "Zipping..." : "Download ZIP"}
            </button>
          )}

          {setShowBulkOps && (
            <button
              type="button"
              onClick={() => setShowBulkOps(!showBulkOps)}
              className={`text-[10px] font-bold border rounded-lg px-3 py-1.5 transition-colors shadow-md active:scale-95 cursor-pointer ${
                showBulkOps
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]"
                  : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
              }`}
            >
              Bulk Actions
            </button>
          )}
        </div>
      )}
    </div>
  );
}
