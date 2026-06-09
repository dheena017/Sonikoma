import React from "react";
import { Sliders, Download, RefreshCw, Sparkles } from "lucide-react";

interface TimelineHeaderProps {
  showBulkOps: boolean;
  setShowBulkOps: (val: boolean) => void;
  isZipping: boolean;
  panelsLength: number;
  handleDownloadZip: () => void;
  isCompiling: boolean;
  handleCompileVideo: () => void;
}

export default function TimelineHeader({
  showBulkOps,
  setShowBulkOps,
  isZipping,
  panelsLength,
  handleDownloadZip,
  isCompiling,
  handleCompileVideo,
}: TimelineHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
      <div>
        <h3 className="font-bold text-base text-white">
          Dynamic Storyboard & OCR Transcription
        </h3>
        <p className="hidden sm:block text-xs text-neutral-400">
          Review live isolated panel frames. Adjust speech transcripts locally
          below.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Bulk Action Toggle */}
        <button
          type="button"
          onClick={() => setShowBulkOps(!showBulkOps)}
          className={`px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            showBulkOps
              ? "bg-purple-900/40 border-purple-500/50 text-purple-300"
              : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Sliders className="h-4 w-4 text-purple-400" />
          <span>Bulk Actions</span>
        </button>

        {/* ZIP Download Button */}
        <button
          type="button"
          disabled={isZipping || panelsLength === 0}
          onClick={handleDownloadZip}
          className={`px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isZipping
              ? "bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed"
              : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-200 shadow-sm hover:border-neutral-700"
          }`}
        >
          {isZipping ? (
            <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
          ) : (
            <Download className="h-4 w-4 text-purple-400" />
          )}
          <span>{isZipping ? "Zipping..." : "Download Panels ZIP"}</span>
        </button>

        <button
          type="button"
          disabled={isCompiling || panelsLength === 0}
          onClick={handleCompileVideo}
          className={`px-3 sm:px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isCompiling
              ? "bg-purple-900/40 border-purple-500/50 text-purple-200 cursor-not-allowed"
              : "bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-md hover:shadow-purple-500/20"
          }`}
        >
          {isCompiling ? (
            <RefreshCw className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
          )}
          <span>
            {isCompiling ? "Compiling Video..." : "Convert Storyboard to Video"}
          </span>
        </button>
      </div>
    </div>
  );
}
