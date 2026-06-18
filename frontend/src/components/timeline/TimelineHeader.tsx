import React from "react";
import { Image, FileText } from "lucide-react";

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
  onAddBlankPanel?: () => void;
  onUploadImagePanel?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function TimelineHeader({
  panelsLength,
  showBulkOps,
  setShowBulkOps,
  isZipping,
  handleDownloadZip,
  isAnalyzingAll,
  handleAnalyzeAllPanels,
  onAddBlankPanel,
  onUploadImagePanel,
}: TimelineHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
      <div>
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          Dynamic Storyboard &amp; OCR Transcription
          <span className="text-xs bg-neutral-800 text-neutral-400 border border-neutral-750 px-2 py-0.5 rounded-full font-mono">
            {panelsLength} {panelsLength === 1 ? "panel" : "panels"}
          </span>
        </h3>
        <p className="hidden sm:block text-xs text-neutral-400 mt-0.5">
          Review live isolated panel frames. Adjust speech transcripts locally
          below.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {onAddBlankPanel && (
          <button
            onClick={onAddBlankPanel}
            className="px-3 py-1.5 bg-neutral-950/40 hover:bg-neutral-850 text-neutral-350 border border-neutral-850 hover:border-neutral-750 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-purple-400" />+ Blank Panel
          </button>
        )}

        {onUploadImagePanel && (
          <label className="px-3 py-1.5 bg-neutral-950/40 hover:bg-neutral-850 text-neutral-350 border border-neutral-850 hover:border-neutral-750 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer">
            <Image className="h-3.5 w-3.5 text-purple-400" />
            + Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={onUploadImagePanel}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
