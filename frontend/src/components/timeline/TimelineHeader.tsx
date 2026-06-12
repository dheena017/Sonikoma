import React from "react";
import { RefreshCw, Sparkles } from "lucide-react";

interface TimelineHeaderProps {
  panelsLength: number;
  isCompiling: boolean;
  handleCompileVideo: () => void;
  showBulkOps?: boolean;
  setShowBulkOps?: React.Dispatch<React.SetStateAction<boolean>> | ((v: boolean) => void);
  isZipping?: boolean;
  handleDownloadZip?: () => void;
  isAnalyzingAll?: boolean;
  handleAnalyzeAllPanels?: () => void;
}

export default function TimelineHeader({
  panelsLength,
  isCompiling,
  handleCompileVideo,
  showBulkOps,
  setShowBulkOps,
  isZipping,
  handleDownloadZip,
  isAnalyzingAll,
  handleAnalyzeAllPanels,
}: TimelineHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
      <div>
        <h3 className="font-bold text-base text-white">Dynamic Storyboard &amp; OCR Transcription</h3>
        <p className="hidden sm:block text-xs text-neutral-400">Review live isolated panel frames. Adjust speech transcripts locally below.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap mt-2 sm:mt-0">
        
        {/* Convert to Video Button */}
        <button
          type="button"
          disabled={isCompiling || panelsLength === 0}
          onClick={() => {
            console.log("[TimelineHeader] Compile video triggered");
            handleCompileVideo();
          }}
          className={`whitespace-nowrap px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isCompiling
              ? "bg-purple-900/40 border-purple-500/50 text-purple-200 cursor-not-allowed"
              : "bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-md hover:shadow-purple-500/20"
          }`}
        >
          {isCompiling ? (
            <RefreshCw className="h-4 w-4 animate-spin text-white shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 text-white animate-pulse shrink-0" />
          )}
          <span>{isCompiling ? "Compiling Video..." : "Convert Storyboard to Video"}</span>
        </button>
        
      </div>
    </div>
  );
}
