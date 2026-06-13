import React from "react";

interface TimelineHeaderProps {
  panelsLength: number;
  showBulkOps?: boolean;
  setShowBulkOps?: React.Dispatch<React.SetStateAction<boolean>> | ((v: boolean) => void);
  isZipping?: boolean;
  handleDownloadZip?: () => void;
  isAnalyzingAll?: boolean;
  handleAnalyzeAllPanels?: () => void;
}

export default function TimelineHeader({
  panelsLength,
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
    </div>
  );
}
