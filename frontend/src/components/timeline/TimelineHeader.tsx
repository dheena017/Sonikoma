import React from "react";
import { Sparkles } from "lucide-react";

interface TimelineHeaderProps {
  panelsLength: number;
  showBulkOps?: boolean;
  setShowBulkOps?:
    | React.Dispatch<React.SetStateAction<boolean>>
    | ((v: boolean) => void);
  isZipping?: boolean;
  handleDownloadZip?: () => void;
  isAnalyzingAll?: boolean;
  handleAnalyzeAllPanels?: () => void;
  handleSaveStoryboard?: () => void;
  isBatchCropping?: boolean;
  isCleaningBubbles?: boolean;
  handleCancelBatch?: () => void;
  handleCancelAnalysis?: () => void;
}

export default function TimelineHeader({
  panelsLength,
  showBulkOps,
  setShowBulkOps,
  isZipping,
  handleDownloadZip,
  isAnalyzingAll,
  handleAnalyzeAllPanels,
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

      <div className="flex items-center gap-2 flex-wrap">
        {(isAnalyzingAll || isBatchCropping || isCleaningBubbles) && (
          <button
            type="button"
            onClick={() => {
              if (isAnalyzingAll && handleCancelAnalysis) handleCancelAnalysis();
              if ((isBatchCropping || isCleaningBubbles) && handleCancelBatch) handleCancelBatch();
            }}
            className="text-[10px] font-bold border border-red-500/50 bg-red-600 hover:bg-red-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            Stop {isAnalyzingAll ? "Analyzing" : isBatchCropping ? "Cropping" : "Cleaning"}
          </button>
        )}
        {!isAnalyzingAll && !isBatchCropping && !isCleaningBubbles && handleAnalyzeAllPanels && panelsLength > 0 && (
          <button
            type="button"
            onClick={handleAnalyzeAllPanels}
            className="text-[10px] font-bold border border-indigo-500/50 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            Analyze Full Sequence
          </button>
        )}
        {handleSaveStoryboard && panelsLength > 0 && (
          <button
            type="button"
            onClick={handleSaveStoryboard}
            className="text-[10px] font-bold border border-purple-500/50 bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            Save Timeline
          </button>
        )}
        {/* Bulk Operations and Download Buttons can be added here if needed */}
      </div>
    </div>
  );
}
