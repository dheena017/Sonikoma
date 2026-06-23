import React from "react";

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
}: TimelineHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
      <div>
        <h3 className="font-bold text-base text-white flex flex-wrap items-center gap-2">
          Dynamic Storyboard &amp; OCR Transcription
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
        {handleSaveStoryboard && panelsLength > 0 && (
          <button
            type="button"
            onClick={handleSaveStoryboard}
            className="text-[10px] font-bold border border-purple-500/50 bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            Save Storyboard
          </button>
        )}
        {/* Bulk Operations and Download Buttons can be added here if needed */}
      </div>
    </div>
  );
}
